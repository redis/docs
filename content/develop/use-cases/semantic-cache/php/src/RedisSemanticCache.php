<?php

declare(strict_types=1);

namespace Redis\SemanticCache;

use InvalidArgumentException;
use Predis\Client;
use Predis\Command\Argument\Search\CreateArguments;
use Predis\Command\Argument\Search\DropArguments;
use Predis\Command\Argument\Search\SchemaFields\NumericField;
use Predis\Command\Argument\Search\SchemaFields\TagField;
use Predis\Command\Argument\Search\SchemaFields\TextField;
use Predis\Command\Argument\Search\SchemaFields\VectorField;
use Predis\Command\Argument\Search\SearchArguments;
use Predis\Response\ServerException;

/**
 * Redis semantic-cache helper backed by Redis Search.
 *
 * Each cache entry lives as a Hash document at `cache:<id>`. The hash
 * stores the user's prompt and the corresponding LLM response
 * alongside the raw float32 bytes of the prompt's 384-dimensional
 * embedding and a small set of metadata fields — tenant, locale,
 * model version, and a safety flag.
 *
 * A single Redis Search index covers the embedding plus every
 * metadata field, so one `FT.SEARCH` call does an
 * approximate-nearest-neighbour lookup against the cached prompts
 * with a TAG pre-filter applied in the same pass — no cross-store
 * joins, no extra round trips, and tenant isolation is enforced
 * *inside* the query rather than after the fact in application code.
 *
 * The lookup is thresholded: `FT.SEARCH` always returns the closest
 * cached prompt, but the cache only serves it as a hit when the
 * cosine distance is at or below `distanceThreshold`. Anything
 * further away is treated as a miss; the caller is expected to run
 * the underlying LLM and write the new prompt, response, and
 * embedding back with `put`.
 *
 * Each cache entry is written with `EXPIRE`, so stale answers age out
 * without manual cleanup; combine with an `allkeys-lfu` eviction
 * policy on the database to cap memory under pressure too.
 */
final class RedisSemanticCache
{
    public const VECTOR_DIM_DEFAULT = 384;

    /**
     * Characters Redis Search treats as syntax inside a TAG value;
     * any of them in a user-supplied filter must be backslash-escaped
     * or the surrounding `{...}` block won't parse correctly.
     */
    private const TAG_SPECIAL = "\\,.<>{}[]\"':;!@#\$%^&*()-+=~| ";

    public function __construct(
        public readonly Client $client,
        public readonly string $indexName = 'semcache:idx',
        public readonly string $keyPrefix = 'cache:',
        public readonly int $vectorDim = self::VECTOR_DIM_DEFAULT,
        public readonly float $distanceThreshold = 0.5,
        public readonly int $defaultTtlSeconds = 3600,
    ) {
    }

    // -- Keys ------------------------------------------------------------

    public function entryKey(string $entryId): string
    {
        return $this->keyPrefix . $entryId;
    }

    // -- Index management -----------------------------------------------

    /**
     * Create the Redis Search index if it doesn't already exist.
     *
     * One index covers the embedding plus every metadata field, so a
     * single `FT.SEARCH` can pre-filter by tenant / locale / model
     * and then KNN-rank the matching documents in one pass. The
     * `prompt` and `response` fields are stored as TEXT so admin
     * tooling can grep the cache by content, but the cache lookup
     * itself is vector-only.
     */
    public function createIndex(): void
    {
        $schema = [
            new TextField('prompt'),
            new TextField('response'),
            new TagField('tenant'),
            new TagField('locale'),
            new TagField('model_version'),
            new TagField('safety'),
            new NumericField('created_ts', '', NumericField::SORTABLE),
            new NumericField('hit_count', '', NumericField::SORTABLE),
            new VectorField(
                'embedding',
                'HNSW',
                ['TYPE', 'FLOAT32', 'DIM', $this->vectorDim, 'DISTANCE_METRIC', 'COSINE'],
            ),
        ];

        try {
            $this->client->ftcreate(
                $this->indexName,
                $schema,
                (new CreateArguments())
                    ->on('HASH')
                    ->prefix([$this->keyPrefix]),
            );
        } catch (ServerException $exc) {
            if (!str_contains((string) $exc->getMessage(), 'Index already exists')) {
                throw $exc;
            }
        }
    }

    public function dropIndex(bool $deleteDocuments = false): void
    {
        try {
            $args = new DropArguments();
            if ($deleteDocuments) {
                $args->dd();
            }
            $this->client->ftdropindex($this->indexName, $args);
        } catch (ServerException $exc) {
            $message = strtolower((string) $exc->getMessage());
            if (!str_contains($message, 'no such index')
                && !str_contains($message, 'unknown index name')
            ) {
                throw $exc;
            }
        }
    }

    // -- Lookup ---------------------------------------------------------

    /**
     * Find the nearest in-scope cached prompt and decide hit / miss.
     *
     * `FT.SEARCH` returns the single nearest entry that satisfies the
     * TAG pre-filters. The lookup is a hit only if the reported
     * cosine distance is at or below `distanceThreshold` (or the
     * instance default). Anything further away is a miss with the
     * candidate distance attached so the caller can log it.
     *
     * On a hit, the entry's `hit_count` is incremented inside a
     * MULTI/EXEC alongside an `EXPIRE` refresh so a frequently-used
     * answer keeps its TTL and the demo UI can see which entries are
     * load-bearing.
     *
     * @param list<float> $queryVec
     */
    public function lookup(
        array $queryVec,
        ?string $tenant = null,
        ?string $locale = null,
        ?string $modelVersion = null,
        ?string $safety = 'ok',
        ?float $distanceThreshold = null,
    ): CacheHit|CacheMiss {
        // Match the shape check that `put` performs. A wrong-dim
        // vector would otherwise hit Redis as a malformed FT.SEARCH
        // parameter and surface as a server-side parse error instead
        // of a clear caller-side InvalidArgumentException.
        if (count($queryVec) !== $this->vectorDim) {
            throw new InvalidArgumentException(sprintf(
                'queryVec length is %d; index expects %d',
                count($queryVec),
                $this->vectorDim,
            ));
        }

        $threshold = $distanceThreshold ?? $this->distanceThreshold;

        $filterClause = self::buildFilterClause(
            tenant: $tenant,
            locale: $locale,
            modelVersion: $modelVersion,
            safety: $safety,
        );
        $queryStr = $filterClause . '=>[KNN 1 @embedding $vec AS distance]';
        $vecBytes = LocalEmbedder::toBytes($queryVec);

        $arguments = (new SearchArguments())
            ->addReturn(7, 'prompt', 'response', 'tenant', 'locale', 'model_version', 'hit_count', 'distance')
            ->sortBy('distance', 'asc')
            ->limit(0, 1)
            ->dialect('2')
            ->params(['vec', $vecBytes]);

        $raw = $this->client->ftsearch($this->indexName, $queryStr, $arguments);
        $docs = self::parseSearchResponse($raw);
        if ($docs === []) {
            return new CacheMiss(null, null);
        }

        $doc = $docs[0];
        $rawKey = $doc['__id'] ?? '';
        $entryId = str_starts_with($rawKey, $this->keyPrefix)
            ? substr($rawKey, strlen($this->keyPrefix))
            : $rawKey;
        $distance = (float) ($doc['distance'] ?? 0.0);

        if ($distance > $threshold) {
            return new CacheMiss($distance, $entryId);
        }

        // The hash may have expired between FT.SEARCH returning the
        // row and us getting here — the search index lags expirations
        // by its periodic scan. If we just blindly HINCRBY-ed, Redis
        // would helpfully recreate the hash with only `hit_count` set
        // and the search index would then log it as an indexing
        // failure (no embedding, no metadata). EXISTS narrows that
        // race to the pipeline round-trip; a strictly race-free
        // version would wrap the bump in a Lua script that checks
        // existence and acts in one server-side step.
        $entryKey = $this->entryKey($entryId);
        if ((int) $this->client->exists($entryKey) === 0) {
            return new CacheMiss($distance, $entryId);
        }

        // MULTI/EXEC the three writes so they apply as a unit on the
        // server — a partial failure between HINCRBY and EXPIRE would
        // otherwise leave the entry without a refreshed TTL.
        $ttlSeconds = $this->defaultTtlSeconds;
        $replies = $this->client->transaction(function ($tx) use ($entryKey, $ttlSeconds) {
            $tx->hincrby($entryKey, 'hit_count', 1);
            $tx->expire($entryKey, $ttlSeconds);
            $tx->ttl($entryKey);
        });
        $newHitCount = (int) ($replies[0] ?? 0);
        $ttl = (int) ($replies[2] ?? $ttlSeconds);

        return new CacheHit(
            id: $entryId,
            prompt: (string) ($doc['prompt'] ?? ''),
            response: (string) ($doc['response'] ?? ''),
            tenant: (string) ($doc['tenant'] ?? ''),
            locale: (string) ($doc['locale'] ?? ''),
            modelVersion: (string) ($doc['model_version'] ?? ''),
            distance: $distance,
            ttlSeconds: $ttl > 0 ? $ttl : $this->defaultTtlSeconds,
            hitCount: $newHitCount,
        );
    }

    // -- Write ----------------------------------------------------------

    /**
     * Write a new cache entry and return its id.
     *
     * The embedding is stored as raw little-endian float32 bytes —
     * the encoding Redis Search expects from a FLOAT32 vector field
     * (`pack('g*', ...)`). `EXPIRE` on the key gives every entry a
     * bounded lifetime; combine with an `allkeys-lfu` eviction policy
     * on the database to cap memory under pressure too.
     *
     * @param list<float> $embedding
     */
    public function put(
        string $prompt,
        string $response,
        array $embedding,
        string $tenant = 'default',
        string $locale = 'en',
        string $modelVersion = 'gpt-4.5-2026',
        string $safety = 'ok',
        ?int $ttlSeconds = null,
        ?string $entryId = null,
    ): string {
        if (count($embedding) !== $this->vectorDim) {
            throw new InvalidArgumentException(sprintf(
                'embedding length is %d; index expects %d',
                count($embedding),
                $this->vectorDim,
            ));
        }

        $entryId ??= self::newEntryId();
        $key = $this->entryKey($entryId);
        $ttl = $ttlSeconds ?? $this->defaultTtlSeconds;

        $mapping = [
            'prompt' => $prompt,
            'response' => $response,
            'tenant' => $tenant,
            'locale' => $locale,
            'model_version' => $modelVersion,
            'safety' => $safety,
            'created_ts' => sprintf('%.6f', microtime(true)),
            'hit_count' => '0',
            'embedding' => LocalEmbedder::toBytes($embedding),
        ];

        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. Without the transaction wrapper a connection drop
        // between the two writes could leave the entry without a TTL
        // and the cache would then keep an answer past its intended
        // lifetime (or forever, on a database with no eviction policy).
        // Predis exposes both `hmset` and `hset`, but `HMSET` has been
        // deprecated server-side since Redis 4 in favour of the
        // variadic `HSET key field value [field value …]`. Flatten the
        // associative mapping into the field/value sequence `hset`
        // expects to keep the wire command on the supported path.
        $hsetArgs = [$key];
        foreach ($mapping as $field => $value) {
            $hsetArgs[] = $field;
            $hsetArgs[] = $value;
        }
        $this->client->transaction(function ($tx) use ($hsetArgs, $key, $ttl) {
            $tx->hset(...$hsetArgs);
            $tx->expire($key, $ttl);
        });
        return $entryId;
    }

    // -- Filter clause --------------------------------------------------

    public static function escapeTagValue(string $value): string
    {
        $out = '';
        $special = self::TAG_SPECIAL;
        $len = strlen($value);
        for ($i = 0; $i < $len; $i++) {
            $ch = $value[$i];
            $out .= (str_contains($special, $ch) ? '\\' . $ch : $ch);
        }
        return $out;
    }

    public static function buildFilterClause(
        ?string $tenant,
        ?string $locale,
        ?string $modelVersion,
        ?string $safety,
    ): string {
        $clauses = [];
        if ($tenant !== null && $tenant !== '') {
            $clauses[] = '@tenant:{' . self::escapeTagValue($tenant) . '}';
        }
        if ($locale !== null && $locale !== '') {
            $clauses[] = '@locale:{' . self::escapeTagValue($locale) . '}';
        }
        if ($modelVersion !== null && $modelVersion !== '') {
            $clauses[] = '@model_version:{' . self::escapeTagValue($modelVersion) . '}';
        }
        if ($safety !== null && $safety !== '') {
            $clauses[] = '@safety:{' . self::escapeTagValue($safety) . '}';
        }
        if ($clauses === []) {
            return '(*)';
        }
        return '(' . implode(' ', $clauses) . ')';
    }

    // -- Inspection / admin ---------------------------------------------

    /**
     * Subset of `FT.INFO` useful for the demo UI.
     *
     * @return array{num_docs:int,indexing_failures:int,vector_index_size_mb:float}
     */
    public function indexInfo(): array
    {
        try {
            $raw = $this->client->ftinfo($this->indexName);
        } catch (ServerException) {
            return [
                'num_docs' => 0,
                'indexing_failures' => 0,
                'vector_index_size_mb' => 0.0,
            ];
        }

        $info = self::flatPairsToMap($raw);
        return [
            'num_docs' => (int) ($info['num_docs'] ?? 0),
            'indexing_failures' => (int) ($info['hash_indexing_failures'] ?? 0),
            'vector_index_size_mb' => (float) ($info['vector_index_sz_mb'] ?? 0.0),
        ];
    }

    /**
     * Return every cached entry (no embedding) for the admin UI.
     *
     * @return list<array<string, mixed>>
     */
    public function listEntries(int $limit = 100): array
    {
        $arguments = (new SearchArguments())
            ->addReturn(8, 'prompt', 'response', 'tenant', 'locale', 'model_version', 'safety', 'created_ts', 'hit_count')
            ->limit(0, $limit)
            ->sortBy('created_ts', 'desc');

        try {
            $raw = $this->client->ftsearch($this->indexName, '*', $arguments);
        } catch (ServerException) {
            return [];
        }
        $docs = self::parseSearchResponse($raw);

        $out = [];
        foreach ($docs as $doc) {
            $rawKey = $doc['__id'] ?? '';
            $entryId = str_starts_with($rawKey, $this->keyPrefix)
                ? substr($rawKey, strlen($this->keyPrefix))
                : $rawKey;
            $ttl = (int) $this->client->ttl($this->entryKey($entryId));
            $out[] = [
                'id' => $entryId,
                'prompt' => (string) ($doc['prompt'] ?? ''),
                'response' => (string) ($doc['response'] ?? ''),
                'tenant' => (string) ($doc['tenant'] ?? ''),
                'locale' => (string) ($doc['locale'] ?? ''),
                'model_version' => (string) ($doc['model_version'] ?? ''),
                'safety' => (string) ($doc['safety'] ?? ''),
                'hit_count' => (int) ($doc['hit_count'] ?? 0),
                'ttl_seconds' => $ttl > 0 ? $ttl : 0,
                'created_ts' => (float) ($doc['created_ts'] ?? 0.0),
            ];
        }
        return $out;
    }

    public function deleteEntry(string $entryId): bool
    {
        return ((int) $this->client->del($this->entryKey($entryId))) > 0;
    }

    /**
     * Drop the index and every cached entry. Returns the number of
     * entries that were removed. Used by the demo's "reset" button —
     * in production the equivalent is just `FLUSHDB` on a dedicated
     * cache database, or letting TTLs expire naturally.
     */
    public function clear(): int
    {
        $before = $this->indexInfo()['num_docs'];
        $this->dropIndex(deleteDocuments: true);
        $this->createIndex();
        return $before;
    }

    // -- Helpers --------------------------------------------------------

    /**
     * FT.SEARCH returns: [count, key1, [field, value, field, value, ...], key2, [...], ...]
     *
     * @param  mixed                          $raw
     * @return list<array<string, mixed>>
     */
    private static function parseSearchResponse(mixed $raw): array
    {
        if (!is_array($raw) || $raw === []) {
            return [];
        }
        $docs = [];
        $count = count($raw);
        for ($i = 1; $i + 1 < $count; $i += 2) {
            $key = $raw[$i];
            $fields = $raw[$i + 1];
            if (!is_array($fields)) {
                continue;
            }
            $doc = ['__id' => (string) $key];
            $fieldCount = count($fields);
            for ($j = 0; $j + 1 < $fieldCount; $j += 2) {
                $doc[(string) $fields[$j]] = $fields[$j + 1];
            }
            $docs[] = $doc;
        }
        return $docs;
    }

    /**
     * Convert a flat RESP key-value array (`[k1, v1, k2, v2, ...]`)
     * into an associative map for the `FT.INFO` reply.
     *
     * @param  mixed                $raw
     * @return array<string, mixed>
     */
    private static function flatPairsToMap(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }
        $map = [];
        $count = count($raw);
        for ($i = 0; $i + 1 < $count; $i += 2) {
            $map[(string) $raw[$i]] = $raw[$i + 1];
        }
        return $map;
    }

    private static function newEntryId(): string
    {
        // 12 lowercase hex characters — collision space is 16^12, big
        // enough for the demo but compact in the UI table.
        $bytes = random_bytes(6);
        return bin2hex($bytes);
    }
}
