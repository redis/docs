# Redis event-stream helper backed by a single Redis Stream.
#
# Producers append events with `XADD`. Consumers belong to consumer
# groups and read with `XREADGROUP`. The group as a whole tracks a
# single `last-delivered-id` cursor, and each consumer gets its own
# pending-entries list (PEL) of in-flight messages it has been handed.
# Once a consumer has processed an entry it acknowledges it with
# `XACK`; entries left unacknowledged past an idle threshold can be
# swept to a healthy consumer with `XAUTOCLAIM` (or to a specific one
# with `XCLAIM`).
#
# Each `XADD` carries an approximate `MAXLEN` so the stream stays
# bounded as it rolls forward. `XRANGE` supports replay over the
# retained history for debugging, audit, or rebuilding a downstream
# projection. Note that approximate trimming can release entries that
# are still in a group's PEL: those entries appear in `XAUTOCLAIM`'s
# deleted-IDs list, which the caller should log and route to a
# dead-letter store. Redis 7+ removes them from the PEL inside the
# `XAUTOCLAIM` call itself, so no explicit `XACK` is needed.
#
# The same stream can be read by any number of consumer groups -- each
# group has its own cursor and its own pending lists, so analytics,
# notifications, and audit can all process the full event flow at their
# own pace without coordinating with each other.

require 'redis'
require 'thread'

# Producer/consumer helper for a single Redis Stream with consumer groups.
class RedisEventStream
  attr_reader :stream_key, :maxlen_approx, :claim_min_idle_ms

  def initialize(redis:, stream_key: 'demo:events:orders',
                 maxlen_approx: 10_000, claim_min_idle_ms: 15_000)
    @redis = redis
    @stream_key = stream_key
    @maxlen_approx = maxlen_approx
    @claim_min_idle_ms = claim_min_idle_ms

    @stats_lock = Mutex.new
    @produced_total = 0
    @acked_total = 0
    @claimed_total = 0
  end

  # ------------------------------------------------------------------
  # Producer
  # ------------------------------------------------------------------

  # Append a single event. Returns the stream ID Redis assigned.
  def produce(event_type, payload)
    produce_batch([[event_type, payload]]).first
  end

  # Pipeline several `XADD` calls in one round trip.
  #
  # Each entry carries an approximate `MAXLEN` cap. The `~` flavour
  # lets Redis trim at a macro-node boundary, which is much cheaper
  # than exact trimming and is the right call for a retention
  # guardrail rather than a hard size limit.
  def produce_batch(events)
    events = events.to_a
    return [] if events.empty?
    ids = @redis.pipelined do |pipe|
      events.each do |event_type, payload|
        fields = encode_fields(event_type, payload)
        pipe.xadd(@stream_key, fields,
                  maxlen: @maxlen_approx, approximate: true)
      end
    end
    @stats_lock.synchronize { @produced_total += ids.length }
    ids
  end

  # ------------------------------------------------------------------
  # Consumer groups
  # ------------------------------------------------------------------

  # Create the consumer group if it doesn't exist.
  #
  # `$` means "deliver only events appended after this point"; pass
  # `0-0` to replay the entire stream into a fresh group.
  def ensure_group(group, start_id = '$')
    @redis.xgroup(:create, @stream_key, group, start_id, mkstream: true)
  rescue Redis::CommandError => exc
    raise unless exc.message.include?('BUSYGROUP')
  end

  def delete_group(group)
    @redis.xgroup(:destroy, @stream_key, group).to_i
  end

  # Read new entries for this consumer via `XREADGROUP`.
  #
  # The `>` ID means "deliver entries this consumer group has not
  # delivered to *anyone* yet" -- that is the at-least-once path.
  # Replaying an explicit ID instead would re-deliver an entry that
  # is already in this consumer's pending list (see
  # `consume_own_pel` for that recovery path).
  def consume(group, consumer, count: 10, block_ms: 500)
    result = @redis.xreadgroup(group, consumer, @stream_key, '>',
                               count: count, block: block_ms)
    flatten_entries(result)
  end

  # Re-deliver entries already in this consumer's PEL.
  #
  # Reading with an explicit ID (`0` here) instead of `>` replays the
  # entries already assigned to this consumer name without advancing
  # the group's `last-delivered-id`. This is the canonical recovery
  # path after a crash on the same consumer name, and is also how a
  # consumer picks up entries that another consumer (or `XAUTOCLAIM`)
  # handed to it.
  def consume_own_pel(group, consumer, count: 10)
    result = @redis.xreadgroup(group, consumer, @stream_key, '0',
                               count: count)
    flatten_entries(result)
  end

  def ack(group, ids)
    ids = Array(ids)
    return 0 if ids.empty?
    n = @redis.xack(@stream_key, group, ids).to_i
    @stats_lock.synchronize { @acked_total += n }
    n
  end

  # Sweep idle pending entries to `consumer`.
  #
  # A single `XAUTOCLAIM` call scans up to `page_count` PEL entries
  # starting at `start_id` and returns a continuation cursor. For a
  # full sweep of the PEL, loop until the cursor returns to `0-0` (or
  # hit `max_pages` as a safety net so a very large PEL can't
  # monopolise the call).
  #
  # Returns a hash `{claimed: [...], deleted_ids: [...]}`.
  # `deleted_ids` are PEL entries whose stream payload had already
  # been trimmed by the time this sweep ran (typically because
  # `MAXLEN ~` retention outran a slow consumer). `XAUTOCLAIM`
  # removes those dangling slots from the PEL itself -- the caller
  # does *not* need to `XACK` them -- but they cannot be retried, so
  # log and route them to a dead-letter store for observability.
  #
  # redis-rb 5.x's `xautoclaim` wrapper discards the third return
  # element (deleted IDs), so this helper drives `XAUTOCLAIM`
  # directly via `redis.call` and parses the raw reply.
  def autoclaim(group, consumer, page_count: 100, start_id: '0-0',
                max_pages: 10)
    claimed_all = []
    deleted_all = []
    cursor = start_id
    max_pages.times do
      reply = @redis.call('XAUTOCLAIM', @stream_key, group, consumer,
                          @claim_min_idle_ms.to_s, cursor,
                          'COUNT', page_count.to_s)
      next_cursor = reply[0]
      claimed = parse_entries(reply[1])
      deleted = Array(reply[2])
      claimed_all.concat(claimed)
      deleted_all.concat(deleted)
      break if next_cursor == '0-0'
      cursor = next_cursor
    end
    @stats_lock.synchronize { @claimed_total += claimed_all.length }
    { claimed: claimed_all, deleted_ids: deleted_all }
  end

  # Drop a consumer from a group.
  #
  # `XGROUP DELCONSUMER` destroys this consumer's PEL entries -- any
  # entry it still owned is no longer tracked anywhere in the group,
  # and `XAUTOCLAIM` will never find it again. Always
  # `handover_pending` (or `XCLAIM` it manually) to a healthy
  # consumer first; this method is the raw destructive call and is
  # exposed only for explicit cleanup.
  def delete_consumer(group, consumer)
    @redis.xgroup(:delconsumer, @stream_key, group, consumer).to_i
  rescue Redis::CommandError
    0
  end

  # Move every PEL entry owned by `from_consumer` to `to_consumer`.
  #
  # Enumerates the source consumer's PEL with
  # `XPENDING ... CONSUMER` and reassigns each ID with `XCLAIM` at
  # zero idle time so the move is unconditional. (`XAUTOCLAIM` does
  # not filter by source consumer, so it cannot be used for a
  # per-consumer handover.)
  #
  # Call this before `delete_consumer` whenever the source still has
  # pending entries -- otherwise `XGROUP DELCONSUMER` would silently
  # destroy them and they could never be recovered.
  def handover_pending(group, from_consumer, to_consumer, batch: 100)
    moved = 0
    loop do
      rows = @redis.xpending(@stream_key, group, '-', '+', batch,
                             from_consumer)
      break if rows.nil? || rows.empty?
      ids = rows.map { |row| row['entry_id'] }
      claimed = @redis.xclaim(@stream_key, group, to_consumer, 0, ids)
      moved += claimed.is_a?(Hash) ? claimed.length : Array(claimed).length
      break if rows.length < batch
    end
    @stats_lock.synchronize { @claimed_total += moved }
    moved
  end

  # ------------------------------------------------------------------
  # Replay, length, trim
  # ------------------------------------------------------------------

  # Range read with `XRANGE` for replay or audit.
  #
  # Read-only: ranges do not update any group cursor and do not ack
  # anything. Useful for bootstrapping a new projection, for building
  # an audit view, or for debugging what actually went through the
  # stream.
  def replay(start_id: '-', end_id: '+', count: 100)
    rows = @redis.xrange(@stream_key, start_id, end_id, count: count)
    rows.map { |entry_id, fields| [entry_id, fields] }
  end

  def length
    @redis.xlen(@stream_key).to_i
  end

  def trim_maxlen(maxlen)
    @redis.xtrim(@stream_key, maxlen, approximate: true).to_i
  end

  def trim_minid(minid)
    @redis.xtrim(@stream_key, minid, strategy: 'MINID',
                 approximate: true).to_i
  end

  # ------------------------------------------------------------------
  # Inspection
  # ------------------------------------------------------------------

  # Subset of `XINFO STREAM` that's safe to JSON-encode.
  def info_stream
    raw = @redis.xinfo(:stream, @stream_key)
    first = raw['first-entry']
    last = raw['last-entry']
    {
      'length' => raw['length'].to_i,
      'last_generated_id' => raw['last-generated-id'],
      'first_entry_id' => first ? first[0] : nil,
      'last_entry_id' => last ? last[0] : nil,
    }
  rescue Redis::CommandError
    { 'length' => 0, 'last_generated_id' => nil,
      'first_entry_id' => nil, 'last_entry_id' => nil }
  end

  def info_groups
    rows = @redis.xinfo(:groups, @stream_key)
    rows.map do |row|
      {
        'name' => row['name'],
        'consumers' => row.fetch('consumers', 0).to_i,
        'pending' => row.fetch('pending', 0).to_i,
        'last_delivered_id' => row['last-delivered-id'],
        'lag' => row['lag'].nil? ? nil : row['lag'].to_i,
      }
    end
  rescue Redis::CommandError
    []
  end

  def info_consumers(group)
    rows = @redis.xinfo(:consumers, @stream_key, group)
    rows.map do |row|
      {
        'name' => row['name'],
        'pending' => row.fetch('pending', 0).to_i,
        'idle_ms' => row.fetch('idle', 0).to_i,
      }
    end
  rescue Redis::CommandError
    []
  end

  # Per-entry PEL view (id, consumer, idle, deliveries).
  def pending_detail(group, count: 20)
    rows = @redis.xpending(@stream_key, group, '-', '+', count)
    return [] if rows.nil? || rows.empty?
    rows.map do |row|
      {
        'id' => row['entry_id'],
        'consumer' => row['consumer'],
        'idle_ms' => row['elapsed'].to_i,
        'deliveries' => row['count'].to_i,
      }
    end
  rescue Redis::CommandError
    []
  end

  def stats
    @stats_lock.synchronize do
      {
        'produced_total' => @produced_total,
        'acked_total' => @acked_total,
        'claimed_total' => @claimed_total,
      }
    end
  end

  def reset_stats
    @stats_lock.synchronize do
      @produced_total = 0
      @acked_total = 0
      @claimed_total = 0
    end
  end

  # ------------------------------------------------------------------
  # Demo housekeeping
  # ------------------------------------------------------------------

  # Drop the stream key entirely. Used by the demo's reset path.
  def delete_stream
    @redis.del(@stream_key)
  end

  # XREVRANGE for the demo's "tail" view. Exposed as a convenience
  # because the demo server wants the newest N entries.
  def tail(count: 10)
    rows = @redis.xrevrange(@stream_key, '+', '-', count: count)
    rows.map { |entry_id, fields| [entry_id, fields] }
  end

  private

  def encode_fields(event_type, payload)
    fields = {
      'type' => event_type,
      'ts_ms' => (Time.now.to_f * 1000).to_i.to_s,
    }
    payload.each do |key, value|
      fields[key.to_s] = value.nil? ? '' : value.to_s
    end
    fields
  end

  # `XREADGROUP` via redis-rb returns `{ stream_key => { id => {field=>value} } }`
  # (a hash, not the python list-of-tuples). Flatten to `[[id, fields], ...]`.
  def flatten_entries(raw)
    return [] if raw.nil? || raw.empty?
    out = []
    raw.each do |_stream, entries|
      entries.each do |entry_id, fields|
        out << [entry_id, fields || {}]
      end
    end
    out
  end

  # Parse the raw XAUTOCLAIM "entries" reply (flat array of
  # `[id, [field, value, field, value, ...]]`) into `[[id, hash], ...]`.
  def parse_entries(raw)
    return [] if raw.nil?
    raw.compact.map do |entry_id, kv|
      fields = {}
      Array(kv).each_slice(2) { |k, v| fields[k] = v }
      [entry_id, fields]
    end
  end
end
