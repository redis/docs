# Redis online feature store backed by per-entity Hashes (redis-rb).
#
# Each entity (here, a user) lives at a deterministic key such as
# `fs:user:{id}`. The hash holds every feature for that entity as one
# field per feature -- batch-materialized aggregates (refreshed on a
# daily cycle) alongside streaming-updated signals (refreshed every
# few seconds). One `HMGET` returns whichever subset the model needs
# in one network round trip.
#
# Two TTL layers solve the *mixed staleness* problem:
#
#   * A key-level `EXPIRE` aligned with the batch materialization
#     cycle causes the whole entity to disappear if its batch
#     refresher fails, so inference sees a missing entity (which the
#     model handler can detect and fall back on) rather than silently
#     outdated values.
#   * A per-field `HEXPIRE` on each streaming field gives that field
#     its own shorter expiry, independent of the rest of the hash.
#     When the streaming pipeline stops updating a field, the field
#     self-cleans while the rest of the entity stays populated.
#
# `HEXPIRE` and `HTTL` require Redis 7.4 or later. redis-rb 5.4 ships
# no stable typed helpers for the per-field TTL commands, so the
# helper issues them with `Redis#call` directly. The wire bytes are
# identical to what a typed binding would produce.

require 'redis'
require 'thread'

class FeatureStore
  DEFAULT_BATCH_FIELDS = %w[
    country_iso
    risk_segment
    account_age_days
    tx_count_7d
    avg_amount_30d
    chargeback_count_180d
  ].freeze

  DEFAULT_STREAMING_FIELDS = %w[
    last_login_ts
    last_device_id
    tx_count_5m
    failed_logins_15m
    session_country
  ].freeze

  DEFAULT_BATCH_TTL_SECONDS = 24 * 60 * 60
  DEFAULT_STREAMING_TTL_SECONDS = 5 * 60
  DEFAULT_KEY_PREFIX = 'fs:user:'

  attr_reader :key_prefix, :batch_ttl_seconds, :streaming_ttl_seconds

  def initialize(redis:, key_prefix: DEFAULT_KEY_PREFIX,
                 batch_ttl_seconds: DEFAULT_BATCH_TTL_SECONDS,
                 streaming_ttl_seconds: DEFAULT_STREAMING_TTL_SECONDS)
    @redis = redis
    @key_prefix = key_prefix
    @batch_ttl_seconds = batch_ttl_seconds
    @streaming_ttl_seconds = streaming_ttl_seconds
    @stats_lock = Mutex.new
    @batch_writes_total = 0
    @streaming_writes_total = 0
    @reads_total = 0
    @read_fields_total = 0
  end

  def key_for(entity_id)
    "#{@key_prefix}#{entity_id}"
  end

  # ------------------------------------------------------------------
  # Batch ingestion (materialization)
  # ------------------------------------------------------------------

  # Materialize a batch of entities into Redis.
  #
  # rows is `{entity_id => {field => value, ...}}`. One HSET plus one
  # EXPIRE per entity, all queued through `Redis#pipelined` so the
  # whole batch ships in a single round trip. The key-level EXPIRE
  # is what makes the entity disappear if a future batch run fails.
  def bulk_load(rows, ttl_seconds: nil)
    return 0 if rows.empty?
    ttl = ttl_seconds || @batch_ttl_seconds
    @redis.pipelined do |pipe|
      rows.each do |entity_id, fields|
        key = key_for(entity_id)
        encoded = fields.transform_values { |v| encode_value(v) }
        pipe.hset(key, encoded)
        pipe.expire(key, ttl)
      end
    end
    @stats_lock.synchronize { @batch_writes_total += rows.size }
    rows.size
  end

  def update_batch_feature(entity_id, field, value)
    @redis.hset(key_for(entity_id), field, encode_value(value))
    @stats_lock.synchronize { @batch_writes_total += 1 }
  end

  # ------------------------------------------------------------------
  # Streaming ingestion
  # ------------------------------------------------------------------

  # Write streaming features with a per-field TTL.
  #
  # HSET and HEXPIRE are queued in the same pipeline so Redis runs
  # them in order: the HSET first creates or overwrites the fields,
  # then HEXPIRE attaches a TTL to each of those same fields.
  #
  # HEXPIRE returns one status code per field:
  #   1 = TTL set, 2 = the expiry was 0 or in the past (field deleted),
  #   0 = an NX|XX|GT|LT condition was not met (we never use one),
  #   -2 = no such field or no such key.
  # We always follow HSET with HEXPIRE, so any code other than 1
  # means the per-field TTL invariant didn't hold -- raise rather
  # than silently leave a streaming field with no expiry attached.
  def update_streaming(entity_id, fields, ttl_seconds: nil)
    return if fields.empty?
    ttl = ttl_seconds || @streaming_ttl_seconds
    key = key_for(entity_id)
    encoded = fields.transform_values { |v| encode_value(v) }
    names = encoded.keys

    results = @redis.pipelined do |pipe|
      pipe.hset(key, encoded)
      pipe.call('HEXPIRE', key, ttl, 'FIELDS', names.size, *names)
    end
    # results[0] = HSET fields-set count (ignored)
    # results[1] = HEXPIRE per-field codes
    codes = results[1] || []
    codes.each do |code|
      unless code == 1
        raise "HEXPIRE did not set every field TTL for #{key}: #{codes.inspect}"
      end
    end
    @stats_lock.synchronize { @streaming_writes_total += fields.size }
  end

  # ------------------------------------------------------------------
  # Inference reads
  # ------------------------------------------------------------------

  # Retrieve a subset of features for one entity. Pass field_names=nil
  # to fetch the entire hash with HGETALL -- useful for debugging but
  # rarely the right call on the request path.
  def get_features(entity_id, field_names = nil)
    key = key_for(entity_id)
    if field_names.nil?
      data = @redis.hgetall(key)
      @stats_lock.synchronize do
        @reads_total += 1
        @read_fields_total += data.size
      end
      return data
    end
    return {} if field_names.empty?
    values = @redis.hmget(key, *field_names)
    out = {}
    field_names.each_with_index do |n, i|
      out[n] = values[i] unless values[i].nil?
    end
    @stats_lock.synchronize do
      @reads_total += 1
      @read_fields_total += out.size
    end
    out
  end

  # Pipeline HMGET across many entities for batch scoring.
  def batch_get_features(entity_ids, field_names)
    return {} if entity_ids.empty? || field_names.empty?
    rows = @redis.pipelined do |pipe|
      entity_ids.each { |id| pipe.hmget(key_for(id), *field_names) }
    end
    out = {}
    seen = 0
    entity_ids.each_with_index do |id, i|
      values = rows[i] || []
      row = {}
      field_names.each_with_index do |n, j|
        row[n] = values[j] unless values[j].nil?
      end
      out[id] = row
      seen += row.size
    end
    @stats_lock.synchronize do
      @reads_total += entity_ids.size
      @read_fields_total += seen
    end
    out
  end

  # ------------------------------------------------------------------
  # TTL inspection (used by the demo UI)
  # ------------------------------------------------------------------

  def key_ttl_seconds(entity_id)
    @redis.ttl(key_for(entity_id))
  end

  # Per-field TTL via HTTL (Redis 7.4+). Each value mirrors the TTL
  # convention: positive seconds remaining, -1 no field TTL, -2
  # field/key missing.
  def field_ttls_seconds(entity_id, field_names)
    return {} if field_names.empty?
    codes = @redis.call('HTTL', key_for(entity_id), 'FIELDS',
                        field_names.size, *field_names)
    # HTTL on a missing key returns a flat array of -2s. No
    # defensive shim needed for this client.
    codes ||= field_names.map { |_| -2 }
    out = {}
    field_names.each_with_index do |n, i|
      out[n] = codes[i] || -2
    end
    out
  end

  # ------------------------------------------------------------------
  # Demo housekeeping
  # ------------------------------------------------------------------

  def list_entity_ids(limit: 200)
    ids = []
    pattern = "#{@key_prefix}*"
    prefix_len = @key_prefix.length
    @redis.scan_each(match: pattern, count: 200) do |key|
      ids << key[prefix_len..-1] if key.length > prefix_len
      break if ids.size >= limit
    end
    ids.sort
  end

  def count_entities
    n = 0
    pattern = "#{@key_prefix}*"
    @redis.scan_each(match: pattern, count: 500) { |_| n += 1 }
    n
  end

  def delete_entity(entity_id)
    @redis.del(key_for(entity_id))
  end

  # Drop every entity under the key prefix. Used by the demo reset
  # path; scans in batches and issues one variadic DEL per batch.
  def reset
    deleted = 0
    pattern = "#{@key_prefix}*"
    batch = []
    @redis.scan_each(match: pattern, count: 500) do |key|
      batch << key
      if batch.size >= 500
        deleted += @redis.del(*batch)
        batch.clear
      end
    end
    deleted += @redis.del(*batch) unless batch.empty?
    deleted
  end

  def stats
    @stats_lock.synchronize do
      {
        batch_writes_total: @batch_writes_total,
        streaming_writes_total: @streaming_writes_total,
        reads_total: @reads_total,
        read_fields_total: @read_fields_total,
      }
    end
  end

  def reset_stats
    @stats_lock.synchronize do
      @batch_writes_total = 0
      @streaming_writes_total = 0
      @reads_total = 0
      @read_fields_total = 0
    end
  end

  # Render a feature value as a string for hash storage. Booleans
  # become "true"/"false" so they round-trip cleanly through other
  # clients and redis-cli.
  def encode_value(value)
    case value
    when true then 'true'
    when false then 'false'
    when nil then ''
    else value.to_s
    end
  end
end
