# Redis prefetch-cache helper.
#
# Each cached entity is stored as a Redis hash under "cache:{prefix}:{id}"
# with a long safety-net TTL that bounds memory if the sync pipeline ever
# stops, but is not the freshness mechanism. Freshness comes from the
# +apply_change+ path, which the sync worker calls every time a primary
# mutation arrives.
#
# Reads run +HGETALL+ against Redis only. A miss is not a fall-back
# trigger -- the application treats it as an error or a deliberate
# +invalidate+ for testing. In production a sustained miss rate means
# the prefetch or the sync pipeline is broken, not that the primary
# should be re-queried on the request path.

require "redis"

class PrefetchCache
  # Prefetch-cache helper backed by Redis hashes with a safety-net TTL.

  attr_reader :ttl_seconds, :prefix

  def initialize(redis_client: nil, prefix: "cache:category:", ttl_seconds: 3600)
    @redis = redis_client || Redis.new(host: "localhost", port: 6379)
    @prefix = prefix
    @ttl_seconds = ttl_seconds

    # Ruby's GIL makes individual commands thread-safe, but pipelines and
    # transactions need to be serialised so concurrent callers do not
    # interleave commands inside one MULTI/EXEC block.
    @apply_lock = Mutex.new
    @stats_lock = Mutex.new
    @hits = 0
    @misses = 0
    @prefetched = 0
    @sync_events_applied = 0
    @sync_lag_ms_total = 0.0
    @sync_lag_samples = 0
  end

  # Pipeline +DEL+ + +HSET+ + +EXPIRE+ for every record. Returns the count
  # loaded.
  #
  # The pipeline is non-transactional: it is fast on startup (when nothing
  # is reading the cache) and on the live +/reprefetch+ path (when the
  # demo pauses the sync worker around the call). Calling +bulk_load+ on
  # a cache that is actively being read and written to can briefly expose
  # a key that has been deleted but not yet rewritten; pause the writers
  # first or rewrite this with a transactional pipeline if that matters.
  def bulk_load(records)
    loaded = 0
    @apply_lock.synchronize do
      @redis.pipelined do |pipe|
        records.each do |record|
          entity_id = record["id"] || record[:id]
          next if entity_id.nil? || entity_id.to_s.empty?
          cache_key = cache_key_for(entity_id)
          pipe.del(cache_key)
          pipe.hset(cache_key, stringify_record(record))
          pipe.expire(cache_key, @ttl_seconds)
          loaded += 1
        end
      end
    end
    @stats_lock.synchronize { @prefetched += loaded }
    loaded
  end

  # Return +[record, hit, redis_latency_ms]+ for an +HGETALL+ against Redis.
  #
  # Prefetch-cache reads do not fall back to the primary. A miss is a
  # signal that the cache is incomplete, not a trigger to re-query the
  # source. The caller decides how to surface it.
  def get(entity_id)
    cache_key = cache_key_for(entity_id)

    started = monotonic_ms
    cached = @redis.hgetall(cache_key)
    redis_latency_ms = monotonic_ms - started

    if cached && !cached.empty?
      @stats_lock.synchronize { @hits += 1 }
      [cached, true, redis_latency_ms]
    else
      @stats_lock.synchronize { @misses += 1 }
      [nil, false, redis_latency_ms]
    end
  end

  # Apply a primary change event to Redis.
  #
  # The sync worker calls this for every event the primary emits. For an
  # upsert, the helper rewrites the hash and refreshes the safety-net
  # TTL. For a delete, it removes the cache key.
  def apply_change(change)
    op = change[:op] || change["op"]
    entity_id = change[:id] || change["id"]
    return if entity_id.nil? || entity_id.to_s.empty?

    cache_key = cache_key_for(entity_id)

    case op
    when "upsert"
      fields = change[:fields] || change["fields"]
      # Malformed upsert with no fields. Skip rather than crash the sync
      # worker: HSET with an empty mapping raises in redis-rb, and there
      # is nothing to write anyway. A real CDC consumer would route this
      # to a dead-letter queue and alert; the demo just drops it.
      return if fields.nil? || fields.empty?

      @apply_lock.synchronize do
        @redis.multi do |tx|
          tx.del(cache_key)
          tx.hset(cache_key, stringify_record(fields))
          tx.expire(cache_key, @ttl_seconds)
        end
      end
    when "delete"
      @redis.del(cache_key)
    else
      return
    end

    @stats_lock.synchronize do
      @sync_events_applied += 1
      timestamp_ms = change[:timestamp_ms] || change["timestamp_ms"]
      if timestamp_ms.is_a?(Numeric)
        lag_ms = [0.0, wall_ms - timestamp_ms.to_f].max
        @sync_lag_ms_total += lag_ms
        @sync_lag_samples += 1
      end
    end
  end

  # Delete one cache key. Demo-only: simulates a broken sync pipeline.
  def invalidate(entity_id)
    @redis.del(cache_key_for(entity_id)) == 1
  end

  # Delete every key under this cache's prefix and return the count.
  def clear
    deleted = 0
    cursor = "0"
    loop do
      cursor, keys = @redis.scan(cursor, match: "#{@prefix}*", count: 500)
      unless keys.empty?
        results = @redis.pipelined do |pipe|
          keys.each { |k| pipe.del(k) }
        end
        deleted += results.sum { |r| r.to_i }
      end
      break if cursor == "0"
    end
    deleted
  end

  # Return every entity id currently in the cache, sorted.
  def ids
    results = []
    cursor = "0"
    loop do
      cursor, keys = @redis.scan(cursor, match: "#{@prefix}*", count: 500)
      keys.each { |k| results << strip_prefix(k) }
      break if cursor == "0"
    end
    results.sort
  end

  def count
    total = 0
    cursor = "0"
    loop do
      cursor, keys = @redis.scan(cursor, match: "#{@prefix}*", count: 500)
      total += keys.length
      break if cursor == "0"
    end
    total
  end

  def ttl_remaining(entity_id)
    @redis.ttl(cache_key_for(entity_id)).to_i
  end

  def stats
    @stats_lock.synchronize do
      total = @hits + @misses
      hit_rate = total.zero? ? 0.0 : (100.0 * @hits / total).round(1)
      avg_lag = @sync_lag_samples.zero? ? 0.0 : (@sync_lag_ms_total / @sync_lag_samples).round(2)
      {
        "hits" => @hits,
        "misses" => @misses,
        "hit_rate_pct" => hit_rate,
        "prefetched" => @prefetched,
        "sync_events_applied" => @sync_events_applied,
        "sync_lag_ms_avg" => avg_lag,
      }
    end
  end

  def reset_stats
    @stats_lock.synchronize do
      @hits = 0
      @misses = 0
      @prefetched = 0
      @sync_events_applied = 0
      @sync_lag_ms_total = 0.0
      @sync_lag_samples = 0
    end
  end

  private

  def cache_key_for(entity_id)
    "#{@prefix}#{entity_id}"
  end

  def strip_prefix(key)
    key.start_with?(@prefix) ? key[@prefix.length..-1] : key
  end

  def stringify_record(record)
    out = {}
    record.each { |k, v| out[k.to_s] = v.to_s }
    out
  end

  def monotonic_ms
    Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0
  end

  def wall_ms
    Time.now.to_f * 1000.0
  end
end
