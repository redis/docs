<?php

/**
 * Background sync worker for the prefetch-cache demo.
 *
 * Two roles share this file:
 *
 * 1. SyncWorker::run() is the loop the long-running CLI process
 *    (sync_worker.php) calls. It drains the primary's change list with
 *    BRPOP and applies each event to Redis through
 *    PrefetchCache::applyChange. The pause/resume coordination is
 *    Redis-backed because the worker lives in a different process from
 *    the demo server.
 *
 * 2. SyncWorkerSupervisor is what the demo server's HTTP handlers use
 *    to spawn and kill the worker process and to drive pause/resume.
 *    Because the demo server runs under `php -S`, every HTTP request
 *    is a fresh process: anything started inside a request handler
 *    dies when the handler returns. The supervisor records the
 *    worker's PID in Redis so a subsequent request can find and
 *    signal it.
 *
 * Redis-backed coordination keys:
 *
 *   demo:sync:pid      PID of the running worker process (string)
 *   demo:sync:paused   "1" while a pause is requested, "0" / missing otherwise
 *   demo:sync:idle     worker writes "1" once it has parked itself in
 *                      response to a pause request; supervisor waits
 *                      on this before doing the cache write
 *
 * Requires: predis/predis 3.x
 */

declare(strict_types=1);

require_once __DIR__ . '/Cache.php';
require_once __DIR__ . '/Primary.php';

use Predis\ClientInterface;

class SyncWorker
{
    private MockPrimaryStore $primary;
    private PrefetchCache $cache;
    private ClientInterface $redis;
    private int $pollTimeoutS;
    private string $pausedKey;
    private string $idleKey;
    private string $pidKey;
    private bool $stop = false;

    public function __construct(
        ClientInterface $redis,
        MockPrimaryStore $primary,
        PrefetchCache $cache,
        int $pollTimeoutS = 1
    ) {
        $this->redis = $redis;
        $this->primary = $primary;
        $this->cache = $cache;
        // BRPOP timeout is in whole seconds. A 1-second poll keeps the
        // worker responsive to pause / stop signals without spinning.
        $this->pollTimeoutS = max(1, $pollTimeoutS);
        $this->pausedKey = 'demo:sync:paused';
        $this->idleKey = 'demo:sync:idle';
        $this->pidKey = 'demo:sync:pid';
    }

    /**
     * Drain the primary's change feed until requestStop() is called or
     * the host signals SIGTERM / SIGINT.
     */
    public function run(): void
    {
        if (function_exists('pcntl_async_signals')) {
            pcntl_async_signals(true);
            pcntl_signal(SIGTERM, function () { $this->stop = true; });
            pcntl_signal(SIGINT, function () { $this->stop = true; });
        }

        $this->redis->set($this->pidKey, (string) getmypid());

        while (!$this->stop) {
            if ($this->isPaused()) {
                // Tell the supervisor we are parked. The supervisor's
                // /clear and /reprefetch handlers wait for this flag
                // before writing to the cache, so a queued event can't
                // be applied between cache.clear() and bulk_load().
                $this->redis->set($this->idleKey, '1');
                while ($this->isPaused() && !$this->stop) {
                    usleep(20 * 1000);
                }
                $this->redis->set($this->idleKey, '0');
                continue;
            }

            $change = $this->primary->nextChange($this->pollTimeoutS);
            if ($change === null) {
                continue;
            }
            try {
                $this->cache->applyChange($change);
            } catch (\Throwable $exc) {
                // Demo behaviour: log and drop the event. A real CDC
                // consumer would retry with bounded backoff and route
                // poison events to a dead-letter queue; the guide's
                // "Production usage" section spells that out.
                fwrite(STDERR, "[sync] failed to apply event: " . $exc->getMessage() . "\n");
            }
        }
    }

    public function requestStop(): void
    {
        $this->stop = true;
    }

    private function isPaused(): bool
    {
        return ((string) $this->redis->get($this->pausedKey)) === '1';
    }
}

/**
 * Cross-process supervisor: spawns and kills the sync_worker.php
 * process and drives pause/resume from inside the demo server's HTTP
 * handlers.
 */
class SyncWorkerSupervisor
{
    private ClientInterface $redis;
    private string $workerScript;
    private string $phpBinary;
    private array $env;

    private string $pidKey;
    private string $pausedKey;
    private string $idleKey;

    public function __construct(
        ClientInterface $redis,
        string $workerScript,
        array $env = [],
        string $phpBinary = 'php'
    ) {
        $this->redis = $redis;
        $this->workerScript = $workerScript;
        $this->phpBinary = $phpBinary;
        $this->env = $env;

        $this->pidKey = 'demo:sync:pid';
        $this->pausedKey = 'demo:sync:paused';
        $this->idleKey = 'demo:sync:idle';
    }

    /**
     * Spawn one sync_worker.php process if none is alive. Idempotent —
     * calling it while a worker is already running is a no-op.
     */
    public function start(): int
    {
        $existing = $this->runningPid();
        if ($existing > 0) {
            return $existing;
        }
        // Clear any stale coordination flags from a previous run.
        $this->redis->del([$this->pausedKey, $this->idleKey]);

        $pid = $this->spawnWorker();
        if ($pid > 0) {
            $this->redis->set($this->pidKey, (string) $pid);
        }
        return $pid;
    }

    /**
     * SIGTERM the worker and forget its PID. Returns true if a worker
     * was running.
     */
    public function stop(): bool
    {
        $pid = $this->runningPid();
        if ($pid <= 0) {
            $this->redis->del([$this->pidKey, $this->pausedKey, $this->idleKey]);
            return false;
        }
        $this->killPid($pid);
        // Give the worker a chance to drain its BRPOP and exit.
        for ($i = 0; $i < 20; $i++) {
            if (!$this->isAlive($pid)) {
                break;
            }
            usleep(50 * 1000);
        }
        $this->redis->del([$this->pidKey, $this->pausedKey, $this->idleKey]);
        return true;
    }

    public function running(): bool
    {
        return $this->runningPid() > 0;
    }

    public function runningPid(): int
    {
        $raw = $this->redis->get($this->pidKey);
        if ($raw === null) {
            return 0;
        }
        $pid = (int) $raw;
        if ($pid <= 0 || !$this->isAlive($pid)) {
            $this->redis->del([$this->pidKey]);
            return 0;
        }
        return $pid;
    }

    /**
     * Request a pause and block up to $timeoutMs for the worker to
     * acknowledge it has parked itself. Returns true once the worker
     * has confirmed it is idle (via the demo:sync:idle key), or false
     * if the timeout elapsed first.
     *
     * If no worker is running, returns true immediately — there is
     * nothing to wait for, and the caller's cache write is safe by
     * construction.
     */
    public function pause(int $timeoutMs = 2000): bool
    {
        if (!$this->running()) {
            return true;
        }
        $this->redis->set($this->idleKey, '0');
        $this->redis->set($this->pausedKey, '1');
        $started = microtime(true);
        while ((microtime(true) - $started) * 1000.0 < $timeoutMs) {
            if (((string) $this->redis->get($this->idleKey)) === '1') {
                return true;
            }
            usleep(10 * 1000);
        }
        return false;
    }

    public function resume(): void
    {
        $this->redis->set($this->pausedKey, '0');
        $this->redis->set($this->idleKey, '0');
    }

    private function spawnWorker(): int
    {
        // The php -S dev server keeps its listening socket open in
        // every child a request handler forks, which would let the
        // worker hijack the port. Launch the worker through `setsid`
        // (Linux) or a /bin/sh detach (macOS) so it gets a new session
        // and detaches from the dev server's process group. Redirect
        // every standard FD to files so socket FDs can't leak in.
        $cmdArgs = [
            $this->phpBinary,
            $this->workerScript,
        ];
        foreach ($this->env as $k => $v) {
            $cmdArgs[] = '--' . $k;
            $cmdArgs[] = (string) $v;
        }

        $logPath = '/tmp/prefetch_cache_sync_worker.log';

        if (PHP_OS_FAMILY === 'Darwin') {
            // macOS ships `setsid` without the -f flag; fall back to a
            // shell command that backgrounds and detaches.
            $escaped = array_map('escapeshellarg', $cmdArgs);
            $shellCmd = sprintf(
                'exec %s >>%s 2>&1 </dev/null & echo $!',
                implode(' ', $escaped),
                escapeshellarg($logPath)
            );
            $args = ['/bin/sh', '-c', $shellCmd];
        } else {
            $args = array_merge(['setsid', '-f'], $cmdArgs);
        }

        $descriptorSpec = [
            0 => ['file', '/dev/null', 'r'],
            1 => ['pipe', 'w'],
            2 => ['file', $logPath, 'a'],
        ];

        $proc = proc_open($args, $descriptorSpec, $pipes);
        if (!is_resource($proc)) {
            return 0;
        }

        $childPid = 0;
        if (PHP_OS_FAMILY === 'Darwin') {
            $line = trim((string) fgets($pipes[1]));
            $childPid = (int) $line;
        } else {
            $status = proc_get_status($proc);
            $childPid = (int) ($status['pid'] ?? 0);
        }
        foreach ($pipes as $pipe) {
            if (is_resource($pipe)) {
                fclose($pipe);
            }
        }
        proc_close($proc);
        return $childPid;
    }

    private function killPid(int $pid): bool
    {
        if ($pid <= 0 || !function_exists('posix_kill')) {
            return false;
        }
        @posix_kill($pid, defined('SIGTERM') ? SIGTERM : 15);
        return true;
    }

    private function isAlive(int $pid): bool
    {
        if ($pid <= 0 || !function_exists('posix_kill')) {
            return false;
        }
        return @posix_kill($pid, 0);
    }
}
