<?php
/**
 * WorkerSupervisor — spawn and reap worker.php OS processes.
 *
 * The demo server runs under php -S, which gives every HTTP request a
 * fresh process. That means we can't keep a thread pool or a long-lived
 * Worker object in memory: anything started inside a request handler
 * dies when the handler returns. Instead the supervisor:
 *
 *   - spawns one `php worker.php ...` process per worker via proc_open
 *   - tracks their PIDs and configuration in Redis under demo:workers:*
 *   - posix_kills them on stop()
 *   - reaps zombies and checks aliveness via posix_kill($pid, 0)
 *
 * Every HTTP request reconstructs the supervisor from the Redis state,
 * so a stop or status call from one request sees the workers spawned by
 * another request.
 */

declare(strict_types=1);

require_once __DIR__ . '/JobQueue.php';

use Predis\ClientInterface;

class WorkerSupervisor
{
    private ClientInterface $redis;
    private string $pidsKey;
    private string $configKey;
    private string $workerScript;
    private string $phpBinary;
    private JobQueue $queue;
    private int $visibilityMs;
    private int $maxAttempts;

    public function __construct(
        ClientInterface $redis,
        JobQueue $queue,
        string $workerScript,
        int $visibilityMs,
        int $maxAttempts,
        string $phpBinary = 'php'
    ) {
        $this->redis = $redis;
        $this->queue = $queue;
        $this->workerScript = $workerScript;
        $this->visibilityMs = $visibilityMs;
        $this->maxAttempts = $maxAttempts;
        $this->phpBinary = $phpBinary;
        $this->pidsKey = 'demo:workers:pids';
        $this->configKey = 'demo:workers:config';
    }

    /**
     * Resize the pool to $size workers, spawning new ones and killing
     * extras. Re-applies the current config to every running worker by
     * restarting any whose config differs from the request.
     */
    public function start(int $size, int $workLatencyMs, float $failRate, float $hangRate): array
    {
        $size = max(0, min(8, $size));
        $this->setConfig($workLatencyMs, $failRate, $hangRate);

        $pids = $this->alivePids();

        // Kill workers whose config has drifted so the new settings
        // apply to every running process.
        $previousSignature = $this->getStoredSignature();
        $currentSignature = $this->signature($workLatencyMs, $failRate, $hangRate);
        if ($previousSignature !== $currentSignature && !empty($pids)) {
            foreach ($pids as $name => $pid) {
                $this->killPid($pid);
            }
            $this->redis->del([$this->pidsKey]);
            $pids = [];
        }

        // Trim down to $size by killing extras.
        while (count($pids) > $size) {
            $name = array_key_last($pids);
            $pid = $pids[$name];
            $this->killPid($pid);
            $this->redis->hdel($this->pidsKey, [$name]);
            unset($pids[$name]);
        }

        // Spawn new workers up to $size.
        $next = 1;
        while (count($pids) < $size) {
            $name = 'worker-' . $next;
            while (isset($pids[$name])) {
                $next++;
                $name = 'worker-' . $next;
            }
            $pid = $this->spawnWorker($name, $workLatencyMs, $failRate, $hangRate);
            if ($pid > 0) {
                $pids[$name] = $pid;
                $this->redis->hset($this->pidsKey, $name, (string) $pid);
            }
            $next++;
        }

        return $pids;
    }

    public function stop(): int
    {
        $pids = $this->alivePids();
        $killed = 0;
        foreach ($pids as $name => $pid) {
            if ($this->killPid($pid)) {
                $killed++;
            }
            $this->redis->hdel($this->pidsKey, [$name]);
        }
        // Give workers a moment to drain blocking claim() calls.
        if ($killed > 0) {
            usleep(150 * 1000);
        }
        return $killed;
    }

    public function configure(?int $workLatencyMs, ?float $failRate, ?float $hangRate): void
    {
        $cfg = $this->getConfig();
        $latency = $workLatencyMs !== null ? max(0, $workLatencyMs) : $cfg['work_latency_ms'];
        $failR = $failRate !== null ? max(0.0, min(1.0, $failRate)) : $cfg['fail_rate'];
        $hangR = $hangRate !== null ? max(0.0, min(1.0, $hangRate)) : $cfg['hang_rate'];
        $this->setConfig($latency, $failR, $hangR);

        // If workers are running, restart them so the new config takes effect.
        $pids = $this->alivePids();
        if (!empty($pids)) {
            $size = count($pids);
            $this->stop();
            $this->start($size, $latency, $failR, $hangR);
        }
    }

    /**
     * @return array<string,int> name => pid for workers still alive.
     */
    public function alivePids(): array
    {
        $raw = $this->redis->hgetall($this->pidsKey) ?: [];
        $alive = [];
        $dead = [];
        foreach ($raw as $name => $pid) {
            $pid = (int) $pid;
            if ($pid > 0 && $this->isAlive($pid)) {
                $alive[$name] = $pid;
            } else {
                $dead[] = $name;
            }
        }
        if (!empty($dead)) {
            $this->redis->hdel($this->pidsKey, $dead);
        }
        return $alive;
    }

    public function running(): int
    {
        return count($this->alivePids());
    }

    public function getConfig(): array
    {
        $raw = $this->redis->hgetall($this->configKey) ?: [];
        return [
            'work_latency_ms' => (int) ($raw['work_latency_ms'] ?? 400),
            'fail_rate' => (float) ($raw['fail_rate'] ?? 0.0),
            'hang_rate' => (float) ($raw['hang_rate'] ?? 0.0),
        ];
    }

    private function setConfig(int $latencyMs, float $failRate, float $hangRate): void
    {
        $this->redis->hset(
            $this->configKey,
            'work_latency_ms', (string) $latencyMs,
            'fail_rate', (string) $failRate,
            'hang_rate', (string) $hangRate
        );
    }

    private function getStoredSignature(): string
    {
        $cfg = $this->getConfig();
        return $this->signature($cfg['work_latency_ms'], $cfg['fail_rate'], $cfg['hang_rate']);
    }

    private function signature(int $latency, float $failRate, float $hangRate): string
    {
        return "{$latency}|{$failRate}|{$hangRate}";
    }

    private function spawnWorker(string $name, int $latencyMs, float $failRate, float $hangRate): int
    {
        // The php -S dev server keeps its listening socket open in every
        // child the request handler forks/execs, which would let the
        // worker hijack the port. We sidestep that by launching the
        // worker through `setsid` so it gets a new session and detaches
        // from the dev server's process group, and by redirecting every
        // standard FD to files so no socket FDs leak into the worker.
        $args = [
            'setsid',
            '-f',
            $this->phpBinary,
            $this->workerScript,
            '--name', $name,
            '--queue', $this->queue->getQueueName(),
            '--visibility-ms', (string) $this->visibilityMs,
            '--max-attempts', (string) $this->maxAttempts,
            '--work-latency-ms', (string) $latencyMs,
            '--fail-rate', (string) $failRate,
            '--hang-rate', (string) $hangRate,
        ];
        // macOS ships `setsid` without the -f flag; fall back to a shell
        // command that does the equivalent (background + detach).
        if (PHP_OS_FAMILY === 'Darwin') {
            $escaped = array_map('escapeshellarg', array_slice($args, 2));
            $shellCmd = sprintf(
                'exec %s >>%s 2>&1 </dev/null & echo $!',
                implode(' ', $escaped),
                escapeshellarg('/tmp/job_queue_worker.log')
            );
            $args = ['/bin/sh', '-c', $shellCmd];
        }

        $descriptorSpec = [
            0 => ['file', '/dev/null', 'r'],
            1 => ['pipe', 'w'],
            2 => ['file', '/tmp/job_queue_worker.log', 'a'],
        ];

        $proc = proc_open($args, $descriptorSpec, $pipes);
        if (!is_resource($proc)) {
            return 0;
        }

        $childPid = 0;
        if (PHP_OS_FAMILY === 'Darwin') {
            // The shell echoes the backgrounded child's PID on stdout.
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
        if ($pid <= 0) {
            return false;
        }
        if (!function_exists('posix_kill')) {
            return false;
        }
        // SIGTERM first; the worker handles it and exits cleanly.
        @posix_kill($pid, defined('SIGTERM') ? SIGTERM : 15);
        return true;
    }

    private function isAlive(int $pid): bool
    {
        if ($pid <= 0 || !function_exists('posix_kill')) {
            return false;
        }
        // Signal 0 doesn't deliver anything; it just checks reachability.
        return @posix_kill($pid, 0);
    }

    /**
     * Forget about all tracked workers without killing them. Used after
     * purge so demo:* keys can be cleared. Caller is expected to have
     * already stopped the workers.
     */
    public function forget(): void
    {
        $this->redis->del([$this->pidsKey, $this->configKey]);
    }
}
