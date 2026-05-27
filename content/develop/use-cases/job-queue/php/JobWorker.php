<?php

/**
 * Mock background worker for the job-queue demo.
 *
 * A worker pulls jobs off the queue, simulates work by sleeping for a
 * configurable latency, and either completes the job, fails it, or
 * intentionally hangs to simulate a worker crash that the reclaimer must
 * recover from. This is the demo-side stand-in for whatever real work
 * your application would run in the background.
 *
 * Each worker is a single PHP CLI process (see worker.php). Unlike the
 * Python reference, the PHP build doesn't use threads or an in-process
 * pool — the demo server spawns one OS process per worker via proc_open,
 * because the php -S dev server runs each HTTP request in its own
 * short-lived process and in-process threads would die with the request.
 *
 * The class lives in JobWorker.php (rather than Worker.php) so it
 * doesn't collide with worker.php on case-insensitive filesystems like
 * macOS APFS.
 */

declare(strict_types=1);

require_once __DIR__ . '/JobQueue.php';

class JobWorker
{
    private string $name;
    private JobQueue $queue;
    private int $workLatencyMs;
    private float $failRate;
    private float $hangRate;
    private bool $stop = false;

    public function __construct(
        string $name,
        JobQueue $queue,
        int $workLatencyMs = 400,
        float $failRate = 0.0,
        float $hangRate = 0.0
    ) {
        $this->name = $name;
        $this->queue = $queue;
        $this->workLatencyMs = max(0, $workLatencyMs);
        $this->failRate = max(0.0, min(1.0, $failRate));
        $this->hangRate = max(0.0, min(1.0, $hangRate));
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function requestStop(): void
    {
        $this->stop = true;
    }

    /**
     * Drain the queue until requestStop() is called or the host signals SIGTERM/SIGINT.
     */
    public function run(): void
    {
        // Honour SIGTERM / SIGINT so the demo's "Stop workers" button
        // (which posix_kills our PID) gives us a chance to finish a
        // claimed job before exiting.
        if (function_exists('pcntl_async_signals')) {
            pcntl_async_signals(true);
            pcntl_signal(SIGTERM, function () { $this->stop = true; });
            pcntl_signal(SIGINT, function () { $this->stop = true; });
        }

        while (!$this->stop) {
            $job = $this->queue->claim(500);
            if ($job === null) {
                continue;
            }
            $this->process($job);
        }
    }

    private function process(ClaimedJob $job): void
    {
        // Decide outcome up front so the latency reflects "work was tried".
        $outcome = $this->pickOutcome();
        if ($this->workLatencyMs > 0) {
            usleep($this->workLatencyMs * 1000);
        }

        if ($outcome === 'hang') {
            // Simulate a worker that crashed mid-job: don't complete,
            // don't fail. The reclaimer will move this job back to
            // pending once the visibility timeout elapses.
            return;
        }

        if ($outcome === 'fail') {
            $this->queue->fail($job, "{$this->name} simulated failure");
            return;
        }

        $this->queue->complete($job, [
            'worker' => $this->name,
            'echo' => $job->payload,
            'attempts' => $job->attempts,
        ]);
    }

    private function pickOutcome(): string
    {
        // mt_rand is fine for demo outcome selection — secrets-style
        // randomness isn't needed here.
        $roll = mt_rand() / mt_getrandmax();
        if ($roll < $this->hangRate) {
            return 'hang';
        }
        if ($roll < $this->hangRate + $this->failRate) {
            return 'fail';
        }
        return 'ok';
    }
}
