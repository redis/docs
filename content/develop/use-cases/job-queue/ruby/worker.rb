# Mock background worker for the job-queue demo.
#
# A worker pulls jobs off the queue, simulates work by sleeping for a
# configurable latency, and either completes the job, fails it, or
# intentionally hangs to simulate a worker crash that the reclaimer must
# recover from. This is the demo-side stand-in for whatever real work your
# application would run in the background (sending emails, transcoding
# video, calling third-party webhooks, etc.).

require 'thread'

require_relative 'job_queue'

# A single background worker thread that drains a Redis job queue.
class Worker
  attr_accessor :work_latency_ms, :fail_rate, :hang_rate
  attr_reader :name

  def initialize(name:, queue:, work_latency_ms: 400, fail_rate: 0.0, hang_rate: 0.0)
    @name = name
    @queue = queue
    @work_latency_ms = work_latency_ms
    @fail_rate = fail_rate
    @hang_rate = hang_rate
    @stop = true
    @thread = nil
    @processed = 0
    @lock = Mutex.new
  end

  def start
    # If a previous run was asked to stop, wait for it to finish before
    # starting a new thread -- otherwise we'd return early because the
    # old thread is still draining a blocking claim() call.
    if @thread && @thread.alive?
      return unless @stop
      @thread.join(2.0)
    end
    @stop = false
    @thread = Thread.new { run }
    @thread.name = @name if @thread.respond_to?(:name=)
  end

  def stop
    @stop = true
  end

  def alive?
    !@thread.nil? && @thread.alive?
  end

  def processed
    @lock.synchronize { @processed }
  end

  def reset_processed
    @lock.synchronize { @processed = 0 }
  end

  private

  def run
    until @stop
      job = @queue.claim(timeout_ms: 500)
      next if job.nil?
      process(job)
    end
  rescue StandardError => e
    warn "[worker #{@name}] error: #{e.class}: #{e.message}"
  end

  def process(job)
    # Decide outcome up front so the latency reflects "work was tried".
    outcome = pick_outcome
    sleep(@work_latency_ms / 1000.0)

    if outcome == :hang
      # Simulate a worker that crashed mid-job: don't complete, don't
      # fail. The reclaimer will move this job back to pending once
      # the visibility timeout elapses.
      return
    end

    if outcome == :fail
      @queue.fail(job, "#{@name} simulated failure")
      return
    end

    @lock.synchronize { @processed += 1 }
    @queue.complete(
      job,
      worker: @name,
      echo: job.payload,
      attempts: job.attempts,
    )
  end

  def pick_outcome
    roll = rand
    return :hang if roll < @hang_rate
    return :fail if roll < @hang_rate + @fail_rate
    :ok
  end
end

# A pool of named Worker threads that can be started and stopped.
#
# Each worker gets its own RedisJobQueue (built from queue_factory) so its
# blocking BRPOPLPUSH does not stall any other thread sharing the
# connection.
class WorkerPool
  attr_reader :work_latency_ms, :fail_rate, :hang_rate

  def initialize(queue_factory:, size: 2, work_latency_ms: 400, fail_rate: 0.0, hang_rate: 0.0)
    @queue_factory = queue_factory
    @work_latency_ms = work_latency_ms
    @fail_rate = fail_rate
    @hang_rate = hang_rate
    @workers = []
    @lock = Mutex.new
    resize(size)
  end

  def resize(size)
    @lock.synchronize do
      while @workers.length < size
        @workers << Worker.new(
          name: "worker-#{@workers.length + 1}",
          queue: @queue_factory.call,
          work_latency_ms: @work_latency_ms,
          fail_rate: @fail_rate,
          hang_rate: @hang_rate,
        )
      end
      while @workers.length > size
        worker = @workers.pop
        worker.stop
      end
    end
  end

  def start
    @lock.synchronize do
      @workers.each do |worker|
        worker.work_latency_ms = @work_latency_ms
        worker.fail_rate = @fail_rate
        worker.hang_rate = @hang_rate
        worker.start
      end
    end
  end

  def stop
    @lock.synchronize { @workers.each(&:stop) }
  end

  def running
    @lock.synchronize { @workers.count(&:alive?) }
  end

  def total_processed
    @lock.synchronize { @workers.sum(&:processed) }
  end

  def reset_processed
    @lock.synchronize { @workers.each(&:reset_processed) }
  end

  def configure(work_latency_ms: nil, fail_rate: nil, hang_rate: nil)
    @lock.synchronize do
      @work_latency_ms = [0, work_latency_ms.to_i].max unless work_latency_ms.nil?
      unless fail_rate.nil?
        @fail_rate = [[fail_rate.to_f, 0.0].max, 1.0].min
      end
      unless hang_rate.nil?
        @hang_rate = [[hang_rate.to_f, 0.0].max, 1.0].min
      end
      @workers.each do |worker|
        worker.work_latency_ms = @work_latency_ms
        worker.fail_rate = @fail_rate
        worker.hang_rate = @hang_rate
      end
    end
  end
end
