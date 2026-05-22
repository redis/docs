// Package jobqueue provides a Redis-backed reliable job queue.
//
// Jobs are pushed onto a pending list and atomically moved to a processing
// list when a worker claims them. Each job's payload, status, attempts, and
// result live in a Redis hash. A reclaimer scans the processing list for
// jobs older than the visibility timeout and pushes them back to pending so
// no work is lost when a worker dies mid-job.
package jobqueue

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Mark a job complete and remove it from the processing list. Only deletes
// from the processing list if the worker still owns the claim token; this
// prevents a worker that was reclaimed (because it went over the visibility
// timeout) from later marking a job complete that another worker has
// already picked up.
const completeScript = `
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
`

// Record a failure. If the job still has retries left it goes back to the
// pending list; otherwise it lands in the failed list with its metadata
// expiring on the same schedule as completed jobs. Only acts if the
// caller still owns the claim token - a reclaimed job can't be failed
// by the original claimant.
const failScript = `
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
`

// Reclaim jobs whose claim has gone stale. Walks the processing list and
// moves any job past the visibility timeout back to the pending list.
// A job is past the timeout if either:
//   - claimed_at_ms is set and (now - claimed_at_ms) > visibility_ms, OR
//   - claimed_at_ms is missing (worker crashed between BLMOVE and the
//     metadata write) and (now - enqueued_at_ms) > 2 * visibility_ms.
//
// Runs in one round trip so a concurrent worker can't claim a
// half-reclaimed job.
const reclaimScript = `
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
`

// Options configures a RedisJobQueue.
type Options struct {
	// QueueName is the logical queue name used in Redis keys. Default: "jobs".
	QueueName string
	// VisibilityMs is the reclaim window for stuck jobs (milliseconds). Default: 5000.
	VisibilityMs int
	// CompletedTTL is the seconds TTL applied to a job's metadata hash once
	// it lands on the completed or failed list. Default: 300.
	CompletedTTL int
	// CompletedHistory caps the length of the completed and failed lists.
	// Default: 50.
	CompletedHistory int
	// MaxAttempts is the maximum number of claim attempts before a job is
	// moved to the failed list. Default: 3.
	MaxAttempts int
}

// ClaimedJob is a job that has been atomically moved into the processing list.
type ClaimedJob struct {
	ID         string
	Payload    map[string]any
	Attempts   int
	ClaimToken string
}

// RedisJobQueue is a reliable FIFO job queue with visibility-timeout reclaim.
type RedisJobQueue struct {
	client *redis.Client

	queueName        string
	visibilityMs     int
	completedTTL     int
	completedHistory int
	maxAttempts      int

	pendingKey    string
	processingKey string
	completedKey  string
	failedKey     string
	metaPrefix    string
	eventsChannel string

	completeScript *redis.Script
	failScript     *redis.Script
	reclaimScript  *redis.Script

	statsMu      sync.Mutex
	enqueuedN    int
	completedN   int
	failedN      int
	reclaimedN   int
}

// NewRedisJobQueue builds a RedisJobQueue. The Redis client must be
// configured to decode responses as strings (the default for go-redis).
func NewRedisJobQueue(client *redis.Client, opts Options) *RedisJobQueue {
	if opts.QueueName == "" {
		opts.QueueName = "jobs"
	}
	if opts.VisibilityMs <= 0 {
		opts.VisibilityMs = 5000
	}
	if opts.CompletedTTL <= 0 {
		opts.CompletedTTL = 300
	}
	if opts.CompletedHistory <= 0 {
		opts.CompletedHistory = 50
	}
	if opts.MaxAttempts <= 0 {
		opts.MaxAttempts = 3
	}

	q := &RedisJobQueue{
		client:           client,
		queueName:        opts.QueueName,
		visibilityMs:     opts.VisibilityMs,
		completedTTL:     opts.CompletedTTL,
		completedHistory: opts.CompletedHistory,
		maxAttempts:      opts.MaxAttempts,
		pendingKey:       fmt.Sprintf("queue:%s:pending", opts.QueueName),
		processingKey:    fmt.Sprintf("queue:%s:processing", opts.QueueName),
		completedKey:     fmt.Sprintf("queue:%s:completed", opts.QueueName),
		failedKey:        fmt.Sprintf("queue:%s:failed", opts.QueueName),
		metaPrefix:       fmt.Sprintf("queue:%s:job:", opts.QueueName),
		eventsChannel:    fmt.Sprintf("queue:%s:events", opts.QueueName),
		completeScript:   redis.NewScript(completeScript),
		failScript:       redis.NewScript(failScript),
		reclaimScript:    redis.NewScript(reclaimScript),
	}
	return q
}

// VisibilityMs returns the configured visibility timeout in milliseconds.
func (q *RedisJobQueue) VisibilityMs() int { return q.visibilityMs }

func (q *RedisJobQueue) metaKey(jobID string) string {
	return q.metaPrefix + jobID
}

func nowMs() int64 {
	return time.Now().UnixNano() / int64(time.Millisecond)
}

func tokenHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		// Fall back to a time-based token if the system RNG is broken.
		return strconv.FormatInt(time.Now().UnixNano(), 16)
	}
	return hex.EncodeToString(b)
}

// Enqueue pushes a new job onto the pending list and returns its ID.
func (q *RedisJobQueue) Enqueue(ctx context.Context, payload map[string]any) (string, error) {
	jobID := tokenHex(8)
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal payload: %w", err)
	}
	now := nowMs()
	meta := map[string]interface{}{
		"id":             jobID,
		"payload":        string(payloadJSON),
		"status":         "pending",
		"attempts":       0,
		"enqueued_at_ms": now,
		"claim_token":    "",
	}
	pipe := q.client.Pipeline()
	pipe.HSet(ctx, q.metaKey(jobID), meta)
	pipe.LPush(ctx, q.pendingKey, jobID)
	if _, err := pipe.Exec(ctx); err != nil {
		return "", err
	}
	q.statsMu.Lock()
	q.enqueuedN++
	q.statsMu.Unlock()
	return jobID, nil
}

// Claim blocks until a job is available, then atomically claims it.
//
// Uses BLMOVE to wait for a pending job and move it to the processing list
// in a single Redis call. Returns (nil, nil) if no job arrives before
// timeoutMs.
func (q *RedisJobQueue) Claim(ctx context.Context, timeoutMs int) (*ClaimedJob, error) {
	timeout := time.Duration(timeoutMs) * time.Millisecond
	if timeout < 100*time.Millisecond {
		timeout = 100 * time.Millisecond
	}
	// BLMOVE pending RIGHT processing LEFT timeout -- pops from the right
	// of pending and pushes to the left of processing, matching the
	// reference's BRPOPLPUSH semantics.
	jobID, err := q.client.BLMove(ctx, q.pendingKey, q.processingKey, "RIGHT", "LEFT", timeout).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		// If the caller cancelled the context while blocked, treat that as
		// "no job arrived" rather than an error.
		if ctx.Err() != nil {
			return nil, nil
		}
		return nil, err
	}

	token := tokenHex(8)
	now := nowMs()
	metaKey := q.metaKey(jobID)

	pipe := q.client.Pipeline()
	pipe.HSet(ctx, metaKey, map[string]interface{}{
		"status":        "processing",
		"claimed_at_ms": now,
		"claim_token":   token,
	})
	pipe.HIncrBy(ctx, metaKey, "attempts", 1)
	getAll := pipe.HGetAll(ctx, metaKey)
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, err
	}

	meta := getAll.Val()
	payload := map[string]any{}
	if raw, ok := meta["payload"]; ok && raw != "" {
		_ = json.Unmarshal([]byte(raw), &payload)
	}
	attempts := 1
	if a, ok := meta["attempts"]; ok {
		if n, err := strconv.Atoi(a); err == nil {
			attempts = n
		}
	}
	return &ClaimedJob{
		ID:         jobID,
		Payload:    payload,
		Attempts:   attempts,
		ClaimToken: token,
	}, nil
}

// Complete marks a job complete and removes it from the processing list.
//
// Only succeeds if the worker still owns the claim - a job that was
// reclaimed by the visibility-timeout sweep can no longer be completed by
// the original claimant.
func (q *RedisJobQueue) Complete(ctx context.Context, job *ClaimedJob, result map[string]any) (bool, error) {
	resultJSON, err := json.Marshal(result)
	if err != nil {
		return false, fmt.Errorf("marshal result: %w", err)
	}
	keys := []string{q.metaPrefix, q.processingKey, q.completedKey}
	args := []interface{}{
		job.ID,
		job.ClaimToken,
		"completed",
		nowMs(),
		string(resultJSON),
		q.completedTTL,
		q.completedHistory,
	}
	res, err := q.completeScript.Run(ctx, q.client, keys, args...).Result()
	if err != nil {
		return false, err
	}
	ok := false
	if n, isInt := res.(int64); isInt && n == 1 {
		ok = true
	}
	if !ok {
		return false, nil
	}
	eventPayload, _ := json.Marshal(map[string]any{"id": job.ID, "status": "completed"})
	q.client.Publish(ctx, q.eventsChannel, string(eventPayload))
	q.statsMu.Lock()
	q.completedN++
	q.statsMu.Unlock()
	return true, nil
}

// Fail records a failure. Retries up to MaxAttempts, then gives up.
//
// If the job still has attempts left, it goes back on the pending list.
// If it has exhausted its retries, it moves to the failed list and the
// metadata hash records the final error.
func (q *RedisJobQueue) Fail(ctx context.Context, job *ClaimedJob, errMsg string) (bool, error) {
	retry := job.Attempts < q.maxAttempts
	retryArg := "0"
	if retry {
		retryArg = "1"
	}
	keys := []string{
		q.metaPrefix,
		q.processingKey,
		q.pendingKey,
		q.failedKey,
	}
	args := []interface{}{
		job.ID,
		job.ClaimToken,
		errMsg,
		nowMs(),
		q.completedTTL,
		q.completedHistory,
		retryArg,
	}
	res, err := q.failScript.Run(ctx, q.client, keys, args...).Result()
	if err != nil {
		return false, err
	}
	n, isInt := res.(int64)
	if !isInt || n == 0 {
		return false, nil
	}
	status := "failed"
	if retry {
		status = "retry"
	}
	eventPayload, _ := json.Marshal(map[string]any{"id": job.ID, "status": status})
	q.client.Publish(ctx, q.eventsChannel, string(eventPayload))
	if !retry {
		q.statsMu.Lock()
		q.failedN++
		q.statsMu.Unlock()
	}
	return true, nil
}

// ReclaimStuck moves processing-list jobs past the visibility timeout back
// to pending. Returns the IDs of reclaimed jobs.
func (q *RedisJobQueue) ReclaimStuck(ctx context.Context) ([]string, error) {
	keys := []string{q.pendingKey, q.processingKey, q.metaPrefix}
	args := []interface{}{nowMs(), q.visibilityMs}
	res, err := q.reclaimScript.Run(ctx, q.client, keys, args...).Result()
	if err != nil {
		return nil, err
	}
	raw, ok := res.([]interface{})
	if !ok {
		return []string{}, nil
	}
	out := make([]string, 0, len(raw))
	for _, item := range raw {
		if s, ok := item.(string); ok {
			out = append(out, s)
		}
	}
	if len(out) > 0 {
		q.statsMu.Lock()
		q.reclaimedN += len(out)
		q.statsMu.Unlock()
	}
	return out, nil
}

// GetJob returns the current metadata hash for jobID, decoded. Returns nil
// if the job doesn't exist.
func (q *RedisJobQueue) GetJob(ctx context.Context, jobID string) (map[string]any, error) {
	meta, err := q.client.HGetAll(ctx, q.metaKey(jobID)).Result()
	if err != nil {
		return nil, err
	}
	if len(meta) == 0 {
		return nil, nil
	}
	out := make(map[string]any, len(meta))
	for k, v := range meta {
		out[k] = v
	}
	if raw, ok := meta["payload"]; ok && raw != "" {
		var parsed any
		if err := json.Unmarshal([]byte(raw), &parsed); err == nil {
			out["payload"] = parsed
		} else {
			out["payload"] = map[string]any{}
		}
	} else {
		out["payload"] = map[string]any{}
	}
	if raw, ok := meta["result"]; ok && raw != "" {
		var parsed any
		if err := json.Unmarshal([]byte(raw), &parsed); err == nil {
			out["result"] = parsed
		}
	}
	return out, nil
}

// ListPending returns the pending job IDs with the oldest first.
func (q *RedisJobQueue) ListPending(ctx context.Context) ([]string, error) {
	ids, err := q.client.LRange(ctx, q.pendingKey, 0, -1).Result()
	if err != nil {
		return nil, err
	}
	// LPUSH puts newest at the head; reverse so oldest comes first.
	reversed := make([]string, len(ids))
	for i, id := range ids {
		reversed[len(ids)-1-i] = id
	}
	return reversed, nil
}

// ListProcessing returns the job IDs currently in the processing list.
func (q *RedisJobQueue) ListProcessing(ctx context.Context) ([]string, error) {
	return q.client.LRange(ctx, q.processingKey, 0, -1).Result()
}

// ListCompleted returns the most recent completed job IDs (newest first).
func (q *RedisJobQueue) ListCompleted(ctx context.Context) ([]string, error) {
	return q.client.LRange(ctx, q.completedKey, 0, -1).Result()
}

// ListFailed returns the most recent failed job IDs (newest first).
func (q *RedisJobQueue) ListFailed(ctx context.Context) ([]string, error) {
	return q.client.LRange(ctx, q.failedKey, 0, -1).Result()
}

// Stats returns counters plus the current queue depth.
func (q *RedisJobQueue) Stats(ctx context.Context) (map[string]any, error) {
	pipe := q.client.Pipeline()
	pendingCmd := pipe.LLen(ctx, q.pendingKey)
	processingCmd := pipe.LLen(ctx, q.processingKey)
	completedCmd := pipe.LLen(ctx, q.completedKey)
	failedCmd := pipe.LLen(ctx, q.failedKey)
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, err
	}
	q.statsMu.Lock()
	defer q.statsMu.Unlock()
	return map[string]any{
		"enqueued_total":   q.enqueuedN,
		"completed_total":  q.completedN,
		"failed_total":     q.failedN,
		"reclaimed_total":  q.reclaimedN,
		"pending_depth":    pendingCmd.Val(),
		"processing_depth": processingCmd.Val(),
		"completed_depth":  completedCmd.Val(),
		"failed_depth":     failedCmd.Val(),
		"visibility_ms":    q.visibilityMs,
	}, nil
}

// ResetStats zeroes the in-process counters.
func (q *RedisJobQueue) ResetStats() {
	q.statsMu.Lock()
	defer q.statsMu.Unlock()
	q.enqueuedN = 0
	q.completedN = 0
	q.failedN = 0
	q.reclaimedN = 0
}

// Purge deletes every queue list and every job metadata hash for this
// queue. Only touches keys matching queue:{name}:*.
func (q *RedisJobQueue) Purge(ctx context.Context) error {
	pipe := q.client.Pipeline()
	pipe.Del(ctx, q.pendingKey, q.processingKey, q.completedKey, q.failedKey)
	var cursor uint64
	pattern := q.metaPrefix + "*"
	for {
		keys, next, err := q.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return err
		}
		for _, k := range keys {
			pipe.Del(ctx, k)
		}
		cursor = next
		if cursor == 0 {
			break
		}
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return err
	}
	q.ResetStats()
	return nil
}
