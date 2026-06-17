<?php

declare(strict_types=1);

use Predis\Client as PredisClient;

/**
 * Cache-aside helper backed by Redis hashes with TTL and Lua-backed
 * single-flight stampede protection.
 *
 * Stats counters live in Redis (under "demo:cache_stats") rather than in
 * process memory because PHP requests do not share state.
 */
class RedisCache
{
    private const ACQUIRE_LOCK_SCRIPT = <<<'LUA'
        if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
            return 1
        end
        return 0
        LUA;

    private const RELEASE_LOCK_SCRIPT = <<<'LUA'
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
        end
        return 0
        LUA;

    private const STATS_KEY = 'demo:cache_stats';

    private PredisClient $redis;
    private string $prefix;
    private int $ttl;
    private int $lockTtlMs;
    private int $waitPollMs;

    public function __construct(
        PredisClient $redis,
        string $prefix = 'cache:product:',
        int $ttl = 30,
        int $lockTtlMs = 2000,
        int $waitPollMs = 25
    ) {
        $this->redis = $redis;
        $this->prefix = $prefix;
        $this->ttl = $ttl;
        $this->lockTtlMs = $lockTtlMs;
        $this->waitPollMs = $waitPollMs;
    }

    public function ttl(): int
    {
        return $this->ttl;
    }

    /**
     * Read through the cache, calling $loader on a miss.
     *
     * @param callable(string): ?array<string,string> $loader
     * @return array{record: ?array<string,string>, hit: bool, redis_latency_ms: float}
     */
    public function get(string $entityId, callable $loader): array
    {
        $cacheKey = $this->cacheKey($entityId);

        $started = self::monotonicMs();
        $cached = $this->redis->hgetall($cacheKey);
        $redisLatencyMs = self::monotonicMs() - $started;

        if (is_array($cached) && count($cached) > 0) {
            $this->recordHit();
            return ['record' => $cached, 'hit' => true, 'redis_latency_ms' => $redisLatencyMs];
        }

        $this->recordMiss();
        $record = $this->loadWithSingleFlight($entityId, $loader);
        return ['record' => $record, 'hit' => false, 'redis_latency_ms' => $redisLatencyMs];
    }

    public function invalidate(string $entityId): bool
    {
        return ((int) $this->redis->del([$this->cacheKey($entityId)])) === 1;
    }

    public function updateField(string $entityId, string $field, string $value): bool
    {
        $cacheKey = $this->cacheKey($entityId);
        while (true) {
            $this->redis->watch($cacheKey);
            if ((int) $this->redis->exists($cacheKey) === 0) {
                $this->redis->unwatch();
                return false;
            }
            $result = $this->redis->transaction(function ($pipe) use ($cacheKey, $field, $value): void {
                $pipe->hset($cacheKey, $field, $value);
                $pipe->expire($cacheKey, $this->ttl);
            });
            if ($result !== null) {
                return true;
            }
            // null means WATCH detected a change — retry.
        }
    }

    public function ttlRemaining(string $entityId): int
    {
        return (int) $this->redis->ttl($this->cacheKey($entityId));
    }

    /**
     * @return array<string, int|float>
     */
    public function stats(): array
    {
        $raw = $this->redis->hgetall(self::STATS_KEY);
        $hits = (int) ($raw['hits'] ?? 0);
        $misses = (int) ($raw['misses'] ?? 0);
        $stampedes = (int) ($raw['stampedes_suppressed'] ?? 0);
        $total = $hits + $misses;
        $hitRate = $total === 0 ? 0.0 : (float) ((int) (1000 * $hits / $total)) / 10;
        return [
            'hits' => $hits,
            'misses' => $misses,
            'stampedes_suppressed' => $stampedes,
            'hit_rate_pct' => $hitRate,
        ];
    }

    public function resetStats(): void
    {
        $this->redis->del([self::STATS_KEY]);
    }

    /**
     * @param callable(string): ?array<string,string> $loader
     * @return ?array<string,string>
     */
    private function loadWithSingleFlight(string $entityId, callable $loader): ?array
    {
        $cacheKey = $this->cacheKey($entityId);
        $lockKey = $this->lockKey($entityId);
        $token = bin2hex(random_bytes(8));

        $acquired = (int) $this->redis->eval(
            self::ACQUIRE_LOCK_SCRIPT,
            1,
            $lockKey,
            $token,
            (string) $this->lockTtlMs
        );

        if ($acquired === 1) {
            try {
                $record = $loader($entityId);
                if ($record === null) {
                    return null;
                }
                $this->redis->transaction(function ($pipe) use ($cacheKey, $record): void {
                    $pipe->del([$cacheKey]);
                    $pipe->hmset($cacheKey, $record);
                    $pipe->expire($cacheKey, $this->ttl);
                });
                return $record;
            } finally {
                $this->redis->eval(self::RELEASE_LOCK_SCRIPT, 1, $lockKey, $token);
            }
        }

        $this->recordStampedeSuppressed();
        $deadline = self::monotonicMs() + $this->lockTtlMs;
        while (self::monotonicMs() < $deadline) {
            usleep($this->waitPollMs * 1000);
            $cached = $this->redis->hgetall($cacheKey);
            if (is_array($cached) && count($cached) > 0) {
                return $cached;
            }
        }
        return $loader($entityId);
    }

    private function cacheKey(string $id): string
    {
        return $this->prefix . $id;
    }

    private function lockKey(string $id): string
    {
        return 'lock:' . $this->prefix . $id;
    }

    private function recordHit(): void
    {
        $this->redis->hincrby(self::STATS_KEY, 'hits', 1);
    }

    private function recordMiss(): void
    {
        $this->redis->hincrby(self::STATS_KEY, 'misses', 1);
    }

    private function recordStampedeSuppressed(): void
    {
        $this->redis->hincrby(self::STATS_KEY, 'stampedes_suppressed', 1);
    }

    private static function monotonicMs(): float
    {
        return microtime(true) * 1000.0;
    }
}
