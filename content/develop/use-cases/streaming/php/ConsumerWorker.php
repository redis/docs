<?php
/**
 * Background consumer process for a single consumer in a consumer group.
 *
 * Each worker is a long-lived CLI process spawned by the demo server.
 * The reference Python port runs every consumer in a daemon thread of
 * the demo HTTP server, but `php -S` runs each HTTP request in a
 * fresh, short-lived process — there is no daemon thread to live on.
 * The PHP port therefore spawns each consumer as a detached OS
 * process and keeps every piece of cross-request state in Redis.
 *
 * The loop is: `XREADGROUP >` (short block), process each entry,
 * `XACK`. Recovery of stuck PEL entries (this consumer's, or anyone
 * else's) happens through `reapIdlePel()`, which is the textbook
 * Streams pattern: each consumer periodically calls `XAUTOCLAIM`
 * with itself as the target, then processes whatever it claimed.
 *
 * Two demo-only levers, both Redis-backed so the demo server can
 * flip them across the process boundary:
 *
 *   * `demo:streaming:worker:{group}:{name}:paused` — non-zero
 *     parks the worker. The worker writes
 *     `demo:streaming:worker:{group}:{name}:idle = 1` while it's
 *     parked so the demo server can wait for a clean stop.
 *   * `demo:streaming:worker:{group}:{name}:crash_next` — an integer
 *     counter the worker decrements per delivery; while > 0, the
 *     worker drops the entry on the floor without acking it. This
 *     simulates a crash mid-message — the entries stay in the PEL
 *     and become eligible for `XAUTOCLAIM` once they age past the
 *     idle threshold.
 *
 * Per-worker observables (`processed`, `reaped`, `crashed_drops`,
 * `recent`) live in Redis under
 * `demo:streaming:worker:{group}:{name}:*` so the demo server can
 * read them.
 *
 * This file is dual-purpose: it defines the `ConsumerWorker` class
 * (used by the demo server's autoclaim handler to run a reap on a
 * named consumer), and when invoked from the CLI it runs the worker
 * loop in a long-lived background process.
 */

declare(strict_types=1);

use Predis\Client as PredisClient;
use Predis\ClientInterface;

require_once __DIR__ . '/EventStream.php';

class ConsumerWorker
{
    private EventStream $stream;
    private string $group;
    private string $name;
    private int $processLatencyMs;
    private int $recentCapacity;
    private ClientInterface $redis;

    public function __construct(
        EventStream $stream,
        string $group,
        string $name,
        int $processLatencyMs = 25,
        int $recentCapacity = 20
    ) {
        $this->stream = $stream;
        $this->group = $group;
        $this->name = $name;
        $this->processLatencyMs = $processLatencyMs;
        $this->recentCapacity = $recentCapacity;
        $this->redis = $stream->client();
    }

    public function group(): string
    {
        return $this->group;
    }

    public function name(): string
    {
        return $this->name;
    }

    // ------------------------------------------------------------------
    // Demo levers — written by the demo server, read by the worker
    // ------------------------------------------------------------------

    public function pause(): void
    {
        $this->redis->set(EventStream::workerKey($this->group, $this->name, 'paused'), '1');
    }

    public function resume(): void
    {
        $this->redis->del([
            EventStream::workerKey($this->group, $this->name, 'paused'),
            EventStream::workerKey($this->group, $this->name, 'idle'),
        ]);
    }

    /**
     * Drop the next `$count` deliveries without acking them.
     *
     * The entries stay in the group's PEL with their delivery counter
     * incremented, so `XAUTOCLAIM` can recover them once they exceed
     * the idle threshold.
     */
    public function crashNext(int $count): void
    {
        if ($count <= 0) {
            return;
        }
        $this->redis->incrby(
            EventStream::workerKey($this->group, $this->name, 'crash_next'),
            $count
        );
    }

    // ------------------------------------------------------------------
    // Introspection (read by demo server's /state)
    // ------------------------------------------------------------------

    /**
     * @return list<array<string,mixed>>
     */
    public function recent(): array
    {
        $rawList = $this->redis->lrange(
            EventStream::workerKey($this->group, $this->name, 'recent'),
            0,
            $this->recentCapacity - 1
        );
        $out = [];
        foreach ((array) $rawList as $line) {
            $decoded = json_decode((string) $line, true);
            if (is_array($decoded)) {
                $out[] = $decoded;
            }
        }
        return $out;
    }

    /**
     * @return array<string,mixed>
     */
    public function status(): array
    {
        $pid = (int) $this->redis->get(EventStream::workerKey($this->group, $this->name, 'pid'));
        $processed = (int) $this->redis->get(EventStream::workerKey($this->group, $this->name, 'processed'));
        $reaped = (int) $this->redis->get(EventStream::workerKey($this->group, $this->name, 'reaped'));
        $crashedDrops = (int) $this->redis->get(EventStream::workerKey($this->group, $this->name, 'crashed_drops'));
        $crashQueued = (int) $this->redis->get(EventStream::workerKey($this->group, $this->name, 'crash_next'));
        $paused = ((string) $this->redis->get(EventStream::workerKey($this->group, $this->name, 'paused'))) === '1';
        $alive = $pid > 0 && self::isAlive($pid);

        return [
            'name' => $this->name,
            'group' => $this->group,
            'processed' => $processed,
            'reaped' => $reaped,
            'crashed_drops' => $crashedDrops,
            'paused' => $paused,
            'crash_queued' => $crashQueued,
            'alive' => $alive,
            'pid' => $pid,
        ];
    }

    // ------------------------------------------------------------------
    // Recovery — runs in whichever PHP process calls it
    // ------------------------------------------------------------------

    /**
     * Run `XAUTOCLAIM` into this consumer and process the claimed entries.
     *
     * Safe to call from the demo server. The heavy lifting is
     * `EventStream::autoclaim()` (a Redis call) and the sequential
     * per-entry handling.
     *
     * `deletedIds` are PEL entries whose stream payload was already
     * trimmed by `MAXLEN ~`/`XTRIM` before the sweep ran. Redis 7+
     * removes them from the PEL inside `XAUTOCLAIM` itself, so the
     * caller does not have to `XACK` them; they are reported so the
     * caller can route them to a dead-letter store.
     *
     * @return array{claimed:int, processed:int, deleted_ids:list<string>}
     */
    public function reapIdlePel(): array
    {
        $result = $this->stream->autoclaim($this->group, $this->name, 100, '0-0', 10);
        $claimed = $result['claimed'];
        $deletedIds = $result['deletedIds'];

        $processed = 0;
        foreach ($claimed as [$entryId, $fields]) {
            try {
                $this->handleEntry($entryId, $fields, /*viaReap*/ true);
                $processed++;
            } catch (\Throwable $exc) {
                fwrite(STDERR, "[{$this->group}/{$this->name}] reap failed on {$entryId}: " . $exc->getMessage() . "\n");
            }
        }
        if ($processed > 0) {
            $this->redis->incrby(
                EventStream::workerKey($this->group, $this->name, 'reaped'),
                $processed
            );
        }
        return [
            'claimed' => count($claimed),
            'processed' => $processed,
            'deleted_ids' => $deletedIds,
        ];
    }

    // ------------------------------------------------------------------
    // Main loop — runs only in the spawned worker process
    // ------------------------------------------------------------------

    public function run(): void
    {
        $stop = false;
        if (function_exists('pcntl_async_signals')) {
            pcntl_async_signals(true);
            pcntl_signal(SIGTERM, function () use (&$stop) { $stop = true; });
            pcntl_signal(SIGINT, function () use (&$stop) { $stop = true; });
        }

        $pausedKey = EventStream::workerKey($this->group, $this->name, 'paused');
        $idleKey = EventStream::workerKey($this->group, $this->name, 'idle');

        // Record our PID so the demo server can kill us.
        $this->redis->set(
            EventStream::workerKey($this->group, $this->name, 'pid'),
            (string) getmypid()
        );

        while (!$stop) {
            // Cross-process pause: the demo server flips `paused=1`
            // and waits for `idle=1` before doing surgery on this
            // worker's group. The worker writes `idle=1` only while
            // it's parked, and clears it as soon as it resumes.
            if ((string) $this->redis->get($pausedKey) === '1') {
                $this->redis->set($idleKey, '1');
                usleep(20 * 1000);
                continue;
            } else {
                // Clear the idle flag eagerly so a previous pause
                // doesn't linger after resume().
                $this->redis->del([$idleKey]);
            }

            try {
                $entries = $this->stream->consume($this->group, $this->name, 10, 500);
            } catch (\Throwable $exc) {
                fwrite(STDERR, "[{$this->group}/{$this->name}] read failed: " . $exc->getMessage() . "\n");
                usleep(500 * 1000);
                continue;
            }

            foreach ($entries as [$entryId, $fields]) {
                if ($stop) {
                    break;
                }
                if ($this->processLatencyMs > 0) {
                    usleep($this->processLatencyMs * 1000);
                }
                try {
                    $this->handleEntry($entryId, $fields, /*viaReap*/ false);
                } catch (\Throwable $exc) {
                    // A failure here (typically XACK against Redis)
                    // must not kill the process — the entry stays
                    // unacked, the next reapIdlePel call (here or on
                    // any consumer in the group) can recover it once
                    // it exceeds the idle threshold.
                    fwrite(STDERR, "[{$this->group}/{$this->name}] failed to handle {$entryId}: " . $exc->getMessage() . "\n");
                    $this->appendRecent([
                        'id' => $entryId,
                        'type' => $fields['type'] ?? '',
                        'fields' => $fields,
                        'acked' => false,
                        'note' => 'handler error: ' . $exc->getMessage(),
                    ]);
                }
            }
        }

        // Clear the idle flag so the demo server's pause-wait doesn't
        // hang on a stopped worker.
        $this->redis->del([$idleKey]);
        fwrite(STDERR, "[{$this->group}/{$this->name}] stopped pid=" . getmypid() . "\n");
    }

    /**
     * @param array<string,string> $fields
     */
    private function handleEntry(string $entryId, array $fields, bool $viaReap): void
    {
        // Crash simulation: DECR returns the new value. We claim a
        // "slot" only if the pre-decrement value was > 0. Doing this
        // via a single DECRBY would let us race past zero, so use a
        // tiny Lua script to do the conditional decrement atomically.
        if (!$viaReap) {
            $shouldDrop = $this->tryConsumeCrashSlot();
            if ($shouldDrop) {
                $this->redis->incr(EventStream::workerKey($this->group, $this->name, 'crashed_drops'));
                $this->appendRecent([
                    'id' => $entryId,
                    'type' => $fields['type'] ?? '',
                    'fields' => $fields,
                    'acked' => false,
                    'note' => 'dropped (simulated crash)',
                ]);
                return;
            }
        }

        $this->stream->ack($this->group, [$entryId]);
        if (!$viaReap) {
            $this->redis->incr(EventStream::workerKey($this->group, $this->name, 'processed'));
        }
        $this->appendRecent([
            'id' => $entryId,
            'type' => $fields['type'] ?? '',
            'fields' => $fields,
            'acked' => true,
            'note' => $viaReap ? 'reaped' : '',
        ]);
    }

    /**
     * Atomically decrement the `crash_next` counter iff it's > 0.
     * Returns true when a slot was consumed (meaning: drop this entry).
     */
    private function tryConsumeCrashSlot(): bool
    {
        $key = EventStream::workerKey($this->group, $this->name, 'crash_next');
        // EVAL via Predis: pass keys count first, then keys, then args.
        $lua = <<<'LUA'
local v = tonumber(redis.call('GET', KEYS[1]) or '0')
if v > 0 then
  redis.call('DECR', KEYS[1])
  return 1
end
return 0
LUA;
        $result = $this->redis->eval($lua, 1, $key);
        return ((int) $result) === 1;
    }

    /**
     * @param array<string,mixed> $record
     */
    private function appendRecent(array $record): void
    {
        $recentKey = EventStream::workerKey($this->group, $this->name, 'recent');
        $line = json_encode($record, JSON_UNESCAPED_SLASHES);
        if (!is_string($line)) {
            return;
        }
        $pipe = $this->redis->pipeline();
        $pipe->lpush($recentKey, [$line]);
        $pipe->ltrim($recentKey, 0, $this->recentCapacity - 1);
        $pipe->execute();
    }

    // ------------------------------------------------------------------
    // Static helpers
    // ------------------------------------------------------------------

    public static function isAlive(int $pid): bool
    {
        if ($pid <= 0 || !function_exists('posix_kill')) {
            return false;
        }
        // Signal 0 doesn't deliver; it just checks reachability.
        return @posix_kill($pid, 0);
    }

    public static function deleteWorkerState(ClientInterface $redis, string $group, string $name): void
    {
        $redis->del([
            EventStream::workerKey($group, $name, 'pid'),
            EventStream::workerKey($group, $name, 'processed'),
            EventStream::workerKey($group, $name, 'reaped'),
            EventStream::workerKey($group, $name, 'crashed_drops'),
            EventStream::workerKey($group, $name, 'crash_next'),
            EventStream::workerKey($group, $name, 'paused'),
            EventStream::workerKey($group, $name, 'idle'),
            EventStream::workerKey($group, $name, 'recent'),
        ]);
    }
}

// ---------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------

// Run only when invoked as a script, not when require_once'd.
if (PHP_SAPI === 'cli' && isset($argv) && realpath($argv[0]) === __FILE__) {
    // Composer autoloader for Predis when this file is the CLI entry.
    $autoload = __DIR__ . '/vendor/autoload.php';
    if (!file_exists($autoload)) {
        fwrite(STDERR, "[consumer_worker] missing vendor/autoload.php — run 'composer install' in the demo directory first\n");
        exit(1);
    }
    require_once $autoload;

    $opts = [
        'group' => '',
        'name' => '',
        'redis-host' => '127.0.0.1',
        'redis-port' => 6379,
        'stream-key' => 'demo:events:orders',
        'maxlen' => 10000,
        'claim-idle-ms' => 15000,
        'process-latency-ms' => 25,
    ];

    $count = count($argv);
    for ($i = 1; $i < $count; $i++) {
        $arg = $argv[$i];
        if (strpos($arg, '--') !== 0) {
            continue;
        }
        $key = substr($arg, 2);
        $eq = strpos($key, '=');
        if ($eq !== false) {
            $value = substr($key, $eq + 1);
            $key = substr($key, 0, $eq);
        } elseif ($i + 1 < $count) {
            $value = $argv[++$i];
        } else {
            $value = '';
        }
        if (!array_key_exists($key, $opts)) {
            fwrite(STDERR, "[consumer_worker] unknown option --{$key}\n");
            exit(2);
        }
        $opts[$key] = $value;
    }

    if ($opts['group'] === '' || $opts['name'] === '') {
        fwrite(STDERR, "[consumer_worker] --group and --name are required\n");
        exit(2);
    }

    $redis = new PredisClient([
        'host' => (string) $opts['redis-host'],
        'port' => (int) $opts['redis-port'],
        // The XREADGROUP block window is half a second, so we set the
        // socket read timeout comfortably above that. A value of 0
        // disables the timeout entirely, which would also work.
        'read_write_timeout' => 0,
    ]);

    try {
        $redis->ping();
    } catch (\Throwable $exc) {
        fwrite(STDERR, "[consumer_worker {$opts['group']}/{$opts['name']}] cannot reach Redis: " . $exc->getMessage() . "\n");
        exit(1);
    }

    $stream = new EventStream(
        $redis,
        (string) $opts['stream-key'],
        (int) $opts['maxlen'],
        (int) $opts['claim-idle-ms']
    );
    // The group should already exist (the demo server seeds it on
    // start), but ensureGroup is idempotent.
    $stream->ensureGroup((string) $opts['group'], '0-0');

    $worker = new ConsumerWorker(
        $stream,
        (string) $opts['group'],
        (string) $opts['name'],
        (int) $opts['process-latency-ms']
    );

    fwrite(STDERR, "[consumer_worker {$opts['group']}/{$opts['name']}] starting pid=" . getmypid() . "\n");
    $worker->run();
}
