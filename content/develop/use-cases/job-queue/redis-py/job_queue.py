"""
Redis-backed job queue helper.

Jobs are pushed onto a pending list and atomically moved to a processing
list when a worker claims them. Each job's payload, status, attempts, and
result live in a Redis hash. A reclaimer scans the processing list for
jobs older than the visibility timeout and pushes them back to pending so
no work is lost when a worker dies mid-job.
"""

from __future__ import annotations

import json
import secrets
import time
from threading import Lock
from typing import Optional

import redis


# Mark a job complete and remove it from the processing list. Only deletes
# from the processing list if the worker still owns the claim token; this
# prevents a worker that was reclaimed (because it went over the visibility
# timeout) from later marking a job complete that another worker has
# already picked up.
COMPLETE_SCRIPT = """
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
"""

# Record a failure. If the job still has retries left it goes back to the
# pending list; otherwise it lands in the failed list with its metadata
# expiring on the same schedule as completed jobs. Only acts if the
# caller still owns the claim token — a reclaimed job can't be failed
# by the original claimant.
FAIL_SCRIPT = """
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
"""

# Reclaim jobs whose claim has gone stale. Walks the processing list and
# moves any job past the visibility timeout back to the pending list.
# A job is past the timeout if either:
#   - claimed_at_ms is set and (now - claimed_at_ms) > visibility_ms, OR
#   - claimed_at_ms is missing (worker crashed between BRPOPLPUSH and the
#     metadata write) and (now - enqueued_at_ms) > 2 * visibility_ms.
# Runs in one round trip so a concurrent worker can't claim a
# half-reclaimed job.
RECLAIM_SCRIPT = """
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
"""


class ClaimedJob:
    """A job that has been atomically moved into the processing list."""

    def __init__(self, job_id: str, payload: dict, attempts: int, claim_token: str) -> None:
        self.id = job_id
        self.payload = payload
        self.attempts = attempts
        self.claim_token = claim_token

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "payload": self.payload,
            "attempts": self.attempts,
            "claim_token": self.claim_token,
        }


class RedisJobQueue:
    """Reliable FIFO job queue with visibility-timeout reclaim."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        queue_name: str = "jobs",
        visibility_ms: int = 5000,
        completed_ttl: int = 300,
        completed_history: int = 50,
        max_attempts: int = 3,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        self.queue_name = queue_name
        self.visibility_ms = visibility_ms
        self.completed_ttl = completed_ttl
        self.completed_history = completed_history
        self.max_attempts = max_attempts

        self.pending_key = f"queue:{queue_name}:pending"
        self.processing_key = f"queue:{queue_name}:processing"
        self.completed_key = f"queue:{queue_name}:completed"
        self.failed_key = f"queue:{queue_name}:failed"
        self.meta_prefix = f"queue:{queue_name}:job:"
        self.events_channel = f"queue:{queue_name}:events"

        self._complete = self.redis.register_script(COMPLETE_SCRIPT)
        self._fail = self.redis.register_script(FAIL_SCRIPT)
        self._reclaim = self.redis.register_script(RECLAIM_SCRIPT)

        self._stats_lock = Lock()
        self._enqueued = 0
        self._completed = 0
        self._failed = 0
        self._reclaimed = 0

    def _meta_key(self, job_id: str) -> str:
        return f"{self.meta_prefix}{job_id}"

    @staticmethod
    def _now_ms() -> int:
        return int(time.time() * 1000)

    def enqueue(self, payload: dict) -> str:
        """Push a new job onto the pending list and return its ID."""
        job_id = secrets.token_hex(8)
        now_ms = self._now_ms()
        meta = {
            "id": job_id,
            "payload": json.dumps(payload),
            "status": "pending",
            "attempts": 0,
            "enqueued_at_ms": now_ms,
            "claim_token": "",
        }
        pipe = self.redis.pipeline()
        pipe.hset(self._meta_key(job_id), mapping=meta)
        pipe.lpush(self.pending_key, job_id)
        pipe.execute()
        with self._stats_lock:
            self._enqueued += 1
        return job_id

    def claim(self, timeout_ms: int = 1000) -> Optional[ClaimedJob]:
        """Block until a job is available, then atomically claim it.

        Uses ``BRPOPLPUSH`` to wait for a pending job and move it to the
        processing list in a single Redis call; falls back to the same
        operation via a Lua script if a job arrives during the blocking
        window. Returns ``None`` if nothing arrives before ``timeout_ms``.
        """
        timeout_s = max(timeout_ms / 1000.0, 0.1)
        job_id = self.redis.brpoplpush(self.pending_key, self.processing_key, timeout=timeout_s)
        if job_id is None:
            return None

        token = secrets.token_hex(8)
        now_ms = self._now_ms()
        meta_key = self._meta_key(job_id)
        pipe = self.redis.pipeline()
        pipe.hset(
            meta_key,
            mapping={
                "status": "processing",
                "claimed_at_ms": now_ms,
                "claim_token": token,
            },
        )
        pipe.hincrby(meta_key, "attempts", 1)
        pipe.hgetall(meta_key)
        _, _, meta = pipe.execute()

        try:
            payload = json.loads(meta.get("payload", "{}"))
        except json.JSONDecodeError:
            payload = {}
        attempts = int(meta.get("attempts", "1"))
        return ClaimedJob(job_id, payload, attempts, token)

    def complete(self, job: ClaimedJob, result: dict) -> bool:
        """Mark a job complete and remove it from the processing list.

        Only succeeds if the worker still owns the claim — a job that was
        reclaimed by the visibility-timeout sweep can no longer be
        completed by the original claimant.
        """
        ok = self._complete(
            keys=[self.meta_prefix, self.processing_key, self.completed_key],
            args=[
                job.id,
                job.claim_token,
                "completed",
                self._now_ms(),
                json.dumps(result),
                self.completed_ttl,
                self.completed_history,
            ],
        )
        if not ok:
            return False
        self.redis.publish(self.events_channel, json.dumps({"id": job.id, "status": "completed"}))
        with self._stats_lock:
            self._completed += 1
        return True

    def fail(self, job: ClaimedJob, error: str) -> bool:
        """Record a failure. Retries up to ``max_attempts``, then gives up.

        If the job still has attempts left, it goes back on the pending
        list. If it has exhausted its retries, it moves to the failed
        list and the metadata hash records the final error.
        """
        retry = job.attempts < self.max_attempts
        result = self._fail(
            keys=[
                self.meta_prefix,
                self.processing_key,
                self.pending_key,
                self.failed_key,
            ],
            args=[
                job.id,
                job.claim_token,
                error,
                self._now_ms(),
                self.completed_ttl,
                self.completed_history,
                "1" if retry else "0",
            ],
        )
        if not result:
            return False
        self.redis.publish(
            self.events_channel,
            json.dumps({"id": job.id, "status": "retry" if retry else "failed"}),
        )
        if not retry:
            with self._stats_lock:
                self._failed += 1
        return True

    def reclaim_stuck(self) -> list[str]:
        """Move processing-list jobs past the visibility timeout back to pending."""
        reclaimed = self._reclaim(
            keys=[self.pending_key, self.processing_key, self.meta_prefix],
            args=[self._now_ms(), self.visibility_ms],
        )
        if reclaimed:
            with self._stats_lock:
                self._reclaimed += len(reclaimed)
        return list(reclaimed)

    def get_job(self, job_id: str) -> Optional[dict]:
        """Return the current metadata hash for ``job_id``, decoded."""
        meta = self.redis.hgetall(self._meta_key(job_id))
        if not meta:
            return None
        try:
            meta["payload"] = json.loads(meta.get("payload", "{}"))
        except json.JSONDecodeError:
            meta["payload"] = {}
        if "result" in meta:
            try:
                meta["result"] = json.loads(meta["result"])
            except json.JSONDecodeError:
                pass
        return meta

    def list_pending(self) -> list[str]:
        return list(reversed(self.redis.lrange(self.pending_key, 0, -1)))

    def list_processing(self) -> list[str]:
        return list(self.redis.lrange(self.processing_key, 0, -1))

    def list_completed(self) -> list[str]:
        return list(self.redis.lrange(self.completed_key, 0, -1))

    def list_failed(self) -> list[str]:
        return list(self.redis.lrange(self.failed_key, 0, -1))

    def stats(self) -> dict:
        """Return counters plus the current queue depth."""
        pipe = self.redis.pipeline()
        pipe.llen(self.pending_key)
        pipe.llen(self.processing_key)
        pipe.llen(self.completed_key)
        pipe.llen(self.failed_key)
        pending, processing, completed, failed = pipe.execute()
        with self._stats_lock:
            return {
                "enqueued_total": self._enqueued,
                "completed_total": self._completed,
                "failed_total": self._failed,
                "reclaimed_total": self._reclaimed,
                "pending_depth": pending,
                "processing_depth": processing,
                "completed_depth": completed,
                "failed_depth": failed,
                "visibility_ms": self.visibility_ms,
            }

    def reset_stats(self) -> None:
        with self._stats_lock:
            self._enqueued = 0
            self._completed = 0
            self._failed = 0
            self._reclaimed = 0

    def purge(self) -> None:
        """Delete every queue list and every job metadata hash."""
        pipe = self.redis.pipeline()
        pipe.delete(self.pending_key, self.processing_key, self.completed_key, self.failed_key)
        for key in self.redis.scan_iter(match=f"{self.meta_prefix}*"):
            pipe.delete(key)
        pipe.execute()
        self.reset_stats()
