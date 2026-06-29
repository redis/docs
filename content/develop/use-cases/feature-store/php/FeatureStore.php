<?php
/**
 * Redis online feature store backed by per-entity Hashes (Predis).
 *
 * Each entity (here, a user) lives at a deterministic key such as
 * `fs:user:{id}`. The hash holds every feature for that entity as one
 * field per feature -- batch-materialized aggregates (refreshed on a
 * daily cycle) alongside streaming-updated signals (refreshed every
 * few seconds). One `HMGET` returns whichever subset the model needs
 * in one network round trip.
 *
 * Two TTL layers solve the *mixed staleness* problem:
 *
 *   * A key-level `EXPIRE` aligned with the batch materialization
 *     cycle causes the whole entity to disappear if its batch
 *     refresher fails, so inference sees a missing entity (which the
 *     model handler can detect and fall back on) rather than silently
 *     outdated values.
 *   * A per-field `HEXPIRE` on each streaming field gives that field
 *     its own shorter expiry, independent of the rest of the hash.
 *     When the streaming pipeline stops updating a field, the field
 *     self-cleans while the rest of the entity stays populated.
 *
 * `HEXPIRE` and `HTTL` require Redis 7.4 or later. Predis 3.0+ ships
 * typed `hexpire()` and `httl()` methods on the client; the helper
 * uses them directly.
 */

declare(strict_types=1);

use Predis\Client;

class FeatureStore
{
    public const DEFAULT_BATCH_FIELDS = [
        'country_iso',
        'risk_segment',
        'account_age_days',
        'tx_count_7d',
        'avg_amount_30d',
        'chargeback_count_180d',
    ];

    public const DEFAULT_STREAMING_FIELDS = [
        'last_login_ts',
        'last_device_id',
        'tx_count_5m',
        'failed_logins_15m',
        'session_country',
    ];

    public const DEFAULT_BATCH_TTL_SECONDS = 24 * 60 * 60;
    public const DEFAULT_STREAMING_TTL_SECONDS = 5 * 60;
    public const DEFAULT_KEY_PREFIX = 'fs:user:';

    private Client $redis;
    public readonly string $keyPrefix;
    public readonly int $batchTtlSeconds;
    public readonly int $streamingTtlSeconds;

    public function __construct(
        Client $redis,
        string $keyPrefix = self::DEFAULT_KEY_PREFIX,
        int $batchTtlSeconds = self::DEFAULT_BATCH_TTL_SECONDS,
        int $streamingTtlSeconds = self::DEFAULT_STREAMING_TTL_SECONDS,
    ) {
        $this->redis = $redis;
        $this->keyPrefix = $keyPrefix;
        $this->batchTtlSeconds = $batchTtlSeconds;
        $this->streamingTtlSeconds = $streamingTtlSeconds;
    }

    public function keyFor(string $entityId): string
    {
        return $this->keyPrefix . $entityId;
    }

    // ------------------------------------------------------------------
    // Batch ingestion (materialization)
    // ------------------------------------------------------------------

    /**
     * Materialize a batch of entities into Redis.
     *
     * One `HSET` plus one `EXPIRE` per entity, all queued through a
     * non-transactional pipeline so the whole batch ships in a single
     * round trip.
     *
     * @param array<string, array<string, scalar|bool|null>> $rows
     */
    public function bulkLoad(array $rows, ?int $ttlSeconds = null): int
    {
        if (count($rows) === 0) return 0;
        $ttl = $ttlSeconds ?? $this->batchTtlSeconds;
        $this->redis->pipeline(function ($pipe) use ($rows, $ttl) {
            foreach ($rows as $entityId => $fields) {
                $key = $this->keyFor((string)$entityId);
                // Predis 3's `hset` accepts variadic field/value
                // pairs (key, f1, v1, f2, v2, ...) but not a
                // single field=>value map argument the way Predis
                // 2 did — flatten the encoded map into that shape.
                $flat = [];
                foreach ($fields as $name => $value) {
                    $flat[] = $name;
                    $flat[] = self::encodeValue($value);
                }
                $pipe->hset($key, ...$flat);
                $pipe->expire($key, $ttl);
            }
        });
        $this->incrStat('batch_writes_total', count($rows));
        return count($rows);
    }

    public function updateBatchFeature(string $entityId, string $field, mixed $value): void
    {
        $this->redis->hset($this->keyFor($entityId), $field, self::encodeValue($value));
        $this->incrStat('batch_writes_total', 1);
    }

    // ------------------------------------------------------------------
    // Streaming ingestion
    // ------------------------------------------------------------------

    /**
     * Write streaming features with a per-field TTL.
     *
     * `HSET` and `HEXPIRE` are queued in the same pipeline so Redis
     * runs them in order: the `HSET` first creates or overwrites the
     * fields, then `HEXPIRE` attaches a TTL to each of those same
     * fields.
     *
     * `HEXPIRE` returns one status code per field:
     *   * 1 = TTL set / updated.
     *   * 2 = the expiry was 0 or in the past (so Redis deleted the
     *     field instead of applying a TTL).
     *   * 0 = an NX | XX | GT | LT conditional flag was specified and
     *     not met (we never use one here).
     *   * -2 = no such field, or no such key.
     * We always follow `HSET` with `HEXPIRE` so any code other than 1
     * means the per-field TTL invariant didn't hold -- throw rather
     * than silently leave a streaming field with no expiry attached.
     *
     * @param array<string, scalar|bool|null> $fields
     */
    public function updateStreaming(string $entityId, array $fields, ?int $ttlSeconds = null): void
    {
        if (count($fields) === 0) return;
        $ttl = $ttlSeconds ?? $this->streamingTtlSeconds;
        $key = $this->keyFor($entityId);
        $flat = [];
        $names = [];
        foreach ($fields as $name => $value) {
            $names[] = $name;
            $flat[] = $name;
            $flat[] = self::encodeValue($value);
        }

        $results = $this->redis->pipeline(function ($pipe) use ($key, $flat, $names, $ttl) {
            // Predis 3 hset wants variadic field/value pairs, not a
            // single array map; spread the flattened list.
            $pipe->hset($key, ...$flat);
            $pipe->hexpire($key, $ttl, $names);
        });
        // $results[0] = HSET reply (count of new fields set)
        // $results[1] = HEXPIRE reply (array of per-field codes)
        $codes = $results[1] ?? [];
        foreach ($codes as $code) {
            if ((int)$code !== 1) {
                throw new RuntimeException(
                    "HEXPIRE did not set every field TTL for {$key}: " . json_encode($codes)
                );
            }
        }
        $this->incrStat('streaming_writes_total', count($fields));
    }

    // ------------------------------------------------------------------
    // Inference reads
    // ------------------------------------------------------------------

    /**
     * Retrieve a subset of features for one entity with `HMGET`.
     * Pass `$fieldNames=null` to fetch the entire hash with `HGETALL` --
     * useful for debugging but rarely the right call on the request
     * path.
     *
     * @return array<string, string>
     */
    public function getFeatures(string $entityId, ?array $fieldNames): array
    {
        $key = $this->keyFor($entityId);
        if ($fieldNames === null) {
            $data = $this->redis->hgetall($key);
            $this->incrStat('reads_total', 1);
            $this->incrStat('read_fields_total', count($data));
            return $data;
        }
        if (count($fieldNames) === 0) return [];
        $values = $this->redis->hmget($key, $fieldNames);
        $out = [];
        foreach ($fieldNames as $i => $n) {
            if ($values[$i] !== null) $out[$n] = (string)$values[$i];
        }
        $this->incrStat('reads_total', 1);
        $this->incrStat('read_fields_total', count($out));
        return $out;
    }

    /**
     * Pipeline `HMGET` across many entities for batch scoring. One
     * round trip for the whole batch.
     *
     * @return array<string, array<string, string>>
     */
    public function batchGetFeatures(array $entityIds, array $fieldNames): array
    {
        if (count($entityIds) === 0 || count($fieldNames) === 0) return [];
        $rows = $this->redis->pipeline(function ($pipe) use ($entityIds, $fieldNames) {
            foreach ($entityIds as $id) {
                $pipe->hmget($this->keyFor($id), $fieldNames);
            }
        });
        $out = [];
        $seen = 0;
        foreach ($entityIds as $i => $id) {
            $values = $rows[$i] ?? [];
            $row = [];
            foreach ($fieldNames as $j => $n) {
                if (($values[$j] ?? null) !== null) {
                    $row[$n] = (string)$values[$j];
                    $seen++;
                }
            }
            $out[$id] = $row;
        }
        $this->incrStat('reads_total', count($entityIds));
        $this->incrStat('read_fields_total', $seen);
        return $out;
    }

    // ------------------------------------------------------------------
    // TTL inspection (used by the demo UI)
    // ------------------------------------------------------------------

    public function keyTtlSeconds(string $entityId): int
    {
        return (int)$this->redis->ttl($this->keyFor($entityId));
    }

    /**
     * Per-field TTL via `HTTL` (Redis 7.4+). Each value mirrors the
     * `TTL` convention: positive seconds remaining, `-1` no field TTL,
     * `-2` field (or key) missing.
     *
     * @return array<string, int>
     */
    public function fieldTtlsSeconds(string $entityId, array $fieldNames): array
    {
        if (count($fieldNames) === 0) return [];
        $codes = $this->redis->httl($this->keyFor($entityId), $fieldNames);
        // HTTL on a missing key returns a flat array of -2s. No
        // defensive shim needed for this client.
        $out = [];
        foreach ($fieldNames as $i => $n) {
            $out[$n] = isset($codes[$i]) ? (int)$codes[$i] : -2;
        }
        return $out;
    }

    // ------------------------------------------------------------------
    // Demo housekeeping
    // ------------------------------------------------------------------

    public function listEntityIds(int $limit = 200): array
    {
        $ids = [];
        $cursor = '0';
        $prefixLen = strlen($this->keyPrefix);
        do {
            [$cursor, $keys] = $this->redis->scan(
                $cursor,
                ['MATCH' => $this->keyPrefix . '*', 'COUNT' => 200],
            );
            foreach ($keys as $k) {
                if (strlen($k) > $prefixLen) {
                    $ids[] = substr($k, $prefixLen);
                    if (count($ids) >= $limit) { sort($ids); return $ids; }
                }
            }
        } while ($cursor !== '0');
        sort($ids);
        return $ids;
    }

    public function countEntities(): int
    {
        $n = 0;
        $cursor = '0';
        do {
            [$cursor, $keys] = $this->redis->scan(
                $cursor,
                ['MATCH' => $this->keyPrefix . '*', 'COUNT' => 500],
            );
            $n += count($keys);
        } while ($cursor !== '0');
        return $n;
    }

    public function deleteEntity(string $entityId): int
    {
        return (int)$this->redis->del($this->keyFor($entityId));
    }

    /**
     * Drop every entity under the key prefix. Used by the demo reset
     * path; scans in batches and issues one variadic `DEL` per batch.
     */
    public function reset(): int
    {
        $deleted = 0;
        $cursor = '0';
        $batch = [];
        do {
            [$cursor, $keys] = $this->redis->scan(
                $cursor,
                ['MATCH' => $this->keyPrefix . '*', 'COUNT' => 500],
            );
            foreach ($keys as $k) {
                $batch[] = $k;
                if (count($batch) >= 500) {
                    $deleted += (int)$this->redis->del(...$batch);
                    $batch = [];
                }
            }
        } while ($cursor !== '0');
        if (count($batch) > 0) {
            $deleted += (int)$this->redis->del(...$batch);
        }
        return $deleted;
    }

    // ------------------------------------------------------------------
    // Stats — kept in Redis under `fs:stats:*` so the demo server and
    // the streaming worker (separate OS processes under `php -S`) can
    // both increment and read them.
    // ------------------------------------------------------------------

    public function statsSnapshot(): array
    {
        return [
            'batch_writes_total'     => (int)$this->redis->get('fs:stats:batch_writes_total'),
            'streaming_writes_total' => (int)$this->redis->get('fs:stats:streaming_writes_total'),
            'reads_total'            => (int)$this->redis->get('fs:stats:reads_total'),
            'read_fields_total'      => (int)$this->redis->get('fs:stats:read_fields_total'),
        ];
    }

    public function resetStats(): void
    {
        $this->redis->del(...[
            'fs:stats:batch_writes_total',
            'fs:stats:streaming_writes_total',
            'fs:stats:reads_total',
            'fs:stats:read_fields_total',
        ]);
    }

    private function incrStat(string $name, int $by): void
    {
        if ($by <= 0) return;
        $this->redis->incrby("fs:stats:{$name}", $by);
    }

    /**
     * Render a feature value as a string for hash storage. Booleans
     * become `"true"`/`"false"` so they round-trip cleanly through
     * other clients and redis-cli.
     */
    public static function encodeValue(mixed $value): string
    {
        if ($value === null) return '';
        if (is_bool($value)) return $value ? 'true' : 'false';
        return (string)$value;
    }
}
