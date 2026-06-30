//! Redis-backed job queue helper.
//!
//! Jobs are pushed onto a pending list and atomically moved to a processing
//! list when a worker claims them. Each job's payload, status, attempts, and
//! result live in a Redis hash. A reclaimer scans the processing list for
//! jobs older than the visibility timeout and pushes them back to pending so
//! no work is lost when a worker dies mid-job.

use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use rand::RngCore;
use redis::aio::ConnectionManager;
use redis::{AsyncCommands, RedisResult, Script};
use serde_json::{json, Value};

// Mark a job complete and remove it from the processing list. Only deletes
// from the processing list if the worker still owns the claim token; this
// prevents a worker that was reclaimed (because it went over the visibility
// timeout) from later marking a job complete that another worker has
// already picked up.
const COMPLETE_SCRIPT: &str = r##"
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
"##;

// Record a failure. If the job still has retries left it goes back to the
// pending list; otherwise it lands in the failed list with its metadata
// expiring on the same schedule as completed jobs. Only acts if the
// caller still owns the claim token — a reclaimed job can't be failed
// by the original claimant.
const FAIL_SCRIPT: &str = r##"
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
"##;

// Reclaim jobs whose claim has gone stale. Walks the processing list and
// moves any job past the visibility timeout back to the pending list.
// A job is past the timeout if either:
//   - claimed_at_ms is set and (now - claimed_at_ms) > visibility_ms, OR
//   - claimed_at_ms is missing (worker crashed between BRPOPLPUSH and the
//     metadata write) and (now - enqueued_at_ms) > 2 * visibility_ms.
// Runs in one round trip so a concurrent worker can't claim a
// half-reclaimed job.
const RECLAIM_SCRIPT: &str = r##"
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
"##;

/// Options controlling the queue's behaviour.
#[derive(Clone, Debug)]
pub struct JobQueueOptions {
    pub queue_name: String,
    pub visibility_ms: u64,
    pub completed_ttl: u64,
    pub completed_history: i64,
    pub max_attempts: i64,
}

impl Default for JobQueueOptions {
    fn default() -> Self {
        Self {
            queue_name: "jobs".to_string(),
            visibility_ms: 5000,
            completed_ttl: 300,
            completed_history: 50,
            max_attempts: 3,
        }
    }
}

/// A job that has been atomically moved into the processing list.
#[derive(Clone, Debug)]
pub struct ClaimedJob {
    pub id: String,
    pub payload: Value,
    pub attempts: i64,
    pub claim_token: String,
}

/// Reliable FIFO job queue with visibility-timeout reclaim.
#[derive(Clone)]
pub struct RedisJobQueue {
    conn: ConnectionManager,
    queue_name: String,
    visibility_ms: u64,
    completed_ttl: u64,
    completed_history: i64,
    max_attempts: i64,
    pending_key: String,
    processing_key: String,
    completed_key: String,
    failed_key: String,
    meta_prefix: String,
    events_channel: String,

    enqueued_total: Arc<AtomicI64>,
    completed_total: Arc<AtomicI64>,
    failed_total: Arc<AtomicI64>,
    reclaimed_total: Arc<AtomicI64>,
}

impl RedisJobQueue {
    /// Create a new queue helper around an existing `ConnectionManager`.
    pub fn new(conn: ConnectionManager, opts: JobQueueOptions) -> Self {
        let pending_key = format!("queue:{}:pending", opts.queue_name);
        let processing_key = format!("queue:{}:processing", opts.queue_name);
        let completed_key = format!("queue:{}:completed", opts.queue_name);
        let failed_key = format!("queue:{}:failed", opts.queue_name);
        let meta_prefix = format!("queue:{}:job:", opts.queue_name);
        let events_channel = format!("queue:{}:events", opts.queue_name);

        Self {
            conn,
            queue_name: opts.queue_name,
            visibility_ms: opts.visibility_ms,
            completed_ttl: opts.completed_ttl,
            completed_history: opts.completed_history,
            max_attempts: opts.max_attempts,
            pending_key,
            processing_key,
            completed_key,
            failed_key,
            meta_prefix,
            events_channel,

            enqueued_total: Arc::new(AtomicI64::new(0)),
            completed_total: Arc::new(AtomicI64::new(0)),
            failed_total: Arc::new(AtomicI64::new(0)),
            reclaimed_total: Arc::new(AtomicI64::new(0)),
        }
    }

    pub fn visibility_ms(&self) -> u64 {
        self.visibility_ms
    }

    #[allow(dead_code)]
    pub fn queue_name(&self) -> &str {
        &self.queue_name
    }

    fn meta_key(&self, job_id: &str) -> String {
        format!("{}{}", self.meta_prefix, job_id)
    }

    fn now_ms() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0)
    }

    fn token_hex(bytes: usize) -> String {
        let mut buf = vec![0u8; bytes];
        rand::thread_rng().fill_bytes(&mut buf);
        let mut out = String::with_capacity(bytes * 2);
        for b in buf {
            out.push_str(&format!("{:02x}", b));
        }
        out
    }

    /// Push a new job onto the pending list and return its ID.
    pub async fn enqueue(&self, payload: Value) -> RedisResult<String> {
        let job_id = Self::token_hex(8);
        let now_ms = Self::now_ms();
        let meta_key = self.meta_key(&job_id);
        let payload_str = serde_json::to_string(&payload).unwrap_or_else(|_| "{}".to_string());

        let fields: Vec<(&str, String)> = vec![
            ("id", job_id.clone()),
            ("payload", payload_str),
            ("status", "pending".to_string()),
            ("attempts", "0".to_string()),
            ("enqueued_at_ms", now_ms.to_string()),
            ("claim_token", "".to_string()),
        ];

        let mut conn = self.conn.clone();
        let mut pipe = redis::pipe();
        pipe.atomic()
            .hset_multiple(&meta_key, &fields)
            .ignore()
            .lpush(&self.pending_key, &job_id)
            .ignore();
        let _: () = pipe.query_async(&mut conn).await?;

        self.enqueued_total.fetch_add(1, Ordering::Relaxed);
        Ok(job_id)
    }

    /// Block until a job is available, then atomically claim it.
    ///
    /// Uses `BLMOVE` to wait for a pending job and move it to the processing
    /// list in a single Redis call. Returns `None` if nothing arrives before
    /// `timeout_ms`.
    pub async fn claim(&self, timeout_ms: u64) -> RedisResult<Option<ClaimedJob>> {
        // The blocking BLMOVE takes a timeout in seconds (float). The Python
        // reference rounds up to a 0.1s minimum to avoid sub-tick blocking.
        let timeout_secs = (timeout_ms as f64 / 1000.0).max(0.1);

        let mut conn = self.conn.clone();
        let job_id: Option<String> = redis::cmd("BLMOVE")
            .arg(&self.pending_key)
            .arg(&self.processing_key)
            .arg("RIGHT")
            .arg("LEFT")
            .arg(timeout_secs)
            .query_async(&mut conn)
            .await?;

        let job_id = match job_id {
            Some(id) => id,
            None => return Ok(None),
        };

        let token = Self::token_hex(8);
        let now_ms = Self::now_ms();
        let meta_key = self.meta_key(&job_id);

        let claim_fields: Vec<(&str, String)> = vec![
            ("status", "processing".to_string()),
            ("claimed_at_ms", now_ms.to_string()),
            ("claim_token", token.clone()),
        ];

        let (_, _, meta): ((), i64, std::collections::HashMap<String, String>) = redis::pipe()
            .atomic()
            .hset_multiple(&meta_key, &claim_fields)
            .hincr(&meta_key, "attempts", 1)
            .hgetall(&meta_key)
            .query_async(&mut conn)
            .await?;

        let payload = meta
            .get("payload")
            .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
            .unwrap_or_else(|| json!({}));
        let attempts = meta
            .get("attempts")
            .and_then(|raw| raw.parse::<i64>().ok())
            .unwrap_or(1);

        Ok(Some(ClaimedJob {
            id: job_id,
            payload,
            attempts,
            claim_token: token,
        }))
    }

    /// Mark a job complete and remove it from the processing list.
    ///
    /// Only succeeds if the worker still owns the claim. A job that was
    /// reclaimed by the visibility-timeout sweep can no longer be completed
    /// by the original claimant.
    pub async fn complete(&self, job: &ClaimedJob, result: Value) -> RedisResult<bool> {
        let result_str = serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string());
        let now_ms = Self::now_ms();

        let mut conn = self.conn.clone();
        let ok: i64 = Script::new(COMPLETE_SCRIPT)
            .key(&self.meta_prefix)
            .key(&self.processing_key)
            .key(&self.completed_key)
            .arg(&job.id)
            .arg(&job.claim_token)
            .arg("completed")
            .arg(now_ms)
            .arg(result_str)
            .arg(self.completed_ttl as i64)
            .arg(self.completed_history)
            .invoke_async(&mut conn)
            .await?;

        if ok == 0 {
            return Ok(false);
        }

        let event = json!({"id": job.id, "status": "completed"}).to_string();
        let _: i64 = conn.publish(&self.events_channel, event).await?;
        self.completed_total.fetch_add(1, Ordering::Relaxed);
        Ok(true)
    }

    /// Record a failure. Retries up to `max_attempts`, then gives up.
    pub async fn fail(&self, job: &ClaimedJob, error: &str) -> RedisResult<bool> {
        let retry = job.attempts < self.max_attempts;
        let now_ms = Self::now_ms();
        let retry_arg = if retry { "1" } else { "0" };

        let mut conn = self.conn.clone();
        let result: i64 = Script::new(FAIL_SCRIPT)
            .key(&self.meta_prefix)
            .key(&self.processing_key)
            .key(&self.pending_key)
            .key(&self.failed_key)
            .arg(&job.id)
            .arg(&job.claim_token)
            .arg(error)
            .arg(now_ms)
            .arg(self.completed_ttl as i64)
            .arg(self.completed_history)
            .arg(retry_arg)
            .invoke_async(&mut conn)
            .await?;

        if result == 0 {
            return Ok(false);
        }

        let status = if retry { "retry" } else { "failed" };
        let event = json!({"id": job.id, "status": status}).to_string();
        let _: i64 = conn.publish(&self.events_channel, event).await?;
        if !retry {
            self.failed_total.fetch_add(1, Ordering::Relaxed);
        }
        Ok(true)
    }

    /// Move processing-list jobs past the visibility timeout back to pending.
    pub async fn reclaim_stuck(&self) -> RedisResult<Vec<String>> {
        let now_ms = Self::now_ms();
        let mut conn = self.conn.clone();
        let reclaimed: Vec<String> = Script::new(RECLAIM_SCRIPT)
            .key(&self.pending_key)
            .key(&self.processing_key)
            .key(&self.meta_prefix)
            .arg(now_ms)
            .arg(self.visibility_ms as i64)
            .invoke_async(&mut conn)
            .await?;

        if !reclaimed.is_empty() {
            self.reclaimed_total
                .fetch_add(reclaimed.len() as i64, Ordering::Relaxed);
        }
        Ok(reclaimed)
    }

    /// Return the current metadata hash for `job_id`, decoded.
    pub async fn get_job(&self, job_id: &str) -> RedisResult<Option<Value>> {
        let mut conn = self.conn.clone();
        let meta: std::collections::HashMap<String, String> =
            conn.hgetall(self.meta_key(job_id)).await?;
        if meta.is_empty() {
            return Ok(None);
        }

        let mut out = serde_json::Map::new();
        for (k, v) in meta.iter() {
            if k == "payload" {
                let parsed = serde_json::from_str::<Value>(v).unwrap_or_else(|_| json!({}));
                out.insert(k.clone(), parsed);
            } else if k == "result" {
                let parsed = serde_json::from_str::<Value>(v).unwrap_or_else(|_| Value::String(v.clone()));
                out.insert(k.clone(), parsed);
            } else {
                out.insert(k.clone(), Value::String(v.clone()));
            }
        }
        Ok(Some(Value::Object(out)))
    }

    pub async fn list_pending(&self) -> RedisResult<Vec<String>> {
        let mut conn = self.conn.clone();
        let mut ids: Vec<String> = conn.lrange(&self.pending_key, 0, -1).await?;
        ids.reverse();
        Ok(ids)
    }

    pub async fn list_processing(&self) -> RedisResult<Vec<String>> {
        let mut conn = self.conn.clone();
        conn.lrange(&self.processing_key, 0, -1).await
    }

    pub async fn list_completed(&self) -> RedisResult<Vec<String>> {
        let mut conn = self.conn.clone();
        conn.lrange(&self.completed_key, 0, -1).await
    }

    pub async fn list_failed(&self) -> RedisResult<Vec<String>> {
        let mut conn = self.conn.clone();
        conn.lrange(&self.failed_key, 0, -1).await
    }

    /// Return counters plus the current queue depth.
    pub async fn stats(&self) -> RedisResult<Value> {
        let mut conn = self.conn.clone();
        let (pending, processing, completed, failed): (i64, i64, i64, i64) = redis::pipe()
            .atomic()
            .llen(&self.pending_key)
            .llen(&self.processing_key)
            .llen(&self.completed_key)
            .llen(&self.failed_key)
            .query_async(&mut conn)
            .await?;

        Ok(json!({
            "enqueued_total": self.enqueued_total.load(Ordering::Relaxed),
            "completed_total": self.completed_total.load(Ordering::Relaxed),
            "failed_total": self.failed_total.load(Ordering::Relaxed),
            "reclaimed_total": self.reclaimed_total.load(Ordering::Relaxed),
            "pending_depth": pending,
            "processing_depth": processing,
            "completed_depth": completed,
            "failed_depth": failed,
            "visibility_ms": self.visibility_ms,
        }))
    }

    /// Reset the in-process counters.
    pub fn reset_stats(&self) {
        self.enqueued_total.store(0, Ordering::Relaxed);
        self.completed_total.store(0, Ordering::Relaxed);
        self.failed_total.store(0, Ordering::Relaxed);
        self.reclaimed_total.store(0, Ordering::Relaxed);
    }

    /// Delete every queue list and every job metadata hash.
    pub async fn purge(&self) -> RedisResult<()> {
        let mut conn = self.conn.clone();

        // Delete the four list keys in one pipeline.
        let _: () = redis::pipe()
            .atomic()
            .del(&self.pending_key)
            .ignore()
            .del(&self.processing_key)
            .ignore()
            .del(&self.completed_key)
            .ignore()
            .del(&self.failed_key)
            .ignore()
            .query_async(&mut conn)
            .await?;

        // Scan-and-delete every metadata hash for this queue.
        let pattern = format!("{}*", self.meta_prefix);
        let mut cursor: u64 = 0;
        loop {
            let (next_cursor, keys): (u64, Vec<String>) = redis::cmd("SCAN")
                .arg(cursor)
                .arg("MATCH")
                .arg(&pattern)
                .arg("COUNT")
                .arg(200)
                .query_async(&mut conn)
                .await?;
            if !keys.is_empty() {
                let _: () = conn.del(&keys).await?;
            }
            if next_cursor == 0 {
                break;
            }
            cursor = next_cursor;
        }

        self.reset_stats();
        Ok(())
    }
}
