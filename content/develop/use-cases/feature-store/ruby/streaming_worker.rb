# Streaming feature updater for the demo.
#
# Stands in for whatever Flink, Kafka Streams, or bespoke service
# computes the real-time features in a real deployment. In production
# this code lives in the streaming layer; here it runs as a daemon
# thread next to the demo server so the UI can start, pause, and
# resume it.

require 'thread'

class StreamingWorker
  DEVICE_IDS = %w[ios-1a4c ios-9f02 and-7b21 and-2d18 web-chr-1 web-saf-1 web-ff-2].freeze
  SESSION_COUNTRIES = %w[US GB DE FR IN BR JP AU CA NL].freeze
  FAILED_LOGIN_BUCKETS = [0, 1, 2, 5].freeze
  FAILED_LOGIN_WEIGHTS = [70, 20, 8, 2].freeze

  attr_reader :users_per_tick

  def initialize(store:, tick_seconds: 1.0, users_per_tick: 5, seed: 1337)
    @store = store
    @tick = tick_seconds
    @users_per_tick = users_per_tick
    @rng = Random.new(seed)
    @rng_lock = Mutex.new

    @lifecycle_lock = Mutex.new
    @running = false
    @paused = false
    @tick_in_flight = false
    @tick_count = 0
    @writes_count = 0
    @stop = false
    @thread = nil
  end

  # ------------------------------------------------------------------
  # Lifecycle
  # ------------------------------------------------------------------

  def start
    @lifecycle_lock.synchronize do
      return if @running
      @running = true
      @paused = false
      @stop = false
      @thread = Thread.new { run }
      @thread.report_on_exception = true
    end
  end

  def stop
    thread = nil
    @lifecycle_lock.synchronize do
      return unless @running
      @stop = true
      @running = false
      thread = @thread
      @thread = nil
    end
    if thread && !thread.join(2)
      warn '[streaming-worker] stop timed out; waiting for tick to complete'
      thread.join
    end
    # Defensive clear: the run loop's outer ensure already does this,
    # but the thread may have exited via a path that skips it.
    @tick_in_flight = false
  end

  def pause; @paused = true; end
  def resume; @paused = false; end

  def running?; @running; end
  def paused?; @paused; end

  # Block until any in-flight tick has finished. `pause` only stops
  # *future* ticks; callers (a reset that's about to DEL every
  # entity, for example) use this to flush a mid-flight tick before
  # they touch state the tick might still be writing to.
  def wait_for_idle
    sleep(0.02) while @tick_in_flight
  end

  def stats
    {
      running: @running,
      paused: @paused,
      tick_count: @tick_count,
      writes_count: @writes_count,
    }
  end

  def reset_stats
    @tick_count = 0
    @writes_count = 0
  end

  # ------------------------------------------------------------------
  # Tick loop
  # ------------------------------------------------------------------

  private

  def run
    until @stop
      sleep(@tick)
      break if @stop

      # Set tick_in_flight *before* the pause check so a concurrent
      # pause+wait_for_idle can never observe tick_in_flight=false in
      # the window between the pause check and the actual tick call.
      # The ensure block clears the flag whether we paused, succeeded,
      # or raised.
      @tick_in_flight = true
      begin
        do_tick unless @paused
      rescue => e
        warn "[streaming-worker] tick failed: #{e.class}: #{e.message}"
      ensure
        @tick_in_flight = false
      end
    end
  ensure
    # Clear running and tick_in_flight no matter how the thread
    # exits so a later start can spin a fresh thread.
    @running = false
    @tick_in_flight = false
  end

  def do_tick
    ids = @store.list_entity_ids(limit: 500)
    return if ids.empty?
    picks = sample(ids, @users_per_tick)
    now_ms = (Time.now.to_f * 1000).to_i
    writes = 0
    picks.each do |id|
      fields = {
        'last_login_ts' => now_ms,
        'last_device_id' => choice(DEVICE_IDS),
        'tx_count_5m' => intn(13),
        'failed_logins_15m' => weighted_int(FAILED_LOGIN_BUCKETS, FAILED_LOGIN_WEIGHTS),
        'session_country' => choice(SESSION_COUNTRIES),
      }
      @store.update_streaming(id, fields)
      writes += fields.size
    end
    @tick_count += 1
    @writes_count += writes
  end

  def sample(items, k)
    @rng_lock.synchronize do
      pool = items.dup
      out = []
      [k, pool.size].min.times do
        idx = @rng.rand(pool.size)
        out << pool.delete_at(idx)
      end
      out
    end
  end

  def choice(items)
    @rng_lock.synchronize { items[@rng.rand(items.size)] }
  end

  def intn(n)
    @rng_lock.synchronize { @rng.rand(n) }
  end

  def weighted_int(items, weights)
    @rng_lock.synchronize do
      total = weights.sum
      r = @rng.rand(total)
      items.each_with_index do |item, i|
        r -= weights[i]
        return item if r < 0
      end
      items.last
    end
  end
end
