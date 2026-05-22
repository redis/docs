import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reliable FIFO job queue helper backed by Redis.
 *
 * <p>Jobs are pushed onto a pending list and atomically moved to a processing
 * list when a worker claims them. Each job's payload, status, attempts, and
 * result live in a Redis hash. A reclaimer scans the processing list for jobs
 * older than the visibility timeout and pushes them back to pending so no
 * work is lost when a worker dies mid-job.</p>
 */
public class RedisJobQueue {

    /**
     * Mark a job complete and remove it from the processing list. Only deletes
     * from the processing list if the worker still owns the claim token; this
     * prevents a worker that was reclaimed (because it went over the
     * visibility timeout) from later marking a job complete that another
     * worker has already picked up.
     */
    private static final String COMPLETE_SCRIPT = ""
            + "local meta_key = KEYS[1] .. ARGV[1]\n"
            + "local current_token = redis.call('HGET', meta_key, 'claim_token')\n"
            + "if current_token ~= ARGV[2] then\n"
            + "  return 0\n"
            + "end\n"
            + "redis.call('LREM', KEYS[2], 1, ARGV[1])\n"
            + "redis.call('HSET', meta_key,\n"
            + "  'status', ARGV[3],\n"
            + "  'completed_at_ms', ARGV[4],\n"
            + "  'result', ARGV[5])\n"
            + "redis.call('EXPIRE', meta_key, ARGV[6])\n"
            + "redis.call('LPUSH', KEYS[3], ARGV[1])\n"
            + "redis.call('LTRIM', KEYS[3], 0, ARGV[7] - 1)\n"
            + "return 1\n";

    /**
     * Record a failure. If the job still has retries left it goes back to the
     * pending list; otherwise it lands in the failed list with its metadata
     * expiring on the same schedule as completed jobs. Only acts if the
     * caller still owns the claim token — a reclaimed job can't be failed by
     * the original claimant.
     */
    private static final String FAIL_SCRIPT = ""
            + "local meta_key = KEYS[1] .. ARGV[1]\n"
            + "local current_token = redis.call('HGET', meta_key, 'claim_token')\n"
            + "if current_token ~= ARGV[2] then\n"
            + "  return 0\n"
            + "end\n"
            + "redis.call('LREM', KEYS[2], 1, ARGV[1])\n"
            + "if ARGV[7] == '1' then\n"
            + "  redis.call('HSET', meta_key,\n"
            + "    'status', 'pending',\n"
            + "    'last_error', ARGV[3],\n"
            + "    'last_error_at_ms', ARGV[4],\n"
            + "    'claim_token', '',\n"
            + "    'claimed_at_ms', 0)\n"
            + "  redis.call('LPUSH', KEYS[3], ARGV[1])\n"
            + "  return 1\n"
            + "else\n"
            + "  redis.call('HSET', meta_key,\n"
            + "    'status', 'failed',\n"
            + "    'last_error', ARGV[3],\n"
            + "    'last_error_at_ms', ARGV[4],\n"
            + "    'claim_token', '')\n"
            + "  redis.call('LPUSH', KEYS[4], ARGV[1])\n"
            + "  redis.call('LTRIM', KEYS[4], 0, ARGV[6] - 1)\n"
            + "  redis.call('EXPIRE', meta_key, ARGV[5])\n"
            + "  return 2\n"
            + "end\n";

    /**
     * Reclaim jobs whose claim has gone stale. Walks the processing list and
     * moves any job past the visibility timeout back to the pending list.
     * Runs in one round trip so a concurrent worker can't claim a
     * half-reclaimed job.
     */
    private static final String RECLAIM_SCRIPT = ""
            + "local now_ms = tonumber(ARGV[1])\n"
            + "local visibility_ms = tonumber(ARGV[2])\n"
            + "local processing = redis.call('LRANGE', KEYS[2], 0, -1)\n"
            + "local reclaimed = {}\n"
            + "for _, job_id in ipairs(processing) do\n"
            + "  local meta_key = KEYS[3] .. job_id\n"
            + "  local claimed_at = tonumber(redis.call('HGET', meta_key, 'claimed_at_ms') or '0')\n"
            + "  local enqueued_at = tonumber(redis.call('HGET', meta_key, 'enqueued_at_ms') or '0')\n"
            + "  local stale = false\n"
            + "  if claimed_at > 0 and (now_ms - claimed_at) > visibility_ms then\n"
            + "    stale = true\n"
            + "  elseif claimed_at == 0 and enqueued_at > 0 and (now_ms - enqueued_at) > (visibility_ms * 2) then\n"
            + "    stale = true\n"
            + "  end\n"
            + "  if stale then\n"
            + "    redis.call('LREM', KEYS[2], 1, job_id)\n"
            + "    redis.call('LPUSH', KEYS[1], job_id)\n"
            + "    redis.call('HSET', meta_key,\n"
            + "      'status', 'pending',\n"
            + "      'reclaimed_at_ms', now_ms,\n"
            + "      'claim_token', '',\n"
            + "      'claimed_at_ms', 0)\n"
            + "    table.insert(reclaimed, job_id)\n"
            + "  end\n"
            + "end\n"
            + "return reclaimed\n";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JedisPool pool;
    private final String queueName;
    private final long visibilityMs;
    private final int completedTtl;
    private final int completedHistory;
    private final int maxAttempts;

    private final String pendingKey;
    private final String processingKey;
    private final String completedKey;
    private final String failedKey;
    private final String metaPrefix;
    private final String eventsChannel;

    private final Object statsLock = new Object();
    private long enqueuedTotal = 0;
    private long completedTotal = 0;
    private long failedTotal = 0;
    private long reclaimedTotal = 0;

    public RedisJobQueue(JedisPool pool) {
        this(pool, "jobs", 5000, 300, 50, 3);
    }

    public RedisJobQueue(
            JedisPool pool,
            String queueName,
            long visibilityMs,
            int completedTtl,
            int completedHistory,
            int maxAttempts) {
        this.pool = pool;
        this.queueName = queueName;
        this.visibilityMs = visibilityMs;
        this.completedTtl = completedTtl;
        this.completedHistory = completedHistory;
        this.maxAttempts = maxAttempts;

        this.pendingKey = "queue:" + queueName + ":pending";
        this.processingKey = "queue:" + queueName + ":processing";
        this.completedKey = "queue:" + queueName + ":completed";
        this.failedKey = "queue:" + queueName + ":failed";
        this.metaPrefix = "queue:" + queueName + ":job:";
        this.eventsChannel = "queue:" + queueName + ":events";
    }

    public long getVisibilityMs() {
        return visibilityMs;
    }

    public String getQueueName() {
        return queueName;
    }

    private String metaKey(String jobId) {
        return metaPrefix + jobId;
    }

    private static long nowMs() {
        return System.currentTimeMillis();
    }

    private static String randomTokenHex(int bytes) {
        byte[] buf = new byte[bytes];
        RANDOM.nextBytes(buf);
        return HexFormat.of().formatHex(buf);
    }

    /** Push a new job onto the pending list and return its ID. */
    public String enqueue(Map<String, Object> payload) {
        String jobId = randomTokenHex(8);
        long now = nowMs();
        Map<String, String> meta = new LinkedHashMap<>();
        meta.put("id", jobId);
        meta.put("payload", JsonUtil.toJson(payload));
        meta.put("status", "pending");
        meta.put("attempts", "0");
        meta.put("enqueued_at_ms", Long.toString(now));
        meta.put("claim_token", "");

        try (Jedis jedis = pool.getResource()) {
            Pipeline pipe = jedis.pipelined();
            pipe.hset(metaKey(jobId), meta);
            pipe.lpush(pendingKey, jobId);
            pipe.sync();
        }
        synchronized (statsLock) {
            enqueuedTotal++;
        }
        return jobId;
    }

    /**
     * Block until a job is available, then atomically claim it.
     * Returns null if nothing arrives before timeoutMs.
     */
    public ClaimedJob claim(long timeoutMs) {
        double timeoutSec = Math.max(timeoutMs / 1000.0, 0.1);
        String jobId;
        try (Jedis jedis = pool.getResource()) {
            jobId = jedis.brpoplpush(pendingKey, processingKey, (int) Math.ceil(timeoutSec));
        }
        if (jobId == null) {
            return null;
        }

        String token = randomTokenHex(8);
        long now = nowMs();
        String mk = metaKey(jobId);
        Map<String, String> meta;
        try (Jedis jedis = pool.getResource()) {
            Pipeline pipe = jedis.pipelined();
            Map<String, String> updates = new LinkedHashMap<>();
            updates.put("status", "processing");
            updates.put("claimed_at_ms", Long.toString(now));
            updates.put("claim_token", token);
            pipe.hset(mk, updates);
            pipe.hincrBy(mk, "attempts", 1);
            redis.clients.jedis.Response<Map<String, String>> resp = pipe.hgetAll(mk);
            pipe.sync();
            meta = resp.get();
        }

        Map<String, Object> payload;
        try {
            payload = JsonUtil.parseObject(meta.getOrDefault("payload", "{}"));
        } catch (Exception e) {
            payload = new HashMap<>();
        }
        int attempts;
        try {
            attempts = Integer.parseInt(meta.getOrDefault("attempts", "1"));
        } catch (NumberFormatException e) {
            attempts = 1;
        }
        return new ClaimedJob(jobId, payload, attempts, token);
    }

    /**
     * Mark a job complete and remove it from the processing list. Only
     * succeeds if the worker still owns the claim.
     */
    public boolean complete(ClaimedJob job, Map<String, Object> result) {
        List<String> keys = Arrays.asList(metaPrefix, processingKey, completedKey);
        List<String> args = Arrays.asList(
                job.id,
                job.claimToken,
                "completed",
                Long.toString(nowMs()),
                JsonUtil.toJson(result),
                Integer.toString(completedTtl),
                Integer.toString(completedHistory)
        );
        Object res;
        try (Jedis jedis = pool.getResource()) {
            res = jedis.eval(COMPLETE_SCRIPT, keys, args);
        }
        if (res == null || !"1".equals(res.toString())) {
            return false;
        }
        try (Jedis jedis = pool.getResource()) {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("id", job.id);
            event.put("status", "completed");
            jedis.publish(eventsChannel, JsonUtil.toJson(event));
        }
        synchronized (statsLock) {
            completedTotal++;
        }
        return true;
    }

    /**
     * Record a failure. Retries up to maxAttempts, then gives up.
     */
    public boolean fail(ClaimedJob job, String error) {
        boolean retry = job.attempts < maxAttempts;
        List<String> keys = Arrays.asList(metaPrefix, processingKey, pendingKey, failedKey);
        List<String> args = Arrays.asList(
                job.id,
                job.claimToken,
                error,
                Long.toString(nowMs()),
                Integer.toString(completedTtl),
                Integer.toString(completedHistory),
                retry ? "1" : "0"
        );
        Object res;
        try (Jedis jedis = pool.getResource()) {
            res = jedis.eval(FAIL_SCRIPT, keys, args);
        }
        if (res == null || "0".equals(res.toString())) {
            return false;
        }
        try (Jedis jedis = pool.getResource()) {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("id", job.id);
            event.put("status", retry ? "retry" : "failed");
            jedis.publish(eventsChannel, JsonUtil.toJson(event));
        }
        if (!retry) {
            synchronized (statsLock) {
                failedTotal++;
            }
        }
        return true;
    }

    /** Move processing-list jobs past the visibility timeout back to pending. */
    @SuppressWarnings("unchecked")
    public List<String> reclaimStuck() {
        List<String> keys = Arrays.asList(pendingKey, processingKey, metaPrefix);
        List<String> args = Arrays.asList(Long.toString(nowMs()), Long.toString(visibilityMs));
        Object res;
        try (Jedis jedis = pool.getResource()) {
            res = jedis.eval(RECLAIM_SCRIPT, keys, args);
        }
        List<String> reclaimed = new ArrayList<>();
        if (res instanceof List<?>) {
            for (Object item : (List<Object>) res) {
                if (item != null) {
                    reclaimed.add(item.toString());
                }
            }
        }
        if (!reclaimed.isEmpty()) {
            synchronized (statsLock) {
                reclaimedTotal += reclaimed.size();
            }
        }
        return reclaimed;
    }

    /** Return the metadata hash for a job, or null if missing. */
    public Map<String, Object> getJob(String jobId) {
        Map<String, String> raw;
        try (Jedis jedis = pool.getResource()) {
            raw = jedis.hgetAll(metaKey(jobId));
        }
        if (raw == null || raw.isEmpty()) {
            return null;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : raw.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if ("payload".equals(key)) {
                try {
                    out.put(key, JsonUtil.parseObject(value));
                } catch (Exception e) {
                    out.put(key, new HashMap<>());
                }
            } else if ("result".equals(key)) {
                try {
                    out.put(key, JsonUtil.parseAny(value));
                } catch (Exception e) {
                    out.put(key, value);
                }
            } else {
                out.put(key, value);
            }
        }
        return out;
    }

    /** Return pending job IDs, oldest first. */
    public List<String> listPending() {
        List<String> values;
        try (Jedis jedis = pool.getResource()) {
            values = jedis.lrange(pendingKey, 0, -1);
        }
        List<String> reversed = new ArrayList<>(values);
        Collections.reverse(reversed);
        return reversed;
    }

    public List<String> listProcessing() {
        try (Jedis jedis = pool.getResource()) {
            return jedis.lrange(processingKey, 0, -1);
        }
    }

    public List<String> listCompleted() {
        try (Jedis jedis = pool.getResource()) {
            return jedis.lrange(completedKey, 0, -1);
        }
    }

    public List<String> listFailed() {
        try (Jedis jedis = pool.getResource()) {
            return jedis.lrange(failedKey, 0, -1);
        }
    }

    /** Counters plus current queue depth. */
    public Map<String, Object> stats() {
        long pending;
        long processing;
        long completed;
        long failed;
        try (Jedis jedis = pool.getResource()) {
            Pipeline pipe = jedis.pipelined();
            redis.clients.jedis.Response<Long> pendingResp = pipe.llen(pendingKey);
            redis.clients.jedis.Response<Long> processingResp = pipe.llen(processingKey);
            redis.clients.jedis.Response<Long> completedResp = pipe.llen(completedKey);
            redis.clients.jedis.Response<Long> failedResp = pipe.llen(failedKey);
            pipe.sync();
            pending = pendingResp.get();
            processing = processingResp.get();
            completed = completedResp.get();
            failed = failedResp.get();
        }
        Map<String, Object> out = new LinkedHashMap<>();
        synchronized (statsLock) {
            out.put("enqueued_total", enqueuedTotal);
            out.put("completed_total", completedTotal);
            out.put("failed_total", failedTotal);
            out.put("reclaimed_total", reclaimedTotal);
        }
        out.put("pending_depth", pending);
        out.put("processing_depth", processing);
        out.put("completed_depth", completed);
        out.put("failed_depth", failed);
        out.put("visibility_ms", visibilityMs);
        return out;
    }

    public void resetStats() {
        synchronized (statsLock) {
            enqueuedTotal = 0;
            completedTotal = 0;
            failedTotal = 0;
            reclaimedTotal = 0;
        }
    }

    /** Delete only queue:{name}:* keys via SCAN. */
    public void purge() {
        try (Jedis jedis = pool.getResource()) {
            jedis.del(pendingKey, processingKey, completedKey, failedKey);
            String cursor = ScanParams.SCAN_POINTER_START;
            ScanParams params = new ScanParams().match(metaPrefix + "*").count(100);
            do {
                ScanResult<String> result = jedis.scan(cursor, params);
                List<String> matched = result.getResult();
                if (!matched.isEmpty()) {
                    jedis.del(matched.toArray(new String[0]));
                }
                cursor = result.getCursor();
            } while (!cursor.equals("0"));
        }
        resetStats();
    }

    /** A job that has been atomically moved into the processing list. */
    public static class ClaimedJob {
        public final String id;
        public final Map<String, Object> payload;
        public final int attempts;
        public final String claimToken;

        public ClaimedJob(String id, Map<String, Object> payload, int attempts, String claimToken) {
            this.id = id;
            this.payload = payload;
            this.attempts = attempts;
            this.claimToken = claimToken;
        }
    }
}
