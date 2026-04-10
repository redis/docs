import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Response;
import redis.clients.jedis.Transaction;
import redis.clients.jedis.params.ZRangeParams;
import redis.clients.jedis.resps.Tuple;

/**
 * Redis-backed leaderboard implementation using a sorted set and user metadata hashes.
 */
public class RedisLeaderboard {

    public record LeaderboardEntry(
            int rank,
            String userId,
            double score,
            Map<String, String> metadata,
            List<String> trimmedUserIds
    ) {
        public LeaderboardEntry withTrimmedUserIds(List<String> userIds) {
            return new LeaderboardEntry(rank, userId, score, metadata, List.copyOf(userIds));
        }
    }

    private final JedisPool jedisPool;
    private final String key;
    private int maxEntries;

    public RedisLeaderboard(JedisPool jedisPool, String key, int maxEntries) {
        if (jedisPool == null) {
            throw new IllegalArgumentException("jedisPool is required");
        }
        this.jedisPool = jedisPool;
        this.key = (key == null || key.isBlank()) ? "leaderboard:demo" : key;
        this.maxEntries = normalizePositiveInt(maxEntries == 0 ? 100 : maxEntries, "maxEntries");
    }

    public RedisLeaderboard(JedisPool jedisPool) {
        this(jedisPool, "leaderboard:demo", 100);
    }

    public String getKey() {
        return key;
    }

    public int getMaxEntries() {
        return maxEntries;
    }

    public LeaderboardEntry upsertUser(String userId, double score, Map<String, String> metadata) {
        Map<String, String> payload = coerceMetadata(metadata);

        try (Jedis jedis = jedisPool.getResource()) {
            Transaction tx = jedis.multi();
            tx.zadd(key, score, userId);
            if (!payload.isEmpty()) {
                tx.hset(metadataKey(userId), payload);
            }
            tx.exec();
        }

        List<String> trimmedUserIds = trimToMaxEntries();
        LeaderboardEntry entry = getUserEntry(userId);
        if (entry == null) {
            return new LeaderboardEntry(0, userId, score, payload, trimmedUserIds);
        }
        return entry.withTrimmedUserIds(trimmedUserIds);
    }

    public LeaderboardEntry incrementScore(String userId, double amount, Map<String, String> metadata) {
        Map<String, String> payload = coerceMetadata(metadata);
        double newScore;

        try (Jedis jedis = jedisPool.getResource()) {
            Transaction tx = jedis.multi();
            Response<Double> scoreResponse = tx.zincrby(key, amount, userId);
            if (!payload.isEmpty()) {
                tx.hset(metadataKey(userId), payload);
            }
            tx.exec();
            newScore = scoreResponse.get();
        }

        List<String> trimmedUserIds = trimToMaxEntries();
        LeaderboardEntry entry = getUserEntry(userId);
        if (entry == null) {
            return new LeaderboardEntry(0, userId, newScore, payload, trimmedUserIds);
        }
        return entry.withTrimmedUserIds(trimmedUserIds);
    }

    public List<String> setMaxEntries(int maxEntries) {
        this.maxEntries = normalizePositiveInt(maxEntries, "maxEntries");
        return trimToMaxEntries();
    }

    public List<LeaderboardEntry> getTop(int count) {
        int normalizedCount = normalizePositiveInt(count, "count");
        try (Jedis jedis = jedisPool.getResource()) {
            List<Tuple> entries = jedis.zrangeWithScores(
                    key,
                    ZRangeParams.zrangeParams(0, normalizedCount - 1).rev()
            );
            return hydrateEntries(entries, 1);
        }
    }

    public List<LeaderboardEntry> getAroundRank(int rank, int count) {
        int normalizedRank = normalizePositiveInt(rank, "rank");
        int normalizedCount = normalizePositiveInt(count, "count");
        long totalEntries = getSize();

        if (totalEntries == 0) {
            return List.of();
        }
        if (totalEntries <= normalizedCount) {
            return listAll();
        }

        int halfWindow = normalizedCount / 2;
        int start = Math.max(0, normalizedRank - 1 - halfWindow);
        int maxStart = (int) totalEntries - normalizedCount;
        if (start > maxStart) {
            start = maxStart;
        }
        int end = start + normalizedCount - 1;

        try (Jedis jedis = jedisPool.getResource()) {
            List<Tuple> entries = jedis.zrangeWithScores(
                    key,
                    ZRangeParams.zrangeParams(start, end).rev()
            );
            return hydrateEntries(entries, start + 1);
        }
    }

    public Integer getRank(String userId) {
        try (Jedis jedis = jedisPool.getResource()) {
            Long rank = jedis.zrevrank(key, userId);
            if (rank == null) {
                return null;
            }
            return Math.toIntExact(rank) + 1;
        }
    }

    public Map<String, String> getUserMetadata(String userId) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.hgetAll(metadataKey(userId));
        }
    }

    public LeaderboardEntry getUserEntry(String userId) {
        try (Jedis jedis = jedisPool.getResource()) {
            Pipeline pipeline = jedis.pipelined();
            Response<Double> scoreResponse = pipeline.zscore(key, userId);
            Response<Long> rankResponse = pipeline.zrevrank(key, userId);
            Response<Map<String, String>> metadataResponse = pipeline.hgetAll(metadataKey(userId));
            pipeline.sync();

            Double score = scoreResponse.get();
            Long rank = rankResponse.get();
            if (score == null || rank == null) {
                return null;
            }

            return new LeaderboardEntry(
                    Math.toIntExact(rank) + 1,
                    userId,
                    score,
                    metadataResponse.get(),
                    List.of()
            );
        }
    }

    public List<LeaderboardEntry> listAll() {
        try (Jedis jedis = jedisPool.getResource()) {
            List<Tuple> entries = jedis.zrangeWithScores(
                    key,
                    ZRangeParams.zrangeParams(0, -1).rev()
            );
            return hydrateEntries(entries, 1);
        }
    }

    public long getSize() {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.zcard(key);
        }
    }

    public boolean deleteUser(String userId) {
        try (Jedis jedis = jedisPool.getResource()) {
            Transaction tx = jedis.multi();
            Response<Long> removed = tx.zrem(key, userId);
            tx.del(metadataKey(userId));
            tx.exec();
            return removed.get() == 1;
        }
    }

    public void clear() {
        try (Jedis jedis = jedisPool.getResource()) {
            List<String> userIds = jedis.zrange(key, 0, -1);
            List<String> keysToDelete = new ArrayList<>();
            keysToDelete.add(key);
            for (String userId : userIds) {
                keysToDelete.add(metadataKey(userId));
            }
            jedis.del(keysToDelete.toArray(String[]::new));
        }
    }

    private String metadataKey(String userId) {
        return key + ":user:" + userId;
    }

    private Map<String, String> coerceMetadata(Map<String, String> metadata) {
        if (metadata == null) {
            return new LinkedHashMap<>();
        }
        return new LinkedHashMap<>(metadata);
    }

    private List<String> trimToMaxEntries() {
        try (Jedis jedis = jedisPool.getResource()) {
            long overflow = jedis.zcard(key) - maxEntries;
            if (overflow <= 0) {
                return List.of();
            }

            List<String> trimmedUserIds = jedis.zrange(key, 0, overflow - 1);
            if (trimmedUserIds.isEmpty()) {
                return List.of();
            }

            jedis.zremrangeByRank(key, 0, overflow - 1);
            deleteMetadataForUsers(trimmedUserIds);
            return List.copyOf(trimmedUserIds);
        }
    }

    private void deleteMetadataForUsers(List<String> userIds) {
        if (userIds.isEmpty()) {
            return;
        }
        try (Jedis jedis = jedisPool.getResource()) {
            List<String> keysToDelete = new ArrayList<>();
            for (String userId : userIds) {
                keysToDelete.add(metadataKey(userId));
            }
            jedis.del(keysToDelete.toArray(String[]::new));
        }
    }

    private List<LeaderboardEntry> hydrateEntries(List<Tuple> entries, int startRank) {
        if (entries.isEmpty()) {
            return List.of();
        }

        List<LeaderboardEntry> hydratedEntries = new ArrayList<>();

        try (Jedis jedis = jedisPool.getResource()) {
            Pipeline pipeline = jedis.pipelined();
            List<Response<Map<String, String>>> metadataResponses = new ArrayList<>();
            for (Tuple entry : entries) {
                metadataResponses.add(pipeline.hgetAll(metadataKey(entry.getElement())));
            }
            pipeline.sync();

            for (int index = 0; index < entries.size(); index++) {
                Tuple entry = entries.get(index);
                hydratedEntries.add(new LeaderboardEntry(
                        startRank + index,
                        entry.getElement(),
                        entry.getScore(),
                        metadataResponses.get(index).get(),
                        Collections.emptyList()
                ));
            }
        }

        return hydratedEntries;
    }

    private int normalizePositiveInt(int value, String fieldName) {
        if (value < 1) {
            throw new IllegalArgumentException(fieldName + " must be at least 1");
        }
        return value;
    }
}
