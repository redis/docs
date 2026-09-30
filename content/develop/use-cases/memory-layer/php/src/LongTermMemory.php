<?php
// Long-term memory store for an agent, backed by Redis JSON and Search.
//
// Each memory lives as one JSON document at `agent:mem:<id>`. The
// document holds the memory text, its embedding vector, and a small
// metadata block — user, namespace, kind, source thread, timestamps —
// that lets the recall query scope results without falling back to
// application-side filtering.
//
// A single Redis Search index covers the embedding plus every metadata
// field, so one `FT.SEARCH` call performs approximate-nearest-
// neighbor over the in-scope subset and returns the top-k memories
// ranked by cosine distance. The same KNN check runs at *write* time
// to deduplicate near-identical memories before they enter the store,
// which keeps the index from filling with paraphrases of the same fact
// as the agent reasons over similar topics across sessions.
//
// Memories carry one of two kinds:
//
// * `episodic` — "what happened" snapshots from a specific thread,
//   written with a medium TTL so old session detail decays naturally.
// * `semantic` — distilled facts and preferences the agent should
//   carry forward indefinitely. Written with no TTL by default.
//
// The split is enforced as a TAG on the index, so the recall query
// can ask for one kind or both with a filter — no separate keyspaces.

declare(strict_types=1);

namespace Redis\AgentMemory;

use Predis\Client;
use Predis\Command\Argument\Search\CreateArguments;
use Predis\Command\Argument\Search\DropArguments;
use Predis\Command\Argument\Search\SchemaFields\NumericField;
use Predis\Command\Argument\Search\SchemaFields\TagField;
use Predis\Command\Argument\Search\SchemaFields\TextField;
use Predis\Command\Argument\Search\SchemaFields\VectorField;
use Predis\Command\Argument\Search\SearchArguments;
use Predis\Response\ServerException;

class LongTermMemory
{
    public const VECTOR_DIM_DEFAULT = 384;

    // How close (cosine distance) a candidate must be to an existing
    // memory to count as a duplicate at write time. Smaller = stricter.
    // 0.20 is calibrated to the `all-MiniLM-L6-v2` embedding model used
    // in the demo, where a paraphrase of an existing memory lands in
    // the 0.10 – 0.20 range and a distinct memory lands above 0.50.
    public const DEFAULT_DEDUP_THRESHOLD = 0.20;

    // How close (cosine distance) a candidate must be to count as a
    // relevant recall result. Larger than the dedup threshold so the
    // agent gets a wider net at read time than at write time.
    public const DEFAULT_RECALL_THRESHOLD = 0.55;

    // TTL tiers, in seconds. `null` means "no TTL" — the memory
    // persists until explicitly deleted or evicted under memory
    // pressure.
    public const TTL_BY_KIND = [
        'episodic' => 7 * 24 * 3600,
        'semantic' => null,
    ];

    public readonly Client $client;
    public readonly string $indexName;
    public readonly string $keyPrefix;
    public readonly int $vectorDim;
    public readonly float $dedupThreshold;
    public readonly float $recallThreshold;
    public readonly array $ttlByKind;

    public function __construct(
        Client $client,
        string $indexName = 'agentmem:idx',
        string $keyPrefix = 'agent:mem:',
        int $vectorDim = self::VECTOR_DIM_DEFAULT,
        float $dedupThreshold = self::DEFAULT_DEDUP_THRESHOLD,
        float $recallThreshold = self::DEFAULT_RECALL_THRESHOLD,
        ?array $ttlByKind = null,
    ) {
        $this->client = $client;
        $this->indexName = $indexName;
        $this->keyPrefix = $keyPrefix;
        $this->vectorDim = $vectorDim;
        $this->dedupThreshold = $dedupThreshold;
        $this->recallThreshold = $recallThreshold;
        $this->ttlByKind = $ttlByKind ?? self::TTL_BY_KIND;
    }

    // -- Keys and index --------------------------------------------------

    public function memoryKey(string $memoryId): string
    {
        return $this->keyPrefix . $memoryId;
    }

    /**
     * Create the Redis Search index if it doesn't already exist.
     *
     * The index is declared on the JSON document type, with a
     * `$.embedding` path holding the vector and TAG fields for
     * `user`, `namespace`, `kind`, and `source_thread`. One
     * `FT.SEARCH` can therefore pre-filter by any combination of
     * those tags and KNN-rank the matching memories in one pass.
     */
    public function createIndex(): void
    {
        $schema = [
            new TextField('$.text', 'text'),
            new TagField('$.user', 'user'),
            new TagField('$.namespace', 'namespace'),
            new TagField('$.kind', 'kind'),
            new TagField('$.source_thread', 'source_thread'),
            new NumericField('$.created_ts', 'created_ts', NumericField::SORTABLE),
            new NumericField('$.hit_count', 'hit_count', NumericField::SORTABLE),
            new VectorField(
                '$.embedding',
                'HNSW',
                [
                    'TYPE', 'FLOAT32',
                    'DIM', $this->vectorDim,
                    'DISTANCE_METRIC', 'COSINE',
                ],
                'embedding',
            ),
        ];
        try {
            $this->client->ftcreate(
                $this->indexName,
                $schema,
                (new CreateArguments())
                    ->on('JSON')
                    ->prefix([$this->keyPrefix]),
            );
        } catch (ServerException $exc) {
            if (!str_contains($exc->getMessage(), 'Index already exists')) {
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
            $msg = strtolower($exc->getMessage());
            if (!str_contains($msg, 'no such index')
                && !str_contains($msg, 'unknown index name')) {
                throw $exc;
            }
        }
    }

    // -- Write -----------------------------------------------------------

    /**
     * Write a new memory, deduplicating against existing entries.
     *
     * Runs one in-scope KNN(1) against the index first. If the
     * nearest existing memory is within `dedupThreshold`, the new
     * memory is skipped (its content is already represented) and the
     * existing memory's `hit_count` is bumped. Otherwise a fresh JSON
     * document is written under a new id with a TTL derived from the
     * memory's `kind`.
     *
     * The KNN-then-write sequence is not atomic; two workers that
     * remember the same fact at the same time can both miss each
     * other's in-flight write and insert duplicate memories. See the
     * walkthrough's "Concurrency caveats" section for the production
     * fix (periodic background consolidator that merges
     * near-duplicates).
     *
     * @param  list<float>       $embedding
     * @return array<string,mixed>
     */
    public function remember(
        string $text,
        array $embedding,
        string $user = 'default',
        string $namespace = 'default',
        string $kind = 'episodic',
        string $sourceThread = '',
        int|false $ttlSeconds = false,
    ): array {
        if (count($embedding) !== $this->vectorDim) {
            throw new \InvalidArgumentException(sprintf(
                'embedding length is %d; index expects %d',
                count($embedding), $this->vectorDim,
            ));
        }

        $nearest = $this->nearest($embedding, $user, $namespace, $kind, 1);
        $nearestDistance = $nearest[0]['distance'] ?? null;
        if (!empty($nearest)
            && $nearest[0]['distance'] !== null
            && $nearest[0]['distance'] <= $this->dedupThreshold) {
            // Duplicate. Bump the hit count on the existing memory so
            // the admin UI can show how often it's been re-derived.
            $this->bumpHitCount($nearest[0]['id']);
            return [
                'id' => $nearest[0]['id'],
                'deduped' => true,
                'existing_distance' => $nearestDistance,
            ];
        }

        $memoryId = substr(bin2hex(random_bytes(6)), 0, 12);
        $key = $this->memoryKey($memoryId);
        $now = microtime(true);
        $doc = [
            'id' => $memoryId,
            'user' => $user,
            'namespace' => $namespace,
            'kind' => $kind,
            'source_thread' => $sourceThread,
            'text' => $text,
            'embedding' => $embedding,
            'created_ts' => $now,
            'hit_count' => 0,
        ];
        $ttl = $this->resolveTtl($kind, $ttlSeconds);

        // MULTI/EXEC so the JSON document and its TTL apply together.
        // A connection drop between the JSON.SET and EXPIRE would
        // otherwise leave the memory without an expiry.
        $this->client->transaction(
            function ($tx) use ($key, $doc, $ttl) {
                $tx->jsonset($key, '$', json_encode($doc, JSON_THROW_ON_ERROR));
                if ($ttl !== null) {
                    $tx->expire($key, $ttl);
                }
            },
        );
        return [
            'id' => $memoryId,
            'deduped' => false,
            'existing_distance' => $nearestDistance,
        ];
    }

    // -- Recall ----------------------------------------------------------

    /**
     * Return the top-k in-scope memories ranked by similarity.
     *
     * Memories beyond `distanceThreshold` (or the instance default)
     * are dropped — the index always returns *something* for KNN, so
     * a recall result on an unrelated query would otherwise be a
     * confidently-wrong false positive.
     *
     * @param  list<float>        $queryEmbedding
     * @return list<array<string,mixed>>
     */
    public function recall(
        array $queryEmbedding,
        string $user = 'default',
        ?string $namespace = 'default',
        ?string $kind = null,
        int $k = 5,
        float|null $distanceThreshold = null,
    ): array {
        $threshold = $distanceThreshold ?? $this->recallThreshold;
        $candidates = $this->nearest($queryEmbedding, $user, $namespace, $kind, $k);
        return array_values(array_filter(
            $candidates,
            fn(array $c) => $c['distance'] !== null && $c['distance'] <= $threshold,
        ));
    }

    // -- Internals -------------------------------------------------------

    /**
     * @param  list<float>             $embedding
     * @return list<array<string,mixed>>
     */
    private function nearest(
        array $embedding,
        ?string $user,
        ?string $namespace,
        ?string $kind,
        int $k,
    ): array {
        if (count($embedding) !== $this->vectorDim) {
            throw new \InvalidArgumentException(sprintf(
                'embedding length is %d; index expects %d',
                count($embedding), $this->vectorDim,
            ));
        }
        $filterClause = self::buildFilterClause($user, $namespace, $kind);
        $knnQuery = sprintf(
            '%s=>[KNN %d @embedding $vec AS distance]',
            $filterClause, $k,
        );
        $args = (new SearchArguments())
            ->params(['vec', Embedder::toBytes($embedding)])
            ->dialect('2')
            ->sortBy('distance', 'asc')
            ->limit(0, $k)
            ->addReturn(
                8,
                'user', 'namespace', 'kind', 'source_thread',
                'text', 'created_ts', 'hit_count', 'distance',
            );
        $result = $this->client->ftsearch($this->indexName, $knnQuery, $args);
        return $this->parseSearchResult($result);
    }

    private function bumpHitCount(string $memoryId): void
    {
        try {
            $this->client->jsonnumincrby(
                $this->memoryKey($memoryId), '$.hit_count', 1,
            );
        } catch (ServerException) {
            // The doc may have expired between recall and bump — fine,
            // we just lose the hit count update.
        }
    }

    private function resolveTtl(string $kind, int|false $override): ?int
    {
        if ($override === false) {
            return $this->ttlByKind[$kind] ?? null;
        }
        return $override;
    }

    private function stripPrefix(string $rawKey): string
    {
        if (str_starts_with($rawKey, $this->keyPrefix)) {
            return substr($rawKey, strlen($this->keyPrefix));
        }
        return $rawKey;
    }

    // Characters Redis Search treats as syntax inside a TAG value; any
    // of them in a user-supplied filter must be backslash-escaped or
    // the surrounding `{...}` block won't parse correctly.
    private const TAG_SPECIAL = '\\,.<>{}[]"\':;!@#$%^&*()-+=~| ';

    private static function escapeTagValue(string $value): string
    {
        $out = '';
        $specials = str_split(self::TAG_SPECIAL);
        foreach (mb_str_split($value) as $ch) {
            $out .= in_array($ch, $specials, true) ? '\\' . $ch : $ch;
        }
        return $out;
    }

    private static function buildFilterClause(
        ?string $user,
        ?string $namespace,
        ?string $kind,
    ): string {
        // Truthy-check would drop `"0"` as falsy and silently broaden
        // the scope — only `null` and `""` mean "no filter".
        $clauses = [];
        if ($user !== null && $user !== '') {
            $clauses[] = '@user:{' . self::escapeTagValue($user) . '}';
        }
        if ($namespace !== null && $namespace !== '') {
            $clauses[] = '@namespace:{' . self::escapeTagValue($namespace) . '}';
        }
        if ($kind !== null && $kind !== '') {
            $clauses[] = '@kind:{' . self::escapeTagValue($kind) . '}';
        }
        return empty($clauses) ? '(*)' : '(' . implode(' ', $clauses) . ')';
    }

    /**
     * Parse Predis's flat FT.SEARCH result into structured records.
     *
     * The wire format under DIALECT 2 is: `[total, key1, [k1, v1,
     * k2, v2, ...], key2, [...], ...]`. We translate the
     * alternating field-pair arrays into associative arrays, strip
     * the key prefix off the document id, and look up each
     * document's TTL so the admin panel can show it.
     *
     * @param  mixed                    $result
     * @return list<array<string,mixed>>
     */
    private function parseSearchResult(mixed $result): array
    {
        if (!is_array($result) || count($result) < 2) {
            return [];
        }
        $count = (int) $result[0];
        $out = [];
        for ($i = 0; $i < $count; $i++) {
            $idIdx = 1 + ($i * 2);
            $fieldsIdx = $idIdx + 1;
            if (!isset($result[$idIdx], $result[$fieldsIdx])) {
                break;
            }
            $rawKey = (string) $result[$idIdx];
            $memoryId = $this->stripPrefix($rawKey);
            $flat = $result[$fieldsIdx];
            $fields = is_array($flat) ? self::flatToAssoc($flat) : [];
            $ttl = (int) $this->client->ttl($this->memoryKey($memoryId));
            $out[] = [
                'id' => $memoryId,
                'user' => $fields['user'] ?? '',
                'namespace' => $fields['namespace'] ?? '',
                'kind' => $fields['kind'] ?? '',
                'source_thread' => $fields['source_thread'] ?? '',
                'text' => $fields['text'] ?? '',
                'created_ts' => (float) ($fields['created_ts'] ?? 0),
                'hit_count' => (int) ($fields['hit_count'] ?? 0),
                'distance' => isset($fields['distance'])
                    ? (float) $fields['distance']
                    : null,
                'ttl_seconds' => $ttl > 0 ? $ttl : null,
            ];
        }
        return $out;
    }

    /** @param list<mixed> $flat */
    private static function flatToAssoc(array $flat): array
    {
        $out = [];
        for ($i = 0, $n = count($flat) - 1; $i < $n; $i += 2) {
            $out[(string) $flat[$i]] = $flat[$i + 1];
        }
        return $out;
    }

    // -- Admin / inspection ---------------------------------------------

    /**
     * @return array{num_docs:int,indexing_failures:int}
     */
    public function indexInfo(): array
    {
        try {
            $info = $this->client->ftinfo($this->indexName);
        } catch (ServerException) {
            return ['num_docs' => 0, 'indexing_failures' => 0];
        }
        // Predis returns FT.INFO as a flat alternating key/value array.
        $assoc = self::flatToAssoc($info);
        return [
            'num_docs' => (int) ($assoc['num_docs'] ?? 0),
            'indexing_failures' => (int) (
                $assoc['hash_indexing_failures'] ?? 0
            ),
        ];
    }

    /**
     * Return memories matching the filters, newest first.
     *
     * @return list<array<string,mixed>>
     */
    public function listMemories(
        ?string $user = null,
        ?string $namespace = null,
        ?string $kind = null,
        int $limit = 100,
    ): array {
        $filterClause = self::buildFilterClause($user, $namespace, $kind);
        $args = (new SearchArguments())
            ->dialect('2')
            ->sortBy('created_ts', 'desc')
            ->limit(0, $limit)
            ->addReturn(
                7,
                'user', 'namespace', 'kind', 'source_thread',
                'text', 'created_ts', 'hit_count',
            );
        try {
            $result = $this->client->ftsearch(
                $this->indexName, $filterClause, $args,
            );
        } catch (ServerException) {
            return [];
        }
        $out = $this->parseSearchResult($result);
        // No `distance` is requested by listMemories, so drop the
        // null distance field rather than confuse the UI.
        foreach ($out as &$row) {
            unset($row['distance']);
        }
        return $out;
    }

    public function deleteMemory(string $memoryId): bool
    {
        return ((int) $this->client->del($this->memoryKey($memoryId))) > 0;
    }

    /**
     * Drop the index and every memory document. Returns the count of
     * documents that were removed. In production the equivalent is
     * `FLUSHDB` on a dedicated memory database, or letting TTLs and
     * eviction expire entries naturally.
     */
    public function clear(): int
    {
        $before = $this->indexInfo()['num_docs'];
        $this->dropIndex(deleteDocuments: true);
        $this->createIndex();
        return $before;
    }
}
