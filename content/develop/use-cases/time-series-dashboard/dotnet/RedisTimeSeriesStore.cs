using System.Globalization;
using System.Text.Json.Serialization;
using StackExchange.Redis;

namespace TimeSeriesDashboardDemo;

public sealed class RedisTimeSeriesStore
{
    public const int SampleIntervalMs = 500;
    public const int WindowMs = 12_000;
    public const int BucketMs = 3_000;
    public const int RetentionMs = 12_000;

    private readonly IDatabase _db;
    private readonly IReadOnlyList<SensorDefinition> _sensors;

    public RedisTimeSeriesStore(IDatabase db, IReadOnlyList<SensorDefinition> sensors)
    {
        _db = db;
        _sensors = sensors;
    }

    public async Task EnsureSchemaAsync()
    {
        foreach (var sensor in _sensors)
        {
            var args = new List<object>
            {
                sensor.Key,
                "RETENTION",
                RetentionMs,
                "LABELS"
            };

            foreach (var label in sensor.Labels)
            {
                args.Add(label.Key);
                args.Add(label.Value);
            }

            try
            {
                await _db.ExecuteAsync("TS.CREATE", args.ToArray());
            }
            catch (RedisServerException ex) when (ex.Message.Contains("key already exists", StringComparison.OrdinalIgnoreCase))
            {
            }
        }
    }

    public Task AddSamplesAsync(IReadOnlyList<SensorSample> samples)
    {
        if (samples.Count == 0)
        {
            return Task.CompletedTask;
        }

        var timestampMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var args = new List<object>();
        foreach (var sample in samples)
        {
            args.Add(sample.Sensor.Key);
            args.Add(timestampMs);
            args.Add(sample.Value.ToString(CultureInfo.InvariantCulture));
        }

        return _db.ExecuteAsync("TS.MADD", args.ToArray());
    }

    public async Task<DashboardSnapshot> DashboardSnapshotAsync()
    {
        var nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var startMs = nowMs - WindowMs;
        var aggregateStartMs = startMs - BucketMs;
        var sensorSnapshots = new List<SensorSnapshot>(_sensors.Count);

        foreach (var sensor in _sensors)
        {
            var rawPoints = await RangeQueryAsync(sensor, startMs, nowMs);
            var minPoints = await AggregateQueryAsync(sensor, aggregateStartMs, nowMs, "min");
            var maxPoints = await AggregateQueryAsync(sensor, aggregateStartMs, nowMs, "max");
            var avgPoints = await AggregateQueryAsync(sensor, aggregateStartMs, nowMs, "avg");
            var latest = await LatestQueryAsync(sensor);

            var minByBucket = IndexPoints(minPoints);
            var maxByBucket = IndexPoints(maxPoints);
            var avgByBucket = IndexPoints(avgPoints);

            var firstBucketStart = (startMs / BucketMs) * BucketMs;
            if (firstBucketStart > startMs)
            {
                firstBucketStart -= BucketMs;
            }

            var lastBucketStart = (nowMs / BucketMs) * BucketMs;
            var buckets = new List<BucketSnapshot>();

            for (var bucketStart = firstBucketStart; bucketStart <= lastBucketStart; bucketStart += BucketMs)
            {
                buckets.Add(new BucketSnapshot
                {
                    Start = bucketStart,
                    End = bucketStart + BucketMs,
                    Avg = avgByBucket.GetValueOrDefault(bucketStart),
                    Min = minByBucket.GetValueOrDefault(bucketStart),
                    Max = maxByBucket.GetValueOrDefault(bucketStart)
                });
            }

            sensorSnapshots.Add(new SensorSnapshot
            {
                SensorId = sensor.SensorId,
                Zone = sensor.Zone,
                Unit = sensor.Unit,
                Latest = latest,
                RawPoints = rawPoints,
                Buckets = buckets
            });
        }

        return new DashboardSnapshot
        {
            Now = nowMs,
            WindowMs = WindowMs,
            BucketMs = BucketMs,
            SampleIntervalMs = SampleIntervalMs,
            RetentionMs = RetentionMs,
            Sensors = sensorSnapshots
        };
    }

    private async Task<List<PointSnapshot>> RangeQueryAsync(SensorDefinition sensor, long startMs, long endMs)
    {
        var result = await _db.ExecuteAsync("TS.RANGE", sensor.Key, startMs, endMs);
        return ParsePoints(result);
    }

    private async Task<List<PointSnapshot>> AggregateQueryAsync(
        SensorDefinition sensor,
        long startMs,
        long endMs,
        string aggregation)
    {
        var result = await _db.ExecuteAsync(
            "TS.RANGE",
            sensor.Key,
            startMs,
            endMs,
            "ALIGN",
            0,
            "AGGREGATION",
            aggregation,
            BucketMs);

        return ParsePoints(result);
    }

    private async Task<LatestValueSnapshot?> LatestQueryAsync(SensorDefinition sensor)
    {
        try
        {
            var result = await _db.ExecuteAsync("TS.GET", sensor.Key);
            if (result.IsNull)
            {
                return null;
            }

            RedisResult[] row = (RedisResult[])result!;
            if (row.Length < 2)
            {
                return null;
            }

            return new LatestValueSnapshot
            {
                Timestamp = ParseInt64(row[0]),
                Value = ParseDouble(row[1])
            };
        }
        catch (RedisServerException ex) when (ex.Message.Contains("does not exist", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }
    }

    private static List<PointSnapshot> ParsePoints(RedisResult result)
    {
        var points = new List<PointSnapshot>();
        if (result.IsNull)
        {
            return points;
        }

        RedisResult[] rows = (RedisResult[])result!;
        foreach (var row in rows)
        {
            RedisResult[] pair = (RedisResult[])row!;
            if (pair.Length < 2)
            {
                continue;
            }

            points.Add(
                new PointSnapshot
                {
                    Timestamp = ParseInt64(pair[0]),
                    Value = ParseDouble(pair[1])
                });
        }

        return points;
    }

    private static Dictionary<long, double?> IndexPoints(IEnumerable<PointSnapshot> points)
    {
        return points.ToDictionary(point => point.Timestamp, point => (double?)point.Value);
    }

    private static long ParseInt64(RedisResult result)
    {
        return long.Parse(result.ToString()!, CultureInfo.InvariantCulture);
    }

    private static double ParseDouble(RedisResult result)
    {
        return double.Parse(result.ToString()!, CultureInfo.InvariantCulture);
    }
}

public sealed class PointSnapshot
{
    [JsonPropertyName("timestamp")]
    public long Timestamp { get; init; }

    [JsonPropertyName("value")]
    public double Value { get; init; }
}

public sealed class BucketSnapshot
{
    [JsonPropertyName("start")]
    public long Start { get; init; }

    [JsonPropertyName("end")]
    public long End { get; init; }

    [JsonPropertyName("avg")]
    public double? Avg { get; init; }

    [JsonPropertyName("min")]
    public double? Min { get; init; }

    [JsonPropertyName("max")]
    public double? Max { get; init; }
}

public sealed class LatestValueSnapshot
{
    [JsonPropertyName("timestamp")]
    public long Timestamp { get; init; }

    [JsonPropertyName("value")]
    public double Value { get; init; }
}

public sealed class SensorSnapshot
{
    [JsonPropertyName("sensor_id")]
    public required string SensorId { get; init; }

    [JsonPropertyName("zone")]
    public required string Zone { get; init; }

    [JsonPropertyName("unit")]
    public required string Unit { get; init; }

    [JsonPropertyName("latest")]
    public LatestValueSnapshot? Latest { get; init; }

    [JsonPropertyName("raw_points")]
    public required List<PointSnapshot> RawPoints { get; init; }

    [JsonPropertyName("buckets")]
    public required List<BucketSnapshot> Buckets { get; init; }
}

public sealed class DashboardSnapshot
{
    [JsonPropertyName("now")]
    public long Now { get; init; }

    [JsonPropertyName("window_ms")]
    public long WindowMs { get; init; }

    [JsonPropertyName("bucket_ms")]
    public long BucketMs { get; init; }

    [JsonPropertyName("sample_interval_ms")]
    public long SampleIntervalMs { get; init; }

    [JsonPropertyName("retention_ms")]
    public long RetentionMs { get; init; }

    [JsonPropertyName("sensors")]
    public required List<SensorSnapshot> Sensors { get; init; }
}
