<?php

use Predis\Client as PredisClient;

/**
 * Redis-backed leaderboard implementation using a sorted set and per-user metadata hashes.
 */
class RedisLeaderboard
{
    private PredisClient $redis;
    private string $key;
    private int $maxEntries;

    public function __construct(
        ?PredisClient $redis = null,
        string $key = 'leaderboard:demo',
        int $maxEntries = 100
    ) {
        $this->redis = $redis ?? new PredisClient([
            'host' => '127.0.0.1',
            'port' => 6379,
        ]);
        $this->key = $key !== '' ? $key : 'leaderboard:demo';
        $this->maxEntries = $this->normalizePositiveInt($maxEntries, 'maxEntries');
    }

    public function getKey(): string
    {
        return $this->key;
    }

    public function getMaxEntries(): int
    {
        return $this->maxEntries;
    }

    public function upsertUser(string $userId, float $score, array $metadata = []): array
    {
        $payload = $this->coerceMetadata($metadata);

        $pipeline = $this->redis->pipeline();
        $pipeline->zadd($this->key, [$userId => $score]);
        if ($payload !== []) {
            $pipeline->hmset($this->metadataKey($userId), $payload);
        }
        $pipeline->execute();

        $trimmedUserIds = $this->trimToMaxEntries();
        $entry = $this->getUserEntry($userId);

        if ($entry === null) {
            return [
                'rank' => 0,
                'user_id' => $userId,
                'score' => $score,
                'metadata' => $payload,
                'trimmed_user_ids' => $trimmedUserIds,
            ];
        }

        $entry['trimmed_user_ids'] = $trimmedUserIds;
        return $entry;
    }

    public function incrementScore(string $userId, float $amount, array $metadata = []): array
    {
        $payload = $this->coerceMetadata($metadata);

        $pipeline = $this->redis->pipeline();
        $pipeline->zincrby($this->key, $amount, $userId);
        if ($payload !== []) {
            $pipeline->hmset($this->metadataKey($userId), $payload);
        }
        $result = $pipeline->execute();
        $newScore = isset($result[0]) ? (float) $result[0] : 0.0;

        $trimmedUserIds = $this->trimToMaxEntries();
        $entry = $this->getUserEntry($userId);

        if ($entry === null) {
            return [
                'rank' => 0,
                'user_id' => $userId,
                'score' => $newScore,
                'metadata' => $payload,
                'trimmed_user_ids' => $trimmedUserIds,
            ];
        }

        $entry['trimmed_user_ids'] = $trimmedUserIds;
        return $entry;
    }

    public function setMaxEntries(int $maxEntries): array
    {
        $this->maxEntries = $this->normalizePositiveInt($maxEntries, 'maxEntries');
        return $this->trimToMaxEntries();
    }

    public function getTop(int $count): array
    {
        $normalizedCount = $this->normalizePositiveInt($count, 'count');
        $entries = $this->redis->zrevrange($this->key, 0, $normalizedCount - 1, 'WITHSCORES');
        return $this->hydrateEntries($entries, 1);
    }

    public function getAroundRank(int $rank, int $count): array
    {
        $normalizedRank = $this->normalizePositiveInt($rank, 'rank');
        $normalizedCount = $this->normalizePositiveInt($count, 'count');
        $totalEntries = $this->getSize();

        if ($totalEntries === 0) {
            return [];
        }

        if ($totalEntries <= $normalizedCount) {
            return $this->listAll();
        }

        $halfWindow = intdiv($normalizedCount, 2);
        $start = max(0, $normalizedRank - 1 - $halfWindow);
        $maxStart = $totalEntries - $normalizedCount;
        if ($start > $maxStart) {
            $start = $maxStart;
        }
        $end = $start + $normalizedCount - 1;

        $entries = $this->redis->zrevrange($this->key, $start, $end, 'WITHSCORES');
        return $this->hydrateEntries($entries, $start + 1);
    }

    public function getRank(string $userId): ?int
    {
        $rank = $this->redis->zrevrank($this->key, $userId);
        if ($rank === null) {
            return null;
        }
        return (int) $rank + 1;
    }

    public function getUserMetadata(string $userId): array
    {
        return $this->redis->hgetall($this->metadataKey($userId));
    }

    public function getUserEntry(string $userId): ?array
    {
        $pipeline = $this->redis->pipeline();
        $pipeline->zscore($this->key, $userId);
        $pipeline->zrevrank($this->key, $userId);
        $pipeline->hgetall($this->metadataKey($userId));
        $result = $pipeline->execute();

        if (!isset($result[0], $result[1]) || $result[0] === null || $result[1] === null) {
            return null;
        }

        return [
            'rank' => (int) $result[1] + 1,
            'user_id' => $userId,
            'score' => (float) $result[0],
            'metadata' => $result[2] ?? [],
            'trimmed_user_ids' => [],
        ];
    }

    public function listAll(): array
    {
        $entries = $this->redis->zrevrange($this->key, 0, -1, 'WITHSCORES');
        return $this->hydrateEntries($entries, 1);
    }

    public function getSize(): int
    {
        return (int) $this->redis->zcard($this->key);
    }

    public function deleteUser(string $userId): bool
    {
        $pipeline = $this->redis->pipeline();
        $pipeline->zrem($this->key, $userId);
        $pipeline->del([$this->metadataKey($userId)]);
        $result = $pipeline->execute();
        return isset($result[0]) && (int) $result[0] === 1;
    }

    public function clear(): void
    {
        $userIds = $this->redis->zrange($this->key, 0, -1);
        $keys = [$this->key];
        foreach ($userIds as $userId) {
            $keys[] = $this->metadataKey((string) $userId);
        }
        $this->redis->del($keys);
    }

    private function metadataKey(string $userId): string
    {
        return "{$this->key}:user:{$userId}";
    }

    private function coerceMetadata(array $metadata): array
    {
        $payload = [];
        foreach ($metadata as $field => $value) {
            $payload[(string) $field] = (string) $value;
        }
        return $payload;
    }

    private function trimToMaxEntries(): array
    {
        $overflow = $this->getSize() - $this->maxEntries;
        if ($overflow <= 0) {
            return [];
        }

        $trimmedUserIds = $this->redis->zrange($this->key, 0, $overflow - 1);
        if ($trimmedUserIds === []) {
            return [];
        }

        $this->redis->zremrangebyrank($this->key, 0, $overflow - 1);

        $metadataKeys = [];
        foreach ($trimmedUserIds as $userId) {
            $metadataKeys[] = $this->metadataKey((string) $userId);
        }
        if ($metadataKeys !== []) {
            $this->redis->del($metadataKeys);
        }

        return array_map('strval', $trimmedUserIds);
    }

    private function hydrateEntries(array $entries, int $startRank): array
    {
        $hydrated = [];
        $rank = $startRank;
        foreach ($entries as $userId => $score) {
            $hydrated[] = [
                'rank' => $rank++,
                'user_id' => (string) $userId,
                'score' => (float) $score,
                'metadata' => $this->getUserMetadata((string) $userId),
                'trimmed_user_ids' => [],
            ];
        }
        return $hydrated;
    }

    private function normalizePositiveInt(int $value, string $fieldName): int
    {
        if ($value < 1) {
            throw new InvalidArgumentException("{$fieldName} must be at least 1");
        }
        return $value;
    }
}
