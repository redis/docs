# frozen_string_literal: true

require "redis"
require "digest/sha1"

# Token Bucket Rate Limiter
#
# A Redis-based token bucket rate limiter implementation using Lua scripts
# for atomic operations.
#
# The token bucket algorithm allows requests at a controlled rate by maintaining
# a bucket of tokens that refills over time. Each request consumes a token, and
# requests are denied when the bucket is empty.
class TokenBucket
  # Lua script for atomic token bucket operations
  SCRIPT = <<~LUA
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local refill_rate = tonumber(ARGV[2])
    local refill_interval = tonumber(ARGV[3])
    local now = tonumber(ARGV[4])

    -- Get current state or initialize
    local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
    local tokens = tonumber(bucket[1])
    local last_refill = tonumber(bucket[2])

    -- Initialize if this is the first request
    if tokens == nil then
        tokens = capacity
        last_refill = now
    end

    -- Calculate token refill
    local time_passed = now - last_refill
    local refills = math.floor(time_passed / refill_interval)

    if refills > 0 then
        tokens = math.min(capacity, tokens + (refills * refill_rate))
        last_refill = last_refill + (refills * refill_interval)
    end

    -- Try to consume a token
    local allowed = 0
    if tokens >= 1 then
        tokens = tokens - 1
        allowed = 1
    end

    -- Update state
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)

    -- Return result: allowed (1 or 0) and remaining tokens
    return {allowed, tokens}
  LUA

  # SHA1 digest of the Lua script for EVALSHA caching
  SCRIPT_SHA = Digest::SHA1.hexdigest(SCRIPT)

  # @return [Integer] maximum number of tokens in the bucket
  attr_reader :capacity

  # @return [Float] number of tokens added per refill interval
  attr_reader :refill_rate

  # @return [Float] time in seconds between refills
  attr_reader :refill_interval

  # Create a new token bucket rate limiter.
  #
  # @param capacity [Integer] maximum number of tokens in the bucket (default: 10)
  # @param refill_rate [Float] number of tokens added per refill interval (default: 1.0)
  # @param refill_interval [Float] time in seconds between refills (default: 1.0)
  # @param redis [Redis, nil] Redis client instance; creates a default client if nil
  #
  # @example Basic usage
  #   limiter = TokenBucket.new(capacity: 10, refill_rate: 1, refill_interval: 1.0)
  #
  # @example With custom Redis client
  #   r = Redis.new(host: "localhost", port: 6379)
  #   limiter = TokenBucket.new(capacity: 5, redis: r)
  def initialize(capacity: 10, refill_rate: 1.0, refill_interval: 1.0, redis: nil)
    @redis = redis || Redis.new(host: "localhost", port: 6379)
    @capacity = capacity
    @refill_rate = refill_rate
    @refill_interval = refill_interval
    @script_loaded = false
  end

  # Check if a request should be allowed for the given key.
  #
  # Uses EVALSHA for efficiency with an automatic EVAL fallback if the
  # script is not yet cached in Redis.
  #
  # @param key [String] the rate limit key (e.g., "user:123", "api:endpoint:xyz")
  # @return [Hash] a hash with +:allowed+ (Boolean) and +:remaining+ (Float) keys
  #
  # @example
  #   result = limiter.allow("user:123")
  #   if result[:allowed]
  #     puts "Request allowed. #{result[:remaining]} tokens remaining."
  #   else
  #     puts "Request denied. Rate limit exceeded."
  #   end
  def allow(key)
    ensure_script_loaded
    now = Time.now.to_f

    result = begin
      @redis.evalsha(SCRIPT_SHA, keys: [key], argv: [@capacity, @refill_rate, @refill_interval, now])
    rescue Redis::CommandError => e
      raise unless e.message.include?("NOSCRIPT")

      @script_loaded = false
      @redis.eval(SCRIPT, keys: [key], argv: [@capacity, @refill_rate, @refill_interval, now])
    end

    { allowed: result[0] == 1, remaining: result[1].to_f }
  end

  private

  # Ensure the Lua script is loaded into Redis.
  #
  # @return [void]
  def ensure_script_loaded
    return if @script_loaded

    begin
      @redis.script(:load, SCRIPT)
      @script_loaded = true
    rescue Redis::BaseError
      # If loading fails, allow will fall back to EVAL
      nil
    end
  end
end

