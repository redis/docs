import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import redis.clients.jedis.Connection;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.commands.ProtocolCommand;
import redis.clients.jedis.exceptions.JedisDataException;

/**
 * Redis TimeSeries helpers for the rolling three-sensor dashboard demo.
 */
public final class RedisTimeSeriesStore {
    public static final int SAMPLE_INTERVAL_MS = 500;
    public static final int WINDOW_MS = 12_000;
    public static final int BUCKET_MS = 3_000;
    public static final int RETENTION_MS = 12_000;

    private final JedisPool jedisPool;
    private final List<SensorSimulator.SensorDefinition> sensors;

    public RedisTimeSeriesStore(JedisPool jedisPool, List<SensorSimulator.SensorDefinition> sensors) {
        this.jedisPool = jedisPool;
        this.sensors = sensors;
    }

    public void ensureSchema() {
        for (SensorSimulator.SensorDefinition sensor : sensors) {
            List<String> args = new ArrayList<>();
            args.add(sensor.key());
            args.add("RETENTION");
            args.add(String.valueOf(RETENTION_MS));
            args.add("LABELS");
            sensor.labels().forEach((label, value) -> {
                args.add(label);
                args.add(value);
            });

            try (Jedis jedis = jedisPool.getResource()) {
                executeCommand(jedis.getConnection(), TimeSeriesCommand.TS_CREATE, args.toArray(String[]::new));
            } catch (JedisDataException exception) {
                if (!exception.getMessage().toLowerCase().contains("key already exists")) {
                    throw exception;
                }
            }
        }
    }

    public void addSamples(List<SensorSimulator.SensorSample> samples) {
        if (samples.isEmpty()) {
            return;
        }

        long timestampMs = System.currentTimeMillis();
        List<String> args = new ArrayList<>();
        for (SensorSimulator.SensorSample sample : samples) {
            args.add(sample.sensor().key());
            args.add(String.valueOf(timestampMs));
            args.add(String.valueOf(sample.value()));
        }

        try (Jedis jedis = jedisPool.getResource()) {
            executeCommand(jedis.getConnection(), TimeSeriesCommand.TS_MADD, args.toArray(String[]::new));
        }
    }

    public Map<String, Object> dashboardSnapshot() {
        long nowMs = System.currentTimeMillis();
        long startMs = nowMs - WINDOW_MS;
        List<Map<String, Object>> sensorsPayload = new ArrayList<>();

        for (SensorSimulator.SensorDefinition sensor : sensors) {
            long aggregateStartMs = startMs - BUCKET_MS;
            List<Map<String, Object>> rawPoints = range(sensor, startMs, nowMs);
            List<Map<String, Object>> minPoints = aggregate(sensor, aggregateStartMs, nowMs, "min");
            List<Map<String, Object>> maxPoints = aggregate(sensor, aggregateStartMs, nowMs, "max");
            List<Map<String, Object>> avgPoints = aggregate(sensor, aggregateStartMs, nowMs, "avg");
            Map<String, Object> latest = latest(sensor);

            Map<Long, Double> minByBucket = indexByTimestamp(minPoints);
            Map<Long, Double> maxByBucket = indexByTimestamp(maxPoints);
            Map<Long, Double> avgByBucket = indexByTimestamp(avgPoints);

            long firstBucketStart = (startMs / BUCKET_MS) * BUCKET_MS;
            if (firstBucketStart > startMs) {
                firstBucketStart -= BUCKET_MS;
            }
            long lastBucketStart = (nowMs / BUCKET_MS) * BUCKET_MS;

            List<Map<String, Object>> buckets = new ArrayList<>();
            for (long bucketStart = firstBucketStart; bucketStart <= lastBucketStart; bucketStart += BUCKET_MS) {
                Map<String, Object> bucket = new LinkedHashMap<>();
                bucket.put("start", bucketStart);
                bucket.put("end", bucketStart + BUCKET_MS);
                bucket.put("avg", avgByBucket.get(bucketStart));
                bucket.put("min", minByBucket.get(bucketStart));
                bucket.put("max", maxByBucket.get(bucketStart));
                buckets.add(bucket);
            }

            Map<String, Object> sensorPayload = new LinkedHashMap<>();
            sensorPayload.put("sensor_id", sensor.sensorId());
            sensorPayload.put("zone", sensor.zone());
            sensorPayload.put("unit", sensor.unit());
            sensorPayload.put("latest", latest);
            sensorPayload.put("raw_points", rawPoints);
            sensorPayload.put("buckets", buckets);
            sensorsPayload.add(sensorPayload);
        }

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("now", nowMs);
        snapshot.put("window_ms", WINDOW_MS);
        snapshot.put("bucket_ms", BUCKET_MS);
        snapshot.put("sample_interval_ms", SAMPLE_INTERVAL_MS);
        snapshot.put("retention_ms", RETENTION_MS);
        snapshot.put("sensors", sensorsPayload);
        return snapshot;
    }

    private List<Map<String, Object>> range(SensorSimulator.SensorDefinition sensor, long startMs, long endMs) {
        try (Jedis jedis = jedisPool.getResource()) {
            Object response = executeCommand(
                    jedis.getConnection(),
                    TimeSeriesCommand.TS_RANGE,
                    sensor.key(),
                    String.valueOf(startMs),
                    String.valueOf(endMs)
            );
            return parsePoints(response);
        }
    }

    private List<Map<String, Object>> aggregate(
            SensorSimulator.SensorDefinition sensor,
            long startMs,
            long endMs,
            String aggregation) {
        try (Jedis jedis = jedisPool.getResource()) {
            Object response = executeCommand(
                    jedis.getConnection(),
                    TimeSeriesCommand.TS_RANGE,
                    sensor.key(),
                    String.valueOf(startMs),
                    String.valueOf(endMs),
                    "ALIGN",
                    "0",
                    "AGGREGATION",
                    aggregation,
                    String.valueOf(BUCKET_MS)
            );
            return parsePoints(response);
        }
    }

    private Map<String, Object> latest(SensorSimulator.SensorDefinition sensor) {
        try (Jedis jedis = jedisPool.getResource()) {
            Object response = executeCommand(jedis.getConnection(), TimeSeriesCommand.TS_GET, sensor.key());
            if (!(response instanceof List<?> values) || values.isEmpty()) {
                return null;
            }

            Map<String, Object> latest = new LinkedHashMap<>();
            latest.put("timestamp", asLong(values.get(0)));
            latest.put("value", asDouble(values.get(1)));
            return latest;
        }
    }

    private Map<Long, Double> indexByTimestamp(List<Map<String, Object>> points) {
        Map<Long, Double> indexed = new LinkedHashMap<>();
        for (Map<String, Object> point : points) {
            indexed.put((Long) point.get("timestamp"), (Double) point.get("value"));
        }
        return indexed;
    }

    private List<Map<String, Object>> parsePoints(Object response) {
        List<Map<String, Object>> parsed = new ArrayList<>();
        if (!(response instanceof List<?> rows)) {
            return parsed;
        }

        for (Object row : rows) {
            if (!(row instanceof List<?> pair) || pair.size() < 2) {
                continue;
            }

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("timestamp", asLong(pair.get(0)));
            point.put("value", asDouble(pair.get(1)));
            parsed.add(point);
        }
        return parsed;
    }

    private Object executeCommand(Connection connection, ProtocolCommand command, String... args) {
        connection.sendCommand(command, args);
        return connection.getOne();
    }

    private long asLong(Object value) {
        if (value instanceof Long longValue) {
            return longValue;
        }
        if (value instanceof byte[] bytes) {
            return Long.parseLong(new String(bytes, StandardCharsets.UTF_8));
        }
        return Long.parseLong(String.valueOf(value));
    }

    private double asDouble(Object value) {
        if (value instanceof Double doubleValue) {
            return doubleValue;
        }
        if (value instanceof byte[] bytes) {
            return Double.parseDouble(new String(bytes, StandardCharsets.UTF_8));
        }
        return Double.parseDouble(String.valueOf(value));
    }

    private enum TimeSeriesCommand implements ProtocolCommand {
        TS_CREATE("TS.CREATE"),
        TS_MADD("TS.MADD"),
        TS_GET("TS.GET"),
        TS_RANGE("TS.RANGE");

        private final byte[] raw;

        TimeSeriesCommand(String raw) {
            this.raw = raw.getBytes(StandardCharsets.UTF_8);
        }

        @Override
        public byte[] getRaw() {
            return raw;
        }
    }
}
