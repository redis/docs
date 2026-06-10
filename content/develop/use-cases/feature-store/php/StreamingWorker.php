<?php
/**
 * Streaming feature updater for the demo (PHP CLI process).
 *
 * `php -S` runs each HTTP request in a fresh process, so the
 * streaming worker can't live inside the demo server -- it runs as a
 * separate, long-lived CLI process spawned by the demo server on
 * startup. Cross-process state (pause flag, in-flight flag, tick /
 * writes counters, stop signal) lives in Redis under `fs:control:*`
 * so the HTTP handlers can read and write it.
 *
 * Same lifecycle surface as every other client in this use case:
 * start / pause / resume / wait_for_idle / stop. Same pre-flight
 * `tick_in_flight` set *before* the pause check, and same cleanup
 * of both flags on every exit path.
 */

declare(strict_types=1);

use Predis\Client;

class StreamingWorker
{
    private const DEVICE_IDS = [
        'ios-1a4c', 'ios-9f02', 'and-7b21', 'and-2d18',
        'web-chr-1', 'web-saf-1', 'web-ff-2',
    ];
    private const SESSION_COUNTRIES = [
        'US', 'GB', 'DE', 'FR', 'IN', 'BR', 'JP', 'AU', 'CA', 'NL',
    ];
    private const FAILED_LOGIN_BUCKETS = [0, 1, 2, 5];
    private const FAILED_LOGIN_WEIGHTS = [70, 20, 8, 2];

    public function __construct(
        private Client $redis,
        private FeatureStore $store,
        public int $usersPerTick = 5,
        public float $tickSeconds = 1.0,
    ) {}

    /**
     * Tick loop entry point. Runs until `fs:control:stop` flips to 1.
     */
    public function run(): void
    {
        // Tell the demo server we're alive and record our PID so the
        // server can `kill -0 $pid` to check.
        $this->redis->set('fs:control:worker_pid', (string)getmypid());
        $this->redis->set('fs:control:running', '1');

        // Trap SIGTERM / SIGINT so a `kill <pid>` from the demo
        // server's shutdown path clears the Redis state instead of
        // leaving stale `running`/`paused` flags behind.
        if (function_exists('pcntl_signal')) {
            pcntl_async_signals(true);
            $shutdown = function () {
                $this->redis->set('fs:control:stop', '1');
            };
            pcntl_signal(SIGTERM, $shutdown);
            pcntl_signal(SIGINT, $shutdown);
        }

        try {
            while (true) {
                if ($this->redis->get('fs:control:stop') === '1') break;
                $this->microsleep($this->tickSeconds);
                if ($this->redis->get('fs:control:stop') === '1') break;

                // Set tick_in_flight *before* the pause check so a
                // concurrent pause + wait_for_idle (reset path) can
                // never observe tick_in_flight=0 in the window
                // between the pause check and the actual tick. The
                // finally block clears the flag whether we paused,
                // succeeded, or threw.
                $this->redis->set('fs:control:tick_in_flight', '1');
                try {
                    if ($this->redis->get('fs:control:paused') !== '1') {
                        $this->doTick();
                    }
                } catch (\Throwable $e) {
                    fwrite(STDERR, "[streaming-worker] tick failed: " . $e->getMessage() . "\n");
                } finally {
                    $this->redis->set('fs:control:tick_in_flight', '0');
                }
            }
        } finally {
            // Clear running, tick_in_flight, and stop no matter how
            // the loop exits so a later restart can spin a fresh
            // worker with a clean slate.
            $this->redis->del(...[
                'fs:control:running',
                'fs:control:tick_in_flight',
                'fs:control:worker_pid',
                'fs:control:stop',
            ]);
        }
    }

    private function doTick(): void
    {
        $ids = $this->store->listEntityIds(500);
        if (count($ids) === 0) return;
        $picks = $this->sample($ids, $this->usersPerTick);
        $nowMs = (int)(microtime(true) * 1000);
        $writes = 0;
        foreach ($picks as $id) {
            $fields = [
                'last_login_ts'     => $nowMs,
                'last_device_id'    => self::DEVICE_IDS[array_rand(self::DEVICE_IDS)],
                'tx_count_5m'       => random_int(0, 12),
                'failed_logins_15m' => $this->weighted(self::FAILED_LOGIN_BUCKETS, self::FAILED_LOGIN_WEIGHTS),
                'session_country'   => self::SESSION_COUNTRIES[array_rand(self::SESSION_COUNTRIES)],
            ];
            $this->store->updateStreaming($id, $fields);
            $writes += count($fields);
        }
        $this->redis->incrby('fs:control:tick_count', 1);
        $this->redis->incrby('fs:control:writes_count', $writes);
    }

    private function sample(array $items, int $k): array
    {
        $n = min($k, count($items));
        if ($n === 0) return [];
        $keys = array_rand($items, $n);
        if (!is_array($keys)) $keys = [$keys];
        $out = [];
        foreach ($keys as $key) $out[] = $items[$key];
        return $out;
    }

    private function weighted(array $items, array $weights): int
    {
        $total = array_sum($weights);
        $r = random_int(0, $total - 1);
        foreach ($items as $i => $item) {
            $r -= $weights[$i];
            if ($r < 0) return $item;
        }
        return $items[count($items) - 1];
    }

    private function microsleep(float $seconds): void
    {
        usleep((int)($seconds * 1_000_000));
    }
}
