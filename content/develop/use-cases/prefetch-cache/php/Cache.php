<?php

/**
 * Redis prefetch-cache helper.
 *
 * Each cached entity is stored as a Redis hash under
 * "cache:{prefix}:{id}" with a long safety-net TTL that bounds memory if
 * the sync pipeline ever stops, but is not the freshness mechanism.
 * Freshness comes from the applyChange() path, which the sync worker
 * calls every time a primary mutation arrives.
 *
 * Reads run HGETALL against Redis only. A miss is not a fall-back
 * trigger — the application treats it as an error or a deliberate
 * invalidate() for testing. In production a sustained miss rate means
 * the prefetch or the sync pipeline is broken, not that the primary
 * should be re-queried on the request path.
 *
 * Because the demo runs under PHP's built-in dev server, every HTTP
 * request lives in its own short-lived process. In-process counters
 * therefore can't work; the stats live in a Redis hash under
 * demo:stats:{prefix} so every request, the demo server, and the sync
 * worker all see the same totals.
 *
 * Requires: predis/predis 3.x
 */

declare(strict_types=1);

use Predis\ClientInterface;

class PrefetchCache
{
    private ClientInterface $redis;
    private string $prefix;
    private int $ttlSeconds;
    private string $statsKey;

    public function __construct(
        ClientInterface $redis,
        string $prefix = 'cache:category:',
        int $ttlSeconds = 3600
    ) {
        $this->redis = $redis;
        $this->prefix = $prefix;
        $this->ttlSeconds = $ttlSeconds;
        $this->statsKey = 'demo:stats:' . $prefix;
    }

    public function getPrefix(): string
    {
        return $this->prefix;
    }

    public function getTtlSeconds(): int
    {
        return $this->ttlSeconds;
    }

    private function cacheKey(string $entityId): string
    {
        return $this->prefix . $entityId;
    }

    private function stripPrefix(string $key): string
    {
        if (strpos($key, $this->prefix) === 0) {
            return substr($key, strlen($this->prefix));
        }
        return $key;
    }

    /**
     * Flatten an associative ["field" => "value"] map into the variadic
     * field/value/field/value form HSET expects in Predis 3.x.
     *
     * Predis 3.x dropped the 1.x convenience signature that accepted an
     * associative array; the 1.x form raises "wrong number of arguments
     * for 'hset'" against 3.x.
     *
     * @return list<string>
     */
    private static function flattenFields(array $fields): array
    {
        $out = [];
        foreach ($fields as $k => $v) {
            $out[] = (string) $k;
            $out[] = (string) $v;
        }
        return $out;
    }

    /**
     * Pipeline DEL + HSET + EXPIRE for every record. Returns the count
     * loaded.
     *
     * The pipeline is non-transactional: it is fast on startup (when
     * nothing is reading the cache) and on the live /reprefetch path
     * (when the demo pauses the sync worker around the call). Calling
     * bulkLoad on a cache that is actively being read and written to
     * can briefly expose a key that has been deleted but not yet
     * rewritten; pause the writers first or rewrite this as a
     * transactional pipeline if that matters.
     *
     * @param iterable<array<string,string>> $records
     */
    public function bulkLoad(iterable $records): int
    {
        $loaded = 0;
        $pipe = $this->redis->pipeline();
        foreach ($records as $record) {
            $entityId = $record['id'] ?? '';
            if ($entityId === '') {
                continue;
            }
            $cacheKey = $this->cacheKey($entityId);
            $pipe->del([$cacheKey]);
            $pipe->hset($cacheKey, ...self::flattenFields($record));
            $pipe->expire($cacheKey, $this->ttlSeconds);
            $loaded++;
        }
        if ($loaded > 0) {
            $pipe->execute();
            $this->redis->hincrby($this->statsKey, 'prefetched', $loaded);
        }
        return $loaded;
    }

    /**
     * Return [record_or_null, hit, redisLatencyMs] for an HGETALL.
     *
     * Prefetch-cache reads do not fall back to the primary. A miss is
     * a signal that the cache is incomplete, not a trigger to re-query
     * the source. The caller decides how to surface it.
     *
     * @return array{0: ?array<string,string>, 1: bool, 2: float}
     */
    public function get(string $entityId): array
    {
        $cacheKey = $this->cacheKey($entityId);
        $started = microtime(true);
        $cached = $this->redis->hgetall($cacheKey);
        $redisLatencyMs = (microtime(true) - $started) * 1000.0;

        if (is_array($cached) && !empty($cached)) {
            $this->redis->hincrby($this->statsKey, 'hits', 1);
            return [$cached, true, $redisLatencyMs];
        }

        $this->redis->hincrby($this->statsKey, 'misses', 1);
        return [null, false, $redisLatencyMs];
    }

    /**
     * Apply a primary change event to Redis.
     *
     * For an upsert, rewrites the hash (DEL + HSET + EXPIRE in a
     * MULTI/EXEC transaction) and refreshes the safety-net TTL. For a
     * delete, removes the cache key.
     *
     * If op=="upsert" and fields is missing or empty, returns early
     * without writing — HSET with an empty map raises in most clients,
     * including Predis 3.x. A real CDC consumer would route this to a
     * dead-letter queue; the demo drops it.
     *
     * @param array{op:string,id:string,fields:?array<string,string>,timestamp_ms:float} $change
     */
    public function applyChange(array $change): void
    {
        $op = $change['op'] ?? '';
        $entityId = $change['id'] ?? '';
        if ($entityId === '') {
            return;
        }
        $cacheKey = $this->cacheKey($entityId);

        if ($op === 'upsert') {
            $fields = $change['fields'] ?? null;
            if (!is_array($fields) || empty($fields)) {
                return;
            }
            $tx = $this->redis->transaction();
            $tx->del([$cacheKey]);
            $tx->hset($cacheKey, ...self::flattenFields($fields));
            $tx->expire($cacheKey, $this->ttlSeconds);
            $tx->execute();
        } elseif ($op === 'delete') {
            $this->redis->del([$cacheKey]);
        } else {
            return;
        }

        $this->redis->hincrby($this->statsKey, 'sync_events_applied', 1);
        $timestampMs = $change['timestamp_ms'] ?? null;
        if (is_int($timestampMs) || is_float($timestampMs)) {
            $lagMs = max(0.0, (microtime(true) * 1000.0) - (float) $timestampMs);
            // Track sum + sample count separately; stats() divides on
            // read. HINCRBYFLOAT is the only sane way to accumulate a
            // floating-point sum across processes without round-trip
            // read-modify-writes.
            $this->redis->hincrbyfloat($this->statsKey, 'sync_lag_ms_total', $lagMs);
            $this->redis->hincrby($this->statsKey, 'sync_lag_samples', 1);
        }
    }

    /**
     * Delete one cache key. Demo-only: simulates a broken sync pipeline.
     */
    public function invalidate(string $entityId): bool
    {
        return (int) $this->redis->del([$this->cacheKey($entityId)]) === 1;
    }

    /**
     * Delete every key under this cache's prefix and return the count.
     */
    public function clear(): int
    {
        $deleted = 0;
        $batch = [];
        $cursor = '0';
        do {
            $result = $this->redis->scan($cursor, ['MATCH' => $this->prefix . '*', 'COUNT' => 500]);
            $cursor = (string) $result[0];
            $keys = $result[1] ?? [];
            foreach ($keys as $key) {
                $batch[] = (string) $key;
                if (count($batch) >= 500) {
                    $deleted += (int) $this->redis->del($batch);
                    $batch = [];
                }
            }
        } while ($cursor !== '0');
        if (!empty($batch)) {
            $deleted += (int) $this->redis->del($batch);
        }
        return $deleted;
    }

    /**
     * Return every entity id currently in the cache, sorted.
     *
     * @return list<string>
     */
    public function ids(): array
    {
        $ids = [];
        $cursor = '0';
        do {
            $result = $this->redis->scan($cursor, ['MATCH' => $this->prefix . '*', 'COUNT' => 500]);
            $cursor = (string) $result[0];
            $keys = $result[1] ?? [];
            foreach ($keys as $key) {
                $ids[] = $this->stripPrefix((string) $key);
            }
        } while ($cursor !== '0');
        sort($ids, SORT_STRING);
        return $ids;
    }

    public function count(): int
    {
        $count = 0;
        $cursor = '0';
        do {
            $result = $this->redis->scan($cursor, ['MATCH' => $this->prefix . '*', 'COUNT' => 500]);
            $cursor = (string) $result[0];
            $keys = $result[1] ?? [];
            $count += count($keys);
        } while ($cursor !== '0');
        return $count;
    }

    public function ttlRemaining(string $entityId): int
    {
        return (int) $this->redis->ttl($this->cacheKey($entityId));
    }

    /**
     * Return the counter snapshot.
     *
     * Counters live in Redis under demo:stats:{prefix}, so every
     * request and the sync worker see the same totals. The average lag
     * is computed at read time from a running sum and a sample count
     * so cross-process increments don't have to coordinate to update
     * a single float.
     *
     * @return array{hits:int,misses:int,hit_rate_pct:float,prefetched:int,sync_events_applied:int,sync_lag_ms_avg:float}
     */
    public function stats(): array
    {
        $raw = $this->redis->hgetall($this->statsKey) ?: [];
        $hits = (int) ($raw['hits'] ?? 0);
        $misses = (int) ($raw['misses'] ?? 0);
        $prefetched = (int) ($raw['prefetched'] ?? 0);
        $applied = (int) ($raw['sync_events_applied'] ?? 0);
        $lagTotal = (float) ($raw['sync_lag_ms_total'] ?? 0.0);
        $lagSamples = (int) ($raw['sync_lag_samples'] ?? 0);

        $total = $hits + $misses;
        $hitRate = $total > 0 ? round(100.0 * $hits / $total, 1) : 0.0;
        $avgLag = $lagSamples > 0 ? round($lagTotal / $lagSamples, 2) : 0.0;

        return [
            'hits' => $hits,
            'misses' => $misses,
            'hit_rate_pct' => $hitRate,
            'prefetched' => $prefetched,
            'sync_events_applied' => $applied,
            'sync_lag_ms_avg' => $avgLag,
        ];
    }

    public function resetStats(): void
    {
        $this->redis->del([$this->statsKey]);
    }
}
