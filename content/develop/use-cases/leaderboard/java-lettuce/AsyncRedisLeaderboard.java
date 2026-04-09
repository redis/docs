import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import io.lettuce.core.ScoredValue;
import io.lettuce.core.api.async.RedisAsyncCommands;

/**
 * Async Redis leaderboard implementation using Lettuce asynchronous commands.
 */
public class AsyncRedisLeaderboard {

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

    private final RedisAsyncCommands<String, String> commands;
    private final String key;
    private volatile int maxEntries;

    public AsyncRedisLeaderboard(
            RedisAsyncCommands<String, String> commands,
            String key,
            int maxEntries
    ) {
        this.commands = Objects.requireNonNull(commands, "commands is required");
        this.key = (key == null || key.isBlank()) ? "leaderboard:demo" : key;
        this.maxEntries = normalizePositiveInt(maxEntries == 0 ? 100 : maxEntries, "maxEntries");
    }

    public String getKey() {
        return key;
    }

    public int getMaxEntries() {
        return maxEntries;
    }

    public CompletableFuture<LeaderboardEntry> upsertUser(
            String userId,
            double score,
            Map<String, String> metadata
    ) {
        Map<String, String> payload = coerceMetadata(metadata);

        CompletableFuture<?> scoreWrite = commands.zadd(key, score, userId).toCompletableFuture();
        CompletableFuture<?> metadataWrite = payload.isEmpty()
                ? CompletableFuture.completedFuture(null)
                : commands.hset(metadataKey(userId), payload).toCompletableFuture();

        return CompletableFuture.allOf(scoreWrite, metadataWrite)
                .thenCompose(ignored -> trimToMaxEntries())
                .thenCompose(trimmedUserIds -> getUserEntry(userId)
                        .thenApply(entry -> entry == null
                                ? new LeaderboardEntry(0, userId, score, payload, trimmedUserIds)
                                : entry.withTrimmedUserIds(trimmedUserIds)));
    }

    public CompletableFuture<LeaderboardEntry> incrementScore(
            String userId,
            double amount,
            Map<String, String> metadata
    ) {
        Map<String, String> payload = coerceMetadata(metadata);

        CompletableFuture<Double> scoreWrite = commands.zincrby(key, amount, userId).toCompletableFuture();
        CompletableFuture<?> metadataWrite = payload.isEmpty()
                ? CompletableFuture.completedFuture(null)
                : commands.hset(metadataKey(userId), payload).toCompletableFuture();

        return CompletableFuture.allOf(scoreWrite, metadataWrite)
                .thenCompose(ignored -> trimToMaxEntries()
                        .thenCompose(trimmedUserIds -> getUserEntry(userId)
                                .thenApply(entry -> entry == null
                                        ? new LeaderboardEntry(0, userId, scoreWrite.join(), payload, trimmedUserIds)
                                        : entry.withTrimmedUserIds(trimmedUserIds))));
    }

    public CompletableFuture<List<String>> setMaxEntries(int maxEntries) {
        this.maxEntries = normalizePositiveInt(maxEntries, "maxEntries");
        return trimToMaxEntries();
    }

    public CompletableFuture<List<LeaderboardEntry>> getTop(int count) {
        int normalizedCount = normalizePositiveInt(count, "count");
        return commands.zrevrangeWithScores(key, 0, normalizedCount - 1)
                .toCompletableFuture()
                .thenCompose(entries -> hydrateEntries(entries, 1));
    }

    public CompletableFuture<List<LeaderboardEntry>> getAroundRank(int rank, int count) {
        int normalizedRank = normalizePositiveInt(rank, "rank");
        int normalizedCount = normalizePositiveInt(count, "count");

        return getSize().thenCompose(totalEntries -> {
            if (totalEntries == 0) {
                return CompletableFuture.completedFuture(List.of());
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

            return commands.zrevrangeWithScores(key, start, end)
                    .toCompletableFuture()
                    .thenCompose(entries -> hydrateEntries(entries, start + 1));
        });
    }

    public CompletableFuture<Integer> getRank(String userId) {
        return commands.zrevrank(key, userId)
                .toCompletableFuture()
                .thenApply(rank -> rank == null ? null : Math.toIntExact(rank) + 1);
    }

    public CompletableFuture<Map<String, String>> getUserMetadata(String userId) {
        return commands.hgetall(metadataKey(userId))
                .toCompletableFuture()
                .thenApply(map -> map == null ? Map.of() : map);
    }

    public CompletableFuture<LeaderboardEntry> getUserEntry(String userId) {
        CompletableFuture<Double> scoreFuture = commands.zscore(key, userId).toCompletableFuture();
        CompletableFuture<Long> rankFuture = commands.zrevrank(key, userId).toCompletableFuture();
        CompletableFuture<Map<String, String>> metadataFuture = getUserMetadata(userId);

        return CompletableFuture.allOf(scoreFuture, rankFuture, metadataFuture)
                .thenApply(ignored -> {
                    Double score = scoreFuture.join();
                    Long rank = rankFuture.join();
                    if (score == null || rank == null) {
                        return null;
                    }
                    return new LeaderboardEntry(
                            Math.toIntExact(rank) + 1,
                            userId,
                            score,
                            metadataFuture.join(),
                            List.of()
                    );
                });
    }

    public CompletableFuture<List<LeaderboardEntry>> listAll() {
        return commands.zrevrangeWithScores(key, 0, -1)
                .toCompletableFuture()
                .thenCompose(entries -> hydrateEntries(entries, 1));
    }

    public CompletableFuture<Long> getSize() {
        return commands.zcard(key).toCompletableFuture();
    }

    public CompletableFuture<Boolean> deleteUser(String userId) {
        CompletableFuture<Long> removedFuture = commands.zrem(key, userId).toCompletableFuture();
        CompletableFuture<Long> deleteFuture = commands.del(metadataKey(userId)).toCompletableFuture();
        return CompletableFuture.allOf(removedFuture, deleteFuture)
                .thenApply(ignored -> removedFuture.join() == 1L);
    }

    public CompletableFuture<Void> clear() {
        return commands.zrange(key, 0, -1)
                .toCompletableFuture()
                .thenCompose(userIds -> {
                    List<String> keysToDelete = new ArrayList<>();
                    keysToDelete.add(key);
                    for (String userId : userIds) {
                        keysToDelete.add(metadataKey(userId));
                    }
                    return commands.del(keysToDelete.toArray(String[]::new))
                            .toCompletableFuture()
                            .thenApply(ignored -> null);
                });
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

    private CompletableFuture<List<String>> trimToMaxEntries() {
        return getSize().thenCompose(size -> {
            long overflow = size - maxEntries;
            if (overflow <= 0) {
                return CompletableFuture.completedFuture(List.of());
            }

            return commands.zrange(key, 0, overflow - 1)
                    .toCompletableFuture()
                    .thenCompose(trimmedUserIds -> {
                        if (trimmedUserIds.isEmpty()) {
                            return CompletableFuture.completedFuture(List.of());
                        }

                        CompletableFuture<Long> trimFuture = commands.zremrangebyrank(key, 0, overflow - 1)
                                .toCompletableFuture();
                        String[] metadataKeys = trimmedUserIds.stream()
                                .map(this::metadataKey)
                                .toArray(String[]::new);
                        CompletableFuture<Long> metadataDeleteFuture = commands.del(metadataKeys).toCompletableFuture();

                        return CompletableFuture.allOf(trimFuture, metadataDeleteFuture)
                                .thenApply(ignored -> List.copyOf(trimmedUserIds));
                    });
        });
    }

    private CompletableFuture<List<LeaderboardEntry>> hydrateEntries(
            List<ScoredValue<String>> entries,
            int startRank
    ) {
        if (entries.isEmpty()) {
            return CompletableFuture.completedFuture(List.of());
        }

        List<CompletableFuture<Map<String, String>>> metadataFutures = new ArrayList<>();
        for (ScoredValue<String> entry : entries) {
            metadataFutures.add(getUserMetadata(entry.getValue()));
        }

        return CompletableFuture.allOf(metadataFutures.toArray(CompletableFuture[]::new))
                .thenApply(ignored -> {
                    List<LeaderboardEntry> hydrated = new ArrayList<>();
                    for (int index = 0; index < entries.size(); index++) {
                        ScoredValue<String> entry = entries.get(index);
                        hydrated.add(new LeaderboardEntry(
                                startRank + index,
                                entry.getValue(),
                                entry.getScore(),
                                metadataFutures.get(index).join(),
                                List.of()
                        ));
                    }
                    return hydrated;
                });
    }

    private int normalizePositiveInt(int value, String fieldName) {
        if (value < 1) {
            throw new IllegalArgumentException(fieldName + " must be at least 1");
        }
        return value;
    }
}
