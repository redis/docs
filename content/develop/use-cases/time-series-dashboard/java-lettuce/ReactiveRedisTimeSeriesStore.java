import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.output.ArrayOutput;
import io.lettuce.core.output.StatusOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.ProtocolKeyword;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Redis TimeSeries helpers for the rolling three-sensor dashboard demo using
 * Lettuce reactive commands.
 */
public final class ReactiveRedisTimeSeriesStore {
    public static final int SAMPLE_INTERVAL_MS = AsyncRedisTimeSeriesStore.SAMPLE_INTERVAL_MS;
    public static final int WINDOW_MS = AsyncRedisTimeSeriesStore.WINDOW_MS;
    public static final int BUCKET_MS = AsyncRedisTimeSeriesStore.BUCKET_MS;
    public static final int RETENTION_MS = AsyncRedisTimeSeriesStore.RETENTION_MS;

    private static final StringCodec CODEC = StringCodec.UTF8;

    private final RedisReactiveCommands<String, String> commands;
    private final List<SensorSimulator.SensorDefinition> sensors;

    public ReactiveRedisTimeSeriesStore(
            RedisReactiveCommands<String, String> commands,
            List<SensorSimulator.SensorDefinition> sensors) {
        this.commands = commands;
        this.sensors = sensors;
    }

    public Mono<Void> ensureSchema() {
        return Mono.when(sensors.stream().map(this::ensureSeries).toList());
    }

    public Mono<Void> addSamples(List<SensorSimulator.SensorSample> samples) {
        if (samples.isEmpty()) {
            return Mono.empty();
        }

        long timestampMs = System.currentTimeMillis();
        CommandArgs<String, String> args = new CommandArgs<>(CODEC);
        for (SensorSimulator.SensorSample sample : samples) {
            args.add(sample.sensor().key()).add(timestampMs).add(sample.value());
        }

        return commands.dispatch(TimeSeriesCommand.TS_MADD, new ArrayOutput<>(CODEC), args)
                .then();
    }

    public Mono<Map<String, Object>> dashboardSnapshot() {
        long nowMs = System.currentTimeMillis();
        long startMs = nowMs - WINDOW_MS;
        long aggregateStartMs = startMs - BUCKET_MS;

        return Flux.concat(sensors.stream()
                        .map(sensor -> sensorSnapshot(sensor, startMs, nowMs, aggregateStartMs))
                        .toList())
                .collectList()
                .map(sensorsPayload -> {
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

    private Mono<Void> ensureSeries(SensorSimulator.SensorDefinition sensor) {
        CommandArgs<String, String> args = new CommandArgs<>(CODEC)
                .add(sensor.key())
                .add("RETENTION")
                .add(RETENTION_MS)
                .add("LABELS");

        sensor.labels().forEach((label, value) -> args.add(label).add(value));

        return commands.dispatch(TimeSeriesCommand.TS_CREATE, new StatusOutput<>(CODEC), args)
                .then()
                .onErrorResume(throwable -> isAlreadyExists(throwable) ? Mono.empty() : Mono.error(throwable));
    }

    private Mono<Map<String, Object>> sensorSnapshot(
            SensorSimulator.SensorDefinition sensor,
            long startMs,
            long nowMs,
            long aggregateStartMs) {
        Mono<List<Map<String, Object>>> rawMono = range(sensor, startMs, nowMs);
        Mono<List<Map<String, Object>>> minMono = aggregate(sensor, aggregateStartMs, nowMs, "min");
        Mono<List<Map<String, Object>>> maxMono = aggregate(sensor, aggregateStartMs, nowMs, "max");
        Mono<List<Map<String, Object>>> avgMono = aggregate(sensor, aggregateStartMs, nowMs, "avg");
        Mono<Map<String, Object>> latestMono = latest(sensor);

        return Mono.zip(rawMono, minMono, maxMono, avgMono, latestMono)
                .map(tuple -> {
                    Map<Long, Double> minByBucket = indexByTimestamp(tuple.getT2());
                    Map<Long, Double> maxByBucket = indexByTimestamp(tuple.getT3());
                    Map<Long, Double> avgByBucket = indexByTimestamp(tuple.getT4());

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
                    payload.put("latest", tuple.getT5());
                    payload.put("raw_points", tuple.getT1());
                    payload.put("buckets", buckets);
                    return payload;
                });
    }

    private Mono<List<Map<String, Object>>> range(
            SensorSimulator.SensorDefinition sensor,
            long startMs,
            long endMs) {
        CommandArgs<String, String> args = new CommandArgs<>(CODEC)
                .add(sensor.key())
                .add(startMs)
                .add(endMs);

        return commands.dispatch(TimeSeriesCommand.TS_RANGE, new ArrayOutput<>(CODEC), args)
                .collectList()
                .map(this::parsePoints);
    }

    private Mono<List<Map<String, Object>>> aggregate(
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
                .collectList()
                .map(this::parsePoints);
    }

    private Mono<Map<String, Object>> latest(SensorSimulator.SensorDefinition sensor) {
        CommandArgs<String, String> args = new CommandArgs<>(CODEC).add(sensor.key());

        return commands.dispatch(TimeSeriesCommand.TS_GET, new ArrayOutput<>(CODEC), args)
                .collectList()
                .map(values -> {
                    if (values.size() < 2) {
                        return null;
                    }

                    Map<String, Object> latest = new LinkedHashMap<>();
                    latest.put("timestamp", asLong(values.get(0)));
                    latest.put("value", asDouble(values.get(1)));
                    return latest;
                })
                .defaultIfEmpty(null);
    }

    private Map<Long, Double> indexByTimestamp(List<Map<String, Object>> points) {
        Map<Long, Double> indexed = new LinkedHashMap<>();
        for (Map<String, Object> point : points) {
            indexed.put((Long) point.get("timestamp"), (Double) point.get("value"));
        }
        return indexed;
    }

    private List<Map<String, Object>> parsePoints(List<Object> rows) {
        List<Map<String, Object>> parsed = new ArrayList<>();
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
