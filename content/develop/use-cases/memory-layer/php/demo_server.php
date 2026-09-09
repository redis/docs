<?php
// Redis agent-memory demo server (PHP).
//
// Run this file and visit http://localhost:8090 to drive a small
// agent-memory demo backed by Redis Hashes, JSON, Search, and
// Streams. The UI lets you:
//
// * Type a turn as the user (or paste a goal). The server appends
//   the turn to the per-thread working-memory hash, embeds the turn,
//   recalls the top-k semantically nearest long-term memories,
//   optionally writes the turn back as a new memory with write-time
//   deduplication, and appends an event to the per-thread stream.
// * Watch the three memory tiers update in place: working memory in
//   one Hash, long-term memories as JSON documents under one index,
//   and the event log in one Stream.
// * Switch user, namespace, kind, and recall threshold to see how
//   scoping changes which memories the agent sees.
// * Inspect every long-term memory and drop individual memories to
//   simulate eviction.
//
// The server holds a single Embedder, one AgentSession, one
// LongTermMemory, and one AgentEventLog for the lifetime of the
// process. The first run downloads the ONNX-exported embedding model
// (~80 MB) into the local Hugging Face cache; everything after is
// local.
//
// PHP's standard library doesn't ship a long-running HTTP server (the
// built-in `php -S` server forks a new process per request, which
// would reload the embedder on every turn). The server below is a
// thin HTTP/1.1 loop over `stream_socket_server`, single-process and
// blocking — fine for a single-browser demo, and small enough to keep
// the Redis-shaped parts of the walkthrough in focus.

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use Predis\Client;
use Redis\AgentMemory\AgentEventLog;
use Redis\AgentMemory\AgentSession;
use Redis\AgentMemory\Embedder;
use Redis\AgentMemory\LongTermMemory;
use Redis\AgentMemory\SeedMemory;

// ---- Argument parsing ------------------------------------------------

$opts = getopt('', [
    'host::',
    'port::',
    'redis-host::',
    'redis-port::',
    'mem-index-name::',
    'mem-key-prefix::',
    'session-key-prefix::',
    'event-key-prefix::',
    'session-ttl-seconds::',
    'dedup-threshold::',
    'recall-threshold::',
    'no-reset',
    'help',
]);

if (isset($opts['help'])) {
    fwrite(STDOUT, <<<USAGE
Run the Redis agent-memory demo server.

Options:
  --host=127.0.0.1            HTTP bind host
  --port=8090                 HTTP bind port
  --redis-host=localhost      Redis host
  --redis-port=6379           Redis port
  --mem-index-name=agentmem:idx
  --mem-key-prefix=agent:mem:
  --session-key-prefix=agent:session:
  --event-key-prefix=agent:events:
  --session-ttl-seconds=3600
  --dedup-threshold=0.20
  --recall-threshold=0.55
  --no-reset                  keep existing memories on startup

USAGE);
    exit(0);
}

$host = $opts['host'] ?? '127.0.0.1';
$port = (int) ($opts['port'] ?? 8090);
$redisHost = $opts['redis-host'] ?? 'localhost';
$redisPort = (int) ($opts['redis-port'] ?? 6379);
$memIndexName = $opts['mem-index-name'] ?? 'agentmem:idx';
$memKeyPrefix = $opts['mem-key-prefix'] ?? 'agent:mem:';
$sessionKeyPrefix = $opts['session-key-prefix'] ?? 'agent:session:';
$eventKeyPrefix = $opts['event-key-prefix'] ?? 'agent:events:';
$sessionTtlSeconds = (int) ($opts['session-ttl-seconds'] ?? 3600);
$dedupThreshold = (float) ($opts['dedup-threshold'] ?? 0.20);
$recallThreshold = (float) ($opts['recall-threshold'] ?? 0.55);
$resetOnStart = !array_key_exists('no-reset', $opts);

// ---- Initialise Redis + helpers --------------------------------------

$client = new Client(
    ['scheme' => 'tcp', 'host' => $redisHost, 'port' => $redisPort],
    // No automatic key prefix — every helper passes its own prefix.
);
try {
    $client->ping();
} catch (Throwable $exc) {
    fwrite(STDERR, "Error: cannot reach Redis at $redisHost:$redisPort\n");
    fwrite(STDERR, "  (" . $exc->getMessage() . ")\n");
    exit(1);
}

$sessionStore = new AgentSession(
    client: $client,
    keyPrefix: $sessionKeyPrefix,
    defaultTtlSeconds: $sessionTtlSeconds,
);
$memory = new LongTermMemory(
    client: $client,
    indexName: $memIndexName,
    keyPrefix: $memKeyPrefix,
    dedupThreshold: $dedupThreshold,
    recallThreshold: $recallThreshold,
);
$memory->createIndex();
$eventLog = new AgentEventLog(
    client: $client,
    keyPrefix: $eventKeyPrefix,
);

fwrite(STDOUT, "Loading embedding model (first run downloads ~80 MB)...\n");
$embedder = new Embedder();

// One mutable container for the current thread id. The demo never
// races itself in practice — single browser, blocking server — so
// this can be a class instead of a process-wide lock.
final class DemoState
{
    public string $currentThreadId;
    public function __construct(string $threadId) { $this->currentThreadId = $threadId; }
}
$demo = new DemoState($sessionStore->newThreadId());

// Load and template the shared HTML once. The four `__*__` tokens
// are replaced with the configured key prefixes and index name so
// the lede paragraph shows the actual values in use.
$htmlPage = strtr(
    file_get_contents(__DIR__ . '/index.html'),
    [
        '__SESSION_PREFIX__' => $sessionKeyPrefix,
        '__MEM_PREFIX__' => $memKeyPrefix,
        '__MEM_INDEX__' => $memIndexName,
        '__EVENT_PREFIX__' => $eventKeyPrefix,
    ],
);

$stackLabel = 'predis + TransformersPHP + pure-PHP stream_socket_server';

// ---- Demo helpers ----------------------------------------------------

$reseed = function (string $user, string $namespace) use (
    $memory, $sessionStore, $eventLog, $embedder, $demo,
): int {
    $memory->clear();
    $sessionStore->delete($demo->currentThreadId);
    $eventLog->clear($demo->currentThreadId);
    $written = SeedMemory::seed(
        $memory, $embedder, $user, $namespace, 'seed',
    );
    $demo->currentThreadId = $sessionStore->newThreadId();
    return $written;
};

$newThread = function (string $user, string $namespace) use (
    $sessionStore, $eventLog, $demo,
): string {
    $eventLog->clear($demo->currentThreadId);
    $demo->currentThreadId = $sessionStore->newThreadId();
    $sessionStore->start(
        $demo->currentThreadId, user: $user, agent: 'demo-agent', goal: '',
    );
    $eventLog->record(
        $demo->currentThreadId, 'thread_started',
        "user=$user namespace=$namespace",
    );
    return $demo->currentThreadId;
};

$handleTurn = function (array $params) use (
    $sessionStore, $memory, $eventLog, $embedder, $demo, $recallThreshold,
): array {
    $text = trim((string) ($params['text'] ?? ''));
    if ($text === '') {
        return ['__http_status' => 400, 'error' => 'text is required'];
    }
    $user = ($params['user'] ?? '') !== '' ? $params['user'] : 'default';
    $namespace = ($params['namespace'] ?? '') !== ''
        ? $params['namespace'] : 'default';
    $kind = ($params['kind'] ?? '') !== '' ? $params['kind'] : 'episodic';
    $role = ($params['role'] ?? '') !== '' ? $params['role'] : 'user';
    $action = ($params['action'] ?? '') !== '' ? $params['action'] : 'turn';

    // Missing/blank threshold falls back to the configured
    // `--recall-threshold` rather than a hard-coded constant, so the
    // server-wide flag actually drives the default.
    $thresholdRaw = $params['threshold'] ?? '';
    $threshold = $thresholdRaw === '' ? $recallThreshold : (float) $thresholdRaw;
    // `(float)` parses "nan"/"inf" as NaN/INF; either would silently
    // turn recall into "every memory" or "nothing". Clamp to the
    // meaningful cosine-distance range so a malformed POST can't
    // override the threshold semantics.
    if (!is_finite($threshold)) {
        $threshold = $recallThreshold;
    }
    $threshold = max(0.0, min(2.0, $threshold));

    $threadId = $demo->currentThreadId;

    $t0 = microtime(true);
    $vec = $embedder->encodeOne($text);
    $embedMs = (microtime(true) - $t0) * 1000;

    // `setGoal` only touches the goal field so existing turns aren't
    // wiped; `appendTurn` carries the request `user` through to the
    // auto-create path so a first turn for a new thread doesn't land
    // under the default user.
    if ($action === 'goal') {
        $sessionStore->setGoal(
            $threadId, $text, user: $user, agent: 'demo-agent',
        );
        $sessionAction = 'goal_set';
    } else {
        $sessionStore->appendTurn(
            $threadId, role: $role, content: $text,
            user: $user, agent: 'demo-agent',
        );
        $sessionAction = "turn_appended:$role";
    }

    $t1 = microtime(true);
    $recalled = $memory->recall(
        queryEmbedding: $vec,
        user: $user,
        namespace: $namespace,
        k: 5,
        distanceThreshold: $threshold,
    );
    $recallMs = (microtime(true) - $t1) * 1000;

    $writeSkipped = ($kind === 'skip' || $action === 'goal');
    $writeResult = null;
    $writeMs = 0.0;
    if (!$writeSkipped) {
        $t2 = microtime(true);
        $writeResult = $memory->remember(
            text: $text,
            embedding: $vec,
            user: $user,
            namespace: $namespace,
            kind: $kind,
            sourceThread: $threadId,
        );
        $writeMs = (microtime(true) - $t2) * 1000;
    }

    if ($writeResult !== null) {
        $eventDetail = $writeResult['deduped']
            ? "deduped onto {$writeResult['id']}"
            : "wrote {$writeResult['id']} as $kind";
        $eventLog->record($threadId, $sessionAction, $eventDetail);
    } else {
        $eventLog->record($threadId, $sessionAction, '');
    }

    return [
        'thread_id' => $threadId,
        'write_skipped' => $writeSkipped,
        'memory_id' => $writeResult['id'] ?? null,
        'deduped' => $writeResult['deduped'] ?? false,
        'existing_distance' => $writeResult['existing_distance'] ?? null,
        'kind' => $writeSkipped ? null : $kind,
        'recalled' => $recalled,
        'embed_ms' => $embedMs,
        'recall_ms' => $recallMs,
        'write_ms' => $writeMs,
    ];
};

$buildState = function (string $user, string $namespace) use (
    $memory, $sessionStore, $eventLog, $embedder, $demo, $stackLabel,
    $memIndexName, $sessionTtlSeconds, $dedupThreshold, $recallThreshold,
): array {
    $info = $memory->indexInfo();
    $threadId = $demo->currentThreadId;
    $session = $sessionStore->load($threadId);
    $memories = $memory->listMemories(
        user: $user, namespace: $namespace, limit: 200,
    );
    $events = $eventLog->recent($threadId, 20);
    return [
        'index' => [
            'num_docs' => $info['num_docs'],
            'indexing_failures' => $info['indexing_failures'],
            'index_name' => $memIndexName,
            'model' => $embedder->modelName,
            'session_ttl_seconds' => $sessionTtlSeconds,
            'dedup_threshold' => $dedupThreshold,
            'default_recall_threshold' => $recallThreshold,
            'stack_label' => $stackLabel,
        ],
        'thread_id' => $threadId,
        'session' => $session,
        'memories' => $memories,
        'events' => $events,
        // `recalled` is populated by /turn; on plain /state reads
        // the UI keeps showing the last turn's result, which is the
        // useful behavior for an "agent" panel.
        'recalled' => [],
    ];
};

// ---- HTTP loop -------------------------------------------------------

// Cap POST bodies so a runaway client (or a `curl --data-binary
// @big-file` by mistake) can't accumulate unbounded memory before the
// handler runs. The demo's largest legitimate body is a few hundred
// bytes of form-encoded query fields; 1 MiB is a generous ceiling
// matching the Node, .NET, Rust, Go, and Java demos.
const MAX_BODY_BYTES = 1 * 1024 * 1024;

function sendResponse($conn, int $status, string $contentType, string $body): void
{
    $reasons = [
        200 => 'OK',
        400 => 'Bad Request',
        404 => 'Not Found',
        405 => 'Method Not Allowed',
        413 => 'Payload Too Large',
        500 => 'Internal Server Error',
    ];
    $reason = $reasons[$status] ?? 'Internal Server Error';
    $headers = "HTTP/1.1 $status $reason\r\n"
        . "Content-Type: $contentType\r\n"
        . 'Content-Length: ' . strlen($body) . "\r\n"
        . "Connection: close\r\n\r\n";
    fwrite($conn, $headers . $body);
}

function sendJson($conn, mixed $payload, int $status = 200): void
{
    sendResponse(
        $conn, $status, 'application/json',
        json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION),
    );
}

function sendHtml($conn, string $html, int $status = 200): void
{
    sendResponse($conn, $status, 'text/html; charset=utf-8', $html);
}

function readRequest($conn): ?array
{
    // Parse request line + headers until \r\n\r\n.
    $head = '';
    while (!feof($conn)) {
        $chunk = fgets($conn);
        if ($chunk === false) {
            return null;
        }
        $head .= $chunk;
        if (str_ends_with($head, "\r\n\r\n") || $chunk === "\r\n") {
            break;
        }
        if (strlen($head) > 64 * 1024) {
            return null;  // header section too big
        }
    }
    $lines = preg_split('/\r\n/', rtrim($head, "\r\n"));
    if (empty($lines)) {
        return null;
    }
    $requestLine = array_shift($lines);
    if (!preg_match('#^(\S+)\s+(\S+)\s+HTTP/\S+#', $requestLine, $m)) {
        return null;
    }
    [, $method, $target] = $m;
    $headers = [];
    foreach ($lines as $line) {
        $pos = strpos($line, ':');
        if ($pos === false) {
            continue;
        }
        $name = strtolower(trim(substr($line, 0, $pos)));
        $value = trim(substr($line, $pos + 1));
        $headers[$name] = $value;
    }
    $contentLength = (int) ($headers['content-length'] ?? 0);
    $body = '';
    if ($contentLength > 0) {
        if ($contentLength > MAX_BODY_BYTES) {
            // Drain a bounded chunk so the connection state stays
            // sane, then signal the cap to the caller.
            $drained = fread($conn, MAX_BODY_BYTES);
            return [
                'method' => $method, 'target' => $target,
                'headers' => $headers, 'body' => $drained,
                'body_too_large' => true,
            ];
        }
        $remaining = $contentLength;
        while ($remaining > 0 && !feof($conn)) {
            $chunk = fread($conn, $remaining);
            if ($chunk === false || $chunk === '') {
                break;
            }
            $body .= $chunk;
            $remaining -= strlen($chunk);
        }
    }
    return [
        'method' => $method, 'target' => $target,
        'headers' => $headers, 'body' => $body,
        'body_too_large' => false,
    ];
}

function parseForm(string $body): array
{
    $params = [];
    parse_str($body, $params);
    return is_array($params) ? $params : [];
}

$endpoint = "tcp://$host:$port";
$serverContext = stream_context_create([
    'socket' => ['so_reuseport' => true, 'so_reuseaddr' => true],
]);
$server = @stream_socket_server(
    $endpoint, $errno, $errstr,
    STREAM_SERVER_BIND | STREAM_SERVER_LISTEN,
    $serverContext,
);
if ($server === false) {
    fwrite(STDERR, "Error: cannot bind $endpoint: $errstr ($errno)\n");
    exit(1);
}

if ($resetOnStart) {
    fwrite(STDOUT,
        "Dropping any existing memories under '$memKeyPrefix*' and re-seeding "
        . "from the sample memory list (pass --no-reset to keep).\n"
    );
    $seeded = $reseed('default', 'default');
    fwrite(STDOUT, "Seeded $seeded memories.\n");
}

fwrite(STDOUT, "Redis agent memory demo listening on http://$host:$port\n");
fwrite(STDOUT,
    "Using Redis at $redisHost:$redisPort with memory index '$memIndexName'\n",
);

// SIGINT / SIGTERM clean up the listener so a re-run can bind the
// same port immediately. Requires ext-pcntl; without it Ctrl+C still
// works, the kernel just reclaims the socket on process exit.
if (function_exists('pcntl_async_signals')) {
    pcntl_async_signals(true);
    $shutdown = function () use ($server) {
        fwrite(STDOUT, "\nShutting down...\n");
        @fclose($server);
        exit(0);
    };
    pcntl_signal(SIGINT, $shutdown);
    pcntl_signal(SIGTERM, $shutdown);
}

while (true) {
    $conn = @stream_socket_accept($server, -1);
    if ($conn === false) {
        continue;
    }
    try {
        $req = readRequest($conn);
        if ($req === null) {
            sendJson($conn, ['error' => 'malformed request'], 400);
            continue;
        }
        if (!empty($req['body_too_large'])) {
            sendJson($conn, [
                'error' => 'request body exceeds ' . MAX_BODY_BYTES . ' bytes',
            ], 413);
            continue;
        }

        $url = parse_url($req['target']);
        $path = $url['path'] ?? '/';
        $query = [];
        if (isset($url['query'])) {
            parse_str($url['query'], $query);
        }

        if ($req['method'] === 'GET' && in_array($path, ['/', '/index.html'], true)) {
            sendHtml($conn, $htmlPage);
        } elseif ($req['method'] === 'GET' && $path === '/state') {
            $user = ($query['user'] ?? '') !== '' ? $query['user'] : 'default';
            $namespace = ($query['namespace'] ?? '') !== ''
                ? $query['namespace'] : 'default';
            sendJson($conn, $buildState($user, $namespace));
        } elseif ($req['method'] === 'POST') {
            $params = parseForm($req['body']);
            switch ($path) {
                case '/turn':
                    $payload = $handleTurn($params);
                    $status = $payload['__http_status'] ?? 200;
                    unset($payload['__http_status']);
                    sendJson($conn, $payload, $status);
                    break;
                case '/new_thread':
                    $threadId = $newThread(
                        ($params['user'] ?? '') !== '' ? $params['user'] : 'default',
                        ($params['namespace'] ?? '') !== '' ? $params['namespace'] : 'default',
                    );
                    sendJson($conn, ['thread_id' => $threadId]);
                    break;
                case '/reset':
                    $seeded = $reseed(
                        ($params['user'] ?? '') !== '' ? $params['user'] : 'default',
                        ($params['namespace'] ?? '') !== '' ? $params['namespace'] : 'default',
                    );
                    sendJson($conn, ['seeded' => $seeded]);
                    break;
                case '/drop_memory':
                    $memoryId = trim((string) ($params['memory_id'] ?? ''));
                    if ($memoryId === '') {
                        sendJson($conn, ['error' => 'memory_id is required'], 400);
                        break;
                    }
                    $deleted = $memory->deleteMemory($memoryId);
                    sendJson($conn, ['deleted' => $deleted, 'memory_id' => $memoryId]);
                    break;
                default:
                    sendJson($conn, ['error' => 'not found'], 404);
            }
        } else {
            sendJson($conn, ['error' => 'not found'], 404);
        }
    } catch (Throwable $exc) {
        // Without this catch, an exception escapes the loop and the
        // client's `await res.json()` blows up on an opaque parse
        // error instead of seeing what went wrong.
        fwrite(STDERR, "[demo] handler error: " . $exc->getMessage() . "\n");
        try {
            sendJson($conn, [
                'error' => $exc->getMessage(),
                'type' => $exc::class,
            ], 500);
        } catch (Throwable) {
            // Headers may already be partially flushed; nothing left to do.
        }
    } finally {
        @fclose($conn);
    }
}
