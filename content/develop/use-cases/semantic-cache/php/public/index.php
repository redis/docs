<?php

declare(strict_types=1);

/*
 * Redis semantic-cache demo server (PHP).
 *
 * Run this file behind PHP's built-in dev server and visit
 * http://localhost:8093 to drive a small semantic-cache demo backed
 * by Redis Search. The UI lets you:
 *
 *   * Type a natural-language prompt and watch the cache decide hit
 *     or miss. On a hit Redis returns the cached response in tens of
 *     milliseconds and the demo LLM is not called at all; on a miss
 *     the demo LLM "thinks" for ~1.5 s before answering and the new
 *     prompt, response, and embedding are written back to Redis for
 *     next time.
 *   * Adjust the cosine-distance threshold to see how close a
 *     paraphrase must be for the cache to serve it.
 *   * Switch tenant, locale, or model version to see metadata
 *     isolation in action — entries written under one tenant cannot
 *     be served to another, because the TAG filter goes into the same
 *     `FT.SEARCH` call as the KNN.
 *   * Inspect every cached entry with TTL and hit count, and drop
 *     individual entries to simulate eviction.
 *
 * This file is the front controller for every request the built-in
 * server receives: `php -S 127.0.0.1:8093 -t public public/index.php`
 * routes static and dynamic paths through this script.
 *
 * The state (embedder, Redis client, cache, mock LLM) is rebuilt on
 * every request because PHP's built-in server is single-process and
 * does not share user-land objects across requests. That makes the
 * first request slow (the embedder reloads its tokenizer and ONNX
 * session) but keeps the demo's request lifecycle the same as a
 * traditional PHP-FPM deployment — no surprise globals.
 */

use Predis\Client;
use Redis\SemanticCache\CacheHit;
use Redis\SemanticCache\LocalEmbedder;
use Redis\SemanticCache\MockLLM;
use Redis\SemanticCache\RedisSemanticCache;
use Redis\SemanticCache\SeedCache;

require __DIR__ . '/../vendor/autoload.php';

// codewithkyrian/transformers-php 0.5.x emits a flurry of
// deprecation notices on PHP 8.4 because of its use of implicit
// nullable parameters. Silence them so the HTTP responses stay clean
// JSON; the underlying inference path is unaffected.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
ini_set('display_errors', '0');

// ----- Configuration via environment variables ----------------------
//
// PHP CLI flag parsing is awkward; the demo reads everything from
// environment variables instead. The `run.sh` helper sets defaults
// and invokes `php -S`. Docs readers can override any value before
// running.

/**
 * @return array{
 *     redis_host: string,
 *     redis_port: int,
 *     index_name: string,
 *     key_prefix: string,
 *     ttl_seconds: int,
 *     threshold: float,
 *     llm_latency_ms: float,
 *     reseed: bool,
 *     stack_label: string
 * }
 */
function load_config(): array
{
    // Route the env var through the same clamp_threshold helper the
    // HTTP boundary uses. A bare `(float)` cast in PHP turns "nan",
    // "inf", and any other non-numeric junk into 0.0 silently — the
    // `is_finite()` check would then pass on 0.0 and the cache's
    // default threshold would land at 0.0, turning every paraphrase
    // lookup into a miss.
    $thresholdRaw = getenv('SEMCACHE_THRESHOLD');
    $threshold = clamp_threshold($thresholdRaw !== false ? $thresholdRaw : '0.5');

    $reseedRaw = strtolower((string) (getenv('SEMCACHE_RESEED') ?: 'true'));
    $reseed = !in_array($reseedRaw, ['0', 'false', 'no', 'off'], true);

    return [
        'redis_host' => getenv('SEMCACHE_REDIS_HOST') ?: 'localhost',
        'redis_port' => (int) (getenv('SEMCACHE_REDIS_PORT') ?: '6379'),
        'index_name' => getenv('SEMCACHE_INDEX_NAME') ?: 'semcache:idx',
        'key_prefix' => getenv('SEMCACHE_KEY_PREFIX') ?: 'cache:',
        'ttl_seconds' => (int) (getenv('SEMCACHE_TTL_SECONDS') ?: '3600'),
        'threshold' => $threshold,
        'llm_latency_ms' => (float) (getenv('SEMCACHE_LLM_LATENCY_MS') ?: '1500'),
        'reseed' => $reseed,
        'stack_label' => 'Predis + codewithkyrian/transformers-php + PHP built-in HTTP server',
    ];
}

// ----- HTTP helpers --------------------------------------------------

function send_json(mixed $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
}

function send_html(string $html, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
}

/**
 * Clamp the threshold to the meaningful cosine-distance range.
 *
 * PHP differs from JavaScript and Python here: `(float) "nan"` is
 * `0.0` and `(float) "inf"` is `0.0` (PHP's cast bails out on the
 * first non-numeric character). So unlike the Node.js port, we
 * cannot rely on `is_finite()` alone — we'd happily accept "nan" as
 * 0.0, which would silently turn every lookup into a miss. Detect
 * the textual forms explicitly first, then parse, then range-check
 * with `is_finite()` as a belt-and-braces guard. Out-of-band threshold
 * values fall back to the documented 0.5 default, matching the
 * behaviour the other-language ports advertise.
 */
function clamp_threshold(?string $raw): float
{
    if ($raw === null || $raw === '') {
        return 0.5;
    }
    $trimmed = strtolower(trim($raw));
    if (in_array($trimmed, ['nan', 'inf', '-inf', '+inf', 'infinity', '-infinity'], true)) {
        return 0.5;
    }
    if (!is_numeric($trimmed)) {
        return 0.5;
    }
    $parsed = (float) $trimmed;
    if (!is_finite($parsed)) {
        return 0.5;
    }
    return max(0.0, min(2.0, $parsed));
}

/**
 * Read POST body fields. PHP's `$_POST` is already populated for
 * application/x-www-form-urlencoded bodies by the built-in server.
 * We also enforce an explicit body cap; php.ini's `post_max_size`
 * defaults to 8M and PHP silently truncates a request larger than
 * that, so we set it explicitly in `run.sh` to a more conservative
 * 1 MiB and then double-check here so the failure mode is a clean
 * 413 JSON response.
 */
function read_post(): array
{
    return $_POST;
}

function estimate_response_tokens(string $prompt, string $response): int
{
    return max(1, (int) floor((strlen($prompt) + strlen($response)) / 4));
}

// ----- Demo orchestration ------------------------------------------

function run_query(
    RedisSemanticCache $cache,
    LocalEmbedder $embedder,
    MockLLM $llm,
    string $prompt,
    string $tenant,
    string $locale,
    string $modelVersion,
    float $threshold,
    bool $lookupOnly,
): array {
    $t0 = hrtime(true);
    $queryVec = $embedder->encodeOne($prompt);
    $embedMs = (hrtime(true) - $t0) / 1e6;

    $t1 = hrtime(true);
    $result = $cache->lookup(
        queryVec: $queryVec,
        tenant: $tenant,
        locale: $locale,
        modelVersion: $modelVersion,
        distanceThreshold: $threshold,
    );
    $lookupMs = (hrtime(true) - $t1) / 1e6;

    if ($result instanceof CacheHit) {
        return [
            'outcome' => 'hit',
            'response' => $result->response,
            'entry_id' => $result->id,
            'distance' => $result->distance,
            'ttl_seconds' => $result->ttlSeconds,
            'hit_count' => $result->hitCount,
            'threshold' => $threshold,
            'embed_ms' => $embedMs,
            'lookup_ms' => $lookupMs,
            'llm_ms' => null,
            'total_ms' => $embedMs + $lookupMs,
            'tokens_avoided' => estimate_response_tokens($result->prompt, $result->response),
            'ms_avoided' => $llm->latencyMs,
        ];
    }

    if ($lookupOnly) {
        return [
            'outcome' => 'miss',
            'response' => '(LLM not called in lookup-only mode)',
            'nearest_distance' => $result->nearestDistance,
            'threshold' => $threshold,
            'wrote_entry_id' => null,
            'embed_ms' => $embedMs,
            'lookup_ms' => $lookupMs,
            'llm_ms' => null,
            'total_ms' => $embedMs + $lookupMs,
        ];
    }

    $t2 = hrtime(true);
    $llmResponse = $llm->complete($prompt);
    $llmMs = (hrtime(true) - $t2) / 1e6;

    // Write the new entry back. The embedding is the same vector we
    // already used for the lookup — no need to re-encode.
    $entryId = $cache->put(
        prompt: $prompt,
        response: $llmResponse['response'],
        embedding: $queryVec,
        tenant: $tenant,
        locale: $locale,
        modelVersion: $modelVersion,
    );

    return [
        'outcome' => 'miss',
        'response' => $llmResponse['response'],
        'nearest_distance' => $result->nearestDistance,
        'threshold' => $threshold,
        'wrote_entry_id' => $entryId,
        'embed_ms' => $embedMs,
        'lookup_ms' => $lookupMs,
        'llm_ms' => $llmMs,
        'total_ms' => $embedMs + $lookupMs + $llmMs,
    ];
}

function build_state(
    RedisSemanticCache $cache,
    LocalEmbedder $embedder,
    MockLLM $llm,
    string $stackLabel,
): array {
    $info = $cache->indexInfo();
    return [
        'index' => array_merge($info, [
            'index_name' => $cache->indexName,
            'model' => $embedder->modelName,
            'mock_llm_latency_ms' => $llm->latencyMs,
            'default_threshold' => $cache->distanceThreshold,
            'stack_label' => $stackLabel,
        ]),
        'entries' => $cache->listEntries(200),
    ];
}

function load_html_page(string $indexName, string $keyPrefix): string
{
    $path = __DIR__ . '/../index.html';
    $raw = file_get_contents($path);
    if ($raw === false) {
        throw new RuntimeException("could not read $path");
    }
    return strtr($raw, [
        '__INDEX_NAME__' => $indexName,
        '__KEY_PREFIX__' => $keyPrefix,
    ]);
}

// ----- Built-in server pre-flight -----------------------------------
//
// The built-in server invokes this script for both static and dynamic
// paths. We don't host any static assets other than the HTML page,
// but we return false for any request the built-in server should
// handle on its own (e.g. a 404 it formats itself) — by leaving the
// dispatch through PHP for known paths only.

// JSON exception wrapper. Without this, an uncaught exception escapes
// to the default error handler and the client's `await res.json()`
// explodes with an opaque parse error instead of surfacing what
// actually went wrong.
set_exception_handler(function (Throwable $exc): void {
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json');
    }
    error_log('[demo] handler error: ' . $exc::class . ': ' . $exc->getMessage());
    echo json_encode([
        'error' => $exc->getMessage(),
        'type' => $exc::class,
    ]);
});

// ----- Router ------------------------------------------------------

$config = load_config();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// Cap POST body size *defensively*. The built-in server has already
// applied php.ini's `post_max_size` by the time we get here, so a
// 50 MiB body would have been rejected at the SAPI layer with an
// empty `$_POST`. We still check `Content-Length` so the failure mode
// is a clean 413 JSON response rather than a confusing "request
// missing required field" downstream.
$maxBodyBytes = 1 * 1024 * 1024;
if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > $maxBodyBytes) {
        send_json([
            'error' => "request body exceeds {$maxBodyBytes} bytes",
            'type' => 'PayloadTooLarge',
        ], 413);
        return;
    }
}

// Connect to Redis up front — the lookup and the state endpoints both
// need it, and a connection error should surface as a clean 500
// instead of a partial response.
$client = new Client([
    'host' => $config['redis_host'],
    'port' => $config['redis_port'],
]);

$cache = new RedisSemanticCache(
    client: $client,
    indexName: $config['index_name'],
    keyPrefix: $config['key_prefix'],
    distanceThreshold: $config['threshold'],
    defaultTtlSeconds: $config['ttl_seconds'],
);
$cache->createIndex();

$embedder = LocalEmbedder::create();
$llm = new MockLLM(latencyMs: $config['llm_latency_ms']);

// Per-process reseed. PHP's built-in server spawns a fresh PHP
// process per request, so the `num_docs` check is what actually
// guards against re-seeding on every request: once the seed has
// run and the index has docs in it, this branch is a no-op. The
// previous version of this block gated the reseed on `path === '/'`,
// which left the cache empty if the first request was to `/state`,
// `/query`, or anything else.
if ($config['reseed'] && $cache->indexInfo()['num_docs'] === 0) {
    $cache->clear();
    SeedCache::seed($cache, $embedder);
}

if ($method === 'GET') {
    if ($path === '/' || $path === '/index.html') {
        send_html(load_html_page($config['index_name'], $config['key_prefix']));
        return;
    }
    if ($path === '/state') {
        send_json(build_state($cache, $embedder, $llm, $config['stack_label']));
        return;
    }
    send_json(['error' => 'not found'], 404);
    return;
}

if ($method === 'POST') {
    $params = read_post();

    if ($path === '/query') {
        $prompt = trim((string) ($params['prompt'] ?? ''));
        if ($prompt === '') {
            send_json(['error' => 'prompt is required'], 400);
            return;
        }
        $payload = run_query(
            cache: $cache,
            embedder: $embedder,
            llm: $llm,
            prompt: $prompt,
            tenant: (string) ($params['tenant'] ?? 'acme'),
            locale: (string) ($params['locale'] ?? 'en'),
            modelVersion: (string) ($params['model_version'] ?? $llm->modelVersion),
            threshold: clamp_threshold($params['threshold'] ?? '0.5'),
            lookupOnly: !empty($params['lookup_only']),
        );
        send_json($payload);
        return;
    }

    if ($path === '/reset') {
        $cache->clear();
        SeedCache::seed($cache, $embedder);
        send_json(['ok' => true]);
        return;
    }

    if ($path === '/drop') {
        $entryId = trim((string) ($params['entry_id'] ?? ''));
        if ($entryId === '') {
            send_json(['error' => 'entry_id is required'], 400);
            return;
        }
        $deleted = $cache->deleteEntry($entryId);
        send_json(['deleted' => $deleted, 'entry_id' => $entryId]);
        return;
    }

    send_json(['error' => 'not found'], 404);
    return;
}

send_json(['error' => 'method not allowed'], 405);
