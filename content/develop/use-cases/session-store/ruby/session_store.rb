# frozen_string_literal: true

require "redis"
require "securerandom"
require "time"

# Redis-backed session storage for Ruby web applications.
#
# Stores session data in Redis hashes and uses key expiration to
# remove inactive sessions automatically.
class RedisSessionStore
  RESERVED_SESSION_FIELDS = %w[created_at last_accessed_at session_ttl].freeze

  def initialize(redis: nil, prefix: "session:", ttl: 1800)
    @redis = redis || Redis.new(host: "localhost", port: 6379)
    @prefix = prefix.nil? || prefix.empty? ? "session:" : prefix
    @ttl = normalize_ttl(ttl)
  end

  def create_session(data = {}, ttl: nil)
    session_id = SecureRandom.urlsafe_base64(32)
    key = session_key(session_id)
    now = timestamp
    session_ttl = normalize_ttl(ttl)

    payload = user_payload(data).merge(
      "created_at" => now,
      "last_accessed_at" => now,
      "session_ttl" => session_ttl.to_s
    )

    @redis.pipelined do |pipeline|
      pipeline.hset(key, payload)
      pipeline.expire(key, session_ttl)
    end

    session_id
  end

  def get_configured_ttl(session_id)
    stored_ttl = @redis.hget(session_key(session_id), "session_ttl")
    return nil if stored_ttl.nil?

    normalize_ttl(Integer(stored_ttl))
  end

  def get_session(session_id, refresh_ttl: true)
    key = session_key(session_id)
    session = @redis.hgetall(key)
    return nil unless valid_session?(session)

    return session unless refresh_ttl

    session_ttl = normalize_ttl(Integer(session["session_ttl"]))
    result = @redis.pipelined do |pipeline|
      pipeline.hset(key, "last_accessed_at", timestamp)
      pipeline.expire(key, session_ttl)
      pipeline.hgetall(key)
    end

    refreshed = result[2] || {}
    valid_session?(refreshed) ? refreshed : nil
  end

  def update_session(session_id, data)
    key = session_key(session_id)
    session = @redis.hgetall(key)
    return false unless valid_session?(session)

    payload = user_payload(data)
    return true if payload.empty?

    session_ttl = normalize_ttl(Integer(session["session_ttl"]))
    payload["last_accessed_at"] = timestamp

    @redis.pipelined do |pipeline|
      pipeline.hset(key, payload)
      pipeline.expire(key, session_ttl)
    end

    true
  end

  def increment_field(session_id, field, amount = 1)
    key = session_key(session_id)
    session = @redis.hgetall(key)
    return nil unless valid_session?(session)

    session_ttl = normalize_ttl(Integer(session["session_ttl"]))
    result = @redis.pipelined do |pipeline|
      pipeline.hincrby(key, field, amount)
      pipeline.hset(key, "last_accessed_at", timestamp)
      pipeline.expire(key, session_ttl)
    end

    Integer(result[0])
  end

  def set_session_ttl(session_id, ttl)
    key = session_key(session_id)
    session = @redis.hgetall(key)
    return false unless valid_session?(session)

    session_ttl = normalize_ttl(ttl)

    @redis.pipelined do |pipeline|
      pipeline.hset(key, {
        "session_ttl" => session_ttl.to_s,
        "last_accessed_at" => timestamp
      })
      pipeline.expire(key, session_ttl)
    end

    true
  end

  def delete_session(session_id)
    @redis.del(session_key(session_id)) == 1
  end

  def get_ttl(session_id)
    Integer(@redis.ttl(session_key(session_id)))
  end

  private

  def normalize_ttl(value)
    ttl = value.nil? ? @ttl : Integer(value)
    raise ArgumentError, "TTL must be at least 1 second" if ttl < 1

    ttl
  end

  def session_key(session_id)
    "#{@prefix}#{session_id}"
  end

  def timestamp
    Time.now.utc.iso8601(0)
  end

  def valid_session?(session)
    return false if session.nil? || session.empty?

    RESERVED_SESSION_FIELDS.all? { |field| session.key?(field) }
  end

  def user_payload(data)
    data.each_with_object({}) do |(field, value), payload|
      next if RESERVED_SESSION_FIELDS.include?(field.to_s)

      payload[field.to_s] = value.to_s
    end
  end
end
