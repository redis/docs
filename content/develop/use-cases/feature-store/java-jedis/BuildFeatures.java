import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import redis.clients.jedis.JedisPool;

/**
 * Synthesize a small batch of users with realistic-looking features
 * and bulk-load them into Redis with a 24-hour key-level TTL.
 *
 * <p>Stands in for the nightly Spark / Feast materialization job in a
 * real deployment. In production the equivalent of this script lives
 * in an offline pipeline that reads from the offline store and writes
 * the serving-time hashes into Redis via {@code HSET} + {@code EXPIRE}.</p>
 *
 * <p>Run with: {@code mvn exec:java -Dexec.mainClass=BuildFeatures -Dexec.args="--count 500"}</p>
 */
public class BuildFeatures {

    private static final List<String> COUNTRY_CHOICES = List.of(
        "US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL");
    private static final List<String> RISK_SEGMENTS = List.of("low", "medium", "high");
    private static final int[] RISK_WEIGHTS = {70, 25, 5};
    private static final int[] CHARGEBACK_BUCKETS = {0, 1, 2, 3};
    private static final int[] CHARGEBACK_WEIGHTS = {85, 10, 4, 1};

    /**
     * Generate {@code count} synthetic user feature rows. The shape
     * mirrors a small fraud-scoring feature set: country and risk
     * segment as TAG-like categorical features, plus a few numeric
     * aggregates over recent windows.
     */
    public static Map<String, Map<String, Object>> synthesizeUsers(int count, long seed) {
        Random rng = new Random(seed);
        Map<String, Map<String, Object>> users = new LinkedHashMap<>(count);
        for (int i = 1; i <= count; i++) {
            String uid = String.format("u%04d", i);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("country_iso", COUNTRY_CHOICES.get(rng.nextInt(COUNTRY_CHOICES.size())));
            row.put("risk_segment", weightedChoice(rng, RISK_SEGMENTS, RISK_WEIGHTS));
            row.put("account_age_days", 7 + rng.nextInt(2394));
            row.put("tx_count_7d", rng.nextInt(81));
            row.put("avg_amount_30d", Math.round((5.0 + rng.nextDouble() * 345.0) * 100.0) / 100.0);
            row.put("chargeback_count_180d", weightedChoiceInt(rng, CHARGEBACK_BUCKETS, CHARGEBACK_WEIGHTS));
            users.put(uid, row);
        }
        return users;
    }

    public static void main(String[] args) {
        String redisHost = "localhost";
        int redisPort = 6379;
        int count = 200;
        long ttlSeconds = 24L * 60L * 60L;
        String keyPrefix = "fs:user:";
        long seed = 42L;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--redis-host" -> redisHost = args[++i];
                case "--redis-port" -> redisPort = Integer.parseInt(args[++i]);
                case "--count" -> count = Integer.parseInt(args[++i]);
                case "--ttl-seconds" -> ttlSeconds = Long.parseLong(args[++i]);
                case "--key-prefix" -> keyPrefix = args[++i];
                case "--seed" -> seed = Long.parseLong(args[++i]);
                case "-h", "--help" -> {
                    System.out.println(
                        "Usage: mvn exec:java -Dexec.mainClass=BuildFeatures " +
                        "-Dexec.args=\"[--redis-host H] [--redis-port P] " +
                        "[--count N] [--ttl-seconds S] [--key-prefix PREFIX] [--seed N]\"");
                    return;
                }
                default -> {
                    System.err.println("Unknown argument: " + args[i]);
                    System.exit(2);
                }
            }
        }

        try (JedisPool pool = new JedisPool(redisHost, redisPort)) {
            FeatureStore store = new FeatureStore(pool, keyPrefix, ttlSeconds,
                FeatureStore.DEFAULT_STREAMING_TTL_SECONDS);
            Map<String, Map<String, Object>> rows = synthesizeUsers(count, seed);
            int loaded = store.bulkLoad(rows, ttlSeconds);
            System.out.printf(
                "Materialized %d users at %s* with a %ds key-level TTL.%n",
                loaded, keyPrefix, ttlSeconds);
        }
    }

    private static String weightedChoice(Random rng, List<String> items, int[] weights) {
        int total = 0;
        for (int w : weights) total += w;
        int r = rng.nextInt(total);
        for (int i = 0; i < items.size(); i++) {
            r -= weights[i];
            if (r < 0) return items.get(i);
        }
        return items.get(items.size() - 1);
    }

    private static int weightedChoiceInt(Random rng, int[] items, int[] weights) {
        int total = 0;
        for (int w : weights) total += w;
        int r = rng.nextInt(total);
        for (int i = 0; i < items.length; i++) {
            r -= weights[i];
            if (r < 0) return items[i];
        }
        return items[items.length - 1];
    }
}
