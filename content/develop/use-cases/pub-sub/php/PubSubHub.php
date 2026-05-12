<?php
/**
 * Redis-backed pub/sub hub helper for PHP.
 *
 * Wraps PUBLISH / SUBSCRIBE / PSUBSCRIBE plus the introspection commands
 * (PUBSUB CHANNELS, PUBSUB NUMSUB, PUBSUB NUMPAT) into a small named API
 * that publishes JSON-encoded messages, registers named subscribers, and
 * reports stats for the demo UI.
 *
 * Unlike the reference Python implementation (which keeps subscribers as
 * in-process objects with their own background thread), this PHP port
 * runs each subscriber as a **separate OS process**. The reason is
 * structural: `php -S` runs every HTTP request in a fresh, short-lived
 * process, so an in-process `PubSub` consumer started inside a request
 * handler would die the moment the handler returns. To keep subscribers
 * alive across requests, the hub:
 *
 *   1. Spawns one detached `php subscriber_worker.php ...` process per
 *      subscription via `proc_open`. The worker connects to Redis,
 *      enters `pubSubLoop()`, and writes every received message to a
 *      Redis list under `demo:pubsub:sub:{name}:messages`. The detach
 *      uses `setsid` on Linux and a shell-wrapped backgrounded launch on
 *      macOS so the worker survives the demo server's request cycle.
 *
 *   2. Records each subscription's name, kind, targets, and PID in
 *      Redis under `demo:pubsub:sub:{name}:*` so every subsequent HTTP
 *      request — running in its own PHP process — can find the workers.
 *
 *   3. On `unsubscribe`, SIGTERMs the worker's PID and deletes the
 *      subscription's Redis state.
 *
 * Counters (`published_total`, `delivered_total`, per-channel publish
 * counts) live in a Redis hash under `demo:pubsub:stats` rather than as
 * object properties, for the same stateless-request reason.
 *
 * Pub/sub is at-most-once delivery: a message that arrives while a
 * subscriber is disconnected is gone. If you need persistence or replay,
 * use Redis Streams instead.
 *
 * Requires: predis/predis 3.x
 */

declare(strict_types=1);

use Predis\ClientInterface;

class RedisPubSubHub
{
    public const KEY_PREFIX = 'demo:pubsub';

    private ClientInterface $redis;
    private string $workerScript;
    private string $phpBinary;
    private int $bufferSize;
    private string $redisHost;
    private int $redisPort;

    /**
     * @param ClientInterface $redis        A Predis client used for publish + introspection.
     * @param string          $workerScript Absolute path to subscriber_worker.php.
     * @param string          $redisHost    Host the workers should dial back to.
     * @param int             $redisPort    Port the workers should dial back to.
     * @param int             $bufferSize   Per-subscription LTRIM cap for the message list.
     * @param string          $phpBinary    PHP binary to launch workers with.
     */
    public function __construct(
        ClientInterface $redis,
        string $workerScript,
        string $redisHost = '127.0.0.1',
        int $redisPort = 6379,
        int $bufferSize = 50,
        string $phpBinary = 'php'
    ) {
        $this->redis = $redis;
        $this->workerScript = $workerScript;
        $this->redisHost = $redisHost;
        $this->redisPort = $redisPort;
        $this->bufferSize = $bufferSize;
        $this->phpBinary = $phpBinary;
    }

    // -----------------------------------------------------------------
    // Publish
    // -----------------------------------------------------------------

    /**
     * Publish ``$message`` to ``$channel`` and return Redis' delivered count.
     *
     * The message is JSON-encoded so callers can pass arrays or scalars
     * without converting on every call. The returned integer is what
     * Redis itself reports — the number of clients that were subscribed
     * (directly or via pattern) at the moment of the PUBLISH.
     */
    public function publish(string $channel, $message): int
    {
        $payload = is_string($message) ? $message : json_encode($message, JSON_UNESCAPED_SLASHES);
        $delivered = (int) $this->redis->publish($channel, $payload);

        $statsKey = self::KEY_PREFIX . ':stats';
        $perChannelKey = self::KEY_PREFIX . ':channel_published';
        $pipe = $this->redis->pipeline();
        $pipe->hincrby($statsKey, 'published_total', 1);
        $pipe->hincrby($statsKey, 'delivered_total', $delivered);
        $pipe->hincrby($perChannelKey, $channel, 1);
        $pipe->execute();

        return $delivered;
    }

    // -----------------------------------------------------------------
    // Subscribe / unsubscribe
    // -----------------------------------------------------------------

    /**
     * Register a named exact-match subscription on one or more channels.
     *
     * @param list<string> $channels
     * @return array<string,mixed>
     */
    public function subscribe(string $name, array $channels): array
    {
        return $this->register($name, $channels, false);
    }

    /**
     * Register a named pattern subscription on one or more glob patterns.
     *
     * @param list<string> $patterns
     * @return array<string,mixed>
     */
    public function psubscribe(string $name, array $patterns): array
    {
        return $this->register($name, $patterns, true);
    }

    /**
     * Spawn the worker, write the per-subscription metadata to Redis,
     * and return the subscription dict for the UI.
     *
     * @param list<string> $targets
     * @return array<string,mixed>
     */
    private function register(string $name, array $targets, bool $isPattern): array
    {
        if ($name === '') {
            throw new InvalidArgumentException('subscription name is required');
        }
        if (empty($targets)) {
            throw new InvalidArgumentException('subscription requires at least one channel or pattern');
        }
        if ($this->subscriptionExists($name)) {
            throw new InvalidArgumentException("subscription named '{$name}' already exists");
        }

        $kind = $isPattern ? 'pattern' : 'channel';
        $metaKey = $this->metaKey($name);

        // Snapshot the relevant subscriber counts BEFORE spawning so
        // waitForSubscription() can detect *this* worker coming up,
        // even when other pattern/channel subscribers (from other
        // demos sharing the same Redis) already exist.
        $beforeNumpat = $isPattern ? $this->patternSubscriberCount() : 0;
        $beforeNumsub = !$isPattern ? $this->channelSubscriberCounts($targets) : [];

        // Stake the name first so two concurrent registrations can't
        // both spawn a worker for the same subscription. HSETNX is
        // atomic.
        $claimed = (int) $this->redis->hsetnx($metaKey, 'name', $name);
        if ($claimed !== 1) {
            throw new InvalidArgumentException("subscription named '{$name}' already exists");
        }

        $this->redis->hset(
            $metaKey,
            'kind', $kind,
            'targets', implode(',', $targets),
            'is_pattern', $isPattern ? '1' : '0',
            'created_at_ms', (string) self::nowMs(),
            'received_total', '0'
        );

        $pid = $this->spawnWorker($name, $kind, $targets);
        if ($pid <= 0) {
            // Best-effort cleanup so the user can retry without the
            // "already exists" guard tripping.
            $this->deleteSubscriptionKeys($name);
            throw new RuntimeException("failed to spawn subscriber worker for '{$name}'");
        }
        $this->redis->set($this->pidKey($name), (string) $pid);

        // Give the worker a moment to call SUBSCRIBE before returning
        // to the caller, so a quick PUBLISH that follows a /subscribe
        // request actually reaches it.
        $this->waitForSubscription($isPattern, $targets, $beforeNumpat, $beforeNumsub);

        return $this->getSubscription($name) ?? [];
    }

    /**
     * Kill the worker for $name and delete its Redis state.
     *
     * Returns true if there was a subscription to remove.
     */
    public function unsubscribe(string $name): bool
    {
        if ($name === '' || !$this->subscriptionExists($name)) {
            return false;
        }
        $pid = (int) $this->redis->get($this->pidKey($name));
        if ($pid > 0) {
            $this->killPid($pid);
        }
        $this->deleteSubscriptionKeys($name);
        return true;
    }

    /**
     * Shut every known subscription down. Safe to call repeatedly.
     */
    public function shutdown(): void
    {
        foreach ($this->subscriptionNames() as $name) {
            $this->unsubscribe($name);
        }
    }

    // -----------------------------------------------------------------
    // Introspection
    // -----------------------------------------------------------------

    /**
     * List the registered subscriptions, decorated with received counts
     * and the last `$bufferSize` messages received by each.
     *
     * @return list<array<string,mixed>>
     */
    public function subscriptions(): array
    {
        $out = [];
        foreach ($this->subscriptionNames() as $name) {
            $sub = $this->getSubscription($name);
            if ($sub !== null) {
                $out[] = $sub;
            }
        }
        return $out;
    }

    /**
     * Return a single subscription's dict, or null if it doesn't exist.
     *
     * @return array<string,mixed>|null
     */
    public function getSubscription(string $name): ?array
    {
        $meta = $this->redis->hgetall($this->metaKey($name));
        if (!$meta || !isset($meta['name'])) {
            return null;
        }
        $targets = isset($meta['targets']) && $meta['targets'] !== ''
            ? explode(',', (string) $meta['targets'])
            : [];
        $pid = (int) $this->redis->get($this->pidKey($name));
        $alive = $pid > 0 && $this->isAlive($pid);

        $rawMessages = $this->redis->lrange($this->messagesKey($name), 0, 14);
        $messages = [];
        foreach ($rawMessages ?: [] as $line) {
            $decoded = json_decode((string) $line, true);
            if (is_array($decoded)) {
                $messages[] = $decoded;
            }
        }

        return [
            'name' => (string) $meta['name'],
            'targets' => $targets,
            'is_pattern' => ($meta['is_pattern'] ?? '0') === '1',
            'received_total' => (int) ($meta['received_total'] ?? 0),
            'alive' => $alive,
            'pid' => $pid,
            'messages' => $messages,
        ];
    }

    /**
     * @return list<string>
     */
    public function activeChannels(string $pattern = '*'): array
    {
        $result = $this->redis->executeRaw(['PUBSUB', 'CHANNELS', $pattern]);
        $list = is_array($result) ? array_map('strval', $result) : [];
        sort($list);
        return $list;
    }

    /**
     * Map of channel => subscriber count from PUBSUB NUMSUB.
     *
     * @param list<string> $channels
     * @return array<string,int>
     */
    public function channelSubscriberCounts(array $channels): array
    {
        if (empty($channels)) {
            return [];
        }
        $args = array_merge(['PUBSUB', 'NUMSUB'], $channels);
        $result = $this->redis->executeRaw($args);
        $out = [];
        if (is_array($result)) {
            for ($i = 0; $i < count($result); $i += 2) {
                $channel = (string) $result[$i];
                $count = (int) ($result[$i + 1] ?? 0);
                $out[$channel] = $count;
            }
        }
        return $out;
    }

    public function patternSubscriberCount(): int
    {
        $result = $this->redis->executeRaw(['PUBSUB', 'NUMPAT']);
        return (int) $result;
    }

    /**
     * Combined publish + receive counters and registry size.
     *
     * @return array<string,mixed>
     */
    public function stats(): array
    {
        $statsKey = self::KEY_PREFIX . ':stats';
        $perChannelKey = self::KEY_PREFIX . ':channel_published';
        $pipe = $this->redis->pipeline();
        $pipe->hgetall($statsKey);
        $pipe->hgetall($perChannelKey);
        [$stats, $perChannel] = $pipe->execute();

        $stats = is_array($stats) ? $stats : [];
        $perChannel = is_array($perChannel) ? $perChannel : [];

        $receivedTotal = 0;
        $names = $this->subscriptionNames();
        foreach ($names as $name) {
            $receivedTotal += (int) $this->redis->hget($this->metaKey($name), 'received_total');
        }

        $perChannelInt = [];
        foreach ($perChannel as $channel => $count) {
            $perChannelInt[(string) $channel] = (int) $count;
        }

        return [
            'published_total' => (int) ($stats['published_total'] ?? 0),
            'delivered_total' => (int) ($stats['delivered_total'] ?? 0),
            'received_total' => $receivedTotal,
            'active_subscriptions' => count($names),
            'channel_published' => $perChannelInt,
            'pattern_subscriptions' => $this->patternSubscriberCount(),
        ];
    }

    /**
     * Zero the publish/receive counters; doesn't touch subscriptions.
     */
    public function resetStats(): void
    {
        $this->redis->del([
            self::KEY_PREFIX . ':stats',
            self::KEY_PREFIX . ':channel_published',
        ]);
        foreach ($this->subscriptionNames() as $name) {
            $this->redis->hset($this->metaKey($name), 'received_total', '0');
            $this->redis->del([$this->messagesKey($name)]);
        }
    }

    // -----------------------------------------------------------------
    // Worker process management
    // -----------------------------------------------------------------

    /**
     * @param list<string> $targets
     */
    private function spawnWorker(string $name, string $kind, array $targets): int
    {
        // Build the worker argv. We pass the same Redis coordinates the
        // demo server is using so the worker dials back to the same
        // instance.
        $workerArgs = [
            $this->phpBinary,
            $this->workerScript,
            '--name', $name,
            '--kind', $kind,
            '--target', implode(',', $targets),
            '--redis-host', $this->redisHost,
            '--redis-port', (string) $this->redisPort,
            '--buffer-size', (string) $this->bufferSize,
        ];

        // The php -S dev server keeps its listening socket open in any
        // child process forked or exec'd by a request handler. If the
        // subscriber worker inherits that socket FD, the dev server's
        // port gets a phantom listener that hijacks new connections
        // *and* the worker can't be killed cleanly. Two defences:
        //
        //   1. setsid (Linux) / equivalent shell wrapper (macOS) — gives
        //      the worker a fresh process group and session, detached
        //      from the dev-server group.
        //   2. Redirect every standard FD to a file so no socket FDs
        //      leak into the worker.
        $logFile = sys_get_temp_dir() . '/pubsub_subscriber_worker.log';
        if (PHP_OS_FAMILY === 'Darwin') {
            // macOS ships `setsid` without the -f flag. Use a shell
            // command that backgrounds the worker (`&`), echoes its PID
            // so the parent can capture it, and detaches stdio.
            $escaped = array_map('escapeshellarg', $workerArgs);
            $shellCmd = sprintf(
                'exec %s >>%s 2>&1 </dev/null & echo $!',
                implode(' ', $escaped),
                escapeshellarg($logFile)
            );
            $args = ['/bin/sh', '-c', $shellCmd];
        } else {
            $args = array_merge(['setsid', '-f'], $workerArgs);
        }

        $descriptorSpec = [
            0 => ['file', '/dev/null', 'r'],
            1 => ['pipe', 'w'],
            2 => ['file', $logFile, 'a'],
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

    /**
     * Block (briefly) until Redis reports the worker has actually
     * subscribed to its channel/pattern, so a publish immediately after
     * subscribe() isn't lost.
     *
     * The before-counts let us tell *this* worker apart from any other
     * subscribers that may have been on the same channels/patterns
     * before we spawned (e.g., other demos sharing one Redis).
     *
     * @param list<string>       $targets
     * @param array<string,int>  $beforeNumsub
     */
    private function waitForSubscription(
        bool $isPattern,
        array $targets,
        int $beforeNumpat,
        array $beforeNumsub
    ): void {
        $deadline = microtime(true) + 2.0;
        while (microtime(true) < $deadline) {
            if ($isPattern) {
                if ($this->patternSubscriberCount() > $beforeNumpat) {
                    return;
                }
            } else {
                $counts = $this->channelSubscriberCounts($targets);
                $allUp = true;
                foreach ($targets as $t) {
                    $now = (int) ($counts[$t] ?? 0);
                    $before = (int) ($beforeNumsub[$t] ?? 0);
                    if ($now <= $before) {
                        $allUp = false;
                        break;
                    }
                }
                if ($allUp) {
                    return;
                }
            }
            usleep(25 * 1000);
        }
        // Fall through anyway — the worker may still be coming up. A
        // later /state poll will pick up the count.
    }

    // -----------------------------------------------------------------
    // Redis key helpers
    // -----------------------------------------------------------------

    /**
     * @return list<string>
     */
    private function subscriptionNames(): array
    {
        $names = [];
        $cursor = '0';
        do {
            $result = $this->redis->scan($cursor, [
                'MATCH' => self::KEY_PREFIX . ':sub:*:meta',
                'COUNT' => 50,
            ]);
            $cursor = (string) $result[0];
            $keys = $result[1] ?? [];
            foreach ($keys as $key) {
                $name = $this->nameFromMetaKey((string) $key);
                if ($name !== null) {
                    $names[] = $name;
                }
            }
        } while ($cursor !== '0');
        sort($names);
        return $names;
    }

    private function nameFromMetaKey(string $key): ?string
    {
        $prefix = self::KEY_PREFIX . ':sub:';
        $suffix = ':meta';
        if (strpos($key, $prefix) !== 0 || substr($key, -strlen($suffix)) !== $suffix) {
            return null;
        }
        return substr($key, strlen($prefix), strlen($key) - strlen($prefix) - strlen($suffix));
    }

    private function metaKey(string $name): string
    {
        return self::KEY_PREFIX . ':sub:' . $name . ':meta';
    }

    private function pidKey(string $name): string
    {
        return self::KEY_PREFIX . ':sub:' . $name . ':pid';
    }

    private function messagesKey(string $name): string
    {
        return self::KEY_PREFIX . ':sub:' . $name . ':messages';
    }

    private function subscriptionExists(string $name): bool
    {
        return (int) $this->redis->exists($this->metaKey($name)) > 0;
    }

    private function deleteSubscriptionKeys(string $name): void
    {
        $this->redis->del([
            $this->metaKey($name),
            $this->pidKey($name),
            $this->messagesKey($name),
        ]);
    }

    // -----------------------------------------------------------------
    // Process helpers
    // -----------------------------------------------------------------

    private function killPid(int $pid): bool
    {
        if ($pid <= 0 || !function_exists('posix_kill')) {
            return false;
        }
        // SIGTERM first; the worker handles it and exits cleanly.
        @posix_kill($pid, defined('SIGTERM') ? SIGTERM : 15);
        // Give the worker a brief moment to exit so the next /state
        // poll doesn't report a stale `alive=true`.
        usleep(80 * 1000);
        if ($this->isAlive($pid)) {
            // Fall back to SIGKILL if the worker is wedged.
            @posix_kill($pid, defined('SIGKILL') ? SIGKILL : 9);
        }
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

    private static function nowMs(): int
    {
        return (int) round(microtime(true) * 1000);
    }
}
