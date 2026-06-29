# frozen_string_literal: true

require "redis"
require "securerandom"

# Cache-aside helper backed by Redis hashes with TTL and Lua-backed
# single-flight stampede protection.
class RedisCache
  ACQUIRE_LOCK_SCRIPT = <<~LUA
    if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
        return 1
    end
    return 0
  LUA

  RELEASE_LOCK_SCRIPT = <<~LUA
    if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
    end
    return 0
  LUA

  def initialize(redis: nil, prefix: "cache:product:", ttl: 30, lock_ttl_ms: 2000, wait_poll_ms: 25)
    @redis = redis || Redis.new(host: "localhost", port: 6379)
    @prefix = prefix
    @ttl = ttl
    @lock_ttl_ms = lock_ttl_ms
    @wait_poll_ms = wait_poll_ms
    @stats = { hits: 0, misses: 0, stampedes_suppressed: 0 }
    @stats_mutex = Mutex.new
  end

  attr_reader :ttl

  def get(entity_id, &loader)
    cache_key = cache_key(entity_id)

    started = monotonic_ms
    cached = @redis.hgetall(cache_key)
    redis_latency_ms = monotonic_ms - started

    if cached && !cached.empty?
      record_hit
      return { record: cached, hit: true, redis_latency_ms: redis_latency_ms }
    end

    record_miss
    record = load_with_single_flight(entity_id, &loader)
    { record: record, hit: false, redis_latency_ms: redis_latency_ms }
  end

  def invalidate(entity_id)
    @redis.del(cache_key(entity_id)) == 1
  end

  def update_field(entity_id, field, value)
    cache_key = cache_key(entity_id)
    loop do
      @redis.watch(cache_key)
      unless @redis.exists?(cache_key)
        @redis.unwatch
        return false
      end
      result = @redis.multi do |pipe|
        pipe.hset(cache_key, field, value.to_s)
        pipe.expire(cache_key, @ttl)
      end
      return true if result
      # nil result means WATCH detected a change — retry.
    end
  end

  def ttl_remaining(entity_id)
    @redis.ttl(cache_key(entity_id))
  end

  def stats
    @stats_mutex.synchronize do
      total = @stats[:hits] + @stats[:misses]
      hit_rate = total.zero? ? 0.0 : (1000 * @stats[:hits] / total).to_f / 10
      {
        "hits" => @stats[:hits],
        "misses" => @stats[:misses],
        "stampedes_suppressed" => @stats[:stampedes_suppressed],
        "hit_rate_pct" => hit_rate,
      }
    end
  end

  def reset_stats
    @stats_mutex.synchronize do
      @stats[:hits] = 0
      @stats[:misses] = 0
      @stats[:stampedes_suppressed] = 0
    end
  end

  private

  def cache_key(id)
    "#{@prefix}#{id}"
  end

  def lock_key(id)
    "lock:#{@prefix}#{id}"
  end

  def load_with_single_flight(entity_id, &loader)
    cache_key = cache_key(entity_id)
    lock_key = lock_key(entity_id)
    token = SecureRandom.hex(8)

    acquired = @redis.eval(ACQUIRE_LOCK_SCRIPT, keys: [lock_key], argv: [token, @lock_ttl_ms.to_s])

    if acquired == 1
      begin
        record = loader.call(entity_id)
        return nil if record.nil?
        @redis.multi do |pipe|
          pipe.del(cache_key)
          pipe.hset(cache_key, record)
          pipe.expire(cache_key, @ttl)
        end
        return record
      ensure
        @redis.eval(RELEASE_LOCK_SCRIPT, keys: [lock_key], argv: [token])
      end
    end

    record_stampede_suppressed
    deadline = monotonic_ms + @lock_ttl_ms
    while monotonic_ms < deadline
      sleep(@wait_poll_ms / 1000.0)
      cached = @redis.hgetall(cache_key)
      return cached if cached && !cached.empty?
    end
    loader.call(entity_id)
  end

  def monotonic_ms
    Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0
  end

  def record_hit
    @stats_mutex.synchronize { @stats[:hits] += 1 }
  end

  def record_miss
    @stats_mutex.synchronize { @stats[:misses] += 1 }
  end

  def record_stampede_suppressed
    @stats_mutex.synchronize { @stats[:stampedes_suppressed] += 1 }
  end
end
