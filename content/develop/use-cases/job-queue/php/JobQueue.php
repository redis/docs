<?php

/**
 * Redis-backed job queue helper.
 *
 * Jobs are pushed onto a pending list and atomically moved to a processing
 * list when a worker claims them. Each job's payload, status, attempts, and
 * result live in a Redis hash. A reclaimer scans the processing list for
 * jobs older than the visibility timeout and pushes them back to pending so
 * no work is lost when a worker dies mid-job.
 *
 * Because PHP's built-in dev server runs each HTTP request in a fresh
 * process, the per-process counters (enqueued, completed, failed,
 * reclaimed) live in Redis under demo:queue_stats:* rather than as object
 * properties. The Lua scripts and data layout otherwise mirror the
 * reference redis-py implementation verbatim.
 *
 * Requires: predis/predis 3.x
 */

declare(strict_types=1);

use Predis\ClientInterface;

/**
 * A job that has been atomically moved into the processing list.
 */
class ClaimedJob
{
    public string $id;
    public array $payload;
    public int $attempts;
    public string $claimToken;

    public function __construct(string $id, array $payload, int $attempts, string $claimToken)
    {
        $this->id = $id;
        $this->payload = $payload;
        $this->attempts = $attempts;
        $this->claimToken = $claimToken;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'payload' => $this->payload,
            'attempts' => $this->attempts,
            'claim_token' => $this->claimToken,
        ];
    }
}

/**
 * Reliable FIFO job queue with visibility-timeout reclaim.
 */
class JobQueue
{
    // Mark a job complete and remove it from the processing list. Only
    // deletes from the processing list if the worker still owns the claim
    // token; this prevents a worker that was reclaimed (because it went
    // over the visibility timeout) from later marking a job complete that
    // another worker has already picked up.
    private const COMPLETE_SCRIPT = <<<'LUA'
local meta_key = KEYS[1] .. ARGV[1]
local current_token = redis.call('HGET', meta_key, 'claim_token')
if current_token ~= ARGV[2] then
  return 0
end
redis.call('LREM', KEYS[2], 1, ARGV[1])
redis.call('HSET', meta_key,
  'status', ARGV[3],
  'completed_at_ms', ARGV[4],
  'result', ARGV[5])
redis.call('EXPIRE', meta_key, ARGV[6])
redis.call('LPUSH', KEYS[3], ARGV[1])
redis.call('LTRIM', KEYS[3], 0, ARGV[7] - 1)
return 1
LUA;

    // Record a failure. If the job still has retries left it goes back to
    // the pending list; otherwise it lands in the failed list with its
    // metadata expiring on the same schedule as completed jobs. Only acts
    // if the caller still owns the claim token — a reclaimed job can't be
    // failed by the original claimant.
    private const FAIL_SCRIPT = <<<'LUA'
local meta_key = KEYS[1] .. ARGV[1]
local current_token = redis.call('HGET', meta_key, 'claim_token')
if current_token ~= ARGV[2] then
  return 0
end
redis.call('LREM', KEYS[2], 1, ARGV[1])
if ARGV[7] == '1' then
  redis.call('HSET', meta_key,
    'status', 'pending',
    'last_error', ARGV[3],
    'last_error_at_ms', ARGV[4],
    'claim_token', '',
    'claimed_at_ms', 0)
  redis.call('LPUSH', KEYS[3], ARGV[1])
  return 1
else
  redis.call('HSET', meta_key,
    'status', 'failed',
    'last_error', ARGV[3],
    'last_error_at_ms', ARGV[4],
    'claim_token', '')
  redis.call('LPUSH', KEYS[4], ARGV[1])
  redis.call('LTRIM', KEYS[4], 0, ARGV[6] - 1)
  redis.call('EXPIRE', meta_key, ARGV[5])
  return 2
end
LUA;

    // Reclaim jobs whose claim has gone stale. Walks the processing list
    // and moves any job past the visibility timeout back to the pending
    // list. A job is past the timeout if either:
    //   - claimed_at_ms is set and (now - claimed_at_ms) > visibility_ms, OR
    //   - claimed_at_ms is missing (worker crashed between BRPOPLPUSH and
    //     the metadata write) and (now - enqueued_at_ms) > 2 * visibility_ms.
    // Runs in one round trip so a concurrent worker can't claim a
    // half-reclaimed job.
    private const RECLAIM_SCRIPT = <<<'LUA'
local now_ms = tonumber(ARGV[1])
local visibility_ms = tonumber(ARGV[2])
local processing = redis.call('LRANGE', KEYS[2], 0, -1)
local reclaimed = {}
for _, job_id in ipairs(processing) do
  local meta_key = KEYS[3] .. job_id
  local claimed_at = tonumber(redis.call('HGET', meta_key, 'claimed_at_ms') or '0')
  local enqueued_at = tonumber(redis.call('HGET', meta_key, 'enqueued_at_ms') or '0')
  local stale = false
  if claimed_at > 0 and (now_ms - claimed_at) > visibility_ms then
    stale = true
  elseif claimed_at == 0 and enqueued_at > 0 and (now_ms - enqueued_at) > (visibility_ms * 2) then
    stale = true
  end
  if stale then
    redis.call('LREM', KEYS[2], 1, job_id)
    redis.call('LPUSH', KEYS[1], job_id)
    redis.call('HSET', meta_key,
      'status', 'pending',
      'reclaimed_at_ms', now_ms,
      'claim_token', '',
      'claimed_at_ms', 0)
    table.insert(reclaimed, job_id)
  end
end
return reclaimed
LUA;

    private ClientInterface $redis;
    private string $queueName;
    private int $visibilityMs;
    private int $completedTtl;
    private int $completedHistory;
    private int $maxAttempts;

    private string $pendingKey;
    private string $processingKey;
    private string $completedKey;
    private string $failedKey;
    private string $metaPrefix;
    private string $eventsChannel;
    private string $statsKey;

    public function __construct(
        ClientInterface $redis,
        string $queueName = 'jobs',
        int $visibilityMs = 5000,
        int $completedTtl = 300,
        int $completedHistory = 50,
        int $maxAttempts = 3
    ) {
        $this->redis = $redis;
        $this->queueName = $queueName;
        $this->visibilityMs = $visibilityMs;
        $this->completedTtl = $completedTtl;
        $this->completedHistory = $completedHistory;
        $this->maxAttempts = $maxAttempts;

        $this->pendingKey = "queue:{$queueName}:pending";
        $this->processingKey = "queue:{$queueName}:processing";
        $this->completedKey = "queue:{$queueName}:completed";
        $this->failedKey = "queue:{$queueName}:failed";
        $this->metaPrefix = "queue:{$queueName}:job:";
        $this->eventsChannel = "queue:{$queueName}:events";

        // PHP requests are stateless, so counters can't live in object
        // properties — they go in Redis under demo:queue_stats:* so each
        // request, worker process, and CLI invocation sees the same totals.
        $this->statsKey = "demo:queue_stats:{$queueName}";
    }

    public function getQueueName(): string
    {
        return $this->queueName;
    }

    public function getVisibilityMs(): int
    {
        return $this->visibilityMs;
    }

    public function getMaxAttempts(): int
    {
        return $this->maxAttempts;
    }

    private function metaKey(string $jobId): string
    {
        return $this->metaPrefix . $jobId;
    }

    private static function nowMs(): int
    {
        return (int) round(microtime(true) * 1000);
    }

    private static function tokenHex(int $bytes = 8): string
    {
        return bin2hex(random_bytes($bytes));
    }

    /**
     * Flatten an associative ["field" => "value"] map into the variadic
     * field/value/field/value form HSET expects in Predis 3.x.
     *
     * @return list<string>
     */
    private static function flattenFields(array $fields): array
    {
        $out = [];
        foreach ($fields as $k => $v) {
            $out[] = (string) $k;
            $out[] = (string) $v;
        }
        return $out;
    }

    /**
     * Push a new job onto the pending list and return its ID.
     */
    public function enqueue(array $payload): string
    {
        $jobId = self::tokenHex(8);
        $nowMs = self::nowMs();
        $meta = [
            'id' => $jobId,
            'payload' => json_encode($payload, JSON_UNESCAPED_SLASHES),
            'status' => 'pending',
            'attempts' => '0',
            'enqueued_at_ms' => (string) $nowMs,
            'claim_token' => '',
        ];

        $pipe = $this->redis->pipeline();
        $pipe->hset($this->metaKey($jobId), ...self::flattenFields($meta));
        $pipe->lpush($this->pendingKey, [$jobId]);
        $pipe->execute();

        $this->redis->hincrby($this->statsKey, 'enqueued_total', 1);
        return $jobId;
    }

    /**
     * Block until a job is available, then atomically claim it.
     *
     * Uses BRPOPLPUSH to wait for a pending job and move it to the
     * processing list in a single Redis call. Returns null if nothing
     * arrives before $timeoutMs.
     */
    public function claim(int $timeoutMs = 1000): ?ClaimedJob
    {
        // Predis brpoplpush takes whole seconds (server-side blocking
        // semantics). Round up so a sub-second timeout still blocks at
        // least once.
        $timeoutSec = max(1, (int) ceil($timeoutMs / 1000));
        $jobId = $this->redis->brpoplpush($this->pendingKey, $this->processingKey, $timeoutSec);
        if ($jobId === null || $jobId === false || $jobId === '') {
            return null;
        }

        $token = self::tokenHex(8);
        $nowMs = self::nowMs();
        $metaKey = $this->metaKey($jobId);

        $pipe = $this->redis->pipeline();
        $pipe->hset($metaKey, ...self::flattenFields([
            'status' => 'processing',
            'claimed_at_ms' => (string) $nowMs,
            'claim_token' => $token,
        ]));
        $pipe->hincrby($metaKey, 'attempts', 1);
        $pipe->hgetall($metaKey);
        $results = $pipe->execute();
        $meta = $results[2] ?? [];

        $payload = [];
        if (isset($meta['payload'])) {
            $decoded = json_decode($meta['payload'], true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        }
        $attempts = isset($meta['attempts']) ? (int) $meta['attempts'] : 1;
        return new ClaimedJob((string) $jobId, $payload, $attempts, $token);
    }

    /**
     * Mark a job complete and remove it from the processing list.
     *
     * Only succeeds if the worker still owns the claim — a job that was
     * reclaimed by the visibility-timeout sweep can no longer be
     * completed by the original claimant.
     */
    public function complete(ClaimedJob $job, array $result): bool
    {
        $ok = $this->redis->eval(
            self::COMPLETE_SCRIPT,
            3,
            $this->metaPrefix,
            $this->processingKey,
            $this->completedKey,
            $job->id,
            $job->claimToken,
            'completed',
            (string) self::nowMs(),
            json_encode($result, JSON_UNESCAPED_SLASHES),
            (string) $this->completedTtl,
            (string) $this->completedHistory
        );
        if (!$ok) {
            return false;
        }
        $this->redis->publish(
            $this->eventsChannel,
            json_encode(['id' => $job->id, 'status' => 'completed'])
        );
        $this->redis->hincrby($this->statsKey, 'completed_total', 1);
        return true;
    }

    /**
     * Record a failure. Retries up to max_attempts, then gives up.
     *
     * If the job still has attempts left, it goes back on the pending
     * list. If it has exhausted its retries, it moves to the failed list
     * and the metadata hash records the final error.
     */
    public function fail(ClaimedJob $job, string $error): bool
    {
        $retry = $job->attempts < $this->maxAttempts;
        $result = $this->redis->eval(
            self::FAIL_SCRIPT,
            4,
            $this->metaPrefix,
            $this->processingKey,
            $this->pendingKey,
            $this->failedKey,
            $job->id,
            $job->claimToken,
            $error,
            (string) self::nowMs(),
            (string) $this->completedTtl,
            (string) $this->completedHistory,
            $retry ? '1' : '0'
        );
        if (!$result) {
            return false;
        }
        $this->redis->publish(
            $this->eventsChannel,
            json_encode(['id' => $job->id, 'status' => $retry ? 'retry' : 'failed'])
        );
        if (!$retry) {
            $this->redis->hincrby($this->statsKey, 'failed_total', 1);
        }
        return true;
    }

    /**
     * Move processing-list jobs past the visibility timeout back to pending.
     *
     * @return list<string>
     */
    public function reclaimStuck(): array
    {
        $reclaimed = $this->redis->eval(
            self::RECLAIM_SCRIPT,
            3,
            $this->pendingKey,
            $this->processingKey,
            $this->metaPrefix,
            (string) self::nowMs(),
            (string) $this->visibilityMs
        );
        $list = is_array($reclaimed) ? array_values(array_map('strval', $reclaimed)) : [];
        if (count($list) > 0) {
            $this->redis->hincrby($this->statsKey, 'reclaimed_total', count($list));
        }
        return $list;
    }

    /**
     * Return the current metadata hash for $jobId, decoded.
     */
    public function getJob(string $jobId): ?array
    {
        $meta = $this->redis->hgetall($this->metaKey($jobId));
        if (!$meta) {
            return null;
        }
        if (isset($meta['payload'])) {
            $decoded = json_decode($meta['payload'], true);
            $meta['payload'] = is_array($decoded) ? $decoded : [];
        }
        if (isset($meta['result'])) {
            $decoded = json_decode($meta['result'], true);
            if ($decoded !== null) {
                $meta['result'] = $decoded;
            }
        }
        return $meta;
    }

    /**
     * @return list<string>
     */
    public function listPending(): array
    {
        $ids = $this->redis->lrange($this->pendingKey, 0, -1);
        return array_reverse(array_map('strval', $ids ?: []));
    }

    /**
     * @return list<string>
     */
    public function listProcessing(): array
    {
        $ids = $this->redis->lrange($this->processingKey, 0, -1);
        return array_map('strval', $ids ?: []);
    }

    /**
     * @return list<string>
     */
    public function listCompleted(): array
    {
        $ids = $this->redis->lrange($this->completedKey, 0, -1);
        return array_map('strval', $ids ?: []);
    }

    /**
     * @return list<string>
     */
    public function listFailed(): array
    {
        $ids = $this->redis->lrange($this->failedKey, 0, -1);
        return array_map('strval', $ids ?: []);
    }

    /**
     * Return counters plus the current queue depth.
     */
    public function stats(): array
    {
        $pipe = $this->redis->pipeline();
        $pipe->llen($this->pendingKey);
        $pipe->llen($this->processingKey);
        $pipe->llen($this->completedKey);
        $pipe->llen($this->failedKey);
        $pipe->hgetall($this->statsKey);
        $results = $pipe->execute();

        [$pending, $processing, $completed, $failed, $statsHash] = $results;
        $statsHash = is_array($statsHash) ? $statsHash : [];

        return [
            'enqueued_total' => (int) ($statsHash['enqueued_total'] ?? 0),
            'completed_total' => (int) ($statsHash['completed_total'] ?? 0),
            'failed_total' => (int) ($statsHash['failed_total'] ?? 0),
            'reclaimed_total' => (int) ($statsHash['reclaimed_total'] ?? 0),
            'pending_depth' => (int) $pending,
            'processing_depth' => (int) $processing,
            'completed_depth' => (int) $completed,
            'failed_depth' => (int) $failed,
            'visibility_ms' => $this->visibilityMs,
        ];
    }

    public function resetStats(): void
    {
        $this->redis->del([$this->statsKey]);
    }

    /**
     * Delete every queue list and every job metadata hash for this queue.
     * Only touches keys under queue:{name}:* via SCAN — never FLUSHDB.
     */
    public function purge(): void
    {
        $patterns = [
            $this->pendingKey,
            $this->processingKey,
            $this->completedKey,
            $this->failedKey,
        ];
        $this->redis->del($patterns);

        $cursor = '0';
        do {
            // Predis exposes SCAN as a method returning [cursor, keys].
            $result = $this->redis->scan($cursor, ['MATCH' => $this->metaPrefix . '*', 'COUNT' => 100]);
            $cursor = (string) $result[0];
            $keys = $result[1] ?? [];
            if (!empty($keys)) {
                $this->redis->del($keys);
            }
        } while ($cursor !== '0');

        $this->resetStats();
    }
}
