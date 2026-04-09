import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import io.lettuce.core.ScoredValue;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive Redis leaderboard implementation using Lettuce reactive commands.
 */
public class ReactiveRedisLeaderboard {

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

    private final RedisReactiveCommands<String, String> commands;
    private final String key;
    private volatile int maxEntries;

    public ReactiveRedisLeaderboard(
            RedisReactiveCommands<String, String> commands,
            String key,
            int maxEntries
    ) {
        this.commands = Objects.requireNonNull(commands, "commands is required");
        this.key = (key == null || key.isBlank()) ? "leaderboard:demo" : key;
        this.maxEntries = normalizePositiveInt(maxEntries == 0 ? 100 : maxEntries, "maxEntries");
    }

    public Mono<LeaderboardEntry> upsertUser(String userId, double score, Map<String, String> metadata) {
        Map<String, String> payload = coerceMetadata(metadata);

        Mono<Long> scoreWrite = commands.zadd(key, score, userId);
        Mono<Long> metadataWrite = payload.isEmpty()
                ? Mono.just(0L)
                : commands.hset(metadataKey(userId), payload);

        return Mono.when(scoreWrite, metadataWrite)
                .then(trimToMaxEntries())
                .flatMap(trimmedUserIds -> getUserEntry(userId)
                        .defaultIfEmpty(new LeaderboardEntry(0, userId, score, payload, trimmedUserIds))
                        .map(entry -> entry.withTrimmedUserIds(trimmedUserIds)));
    }

    public Mono<LeaderboardEntry> incrementScore(String userId, double amount, Map<String, String> metadata) {
        Map<String, String> payload = coerceMetadata(metadata);

        Mono<Double> scoreWrite = commands.zincrby(key, amount, userId);
        Mono<Long> metadataWrite = payload.isEmpty()
                ? Mono.just(0L)
                : commands.hset(metadataKey(userId), payload);

        return Mono.zip(scoreWrite, metadataWrite)
                .flatMap(tuple -> trimToMaxEntries()
                        .flatMap(trimmedUserIds -> getUserEntry(userId)
                                .defaultIfEmpty(new LeaderboardEntry(0, userId, tuple.getT1(), payload, trimmedUserIds))
                                .map(entry -> entry.withTrimmedUserIds(trimmedUserIds))));
    }

    public Mono<List<String>> setMaxEntries(int maxEntries) {
        this.maxEntries = normalizePositiveInt(maxEntries, "maxEntries");
        return trimToMaxEntries();
    }

    public Mono<List<LeaderboardEntry>> getTop(int count) {
        int normalizedCount = normalizePositiveInt(count, "count");
        return commands.zrevrangeWithScores(key, 0, normalizedCount - 1)
                .collectList()
                .flatMap(entries -> hydrateEntries(entries, 1));
    }

    public Mono<List<LeaderboardEntry>> getAroundRank(int rank, int count) {
        int normalizedRank = normalizePositiveInt(rank, "rank");
        int normalizedCount = normalizePositiveInt(count, "count");

        return getSize().flatMap(totalEntries -> {
            if (totalEntries == 0) {
                return Mono.just(List.of());
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
                    .collectList()
                    .flatMap(entries -> hydrateEntries(entries, start + 1));
        });
    }

    public Mono<Integer> getRank(String userId) {
        return commands.zrevrank(key, userId)
                .map(rank -> Math.toIntExact(rank) + 1);
    }

    public Mono<Map<String, String>> getUserMetadata(String userId) {
        return commands.hgetall(metadataKey(userId))
                .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                .map(map -> (Map<String, String>) map);
    }

    public Mono<LeaderboardEntry> getUserEntry(String userId) {
        return Mono.zip(
                commands.zscore(key, userId),
                commands.zrevrank(key, userId),
                getUserMetadata(userId)
        ).map(tuple -> new LeaderboardEntry(
                Math.toIntExact(tuple.getT2()) + 1,
                userId,
                tuple.getT1(),
                tuple.getT3(),
                List.of()
        ));
    }

    public Mono<List<LeaderboardEntry>> listAll() {
        return commands.zrevrangeWithScores(key, 0, -1)
                .collectList()
                .flatMap(entries -> hydrateEntries(entries, 1));
    }

    public Mono<Long> getSize() {
        return commands.zcard(key);
    }

    public Mono<Boolean> deleteUser(String userId) {
        return Mono.zip(
                commands.zrem(key, userId),
                commands.del(metadataKey(userId))
        ).map(tuple -> tuple.getT1() == 1L);
    }

    public Mono<Void> clear() {
        return commands.zrange(key, 0, -1)
                .collectList()
                .flatMap(userIds -> {
                    List<String> keysToDelete = new ArrayList<>();
                    keysToDelete.add(key);
                    for (String userId : userIds) {
                        keysToDelete.add(metadataKey(userId));
                    }
                    return commands.del(keysToDelete.toArray(String[]::new)).then();
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

    private Mono<List<String>> trimToMaxEntries() {
        return getSize().flatMap(size -> {
            long overflow = size - maxEntries;
            if (overflow <= 0) {
                return Mono.just(List.of());
            }

            return commands.zrange(key, 0, overflow - 1)
                    .collectList()
                    .flatMap(trimmedUserIds -> {
                        if (trimmedUserIds.isEmpty()) {
                            return Mono.just(List.of());
                        }

                        String[] metadataKeys = trimmedUserIds.stream()
                                .map(this::metadataKey)
                                .toArray(String[]::new);

                        return Mono.when(
                                commands.zremrangebyrank(key, 0, overflow - 1),
                                commands.del(metadataKeys)
                        ).thenReturn(List.copyOf(trimmedUserIds));
                    });
        });
    }

    private Mono<List<LeaderboardEntry>> hydrateEntries(List<ScoredValue<String>> entries, int startRank) {
        if (entries.isEmpty()) {
            return Mono.just(List.of());
        }

        return Flux.range(0, entries.size())
                .flatMap(index -> getUserMetadata(entries.get(index).getValue())
                        .map(metadata -> new LeaderboardEntry(
                                startRank + index,
                                entries.get(index).getValue(),
                                entries.get(index).getScore(),
                                metadata,
                                List.of()
                        )))
                .collectList();
    }

    private int normalizePositiveInt(int value, String fieldName) {
        if (value < 1) {
            throw new IllegalArgumentException(fieldName + " must be at least 1");
        }
        return value;
    }
}
