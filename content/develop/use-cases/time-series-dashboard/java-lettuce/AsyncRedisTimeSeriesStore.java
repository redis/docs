import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.output.ArrayOutput;
import io.lettuce.core.output.StatusOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.ProtocolKeyword;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

/**
 * Redis TimeSeries helpers for the rolling three-sensor dashboard demo using
 * Lettuce asynchronous commands.
 */
public final class AsyncRedisTimeSeriesStore {
    public static final int SAMPLE_INTERVAL_MS = 500;
    public static final int WINDOW_MS = 12_000;
    public static final int BUCKET_MS = 3_000;
    public static final int RETENTION_MS = 12_000;

    private static final StringCodec CODEC = StringCodec.UTF8;

    private final RedisAsyncCommands<String, String> commands;
    private final List<SensorSimulator.SensorDefinition> sensors;

    public AsyncRedisTimeSeriesStore(
            RedisAsyncCommands<String, String> commands,
            List<SensorSimulator.SensorDefinition> sensors) {
        this.commands = commands;
        this.sensors = sensors;
    }

    public CompletableFuture<Void> ensureSchema() {
        CompletableFuture<Void> future = CompletableFuture.completedFuture(null);

        for (SensorSimulator.SensorDefinition sensor : sensors) {
            future = future.thenCompose(ignore -> ensureSeries(sensor));
        }

        return future;
    }

    public CompletableFuture<Void> addSamples(List<SensorSimulator.SensorSample> samples) {
        if (samples.isEmpty()) {
            return CompletableFuture.completedFuture(null);
        }

        long timestampMs = System.currentTimeMillis();
        CommandArgs<String, String> args = new CommandArgs<>(CODEC);
        for (SensorSimulator.SensorSample sample : samples) {
            args.add(sample.sensor().key()).add(timestampMs).add(sample.value());
        }

        return commands.dispatch(
                        TimeSeriesCommand.TS_MADD,
                        new ArrayOutput<>(CODEC),
                        args)
                .toCompletableFuture()
                .thenApply(ignore -> null);
    }

    public CompletableFuture<Map<String, Object>> dashboardSnapshot() {
        long nowMs = System.currentTimeMillis();
        long startMs = nowMs - WINDOW_MS;
        long aggregateStartMs = startMs - BUCKET_MS;
        List<CompletableFuture<Map<String, Object>>> futures = new ArrayList<>();

        for (SensorSimulator.SensorDefinition sensor : sensors) {
            futures.add(sensorSnapshot(sensor, startMs, nowMs, aggregateStartMs));
        }

        return CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new))
                .thenApply(ignore -> {
                    List<Map<String, Object>> sensorsPayload = new ArrayList<>();
                    for (CompletableFuture<Map<String, Object>> future : futures) {
                        sensorsPayload.add(future.join());
                    }

                    Map<String, Object> snapshot = new LinkedHashMap<>();
                    snapshot.put("now", nowMs);
                    snapshot.put("window_ms", WINDOW_MS);
                    snapshot.put("bucket_ms", BUCKET_MS);
                    snapshot.put("sample_interval_ms", SAMPLE_INTERVAL_MS);
                    snapshot.put("retention_ms", RETENTION_MS);
                    snapshot.put("sensors", sensorsPayload);
                    return snapshot;
                });
    }

    private CompletableFuture<Void> ensureSeries(SensorSimulator.SensorDefinition sensor) {
        CommandArgs<String, String> args = new CommandArgs<>(CODEC)
                .add(sensor.key())
                .add("RETENTION")
                .add(RETENTION_MS)
                .add("LABELS");

        sensor.labels().forEach((label, value) -> args.add(label).add(value));

        return commands.dispatch(TimeSeriesCommand.TS_CREATE, new StatusOutput<>(CODEC), args)
                .toCompletableFuture()
                .handle((ignored, throwable) -> {
                    Throwable cause = unwrap(throwable);
                    if (cause != null && !isAlreadyExists(cause)) {
                        throw new CompletionException(cause);
                    }
                    return null;
                });
    }

    private CompletableFuture<Map<String, Object>> sensorSnapshot(
            SensorSimulator.SensorDefinition sensor,
            long startMs,
            long nowMs,
            long aggregateStartMs) {
        CompletableFuture<List<Map<String, Object>>> rawFuture = range(sensor, startMs, nowMs);
        CompletableFuture<List<Map<String, Object>>> minFuture = aggregate(sensor, aggregateStartMs, nowMs, "min");
        CompletableFuture<List<Map<String, Object>>> maxFuture = aggregate(sensor, aggregateStartMs, nowMs, "max");
        CompletableFuture<List<Map<String, Object>>> avgFuture = aggregate(sensor, aggregateStartMs, nowMs, "avg");
        CompletableFuture<Optional<Map<String, Object>>> latestFuture = latest(sensor);

        return CompletableFuture.allOf(rawFuture, minFuture, maxFuture, avgFuture, latestFuture)
                .thenApply(ignore -> {
                    Map<Long, Double> minByBucket = indexByTimestamp(minFuture.join());
                    Map<Long, Double> maxByBucket = indexByTimestamp(maxFuture.join());
                    Map<Long, Double> avgByBucket = indexByTimestamp(avgFuture.join());

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

                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("sensor_id", sensor.sensorId());
                    payload.put("zone", sensor.zone());
                    payload.put("unit", sensor.unit());
                    payload.put("latest", latestFuture.join().orElse(null));
                    payload.put("raw_points", rawFuture.join());
                    payload.put("buckets", buckets);
                    return payload;
                });
    }

    private CompletableFuture<List<Map<String, Object>>> range(
            SensorSimulator.SensorDefinition sensor,
            long startMs,
            long endMs) {
        CommandArgs<String, String> args = new CommandArgs<>(CODEC)
                .add(sensor.key())
                .add(startMs)
                .add(endMs);

        return commands.dispatch(TimeSeriesCommand.TS_RANGE, new ArrayOutput<>(CODEC), args)
                .toCompletableFuture()
                .thenApply(this::parsePoints);
    }

    private CompletableFuture<List<Map<String, Object>>> aggregate(
            SensorSimulator.SensorDefinition sensor,
            long startMs,
            long endMs,
            String aggregation) {
        CommandArgs<String, String> args = new CommandArgs<>(CODEC)
                .add(sensor.key())
                .add(startMs)
                .add(endMs)
                .add("ALIGN")
                .add("0")
                .add("AGGREGATION")
                .add(aggregation)
                .add(BUCKET_MS);

        return commands.dispatch(TimeSeriesCommand.TS_RANGE, new ArrayOutput<>(CODEC), args)
                .toCompletableFuture()
                .thenApply(this::parsePoints);
    }

    private CompletableFuture<Optional<Map<String, Object>>> latest(SensorSimulator.SensorDefinition sensor) {
        CommandArgs<String, String> args = new CommandArgs<>(CODEC).add(sensor.key());
        return commands.dispatch(TimeSeriesCommand.TS_GET, new ArrayOutput<>(CODEC), args)
                .toCompletableFuture()
                .handle((response, throwable) -> {
                    Throwable cause = unwrap(throwable);
                    if (cause != null) {
                        if (isMissingSeriesError(cause)) {
                            return Optional.empty();
                        }
                        throw new CompletionException(cause);
                    }

                    if (!(response instanceof List<?> values) || values.size() < 2) {
                        return Optional.empty();
                    }

                    Map<String, Object> latest = new LinkedHashMap<>();
                    latest.put("timestamp", asLong(values.get(0)));
                    latest.put("value", asDouble(values.get(1)));
                    return Optional.of(latest);
                });
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

    private static boolean isAlreadyExists(Throwable throwable) {
        String message = throwable.getMessage();
        return message != null && message.toLowerCase().contains("key already exists");
    }

    private static boolean isMissingSeriesError(Throwable throwable) {
        String message = throwable.getMessage();
        return message != null && message.toLowerCase().contains("tsdb: the key does not exist");
    }

    private static Throwable unwrap(Throwable throwable) {
        Throwable current = throwable;
        while (current != null && current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current;
    }

    private static long asLong(Object value) {
        if (value instanceof Long longValue) {
            return longValue;
        }
        if (value instanceof Integer intValue) {
            return intValue.longValue();
        }
        if (value instanceof byte[] bytes) {
            return Long.parseLong(new String(bytes, StandardCharsets.UTF_8));
        }
        return Long.parseLong(String.valueOf(value));
    }

    private static double asDouble(Object value) {
        if (value instanceof Double doubleValue) {
            return doubleValue;
        }
        if (value instanceof Integer intValue) {
            return intValue.doubleValue();
        }
        if (value instanceof Long longValue) {
            return longValue.doubleValue();
        }
        if (value instanceof byte[] bytes) {
            return Double.parseDouble(new String(bytes, StandardCharsets.UTF_8));
        }
        return Double.parseDouble(String.valueOf(value));
    }

    private enum TimeSeriesCommand implements ProtocolKeyword {
        TS_CREATE("TS.CREATE"),
        TS_MADD("TS.MADD"),
        TS_GET("TS.GET"),
        TS_RANGE("TS.RANGE");

        private final byte[] bytes;

        TimeSeriesCommand(String keyword) {
            this.bytes = keyword.getBytes(StandardCharsets.UTF_8);
        }

        @Override
        public byte[] getBytes() {
            return bytes;
        }
    }
}
