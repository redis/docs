<?php
/**
 * Redis recommendation-engine helper backed by Redis Search.
 *
 * Items live as Hash documents at ``product:<id>``. Each hash stores the
 * item's structured metadata (name, description, category, brand, price,
 * in-stock flag, rating) alongside the raw float32 bytes of its
 * 384-dimensional embedding. A single Redis Search index covers every
 * field, so one ``FT.SEARCH`` call does the KNN over the embedding and
 * the TAG / NUMERIC / TEXT pre-filter in the same pass — no cross-store
 * joins, no extra round trips.
 *
 * Per-user state lives in ``user:<id>:features``: a session vector
 * written as an exponentially weighted average of recently-clicked item
 * embeddings, plus per-category affinity counters incremented atomically
 * with ``HINCRBYFLOAT``. The next time the application reads that hash
 * to build a query, it sees the click — no batch cycle, no cache
 * invalidation.
 *
 * The recommendation flow has two paths:
 *
 *  * **Query path** (per recommendation request)
 *    1. *Candidate retrieval* — ``FT.SEARCH`` with ``KNN`` over the
 *       embedding, optionally pre-filtered by structured attributes,
 *       optionally biased toward a session vector blended into the
 *       query.
 *    2. *Re-ranking* — the client takes the top-N candidates and adds
 *       a log-scaled per-category affinity bonus pulled from the user
 *       features hash.
 *  * **Click path** (per user interaction) — the click writes a new
 *    EWMA-blended session vector and increments the category affinity
 *    in the user features hash. The next query path picks both up.
 *
 * Predis exposes Redis Search through dedicated client methods
 * (``ftcreate``, ``ftsearch``, ``ftinfo`` …) and built-in schema-field
 * classes, so this helper builds the index and queries through the
 * typed Predis API rather than ``executeRaw``. Vector bytes go in/out
 * unchanged because PHP strings are 8-bit binary safe — no separate
 * "buffer" wrapper is needed.
 */

declare(strict_types=1);

namespace Redis\RecommendationEngine;

use Predis\Client as PredisClient;
use Predis\Command\Argument\Search\DropArguments;
use Predis\Command\Argument\Search\SearchArguments;
use Predis\Response\ServerException;

class Recommender
{
    public const VECTOR_DIM_DEFAULT = 384;

    public PredisClient $redis;
    public string $indexName;
    public string $keyPrefix;
    public string $userKeyPrefix;
    public int $vectorDim;

    // Characters Redis Search treats as syntax inside a TAG value; any
    // of them appearing in a user-supplied filter must be backslash-
    // escaped or the surrounding ``{...}`` block won't parse correctly.
    // The list comes from the Redis Search query-syntax documentation.
    // The backslash itself is included so a value containing a literal
    // ``\`` can't "eat" the next character's escape.
    private const TAG_SPECIAL = "\\,.<>{}[]\"':;!@#\$%^&*()-+=~| ";

    public function __construct(
        PredisClient $redis,
        string $indexName = 'recommend:idx',
        string $keyPrefix = 'product:',
        string $userKeyPrefix = 'user:',
        int $vectorDim = self::VECTOR_DIM_DEFAULT
    ) {
        $this->redis = $redis;
        $this->indexName = $indexName;
        $this->keyPrefix = $keyPrefix;
        $this->userKeyPrefix = $userKeyPrefix;
        $this->vectorDim = $vectorDim;
    }

    // ------------------------------------------------------------------
    // Keys
    // ------------------------------------------------------------------

    public function productKey(string $productId): string
    {
        return $this->keyPrefix . $productId;
    }

    public function userKey(string $userId): string
    {
        return $this->userKeyPrefix . $userId . ':features';
    }

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    /**
     * Create the Redis Search index if it doesn't already exist.
     *
     * One index covers every queryable field. The vector field is HNSW
     * with cosine distance so KNN is approximate but fast, and
     * TAG / NUMERIC / TEXT fields share the same index so a single
     * ``FT.SEARCH`` can pre-filter and then KNN-rank in one pass.
     */
    public function createIndex(): void
    {
        // Build FT.CREATE as a raw command string so we can pass the
        // ``description`` field a fractional WEIGHT of 0.5 — the same
        // value the Python and Node.js ports use. Predis's typed
        // ``TextField`` declares its WEIGHT argument as ``int``, so the
        // typed builder would silently lose any non-integer weight.
        $args = [
            'FT.CREATE', $this->indexName,
            'ON', 'HASH',
            'PREFIX', '1', $this->keyPrefix,
            'SCHEMA',
            'name', 'TEXT', 'WEIGHT', '1.0',
            'description', 'TEXT', 'WEIGHT', '0.5',
            'category', 'TAG',
            'brand', 'TAG',
            'in_stock', 'TAG',
            'price', 'NUMERIC', 'SORTABLE',
            'rating', 'NUMERIC', 'SORTABLE',
            'embedding', 'VECTOR', 'HNSW', '6',
            'TYPE', 'FLOAT32',
            'DIM', (string) $this->vectorDim,
            'DISTANCE_METRIC', 'COSINE',
        ];
        try {
            $this->redis->executeRaw($args);
        } catch (ServerException $exc) {
            // FT.CREATE on an existing index raises ``Index already
            // exists``. Tolerate it so create_index() is idempotent.
            if (stripos($exc->getMessage(), 'index already exists') === false) {
                throw $exc;
            }
        }
    }

    /**
     * Drop the search index. Optionally also delete the documents.
     */
    public function dropIndex(bool $deleteDocuments = false): void
    {
        try {
            $args = new DropArguments();
            if ($deleteDocuments) {
                $args->dd();
            }
            $this->redis->ftdropindex($this->indexName, $args);
        } catch (ServerException $exc) {
            $msg = strtolower($exc->getMessage());
            // Different Redis Search versions phrase the missing-index
            // error differently; tolerate either.
            if (
                str_contains($msg, 'no such index') === false &&
                str_contains($msg, 'unknown index name') === false
            ) {
                throw $exc;
            }
        }
    }

    // ------------------------------------------------------------------
    // Catalogue ingest
    // ------------------------------------------------------------------

    /**
     * Pipeline a batch of ``HSET`` writes for the catalogue.
     *
     * Each product must include the schema fields plus either
     * ``embedding`` (a ``float[]`` of length ``vectorDim``) or
     * ``embedding_b64`` (the base64-encoded bytes of the same vector —
     * that's what ``build_catalog.php`` writes into ``catalog.json``).
     *
     * @param array<int, array<string, mixed>> $products
     */
    public function indexProducts(array $products): int
    {
        // ``pipeline()`` on Predis sends all the commands in one
        // round trip. We use the non-atomic flavour because HSETs are
        // independent and we don't need MULTI/EXEC semantics here.
        $pipe = $this->redis->pipeline(['atomic' => false]);
        foreach ($products as $product) {
            $pipe->hmset(
                $this->productKey((string) $product['id']),
                $this->encodeProduct($product)
            );
        }
        $pipe->execute();
        return count($products);
    }

    /**
     * @param array<string, mixed> $product
     * @return array<string, string>
     */
    private function encodeProduct(array $product): array
    {
        $vecBytes = $this->extractVectorBytes($product);
        return [
            'name' => (string) $product['name'],
            'description' => (string) $product['description'],
            'category' => (string) $product['category'],
            'brand' => (string) $product['brand'],
            'price' => (string) (float) $product['price'],
            'rating' => (string) (float) $product['rating'],
            'in_stock' => !empty($product['in_stock']) ? 'true' : 'false',
            'embedding' => $vecBytes,
        ];
    }

    /**
     * @param array<string, mixed> $product
     */
    private function extractVectorBytes(array $product): string
    {
        if (isset($product['embedding_b64'])) {
            $decoded = base64_decode((string) $product['embedding_b64'], true);
            if ($decoded === false) {
                throw new \RuntimeException(
                    "product {$product['id']}: embedding_b64 is not valid base64"
                );
            }
            return $decoded;
        }
        if (isset($product['embedding']) && is_array($product['embedding'])) {
            return Embedder::toBytes($product['embedding']);
        }
        if (isset($product['embedding']) && is_string($product['embedding'])) {
            return $product['embedding'];
        }
        throw new \RuntimeException(
            "product {$product['id']}: no usable embedding (expected embedding[] or embedding_b64)"
        );
    }

    public function countIndexed(): int
    {
        try {
            $args = (new SearchArguments())->limit(0, 0);
            $result = $this->redis->ftsearch($this->indexName, '*', $args);
            // FT.SEARCH returns ``[total, key1, fields1, key2, fields2, ...]``.
            return (int) ($result[0] ?? 0);
        } catch (ServerException $exc) {
            return 0;
        }
    }

    // ------------------------------------------------------------------
    // Candidate retrieval (KNN + optional pre-filter)
    // ------------------------------------------------------------------

    /**
     * Retrieve top-``k`` candidates with ``FT.SEARCH`` KNN + filters.
     *
     * @param array<int, float>      $queryVec
     * @param array<string, mixed>   $opts     category, brand, minPrice,
     *                                         maxPrice, inStockOnly,
     *                                         minRating, textMatch,
     *                                         textField, k, sessionVec,
     *                                         sessionWeight.
     * @return array<int, array<string, mixed>>
     */
    public function candidateRetrieve(array $queryVec, array $opts = []): array
    {
        $k = (int) ($opts['k'] ?? 10);
        $sessionVec = $opts['sessionVec'] ?? null;
        $sessionWeight = (float) ($opts['sessionWeight'] ?? 0.3);
        $textField = (string) ($opts['textField'] ?? 'description');

        // Blend query + session signal so a session's clicks pull the
        // next retrieval toward the things the user has been engaging
        // with. Both inputs are unit-normalised so cosine scores stay
        // comparable.
        $effectiveVec = self::blendVectors($queryVec, $sessionVec, $sessionWeight);

        $filterClause = self::buildFilterClause([
            'category' => $opts['category'] ?? null,
            'brand' => $opts['brand'] ?? null,
            'minPrice' => $opts['minPrice'] ?? null,
            'maxPrice' => $opts['maxPrice'] ?? null,
            'inStockOnly' => $opts['inStockOnly'] ?? false,
            'minRating' => $opts['minRating'] ?? null,
            'textMatch' => $opts['textMatch'] ?? null,
            'textField' => $textField,
        ]);

        $knnQuery = "{$filterClause}=>[KNN {$k} @embedding \$vec AS vector_score]";

        $args = (new SearchArguments())
            ->sortBy('vector_score')
            ->addReturn(
                8,
                'name',
                'description',
                'category',
                'brand',
                'price',
                'rating',
                'in_stock',
                'vector_score'
            )
            ->limit(0, $k)
            ->params(['vec', Embedder::toBytes($effectiveVec)])
            ->dialect('2');

        $result = $this->redis->ftsearch($this->indexName, $knnQuery, $args);
        return $this->decodeSearchRows($result);
    }

    /**
     * Decode ``FT.SEARCH`` reply array into ``Candidate``-shaped rows.
     *
     * The reply is ``[total, key, [field, value, ...], key, [...], ...]``.
     *
     * @param array<int, mixed> $result
     * @return array<int, array<string, mixed>>
     */
    private function decodeSearchRows(array $result): array
    {
        $rows = [];
        $count = count($result);
        for ($i = 1; $i + 1 < $count; $i += 2) {
            $rawKey = (string) $result[$i];
            $pairs = $result[$i + 1];
            if (!is_array($pairs)) {
                continue;
            }
            $fields = [];
            for ($j = 0, $jn = count($pairs); $j + 1 < $jn; $j += 2) {
                $fields[(string) $pairs[$j]] = (string) $pairs[$j + 1];
            }
            // ``doc.id`` is the Redis key (``product:<id>``); strip the
            // prefix to expose the bare product id the rest of the demo
            // uses.
            $bareId = str_starts_with($rawKey, $this->keyPrefix)
                ? substr($rawKey, strlen($this->keyPrefix))
                : $rawKey;

            // FT.SEARCH returns ``vector_score`` as the cosine *distance*
            // (0 = identical, 2 = opposite). Carry that through directly
            // so the score the UI sees is the number Redis computed;
            // lower means closer.
            $distance = (float) ($fields['vector_score'] ?? 0);

            $rows[] = [
                'id' => $bareId,
                'name' => $fields['name'] ?? '',
                'description' => $fields['description'] ?? '',
                'category' => $fields['category'] ?? '',
                'brand' => $fields['brand'] ?? '',
                'price' => (float) ($fields['price'] ?? 0),
                'rating' => (float) ($fields['rating'] ?? 0),
                'in_stock' => ($fields['in_stock'] ?? 'false') === 'true',
                'vector_distance' => $distance,
                'score' => $distance,
            ];
        }
        return $rows;
    }

    /**
     * Backslash-escape characters that have meaning inside ``@tag:{...}``.
     *
     * With this in place a TAG filter built from external input can't
     * accidentally close the brace, inject an additional clause, or
     * misparse a value that simply contains a space or a hyphen.
     */
    public static function escapeTagValue(string $value): string
    {
        $out = '';
        $len = strlen($value);
        for ($i = 0; $i < $len; $i++) {
            $ch = $value[$i];
            if (strpos(self::TAG_SPECIAL, $ch) !== false) {
                $out .= '\\';
            }
            $out .= $ch;
        }
        return $out;
    }

    /**
     * Build the pre-filter clause that goes in front of the ``KNN`` clause.
     *
     * Empty filters return ``(*)``, which is a no-op pre-filter in
     * DIALECT 2.
     *
     * @param array<string, mixed> $opts
     */
    public static function buildFilterClause(array $opts): string
    {
        $clauses = [];
        if (!empty($opts['category'])) {
            $clauses[] = '@category:{' . self::escapeTagValue((string) $opts['category']) . '}';
        }
        if (!empty($opts['brand'])) {
            $clauses[] = '@brand:{' . self::escapeTagValue((string) $opts['brand']) . '}';
        }
        $minPrice = $opts['minPrice'] ?? null;
        $maxPrice = $opts['maxPrice'] ?? null;
        if ($minPrice !== null || $maxPrice !== null) {
            $lo = $minPrice === null ? '-inf' : (string) (float) $minPrice;
            $hi = $maxPrice === null ? '+inf' : (string) (float) $maxPrice;
            $clauses[] = "@price:[{$lo} {$hi}]";
        }
        if (isset($opts['minRating']) && $opts['minRating'] !== null) {
            $clauses[] = '@rating:[' . (float) $opts['minRating'] . ' +inf]';
        }
        if (!empty($opts['inStockOnly'])) {
            $clauses[] = '@in_stock:{true}';
        }
        if (!empty($opts['textMatch'])) {
            $textField = (string) ($opts['textField'] ?? 'description');
            // TEXT-field filter. Wrapping in quotes makes the value a
            // single phrase and avoids tripping the query parser on
            // operators (``-``, ``|``, ``"``, etc.) that a user might
            // legitimately type in a search box.
            $safe = str_replace(['\\', '"'], ['\\\\', '\\"'], (string) $opts['textMatch']);
            $clauses[] = '@' . $textField . ':"' . $safe . '"';
        }
        return $clauses ? '(' . implode(' ', $clauses) . ')' : '(*)';
    }

    /**
     * @param array<int, float>      $queryVec
     * @param array<int, float>|null $sessionVec
     * @return array<int, float>
     */
    public static function blendVectors(array $queryVec, ?array $sessionVec, float $sessionWeight): array
    {
        if ($sessionVec === null || $sessionWeight <= 0.0) {
            return $queryVec;
        }
        $n = count($queryVec);
        $mixed = [];
        for ($i = 0; $i < $n; $i++) {
            $mixed[$i] = (1.0 - $sessionWeight) * $queryVec[$i]
                + $sessionWeight * ($sessionVec[$i] ?? 0.0);
        }
        $sumSq = 0.0;
        foreach ($mixed as $v) {
            $sumSq += $v * $v;
        }
        $norm = sqrt($sumSq);
        if ($norm <= 0.0) {
            return $queryVec;
        }
        for ($i = 0; $i < $n; $i++) {
            $mixed[$i] /= $norm;
        }
        return $mixed;
    }

    // ------------------------------------------------------------------
    // Re-ranking with user affinities
    // ------------------------------------------------------------------

    /**
     * Apply a per-category affinity bonus and re-sort.
     *
     * ``userFeatures['affinities']`` is a ``{category: weight}`` map
     * accumulated from previous clicks. The bonus is shaped by
     * ``log(1 + affinity) * affinityWeight`` so repeated clicks see
     * diminishing returns and a single dominant category can't push the
     * bonus arbitrarily large. The bonus is subtracted from the cosine
     * distance, so a category the user has shown interest in pulls its
     * members up the list (closer to zero) without overwhelming the
     * vector signal.
     *
     * @param array<int, array<string, mixed>> $candidates
     * @param array<string, mixed>             $userFeatures
     * @return array<int, array<string, mixed>>
     */
    public function rerank(array $candidates, array $userFeatures, float $affinityWeight = 0.15): array
    {
        $affinities = $userFeatures['affinities'] ?? [];
        if (!$affinities || $affinityWeight <= 0.0) {
            usort($candidates, fn($a, $b) => $a['score'] <=> $b['score']);
            return $candidates;
        }
        foreach ($candidates as &$c) {
            $raw = max((float) ($affinities[$c['category']] ?? 0.0), 0.0);
            $bonus = log1p($raw) * $affinityWeight;
            $c['score'] = $c['vector_distance'] - $bonus;
        }
        unset($c);
        usort($candidates, fn($a, $b) => $a['score'] <=> $b['score']);
        return $candidates;
    }

    // ------------------------------------------------------------------
    // Session signals (clicks)
    // ------------------------------------------------------------------

    /**
     * Update a user's session vector and category affinity.
     *
     * Reads the clicked item's embedding from its hash, blends it into
     * the user's session vector with an exponentially weighted moving
     * average, and bumps the category counter and click total.
     *
     * ``ewmaAlpha`` is the weight given to the *new* click; the previous
     * session keeps ``1 - ewmaAlpha``. The default biases history (0.6)
     * over the latest click (0.4) so a single accidental click doesn't
     * swing the session.
     *
     * The category-affinity bump and click-count bump use
     * ``HINCRBYFLOAT`` / ``HINCRBY`` so they're atomic against any
     * concurrent caller. The session vector blend is inherently
     * read-modify-write — the new vector depends on the previous one —
     * and is *not* atomic against a concurrent click for the same user.
     * For the per-user data this helper writes, that window is rare in
     * practice; if it matters in a given deployment, wrap the read and
     * the writeback in ``WATCH/MULTI/EXEC`` or move the whole blend into
     * a Lua script.
     *
     * @return array{category: string, affinity: float, clicks: int, last_clicked_id: string}
     */
    public function recordClick(
        string $userId,
        string $productId,
        float $ewmaAlpha = 0.4,
        float $affinityStep = 1.0
    ): array {
        $productKey = $this->productKey($productId);
        // Pull the fields we need from the product hash in one round
        // trip. Predis returns hash field values as PHP strings; PHP
        // strings are binary-safe so the raw float32 embedding bytes
        // round-trip without corruption.
        $raw = $this->redis->hmget($productKey, ['embedding', 'category']);
        if (!isset($raw[0]) || $raw[0] === null || $raw[0] === '') {
            throw new \RuntimeException("unknown product {$productId}");
        }
        $clickedVec = Embedder::fromBytes((string) $raw[0], $this->vectorDim);
        $category = (string) ($raw[1] ?? 'unknown');
        if ($category === '') {
            $category = 'unknown';
        }

        $userKey = $this->userKey($userId);
        $previousRaw = $this->redis->hget($userKey, 'session_vec');
        if (is_string($previousRaw) && $previousRaw !== '') {
            $previousVec = Embedder::fromBytes($previousRaw, $this->vectorDim);
            $n = count($clickedVec);
            $mixed = [];
            for ($i = 0; $i < $n; $i++) {
                $mixed[$i] = $ewmaAlpha * $clickedVec[$i]
                    + (1.0 - $ewmaAlpha) * $previousVec[$i];
            }
            $sumSq = 0.0;
            foreach ($mixed as $v) {
                $sumSq += $v * $v;
            }
            $norm = max(sqrt($sumSq), 1e-12);
            for ($i = 0; $i < $n; $i++) {
                $mixed[$i] /= $norm;
            }
            $newSession = $mixed;
        } else {
            // First click: the clicked vector is already unit-normalised.
            $newSession = $clickedVec;
        }

        // Affinity and click counters are independent atomic increments;
        // only the session vector needs the read-modify-write because it
        // depends on the previous value. Pipelining sends the three
        // writes in one round trip.
        $pipe = $this->redis->pipeline(['atomic' => false]);
        $pipe->hmset($userKey, [
            'session_vec' => Embedder::toBytes($newSession),
            'last_clicked_id' => $productId,
            'last_clicked_category' => $category,
        ]);
        $pipe->hincrbyfloat($userKey, 'aff:' . $category, $affinityStep);
        $pipe->hincrby($userKey, 'clicks', 1);
        $results = $pipe->execute();

        return [
            'category' => $category,
            'affinity' => (float) ($results[1] ?? 0),
            'clicks' => (int) ($results[2] ?? 0),
            'last_clicked_id' => $productId,
        ];
    }

    /**
     * Read a user's session vector and affinities for re-ranking.
     *
     * @return array{
     *   session_vec: array<int, float>|null,
     *   affinities: array<string, float>,
     *   clicks: int,
     *   last_clicked_id: string|null,
     *   last_clicked_category: string|null
     * }
     */
    public function getUserFeatures(string $userId): array
    {
        $raw = $this->redis->hgetall($this->userKey($userId));
        if (!$raw) {
            return [
                'session_vec' => null,
                'affinities' => [],
                'clicks' => 0,
                'last_clicked_id' => null,
                'last_clicked_category' => null,
            ];
        }
        $sessionVec = null;
        if (isset($raw['session_vec']) && $raw['session_vec'] !== '') {
            $sessionVec = Embedder::fromBytes((string) $raw['session_vec'], $this->vectorDim);
        }
        $affinities = [];
        foreach ($raw as $field => $value) {
            if (str_starts_with((string) $field, 'aff:')) {
                $cat = substr((string) $field, strlen('aff:'));
                $affinities[$cat] = (float) $value;
            }
        }
        return [
            'session_vec' => $sessionVec,
            'affinities' => $affinities,
            'clicks' => (int) ($raw['clicks'] ?? 0),
            'last_clicked_id' => isset($raw['last_clicked_id']) && $raw['last_clicked_id'] !== ''
                ? (string) $raw['last_clicked_id']
                : null,
            'last_clicked_category' => isset($raw['last_clicked_category']) && $raw['last_clicked_category'] !== ''
                ? (string) $raw['last_clicked_category']
                : null,
        ];
    }

    /** Delete a user's feature hash. Next request starts cold. */
    public function resetUser(string $userId): void
    {
        $this->redis->del([$this->userKey($userId)]);
    }

    // ------------------------------------------------------------------
    // Hot embedding refresh (no serving downtime)
    // ------------------------------------------------------------------

    /**
     * Overwrite the embedding for one product.
     *
     * The HNSW index reflects the change as soon as the ``HSET`` commits,
     * so subsequent ``FT.SEARCH`` calls see the new vector without any
     * index rebuild or serving downtime. The same call path is what an
     * offline retraining pipeline would use to roll out a re-trained
     * model: stream the new vectors into Redis and the serving tier
     * picks them up on the next query.
     *
     * Throws if ``productId`` does not already exist (``HSET`` would
     * otherwise create a partially-populated key that the index then
     * picks up), and rejects vectors with the wrong dimensionality so a
     * model swap doesn't quietly corrupt the index.
     *
     * @param array<int, float> $newVector
     */
    public function refreshEmbedding(string $productId, array $newVector): void
    {
        if (count($newVector) !== $this->vectorDim) {
            throw new \RuntimeException(sprintf(
                'new_vector has length %d; index expects %d',
                count($newVector),
                $this->vectorDim
            ));
        }
        $key = $this->productKey($productId);
        if (!$this->redis->exists($key)) {
            throw new \RuntimeException("unknown product {$productId}");
        }
        $this->redis->hset($key, 'embedding', Embedder::toBytes($newVector));
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /**
     * Subset of ``FT.INFO`` useful for the demo UI.
     *
     * @return array{num_docs: int, indexing_failures: int, vector_index_size_mb: float}
     */
    public function indexInfo(): array
    {
        try {
            $info = $this->redis->ftinfo($this->indexName);
        } catch (ServerException $exc) {
            return ['num_docs' => 0, 'indexing_failures' => 0, 'vector_index_size_mb' => 0.0];
        }
        // FT.INFO returns a flat list of [key1, value1, key2, value2,
        // ...]. Flatten into an associative array; the key we care
        // about (``vector_index_sz_mb``) sits at the top level.
        $flat = [];
        $n = is_array($info) ? count($info) : 0;
        for ($i = 0; $i + 1 < $n; $i += 2) {
            $flat[(string) $info[$i]] = $info[$i + 1];
        }
        return [
            'num_docs' => (int) ($flat['num_docs'] ?? 0),
            'indexing_failures' => (int) ($flat['hash_indexing_failures'] ?? 0),
            'vector_index_size_mb' => (float) ($flat['vector_index_sz_mb'] ?? 0),
        ];
    }

    /**
     * Return every indexed product (metadata only, no vector). Used by
     * the demo to show the full catalogue and to know what IDs exist
     * for the "click" buttons.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listProducts(int $limit = 100): array
    {
        $args = (new SearchArguments())
            ->addReturn(6, 'name', 'category', 'brand', 'price', 'rating', 'in_stock')
            ->limit(0, $limit)
            ->sortBy('price');
        $result = $this->redis->ftsearch($this->indexName, '*', $args);
        $out = [];
        $count = count($result);
        for ($i = 1; $i + 1 < $count; $i += 2) {
            $rawKey = (string) $result[$i];
            $pairs = $result[$i + 1];
            if (!is_array($pairs)) {
                continue;
            }
            $fields = [];
            for ($j = 0, $jn = count($pairs); $j + 1 < $jn; $j += 2) {
                $fields[(string) $pairs[$j]] = (string) $pairs[$j + 1];
            }
            $bareId = str_starts_with($rawKey, $this->keyPrefix)
                ? substr($rawKey, strlen($this->keyPrefix))
                : $rawKey;
            $out[] = [
                'id' => $bareId,
                'name' => $fields['name'] ?? '',
                'category' => $fields['category'] ?? '',
                'brand' => $fields['brand'] ?? '',
                'price' => (float) ($fields['price'] ?? 0),
                'rating' => (float) ($fields['rating'] ?? 0),
                'in_stock' => ($fields['in_stock'] ?? 'false') === 'true',
            ];
        }
        return $out;
    }

    /** @return array<int, string> */
    public function listCategories(): array
    {
        try {
            $raw = $this->redis->fttagvals($this->indexName, 'category');
        } catch (ServerException $exc) {
            return [];
        }
        $out = is_array($raw) ? array_map('strval', $raw) : [];
        sort($out);
        return $out;
    }

    /** @return array<int, string> */
    public function listBrands(): array
    {
        try {
            $raw = $this->redis->fttagvals($this->indexName, 'brand');
        } catch (ServerException $exc) {
            return [];
        }
        $out = is_array($raw) ? array_map('strval', $raw) : [];
        sort($out);
        return $out;
    }
}
