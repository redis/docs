# Redis-backed job queue helper.
#
# Jobs are pushed onto a pending list and atomically moved to a processing
# list when a worker claims them. Each job's payload, status, attempts, and
# result live in a Redis hash. A reclaimer scans the processing list for
# jobs older than the visibility timeout and pushes them back to pending so
# no work is lost when a worker dies mid-job.

require 'json'
require 'redis'
require 'securerandom'
require 'thread'

# Mark a job complete and remove it from the processing list. Only deletes
# from the processing list if the worker still owns the claim token; this
# prevents a worker that was reclaimed (because it went over the visibility
# timeout) from later marking a job complete that another worker has
# already picked up.
COMPLETE_SCRIPT = <<~LUA.freeze
  local meta_key = KEYS[1] .. ARGV[1]
  local current_token = redis.call('HGET', meta_key, 'claim_token')
  if current_token ~= ARGV[2] then
    return 0
  end
  redis.call('LREM', KEYS[2], 1, ARGV[1])
  redis.call('HSET', meta_key,
    'status', ARGV[3],
    'completed_at_ms', ARGV[4],
    'result', ARGV[5])
  redis.call('EXPIRE', meta_key, ARGV[6])
  redis.call('LPUSH', KEYS[3], ARGV[1])
  redis.call('LTRIM', KEYS[3], 0, ARGV[7] - 1)
  return 1
LUA

# Record a failure. If the job still has retries left it goes back to the
# pending list; otherwise it lands in the failed list with its metadata
# expiring on the same schedule as completed jobs. Only acts if the
# caller still owns the claim token -- a reclaimed job can't be failed
# by the original claimant.
FAIL_SCRIPT = <<~LUA.freeze
  local meta_key = KEYS[1] .. ARGV[1]
  local current_token = redis.call('HGET', meta_key, 'claim_token')
  if current_token ~= ARGV[2] then
    return 0
  end
  redis.call('LREM', KEYS[2], 1, ARGV[1])
  if ARGV[7] == '1' then
    redis.call('HSET', meta_key,
      'status', 'pending',
      'last_error', ARGV[3],
      'last_error_at_ms', ARGV[4],
      'claim_token', '',
      'claimed_at_ms', 0)
    redis.call('LPUSH', KEYS[3], ARGV[1])
    return 1
  else
    redis.call('HSET', meta_key,
      'status', 'failed',
      'last_error', ARGV[3],
      'last_error_at_ms', ARGV[4],
      'claim_token', '')
    redis.call('LPUSH', KEYS[4], ARGV[1])
    redis.call('LTRIM', KEYS[4], 0, ARGV[6] - 1)
    redis.call('EXPIRE', meta_key, ARGV[5])
    return 2
  end
LUA

# Reclaim jobs whose claim has gone stale. Walks the processing list and
# moves any job past the visibility timeout back to the pending list.
# A job is past the timeout if either:
#   - claimed_at_ms is set and (now - claimed_at_ms) > visibility_ms, OR
#   - claimed_at_ms is missing (worker crashed between BRPOPLPUSH and the
#     metadata write) and (now - enqueued_at_ms) > 2 * visibility_ms.
# Runs in one round trip so a concurrent worker can't claim a
# half-reclaimed job.
RECLAIM_SCRIPT = <<~LUA.freeze
  local now_ms = tonumber(ARGV[1])
  local visibility_ms = tonumber(ARGV[2])
  local processing = redis.call('LRANGE', KEYS[2], 0, -1)
  local reclaimed = {}
  for _, job_id in ipairs(processing) do
    local meta_key = KEYS[3] .. job_id
    local claimed_at = tonumber(redis.call('HGET', meta_key, 'claimed_at_ms') or '0')
    local enqueued_at = tonumber(redis.call('HGET', meta_key, 'enqueued_at_ms') or '0')
    local stale = false
    if claimed_at > 0 and (now_ms - claimed_at) > visibility_ms then
      stale = true
    elseif claimed_at == 0 and enqueued_at > 0 and (now_ms - enqueued_at) > (visibility_ms * 2) then
      stale = true
    end
    if stale then
      redis.call('LREM', KEYS[2], 1, job_id)
      redis.call('LPUSH', KEYS[1], job_id)
      redis.call('HSET', meta_key,
        'status', 'pending',
        'reclaimed_at_ms', now_ms,
        'claim_token', '',
        'claimed_at_ms', 0)
      table.insert(reclaimed, job_id)
    end
  end
  return reclaimed
LUA

# A job that has been atomically moved into the processing list.
ClaimedJob = Struct.new(:id, :payload, :attempts, :claim_token) do
  def to_h
    { id: id, payload: payload, attempts: attempts, claim_token: claim_token }
  end
end

# Reliable FIFO job queue with visibility-timeout reclaim.
class RedisJobQueue
  attr_reader :visibility_ms

  def initialize(redis:, queue_name: 'jobs', visibility_ms: 5000,
                 completed_ttl: 300, completed_history: 50, max_attempts: 3)
    @redis = redis
    @queue_name = queue_name
    @visibility_ms = visibility_ms
    @completed_ttl = completed_ttl
    @completed_history = completed_history
    @max_attempts = max_attempts

    @pending_key = "queue:#{queue_name}:pending"
    @processing_key = "queue:#{queue_name}:processing"
    @completed_key = "queue:#{queue_name}:completed"
    @failed_key = "queue:#{queue_name}:failed"
    @meta_prefix = "queue:#{queue_name}:job:"
    @events_channel = "queue:#{queue_name}:events"
    @stats_key = "queue:#{queue_name}:stats"

    @complete_sha = @redis.script(:load, COMPLETE_SCRIPT)
    @fail_sha = @redis.script(:load, FAIL_SCRIPT)
    @reclaim_sha = @redis.script(:load, RECLAIM_SCRIPT)
  end

  # Push a new job onto the pending list and return its ID.
  def enqueue(payload)
    job_id = SecureRandom.hex(8)
    now_ms = self.class.now_ms
    meta = {
      'id' => job_id,
      'payload' => JSON.generate(payload),
      'status' => 'pending',
      'attempts' => 0,
      'enqueued_at_ms' => now_ms,
      'claim_token' => '',
    }
    @redis.pipelined do |pipe|
      pipe.hset(meta_key(job_id), meta)
      pipe.lpush(@pending_key, job_id)
      pipe.hincrby(@stats_key, 'enqueued_total', 1)
    end
    job_id
  end

  # Block until a job is available, then atomically claim it.
  #
  # Uses BRPOPLPUSH to wait for a pending job and move it to the
  # processing list in a single Redis call. Returns nil if nothing arrives
  # before timeout_ms.
  def claim(timeout_ms: 1000)
    timeout_s = [timeout_ms / 1000.0, 0.1].max
    job_id = @redis.brpoplpush(@pending_key, @processing_key, timeout: timeout_s)
    return nil if job_id.nil?

    token = SecureRandom.hex(8)
    now_ms = self.class.now_ms
    mkey = meta_key(job_id)
    results = @redis.pipelined do |pipe|
      pipe.hset(mkey,
                'status', 'processing',
                'claimed_at_ms', now_ms,
                'claim_token', token)
      pipe.hincrby(mkey, 'attempts', 1)
      pipe.hgetall(mkey)
    end
    meta = results.last || {}

    payload = begin
      JSON.parse(meta['payload'] || '{}')
    rescue JSON::ParserError
      {}
    end
    attempts = (meta['attempts'] || '1').to_i
    ClaimedJob.new(job_id, payload, attempts, token)
  end

  # Mark a job complete and remove it from the processing list.
  #
  # Only succeeds if the worker still owns the claim -- a job that was
  # reclaimed by the visibility-timeout sweep can no longer be completed
  # by the original claimant.
  def complete(job, result)
    ok = @redis.evalsha(
      @complete_sha,
      keys: [@meta_prefix, @processing_key, @completed_key],
      argv: [
        job.id,
        job.claim_token,
        'completed',
        self.class.now_ms,
        JSON.generate(result),
        @completed_ttl,
        @completed_history,
      ],
    )
    return false if ok.nil? || ok.to_i.zero?

    @redis.publish(@events_channel, JSON.generate(id: job.id, status: 'completed'))
    @redis.hincrby(@stats_key, 'completed_total', 1)
    true
  end

  # Record a failure. Retries up to max_attempts, then gives up.
  def fail(job, error)
    retry_flag = job.attempts < @max_attempts
    result = @redis.evalsha(
      @fail_sha,
      keys: [@meta_prefix, @processing_key, @pending_key, @failed_key],
      argv: [
        job.id,
        job.claim_token,
        error,
        self.class.now_ms,
        @completed_ttl,
        @completed_history,
        retry_flag ? '1' : '0',
      ],
    )
    return false if result.nil? || result.to_i.zero?

    @redis.publish(
      @events_channel,
      JSON.generate(id: job.id, status: retry_flag ? 'retry' : 'failed'),
    )
    @redis.hincrby(@stats_key, 'failed_total', 1) unless retry_flag
    true
  end

  # Move processing-list jobs past the visibility timeout back to pending.
  def reclaim_stuck
    reclaimed = @redis.evalsha(
      @reclaim_sha,
      keys: [@pending_key, @processing_key, @meta_prefix],
      argv: [self.class.now_ms, @visibility_ms],
    ) || []
    @redis.hincrby(@stats_key, 'reclaimed_total', reclaimed.length) if reclaimed.any?
    reclaimed
  end

  # Return the current metadata hash for job_id, decoded.
  def get_job(job_id)
    meta = @redis.hgetall(meta_key(job_id))
    return nil if meta.nil? || meta.empty?

    meta['payload'] = begin
      JSON.parse(meta['payload'] || '{}')
    rescue JSON::ParserError
      {}
    end
    if meta.key?('result')
      begin
        meta['result'] = JSON.parse(meta['result'])
      rescue JSON::ParserError
        # leave as raw string
      end
    end
    meta
  end

  def list_pending
    @redis.lrange(@pending_key, 0, -1).reverse
  end

  def list_processing
    @redis.lrange(@processing_key, 0, -1)
  end

  def list_completed
    @redis.lrange(@completed_key, 0, -1)
  end

  def list_failed
    @redis.lrange(@failed_key, 0, -1)
  end

  # Return counters plus the current queue depth.
  def stats
    pending, processing, completed, failed, counters = @redis.pipelined do |pipe|
      pipe.llen(@pending_key)
      pipe.llen(@processing_key)
      pipe.llen(@completed_key)
      pipe.llen(@failed_key)
      pipe.hgetall(@stats_key)
    end
    {
      'enqueued_total' => (counters['enqueued_total'] || 0).to_i,
      'completed_total' => (counters['completed_total'] || 0).to_i,
      'failed_total' => (counters['failed_total'] || 0).to_i,
      'reclaimed_total' => (counters['reclaimed_total'] || 0).to_i,
      'pending_depth' => pending,
      'processing_depth' => processing,
      'completed_depth' => completed,
      'failed_depth' => failed,
      'visibility_ms' => @visibility_ms,
    }
  end

  def reset_stats
    @redis.del(@stats_key)
  end

  # Delete every queue list and every job metadata hash.
  def purge
    @redis.del(@pending_key, @processing_key, @completed_key, @failed_key, @stats_key)
    cursor = '0'
    loop do
      cursor, keys = @redis.scan(cursor, match: "#{@meta_prefix}*", count: 100)
      @redis.del(*keys) unless keys.empty?
      break if cursor == '0'
    end
    reset_stats
  end

  def self.now_ms
    (Time.now.to_f * 1000).to_i
  end

  private

  def meta_key(job_id)
    "#{@meta_prefix}#{job_id}"
  end
end
