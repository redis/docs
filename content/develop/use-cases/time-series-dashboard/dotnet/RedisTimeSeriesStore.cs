using System.Text.Json.Serialization;
using NRedisStack;
using NRedisStack.DataTypes;
using NRedisStack.Literals.Enums;
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;

namespace TimeSeriesDashboardDemo;

public sealed class RedisTimeSeriesStore
{
    public const int SampleIntervalMs = 500;
    public const int WindowMs = 12_000;
    public const int BucketMs = 3_000;
    public const int RetentionMs = 12_000;

    private readonly ITimeSeriesCommandsAsync _ts;
    private readonly IReadOnlyList<SensorDefinition> _sensors;

    public RedisTimeSeriesStore(IDatabase db, IReadOnlyList<SensorDefinition> sensors)
    {
        _ts = db.TS();
        _sensors = sensors;
    }

    public async Task EnsureSchemaAsync()
    {
        foreach (var sensor in _sensors)
        {
            var labels = sensor.Labels
                .Select(label => new TimeSeriesLabel(label.Key, label.Value))
                .ToList();

            try
            {
                await _ts.CreateAsync(sensor.Key, retentionTime: RetentionMs, labels: labels);
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
        var sequence = samples
            .Select(sample => (sample.Sensor.Key, (TimeStamp)timestampMs, sample.Value))
            .ToList();

        return _ts.MAddAsync(sequence);
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
            var minPoints = await AggregateQueryAsync(sensor, aggregateStartMs, nowMs, TsAggregation.Min);
            var maxPoints = await AggregateQueryAsync(sensor, aggregateStartMs, nowMs, TsAggregation.Max);
            var avgPoints = await AggregateQueryAsync(sensor, aggregateStartMs, nowMs, TsAggregation.Avg);
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
        var tuples = await _ts.RangeAsync(sensor.Key, startMs, endMs);
        return ToPointSnapshots(tuples);
    }

    private async Task<List<PointSnapshot>> AggregateQueryAsync(
        SensorDefinition sensor,
        long startMs,
        long endMs,
        TsAggregation aggregation)
    {
        var tuples = await _ts.RangeAsync(
            sensor.Key,
            startMs,
            endMs,
            align: 0L,
            aggregation: aggregation,
            timeBucket: BucketMs);

        return ToPointSnapshots(tuples);
    }

    private async Task<LatestValueSnapshot?> LatestQueryAsync(SensorDefinition sensor)
    {
        try
        {
            var tuple = await _ts.GetAsync(sensor.Key);
            return tuple is null
                ? null
                : new LatestValueSnapshot { Timestamp = tuple.Time, Value = tuple.Val };
        }
        catch (RedisServerException ex) when (ex.Message.Contains("does not exist", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }
    }

    private static List<PointSnapshot> ToPointSnapshots(IEnumerable<TimeSeriesTuple> tuples) =>
        tuples
            .Select(tuple => new PointSnapshot { Timestamp = tuple.Time, Value = tuple.Val })
            .ToList();

    private static Dictionary<long, double?> IndexPoints(IEnumerable<PointSnapshot> points)
    {
        return points.ToDictionary(point => point.Timestamp, point => (double?)point.Value);
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
