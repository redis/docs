# frozen_string_literal: true

require "redis"

# Redis TimeSeries helpers for the rolling three-sensor dashboard demo.
class RedisTimeSeriesStore
  SAMPLE_INTERVAL_MS = 500
  WINDOW_MS = 12_000
  BUCKET_MS = 3_000
  RETENTION_MS = 12_000

  def initialize(redis:, sensors:)
    @redis = redis
    @sensors = sensors
  end

  def ensure_schema
    @sensors.each do |sensor|
      args = [sensor.key, "RETENTION", RETENTION_MS.to_s, "LABELS"]
      sensor.labels.each do |label, value|
        args << label << value
      end

      begin
        @redis.call("TS.CREATE", *args)
      rescue Redis::CommandError => error
        raise unless error.message.downcase.include?("key already exists")
      end
    end
  end

  def add_samples(samples)
    return if samples.empty?

    timestamp_ms = current_time_ms
    args = samples.flat_map do |sample|
      [sample.sensor.key, timestamp_ms.to_s, sample.value.to_s]
    end
    @redis.call("TS.MADD", *args)
  end

  def dashboard_snapshot
    now_ms = current_time_ms
    start_ms = now_ms - WINDOW_MS
    aggregate_start_ms = start_ms - BUCKET_MS

    sensors = @sensors.map do |sensor|
      raw_points = range_query(sensor, start_ms, now_ms)
      min_points = aggregate_query(sensor, aggregate_start_ms, now_ms, "min")
      max_points = aggregate_query(sensor, aggregate_start_ms, now_ms, "max")
      avg_points = aggregate_query(sensor, aggregate_start_ms, now_ms, "avg")
      latest = latest_query(sensor)

      min_by_bucket = index_points(min_points)
      max_by_bucket = index_points(max_points)
      avg_by_bucket = index_points(avg_points)

      first_bucket_start = (start_ms / BUCKET_MS) * BUCKET_MS
      first_bucket_start -= BUCKET_MS if first_bucket_start > start_ms
      last_bucket_start = (now_ms / BUCKET_MS) * BUCKET_MS

      buckets = []
      bucket_start = first_bucket_start
      while bucket_start <= last_bucket_start
        buckets << {
          "start" => bucket_start,
          "end" => bucket_start + BUCKET_MS,
          "avg" => avg_by_bucket[bucket_start],
          "min" => min_by_bucket[bucket_start],
          "max" => max_by_bucket[bucket_start]
        }
        bucket_start += BUCKET_MS
      end

      {
        "sensor_id" => sensor.sensor_id,
        "zone" => sensor.zone,
        "unit" => sensor.unit,
        "latest" => latest,
        "raw_points" => raw_points,
        "buckets" => buckets
      }
    end

    {
      "now" => now_ms,
      "window_ms" => WINDOW_MS,
      "bucket_ms" => BUCKET_MS,
      "sample_interval_ms" => SAMPLE_INTERVAL_MS,
      "retention_ms" => RETENTION_MS,
      "sensors" => sensors
    }
  end

  private

  def range_query(sensor, start_ms, end_ms)
    parse_points(@redis.call("TS.RANGE", sensor.key, start_ms.to_s, end_ms.to_s))
  end

  def aggregate_query(sensor, start_ms, end_ms, aggregation)
    parse_points(
      @redis.call(
        "TS.RANGE",
        sensor.key,
        start_ms.to_s,
        end_ms.to_s,
        "ALIGN",
        "0",
        "AGGREGATION",
        aggregation,
        BUCKET_MS.to_s
      )
    )
  end

  def latest_query(sensor)
    response = @redis.call("TS.GET", sensor.key)
    return nil unless response.is_a?(Array) && response.length >= 2

    {
      "timestamp" => as_integer(response[0]),
      "value" => as_float(response[1])
    }
  rescue Redis::CommandError => error
    raise unless error.message.downcase.include?("tsdb: the key does not exist")

    nil
  end

  def parse_points(response)
    return [] unless response.is_a?(Array)

    response.filter_map do |row|
      next unless row.is_a?(Array) && row.length >= 2

      {
        "timestamp" => as_integer(row[0]),
        "value" => as_float(row[1])
      }
    end
  end

  def index_points(points)
    points.each_with_object({}) do |point, indexed|
      indexed[point["timestamp"]] = point["value"]
    end
  end

  def as_integer(value)
    Integer(value.to_s)
  end

  def as_float(value)
    Float(value.to_s)
  end

  def current_time_ms
    (Process.clock_gettime(Process::CLOCK_REALTIME, :millisecond)).to_i
  end
end
