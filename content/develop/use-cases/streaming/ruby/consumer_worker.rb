# Background consumer thread for a single consumer in a consumer group.
#
# Each worker owns a daemon thread that loops on `XREADGROUP >` with a
# short block timeout and acks every entry it processes. Recovery of
# stuck PEL entries (this consumer's, or anyone else's) happens through
# `reap_idle_pel`, which is the textbook Streams pattern: each consumer
# periodically (or on demand) calls `XAUTOCLAIM` with itself as the
# target, then processes whatever it claimed. The demo's "XAUTOCLAIM
# to selected" button is exactly that call.
#
# Two demo-only levers are wired into the loop:
#
# * `pause` parks the worker (so its pending entries age into the
#   `XAUTOCLAIM` window without being consumed by `>` reads).
# * `crash_next(n)` tells the worker to drop its next `n` deliveries
#   on the floor without acking them -- the same effect as a worker
#   process dying mid-message. Those entries stay in the group's PEL
#   until `reap_idle_pel` recovers them.
#
# Real consumers do not need either lever; they only need
# `XREADGROUP` -> process -> `XACK` in the main loop and a periodic
# `reap_idle_pel` call to recover stuck entries.

require 'thread'

require_relative 'event_stream'

# One consumer in a consumer group, running in its own Ruby Thread.
#
# Each worker is constructed with two `RedisEventStream` handles:
#
# * `read_stream` -- a dedicated stream/connection used only for the
#   blocking `XREADGROUP` and `XAUTOCLAIM` calls. redis-rb 5.x is not
#   thread-safe across concurrent calls on a single connection, and
#   `XREADGROUP BLOCK n` parks that connection on the server, so each
#   worker needs its own. Per-thread acks and stats go through this
#   handle too.
# * `shared_stream` -- the demo server's primary stream. The worker
#   acks through this handle so the demo's aggregate `acked_total`
#   counter reflects every worker's progress, and so the same stats
#   surface the HTTP layer reads. Only non-blocking commands run on
#   this connection.
class ConsumerWorker
  attr_reader :group, :name

  def initialize(read_stream:, shared_stream:, group:, name:,
                 process_latency_ms: 25, recent_capacity: 20)
    @read_stream = read_stream
    @shared_stream = shared_stream
    @group = group
    @name = name
    @process_latency_ms = process_latency_ms
    @recent_capacity = recent_capacity

    @lock = Mutex.new
    @recent = []
    @processed = 0
    @reaped = 0
    @crashed_drops = 0
    @crash_next = 0
    @paused = false

    @stop = true
    @thread = nil
  end

  # ------------------------------------------------------------------
  # Lifecycle
  # ------------------------------------------------------------------

  def start
    return if @thread && @thread.alive?
    @stop = false
    @thread = Thread.new { run }
    @thread.name = "consumer-#{@group}-#{@name}" if @thread.respond_to?(:name=)
  end

  def stop(timeout: 1.0)
    @stop = true
    @thread&.join(timeout)
  end

  # ------------------------------------------------------------------
  # Demo levers
  # ------------------------------------------------------------------

  def pause
    @lock.synchronize { @paused = true }
  end

  def resume
    @lock.synchronize { @paused = false }
  end

  # Drop the next `count` deliveries without acking them.
  #
  # The entries stay in the group's PEL with their delivery counter
  # incremented, so `XAUTOCLAIM` can recover them once they exceed
  # the idle threshold.
  def crash_next(count)
    n = [count.to_i, 0].max
    @lock.synchronize { @crash_next += n }
  end

  # ------------------------------------------------------------------
  # Introspection
  # ------------------------------------------------------------------

  def recent
    @lock.synchronize { @recent.dup }
  end

  def status
    @lock.synchronize do
      {
        'name' => @name,
        'group' => @group,
        'processed' => @processed,
        'reaped' => @reaped,
        'crashed_drops' => @crashed_drops,
        'paused' => @paused,
        'crash_queued' => @crash_next,
        'alive' => !@thread.nil? && @thread.alive?,
      }
    end
  end

  # ------------------------------------------------------------------
  # Recovery
  # ------------------------------------------------------------------

  # Run `XAUTOCLAIM` into self and process the claimed entries.
  #
  # Returns a hash with `claimed`, `processed`, and `deleted_ids`.
  # Safe to call from any thread -- the heavy lifting is
  # `stream.autoclaim` (a Redis call) and the sequential per-entry
  # dispatch.
  #
  # `deleted_ids` are PEL entries whose stream payload was already
  # trimmed by `MAXLEN ~` / `XTRIM` before the sweep ran. Redis 7+
  # removes them from the PEL inside `XAUTOCLAIM` itself, so the
  # caller does not have to `XACK` them; they are reported so the
  # caller can route them to a dead-letter store.
  def reap_idle_pel
    # XAUTOCLAIM is non-blocking and reap_idle_pel is invoked from
    # the HTTP handler thread, so it runs on the shared (demo
    # server) connection. The blocking XREADGROUP on the worker's
    # own connection is unaffected, and `claimed_total` lands in
    # the same stats hash the UI reads.
    result = @shared_stream.autoclaim(@group, @name,
                                      page_count: 100, max_pages: 10)
    claimed = result[:claimed]
    deleted = result[:deleted_ids]
    processed = 0
    claimed.each do |entry_id, fields|
      begin
        handle_entry(entry_id, fields)
        processed += 1
      rescue StandardError => exc
        warn "[#{@group}/#{@name}] reap failed on #{entry_id}: #{exc}"
      end
    end
    @lock.synchronize { @reaped += processed }
    { claimed: claimed.length, processed: processed, deleted_ids: deleted }
  end

  private

  def run
    until @stop
      if @lock.synchronize { @paused }
        sleep 0.05
        next
      end
      begin
        entries = @read_stream.consume(@group, @name, count: 10, block_ms: 500)
      rescue StandardError => exc
        # Don't kill the thread on a transient Redis error; a real
        # consumer would log this and back off.
        warn "[#{@group}/#{@name}] read failed: #{exc}"
        sleep 0.5
        next
      end

      entries.each do |entry_id, fields|
        dispatch(entry_id, fields)
      end
    end
  rescue StandardError => exc
    warn "[#{@group}/#{@name}] worker thread crashed: #{exc.class}: #{exc.message}"
  end

  def dispatch(entry_id, fields)
    sleep(@process_latency_ms / 1000.0) if @process_latency_ms.to_i > 0
    begin
      handle_entry(entry_id, fields)
    rescue StandardError => exc
      # A failure here (typically XACK against Redis) must not kill
      # the worker thread -- that would silently halt this consumer
      # while every other entry sat in its PEL waiting for
      # XAUTOCLAIM. The entry stays unacked; the next reap call
      # (here or on any consumer in the group) can recover it once
      # it exceeds the idle threshold.
      warn "[#{@group}/#{@name}] failed to handle #{entry_id}: #{exc}"
      record_recent(entry_id, fields, acked: false,
                    note: "handler error: #{exc.message}")
    end
  end

  def handle_entry(entry_id, fields)
    drop = false
    @lock.synchronize do
      if @crash_next > 0
        drop = true
        @crash_next -= 1
      end
    end

    if drop
      @lock.synchronize { @crashed_drops += 1 }
      record_recent(entry_id, fields, acked: false,
                    note: 'dropped (simulated crash)')
      return
    end

    # Ack via the shared stream so the demo's aggregate
    # `acked_total` counter reflects every worker. XACK is a quick
    # non-blocking command, so the brief monitor contention with
    # the HTTP handlers (which read state through the same shared
    # connection) is negligible in the demo. A production deployment
    # could use a per-worker `Redis` connection here and aggregate
    # stats separately.
    @shared_stream.ack(@group, [entry_id])
    @lock.synchronize { @processed += 1 }
    record_recent(entry_id, fields, acked: true, note: '')
  end

  def record_recent(entry_id, fields, acked:, note:)
    entry = {
      'id' => entry_id,
      'type' => fields['type'] || '',
      'fields' => fields,
      'acked' => acked,
      'note' => note,
    }
    @lock.synchronize do
      @recent.unshift(entry)
      @recent.pop while @recent.length > @recent_capacity
    end
  end
end
