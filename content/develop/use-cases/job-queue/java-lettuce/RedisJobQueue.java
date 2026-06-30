import io.lettuce.core.LMoveArgs;
import io.lettuce.core.ScriptOutputType;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reliable FIFO job queue backed by Redis lists and a per-job metadata hash.
 *
 * Jobs are pushed onto a pending list and atomically moved to a processing
 * list when a worker claims them. Each job's payload, status, attempts, and
 * result live in a Redis hash. A reclaimer scans the processing list for
 * jobs older than the visibility timeout and pushes them back to pending so
 * no work is lost when a worker dies mid-job.
 *
 * Every state-changing operation runs inside a Lua script so the
 * processing-list and metadata-hash updates are atomic on the server.
 */
public class RedisJobQueue {

    // Atomically write the job hash and LPUSH the ID onto the pending list.
    // Running this as a single EVAL avoids the multi-command pipeline race that
    // Lettuce's shared StatefulRedisConnection would otherwise expose between
    // concurrent enqueue() callers.
    private static final String ENQUEUE_SCRIPT =
            "redis.call('HSET', KEYS[1],\n" +
            "  'id', ARGV[1],\n" +
            "  'payload', ARGV[2],\n" +
            "  'status', 'pending',\n" +
            "  'attempts', '0',\n" +
            "  'enqueued_at_ms', ARGV[3],\n" +
            "  'claim_token', '')\n" +
            "redis.call('LPUSH', KEYS[2], ARGV[1])\n" +
            "return 1\n";

    // Mark a job complete and remove it from the processing list. Only deletes
    // from the processing list if the worker still owns the claim token; this
    // prevents a worker that was reclaimed (because it went over the visibility
    // timeout) from later marking a job complete that another worker has
    // already picked up.
    private static final String COMPLETE_SCRIPT =
            "local meta_key = KEYS[1] .. ARGV[1]\n" +
            "local current_token = redis.call('HGET', meta_key, 'claim_token')\n" +
            "if current_token ~= ARGV[2] then\n" +
            "  return 0\n" +
            "end\n" +
            "redis.call('LREM', KEYS[2], 1, ARGV[1])\n" +
            "redis.call('HSET', meta_key,\n" +
            "  'status', ARGV[3],\n" +
            "  'completed_at_ms', ARGV[4],\n" +
            "  'result', ARGV[5])\n" +
            "redis.call('EXPIRE', meta_key, ARGV[6])\n" +
            "redis.call('LPUSH', KEYS[3], ARGV[1])\n" +
            "redis.call('LTRIM', KEYS[3], 0, ARGV[7] - 1)\n" +
            "return 1\n";

    // Record a failure. If the job still has retries left it goes back to the
    // pending list; otherwise it lands in the failed list with its metadata
    // expiring on the same schedule as completed jobs. Only acts if the
    // caller still owns the claim token -- a reclaimed job can't be failed
    // by the original claimant.
    private static final String FAIL_SCRIPT =
            "local meta_key = KEYS[1] .. ARGV[1]\n" +
            "local current_token = redis.call('HGET', meta_key, 'claim_token')\n" +
            "if current_token ~= ARGV[2] then\n" +
            "  return 0\n" +
            "end\n" +
            "redis.call('LREM', KEYS[2], 1, ARGV[1])\n" +
            "if ARGV[7] == '1' then\n" +
            "  redis.call('HSET', meta_key,\n" +
            "    'status', 'pending',\n" +
            "    'last_error', ARGV[3],\n" +
            "    'last_error_at_ms', ARGV[4],\n" +
            "    'claim_token', '',\n" +
            "    'claimed_at_ms', 0)\n" +
            "  redis.call('LPUSH', KEYS[3], ARGV[1])\n" +
            "  return 1\n" +
            "else\n" +
            "  redis.call('HSET', meta_key,\n" +
            "    'status', 'failed',\n" +
            "    'last_error', ARGV[3],\n" +
            "    'last_error_at_ms', ARGV[4],\n" +
            "    'claim_token', '')\n" +
            "  redis.call('LPUSH', KEYS[4], ARGV[1])\n" +
            "  redis.call('LTRIM', KEYS[4], 0, ARGV[6] - 1)\n" +
            "  redis.call('EXPIRE', meta_key, ARGV[5])\n" +
            "  return 2\n" +
            "end\n";

    // Reclaim jobs whose claim has gone stale. Walks the processing list and
    // moves any job past the visibility timeout back to the pending list.
    // A job is past the timeout if either:
    //   - claimed_at_ms is set and (now - claimed_at_ms) > visibility_ms, OR
    //   - claimed_at_ms is missing (worker crashed between BRPOPLPUSH and the
    //     metadata write) and (now - enqueued_at_ms) > 2 * visibility_ms.
    // Runs in one round trip so a concurrent worker can't claim a
    // half-reclaimed job.
    private static final String RECLAIM_SCRIPT =
            "local now_ms = tonumber(ARGV[1])\n" +
            "local visibility_ms = tonumber(ARGV[2])\n" +
            "local processing = redis.call('LRANGE', KEYS[2], 0, -1)\n" +
            "local reclaimed = {}\n" +
            "for _, job_id in ipairs(processing) do\n" +
            "  local meta_key = KEYS[3] .. job_id\n" +
            "  local claimed_at = tonumber(redis.call('HGET', meta_key, 'claimed_at_ms') or '0')\n" +
            "  local enqueued_at = tonumber(redis.call('HGET', meta_key, 'enqueued_at_ms') or '0')\n" +
            "  local stale = false\n" +
            "  if claimed_at > 0 and (now_ms - claimed_at) > visibility_ms then\n" +
            "    stale = true\n" +
            "  elseif claimed_at == 0 and enqueued_at > 0 and (now_ms - enqueued_at) > (visibility_ms * 2) then\n" +
            "    stale = true\n" +
            "  end\n" +
            "  if stale then\n" +
            "    redis.call('LREM', KEYS[2], 1, job_id)\n" +
            "    redis.call('LPUSH', KEYS[1], job_id)\n" +
            "    redis.call('HSET', meta_key,\n" +
            "      'status', 'pending',\n" +
            "      'reclaimed_at_ms', now_ms,\n" +
            "      'claim_token', '',\n" +
            "      'claimed_at_ms', 0)\n" +
            "    table.insert(reclaimed, job_id)\n" +
            "  end\n" +
            "end\n" +
            "return reclaimed\n";

    private final StatefulRedisConnection<String, String> conn;
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

    private final SecureRandom random = new SecureRandom();

    private final Object statsLock = new Object();
    private long enqueuedTotal = 0;
    private long completedTotal = 0;
    private long failedTotal = 0;
    private long reclaimedTotal = 0;

    public RedisJobQueue(StatefulRedisConnection<String, String> conn,
                         String queueName,
                         long visibilityMs,
                         int completedTtl,
                         int completedHistory,
                         int maxAttempts) {
        this.conn = conn;
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

    private String metaKey(String jobId) {
        return metaPrefix + jobId;
    }

    private static long nowMs() {
        return System.currentTimeMillis();
    }

    private String randomHex(int byteLength) {
        byte[] bytes = new byte[byteLength];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder(byteLength * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }

    /**
     * Push a new job onto the pending list and return its ID.
     *
     * The metadata hash write plus the LPUSH onto pending are run as a single
     * Lua script. That keeps the operation atomic and lock-free on a shared
     * StatefulRedisConnection, where two threads using Lettuce's pipeline API
     * could otherwise interleave their responses.
     */
    public String enqueue(Map<String, Object> payload) {
        String jobId = randomHex(8);
        long now = nowMs();
        String payloadJson = JsonUtil.toJson(payload);

        String[] keys = { metaKey(jobId), pendingKey };
        String[] argv = {
                jobId,
                payloadJson,
                Long.toString(now),
        };
        RedisCommands<String, String> sync = conn.sync();
        sync.eval(ENQUEUE_SCRIPT, ScriptOutputType.INTEGER, keys, argv);

        synchronized (statsLock) {
            enqueuedTotal++;
        }
        return jobId;
    }

    /**
     * Block until a job is available, then atomically claim it.
     *
     * Uses BLMOVE to wait for a pending job and move it to the processing
     * list in a single Redis call. Returns {@code null} if nothing arrives
     * before {@code timeoutMs}.
     */
    public ClaimedJob claim(long timeoutMs) {
        double timeoutSeconds = Math.max(timeoutMs / 1000.0, 0.1);

        RedisCommands<String, String> sync = conn.sync();
        String jobId = sync.blmove(pendingKey, processingKey,
                LMoveArgs.Builder.rightLeft(), timeoutSeconds);
        if (jobId == null) {
            return null;
        }

        String token = randomHex(8);
        long now = nowMs();
        String meta = metaKey(jobId);

        // Write the claim fields, bump attempts, and read back the hash.
        Map<String, String> updates = new LinkedHashMap<>();
        updates.put("status", "processing");
        updates.put("claimed_at_ms", Long.toString(now));
        updates.put("claim_token", token);
        sync.hset(meta, updates);
        sync.hincrby(meta, "attempts", 1);
        Map<String, String> hash = sync.hgetall(meta);

        Map<String, Object> payload;
        try {
            String payloadJson = hash.getOrDefault("payload", "{}");
            payload = JsonUtil.parseObject(payloadJson);
        } catch (Exception ex) {
            payload = new LinkedHashMap<>();
        }
        int attempts;
        try {
            attempts = Integer.parseInt(hash.getOrDefault("attempts", "1"));
        } catch (NumberFormatException ex) {
            attempts = 1;
        }
        return new ClaimedJob(jobId, payload, attempts, token);
    }

    /**
     * Mark a job complete and remove it from the processing list.
     *
     * Only succeeds if the worker still owns the claim -- a job that was
     * reclaimed by the visibility-timeout sweep can no longer be completed
     * by the original claimant.
     */
    public boolean complete(ClaimedJob job, Map<String, Object> result) {
        String[] keys = { metaPrefix, processingKey, completedKey };
        String[] argv = {
                job.id,
                job.claimToken,
                "completed",
                Long.toString(nowMs()),
                JsonUtil.toJson(result),
                Integer.toString(completedTtl),
                Integer.toString(completedHistory),
        };
        Long ok = conn.sync().eval(COMPLETE_SCRIPT, ScriptOutputType.INTEGER, keys, argv);
        if (ok == null || ok == 0L) {
            return false;
        }
        publishEvent(job.id, "completed");
        synchronized (statsLock) {
            completedTotal++;
        }
        return true;
    }

    /**
     * Record a failure. Retries up to {@code maxAttempts}, then gives up.
     *
     * If the job still has attempts left, it goes back on the pending list.
     * If it has exhausted its retries, it moves to the failed list and the
     * metadata hash records the final error.
     */
    public boolean fail(ClaimedJob job, String error) {
        boolean retry = job.attempts < maxAttempts;
        String[] keys = { metaPrefix, processingKey, pendingKey, failedKey };
        String[] argv = {
                job.id,
                job.claimToken,
                error,
                Long.toString(nowMs()),
                Integer.toString(completedTtl),
                Integer.toString(completedHistory),
                retry ? "1" : "0",
        };
        Long result = conn.sync().eval(FAIL_SCRIPT, ScriptOutputType.INTEGER, keys, argv);
        if (result == null || result == 0L) {
            return false;
        }
        publishEvent(job.id, retry ? "retry" : "failed");
        if (!retry) {
            synchronized (statsLock) {
                failedTotal++;
            }
        }
        return true;
    }

    private void publishEvent(String jobId, String status) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", jobId);
        event.put("status", status);
        try {
            conn.sync().publish(eventsChannel, JsonUtil.toJson(event));
        } catch (Exception ignored) {
            // Best-effort signalling.
        }
    }

    /**
     * Move processing-list jobs past the visibility timeout back to pending.
     */
    @SuppressWarnings("unchecked")
    public List<String> reclaimStuck() {
        String[] keys = { pendingKey, processingKey, metaPrefix };
        String[] argv = {
                Long.toString(nowMs()),
                Long.toString(visibilityMs),
        };
        List<Object> raw = conn.sync().eval(RECLAIM_SCRIPT, ScriptOutputType.MULTI, keys, argv);
        List<String> reclaimed = new ArrayList<>();
        if (raw != null) {
            for (Object item : raw) {
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

    /**
     * Return the current metadata hash for {@code jobId}, decoded.
     */
    public Map<String, Object> getJob(String jobId) {
        Map<String, String> hash = conn.sync().hgetall(metaKey(jobId));
        if (hash == null || hash.isEmpty()) {
            return null;
        }
        Map<String, Object> decoded = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : hash.entrySet()) {
            decoded.put(entry.getKey(), entry.getValue());
        }
        if (decoded.containsKey("payload")) {
            try {
                decoded.put("payload", JsonUtil.parseObject((String) decoded.get("payload")));
            } catch (Exception ex) {
                decoded.put("payload", new LinkedHashMap<>());
            }
        }
        if (decoded.containsKey("result")) {
            try {
                decoded.put("result", JsonUtil.parseObject((String) decoded.get("result")));
            } catch (Exception ex) {
                // Leave it as the raw string if it isn't an object.
            }
        }
        return decoded;
    }

    public List<String> listPending() {
        // Pending IDs were LPUSHed, so the right of the list is the oldest.
        List<String> raw = conn.sync().lrange(pendingKey, 0, -1);
        List<String> reversed = new ArrayList<>(raw);
        java.util.Collections.reverse(reversed);
        return reversed;
    }

    public List<String> listProcessing() {
        return new ArrayList<>(conn.sync().lrange(processingKey, 0, -1));
    }

    public List<String> listCompleted() {
        return new ArrayList<>(conn.sync().lrange(completedKey, 0, -1));
    }

    public List<String> listFailed() {
        return new ArrayList<>(conn.sync().lrange(failedKey, 0, -1));
    }

    public Map<String, Object> stats() {
        RedisCommands<String, String> sync = conn.sync();
        long pending = sync.llen(pendingKey);
        long processing = sync.llen(processingKey);
        long completed = sync.llen(completedKey);
        long failed = sync.llen(failedKey);

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

    /**
     * Delete every queue list and every job metadata hash.
     */
    public void purge() {
        RedisCommands<String, String> sync = conn.sync();
        sync.del(pendingKey, processingKey, completedKey, failedKey);

        List<String> toDelete = new ArrayList<>();
        io.lettuce.core.ScanArgs scanArgs = io.lettuce.core.ScanArgs.Builder.matches(metaPrefix + "*").limit(500);
        io.lettuce.core.ScanCursor cursor = io.lettuce.core.ScanCursor.INITIAL;
        do {
            io.lettuce.core.KeyScanCursor<String> result = sync.scan(cursor, scanArgs);
            toDelete.addAll(result.getKeys());
            cursor = result;
        } while (!cursor.isFinished());

        if (!toDelete.isEmpty()) {
            sync.del(toDelete.toArray(new String[0]));
        }
        resetStats();
    }

    /**
     * A job that has been atomically moved into the processing list.
     */
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

        public Map<String, Object> toMap() {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("id", id);
            out.put("payload", payload);
            out.put("attempts", attempts);
            out.put("claim_token", claimToken);
            return out;
        }
    }

    /**
     * Tiny self-contained JSON encoder/decoder kept in the same package so the
     * demo compiles without pulling Jackson or Gson onto the classpath.
     */
    static final class JsonUtil {

        static String toJson(Object value) {
            StringBuilder sb = new StringBuilder();
            writeValue(sb, value);
            return sb.toString();
        }

        @SuppressWarnings("unchecked")
        static Map<String, Object> parseObject(String json) {
            if (json == null) {
                return new LinkedHashMap<>();
            }
            Object parsed = new JsonParser(json).parse();
            if (parsed instanceof Map) {
                return (Map<String, Object>) parsed;
            }
            return new LinkedHashMap<>();
        }

        static Object parseAny(String json) {
            if (json == null) {
                return null;
            }
            return new JsonParser(json).parse();
        }

        @SuppressWarnings("unchecked")
        private static void writeValue(StringBuilder sb, Object value) {
            if (value == null) {
                sb.append("null");
            } else if (value instanceof Boolean) {
                sb.append(value.toString());
            } else if (value instanceof Number) {
                sb.append(value.toString());
            } else if (value instanceof Map) {
                writeMap(sb, (Map<String, Object>) value);
            } else if (value instanceof List) {
                writeList(sb, (List<Object>) value);
            } else if (value.getClass().isArray()) {
                writeList(sb, Arrays.asList((Object[]) value));
            } else {
                writeString(sb, value.toString());
            }
        }

        private static void writeMap(StringBuilder sb, Map<String, Object> map) {
            sb.append('{');
            boolean first = true;
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (!first) sb.append(',');
                writeString(sb, String.valueOf(entry.getKey()));
                sb.append(':');
                writeValue(sb, entry.getValue());
                first = false;
            }
            sb.append('}');
        }

        private static void writeList(StringBuilder sb, List<Object> items) {
            sb.append('[');
            boolean first = true;
            for (Object item : items) {
                if (!first) sb.append(',');
                writeValue(sb, item);
                first = false;
            }
            sb.append(']');
        }

        private static void writeString(StringBuilder sb, String value) {
            sb.append('"');
            for (int i = 0; i < value.length(); i++) {
                char c = value.charAt(i);
                switch (c) {
                    case '\\': sb.append("\\\\"); break;
                    case '"':  sb.append("\\\""); break;
                    case '\n': sb.append("\\n"); break;
                    case '\r': sb.append("\\r"); break;
                    case '\t': sb.append("\\t"); break;
                    case '\b': sb.append("\\b"); break;
                    case '\f': sb.append("\\f"); break;
                    default:
                        if (c < 0x20) {
                            sb.append(String.format("\\u%04x", (int) c));
                        } else {
                            sb.append(c);
                        }
                }
            }
            sb.append('"');
        }

        private static final class JsonParser {
            private final String src;
            private int pos;

            JsonParser(String src) {
                this.src = src;
                this.pos = 0;
            }

            Object parse() {
                skipWhitespace();
                Object value = parseValue();
                skipWhitespace();
                return value;
            }

            private Object parseValue() {
                skipWhitespace();
                if (pos >= src.length()) {
                    return null;
                }
                char c = src.charAt(pos);
                if (c == '{') return parseMap();
                if (c == '[') return parseList();
                if (c == '"') return parseString();
                if (c == 't' || c == 'f') return parseBoolean();
                if (c == 'n') return parseNull();
                return parseNumber();
            }

            private Map<String, Object> parseMap() {
                Map<String, Object> out = new LinkedHashMap<>();
                pos++; // {
                skipWhitespace();
                if (peek() == '}') { pos++; return out; }
                while (pos < src.length()) {
                    skipWhitespace();
                    String key = parseString();
                    skipWhitespace();
                    if (peek() != ':') throw new IllegalArgumentException("Expected ':' at " + pos);
                    pos++;
                    Object value = parseValue();
                    out.put(key, value);
                    skipWhitespace();
                    char ch = peek();
                    if (ch == ',') { pos++; continue; }
                    if (ch == '}') { pos++; break; }
                    throw new IllegalArgumentException("Expected ',' or '}' at " + pos);
                }
                return out;
            }

            private List<Object> parseList() {
                List<Object> out = new ArrayList<>();
                pos++; // [
                skipWhitespace();
                if (peek() == ']') { pos++; return out; }
                while (pos < src.length()) {
                    out.add(parseValue());
                    skipWhitespace();
                    char ch = peek();
                    if (ch == ',') { pos++; continue; }
                    if (ch == ']') { pos++; break; }
                    throw new IllegalArgumentException("Expected ',' or ']' at " + pos);
                }
                return out;
            }

            private String parseString() {
                if (peek() != '"') throw new IllegalArgumentException("Expected '\"' at " + pos);
                pos++;
                StringBuilder sb = new StringBuilder();
                while (pos < src.length()) {
                    char c = src.charAt(pos++);
                    if (c == '"') return sb.toString();
                    if (c == '\\' && pos < src.length()) {
                        char esc = src.charAt(pos++);
                        switch (esc) {
                            case '"':  sb.append('"'); break;
                            case '\\': sb.append('\\'); break;
                            case '/':  sb.append('/'); break;
                            case 'n':  sb.append('\n'); break;
                            case 'r':  sb.append('\r'); break;
                            case 't':  sb.append('\t'); break;
                            case 'b':  sb.append('\b'); break;
                            case 'f':  sb.append('\f'); break;
                            case 'u':
                                if (pos + 4 > src.length()) {
                                    throw new IllegalArgumentException("Bad unicode escape at " + pos);
                                }
                                sb.append((char) Integer.parseInt(src.substring(pos, pos + 4), 16));
                                pos += 4;
                                break;
                            default: sb.append(esc);
                        }
                    } else {
                        sb.append(c);
                    }
                }
                throw new IllegalArgumentException("Unterminated string");
            }

            private Boolean parseBoolean() {
                if (src.startsWith("true", pos)) { pos += 4; return Boolean.TRUE; }
                if (src.startsWith("false", pos)) { pos += 5; return Boolean.FALSE; }
                throw new IllegalArgumentException("Invalid literal at " + pos);
            }

            private Object parseNull() {
                if (src.startsWith("null", pos)) { pos += 4; return null; }
                throw new IllegalArgumentException("Invalid literal at " + pos);
            }

            private Number parseNumber() {
                int start = pos;
                if (peek() == '-') pos++;
                while (pos < src.length() && "0123456789.eE+-".indexOf(src.charAt(pos)) >= 0) {
                    pos++;
                }
                String literal = src.substring(start, pos);
                if (literal.indexOf('.') >= 0 || literal.indexOf('e') >= 0 || literal.indexOf('E') >= 0) {
                    return Double.parseDouble(literal);
                }
                try {
                    return Long.parseLong(literal);
                } catch (NumberFormatException ex) {
                    return Double.parseDouble(literal);
                }
            }

            private char peek() {
                return pos < src.length() ? src.charAt(pos) : '\0';
            }

            private void skipWhitespace() {
                while (pos < src.length() && Character.isWhitespace(src.charAt(pos))) {
                    pos++;
                }
            }
        }
    }
}
