# frozen_string_literal: true

require "redis"

class RedisLeaderboard
  attr_reader :key, :max_entries

  def initialize(redis: nil, key: "leaderboard:demo", max_entries: 100)
    @redis = redis || Redis.new(host: "localhost", port: 6379)
    @key = key.to_s.empty? ? "leaderboard:demo" : key
    @max_entries = normalize_positive_int(max_entries, "max_entries")
  end

  def upsert_user(user_id, score, metadata = {})
    payload = coerce_metadata(metadata)

    @redis.pipelined do |pipeline|
      pipeline.zadd(@key, score, user_id)
      pipeline.hset(metadata_key(user_id), payload) unless payload.empty?
    end

    trimmed_user_ids = trim_to_max_entries
    entry = get_user_entry(user_id)

    if entry.nil?
      {
        rank: 0,
        user_id: user_id,
        score: score.to_f,
        metadata: payload,
        trimmed_user_ids: trimmed_user_ids
      }
    else
      entry.merge(trimmed_user_ids: trimmed_user_ids)
    end
  end

  def increment_score(user_id, amount, metadata = {})
    payload = coerce_metadata(metadata)

    results = @redis.pipelined do |pipeline|
      pipeline.zincrby(@key, amount, user_id)
      pipeline.hset(metadata_key(user_id), payload) unless payload.empty?
    end

    trimmed_user_ids = trim_to_max_entries
    entry = get_user_entry(user_id)

    if entry.nil?
      {
        rank: 0,
        user_id: user_id,
        score: results.first.to_f,
        metadata: payload,
        trimmed_user_ids: trimmed_user_ids
      }
    else
      entry.merge(trimmed_user_ids: trimmed_user_ids)
    end
  end

  def set_max_entries(max_entries)
    @max_entries = normalize_positive_int(max_entries, "max_entries")
    trim_to_max_entries
  end

  def get_top(count)
    normalized_count = normalize_positive_int(count, "count")
    entries = zrange_with_scores_rev(0, normalized_count - 1)
    hydrate_entries(entries, 1)
  end

  def get_around_rank(rank, count)
    normalized_rank = normalize_positive_int(rank, "rank")
    normalized_count = normalize_positive_int(count, "count")
    total_entries = get_size
    return [] if total_entries.zero?
    return list_all if total_entries <= normalized_count

    half_window = normalized_count / 2
    start = [0, normalized_rank - 1 - half_window].max
    max_start = total_entries - normalized_count
    start = max_start if start > max_start
    ending = start + normalized_count - 1

    entries = zrange_with_scores_rev(start, ending)
    hydrate_entries(entries, start + 1)
  end

  def get_rank(user_id)
    rank = @redis.zrevrank(@key, user_id)
    rank.nil? ? nil : rank + 1
  end

  def get_user_metadata(user_id)
    @redis.hgetall(metadata_key(user_id))
  end

  def get_user_entry(user_id)
    results = @redis.pipelined do |pipeline|
      pipeline.zscore(@key, user_id)
      pipeline.zrevrank(@key, user_id)
      pipeline.hgetall(metadata_key(user_id))
    end

    score, rank, metadata = results
    return nil if score.nil? || rank.nil?

    {
      rank: rank + 1,
      user_id: user_id,
      score: score.to_f,
      metadata: metadata,
      trimmed_user_ids: []
    }
  end

  def list_all
    entries = zrange_with_scores_rev(0, -1)
    hydrate_entries(entries, 1)
  end

  def get_size
    @redis.zcard(@key)
  end

  def delete_user(user_id)
    removed, = @redis.pipelined do |pipeline|
      pipeline.zrem(@key, user_id)
      pipeline.del(metadata_key(user_id))
    end
    removed == 1
  end

  def clear
    user_ids = @redis.zrange(@key, 0, -1)
    keys = [@key] + user_ids.map { |user_id| metadata_key(user_id) }
    @redis.del(*keys) unless keys.empty?
  end

  private

  def metadata_key(user_id)
    "#{@key}:user:#{user_id}"
  end

  def coerce_metadata(metadata)
    metadata.to_h.transform_keys(&:to_s).transform_values(&:to_s)
  end

  def zrange_with_scores_rev(start, ending)
    response = @redis.call("ZRANGE", @key, start, ending, "REV", "WITHSCORES")
    response.each_slice(2).map { |user_id, score| [user_id, score.to_f] }
  end

  def trim_to_max_entries
    overflow = get_size - @max_entries
    return [] if overflow <= 0

    trimmed_user_ids = @redis.zrange(@key, 0, overflow - 1)
    return [] if trimmed_user_ids.empty?

    @redis.zremrangebyrank(@key, 0, overflow - 1)
    @redis.del(*trimmed_user_ids.map { |user_id| metadata_key(user_id) })
    trimmed_user_ids
  end

  def hydrate_entries(entries, start_rank)
    entries.each_with_index.map do |(user_id, score), index|
      {
        rank: start_rank + index,
        user_id: user_id,
        score: score.to_f,
        metadata: get_user_metadata(user_id),
        trimmed_user_ids: []
      }
    end
  end

  def normalize_positive_int(value, field_name)
    integer = Integer(value)
    raise ArgumentError, "#{field_name} must be at least 1" if integer < 1

    integer
  end
end
