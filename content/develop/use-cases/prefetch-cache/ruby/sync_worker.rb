# Background sync worker for the prefetch-cache demo.
#
# A daemon thread drains the primary's change queue and applies each
# event to Redis through +PrefetchCache#apply_change+. In a real system
# the queue is replaced by a CDC pipeline (Redis Data Integration,
# Debezium, or an equivalent) that tails the primary's binlog/WAL and
# writes the same shape of events.
#
# The worker exposes +pause+ and +resume+ so maintenance paths
# (+/reprefetch+, +clear+) can stop event application without tearing
# the thread down. +pause+ blocks until the worker is parked, so the
# caller knows no apply is in flight by the time it returns.

require "thread"

class SyncWorker
  # Drain primary change events into Redis on a daemon thread.

  def initialize(primary:, cache:, poll_timeout_s: 0.05)
    @primary = primary
    @cache = cache
    @poll_timeout_s = poll_timeout_s

    @state_mutex = Mutex.new
    @state_cv = ConditionVariable.new
    @stop = false
    @pause = false
    @paused_idle = false
    @thread = nil
  end

  def start
    @state_mutex.synchronize do
      return if @thread && @thread.alive?
      @stop = false
      @pause = false
      @paused_idle = false
    end
    @thread = Thread.new { run_loop }
    @thread.name = "prefetch-cache-sync" if @thread.respond_to?(:name=)
    @thread
  end

  # Signal the worker to exit and join its thread.
  #
  # If the join times out the worker is wedged inside +apply_change+;
  # we leave +@thread+ populated so a subsequent +start+ does not spawn
  # a second worker on top of the orphan.
  def stop(join_timeout_s: 2.0)
    @state_mutex.synchronize do
      @stop = true
      @state_cv.broadcast
    end
    thread = @thread
    return if thread.nil?
    thread.join(join_timeout_s)
    @thread = nil unless thread.alive?
  end

  # Stop applying events and block until the worker is parked.
  #
  # Returns +true+ once the worker has confirmed it is idle, or
  # +false+ if the timeout elapsed first. While paused, change events
  # accumulate in the primary's queue and are applied in order after
  # +resume+.
  def pause(timeout_s: 2.0)
    deadline = monotonic + timeout_s
    @state_mutex.synchronize do
      @pause = true
      @paused_idle = false
      @state_cv.broadcast
      return true if @thread.nil? || !@thread.alive?
      until @paused_idle
        remaining = deadline - monotonic
        return false if remaining <= 0
        @state_cv.wait(@state_mutex, remaining)
      end
      true
    end
  end

  def resume
    @state_mutex.synchronize do
      @pause = false
      @paused_idle = false
      @state_cv.broadcast
    end
  end

  private

  def run_loop
    loop do
      should_stop, should_pause = @state_mutex.synchronize { [@stop, @pause] }
      break if should_stop

      if should_pause
        @state_mutex.synchronize do
          # Park until the pause is lifted or the worker is stopped.
          # Re-set @paused_idle on every iteration so a *new* pause
          # that arrives while we are still parked from the previous
          # cycle gets acknowledged immediately, not after the caller's
          # full pause-timeout.
          while @pause && !@stop
            @paused_idle = true
            @state_cv.broadcast
            @state_cv.wait(@state_mutex, @poll_timeout_s)
          end
          @paused_idle = false
        end
        next
      end

      change = @primary.next_change(@poll_timeout_s)
      next if change.nil?
      begin
        @cache.apply_change(change)
      rescue => exc
        # Demo behaviour: log and drop the event. A production CDC
        # consumer would retry with bounded backoff and expose a
        # dead-letter / error counter; see the guide's "Production
        # usage" section.
        warn "[sync] failed to apply #{change.inspect}: #{exc}"
      end
    end
  end

  def monotonic
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end
end
