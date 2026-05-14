import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Response;
import redis.clients.jedis.StreamEntryID;
import redis.clients.jedis.commands.ProtocolCommand;
import redis.clients.jedis.exceptions.JedisDataException;
import redis.clients.jedis.params.XAddParams;
import redis.clients.jedis.params.XAutoClaimParams;
import redis.clients.jedis.params.XClaimParams;
import redis.clients.jedis.params.XPendingParams;
import redis.clients.jedis.params.XReadGroupParams;
import redis.clients.jedis.params.XTrimParams;
import redis.clients.jedis.resps.StreamConsumerInfo;
import redis.clients.jedis.resps.StreamEntry;
import redis.clients.jedis.resps.StreamGroupInfo;
import redis.clients.jedis.resps.StreamInfo;
import redis.clients.jedis.resps.StreamPendingEntry;
import redis.clients.jedis.util.SafeEncoder;

/**
 * Redis event-stream helper backed by a single Redis Stream.
 *
 * <p>Producers append events with {@code XADD}. Consumers belong to
 * consumer groups and read with {@code XREADGROUP}. The group as a whole
 * tracks a single {@code last-delivered-id} cursor, and each consumer
 * gets its own pending-entries list (PEL) of in-flight messages it has
 * been handed. Once a consumer has processed an entry it acknowledges
 * it with {@code XACK}; entries left unacknowledged past an idle
 * threshold can be swept to a healthy consumer with {@code XAUTOCLAIM}
 * (or to a specific one with {@code XCLAIM}).</p>
 *
 * <p>Each {@code XADD} carries an approximate {@code MAXLEN} so the
 * stream stays bounded as it rolls forward. {@code XRANGE} supports
 * replay over the retained history for debugging, audit, or rebuilding
 * a downstream projection. Note that approximate trimming can release
 * entries that are still in a group's PEL: those entries appear in
 * {@code XAUTOCLAIM}'s deleted-IDs list, which the caller should log
 * and route to a dead-letter store. Redis 7+ removes them from the PEL
 * inside the {@code XAUTOCLAIM} call itself, so no explicit
 * {@code XACK} is needed.</p>
 *
 * <p>The same stream can be read by any number of consumer groups: each
 * group has its own cursor and its own pending lists, so analytics,
 * notifications, and audit can all process the full event flow at their
 * own pace without coordinating with each other.</p>
 */
public class EventStream {

    public static final String DEFAULT_STREAM_KEY = "demo:events:orders";
    public static final int DEFAULT_MAXLEN_APPROX = 10_000;
    public static final int DEFAULT_CLAIM_MIN_IDLE_MS = 15_000;

    private final JedisPool pool;
    private final String streamKey;
    private final int maxlenApprox;
    private final int claimMinIdleMs;

    private final Object statsLock = new Object();
    private long producedTotal;
    private long ackedTotal;
    private long claimedTotal;

    public EventStream(JedisPool pool) {
        this(pool, DEFAULT_STREAM_KEY, DEFAULT_MAXLEN_APPROX, DEFAULT_CLAIM_MIN_IDLE_MS);
    }

    public EventStream(JedisPool pool, String streamKey, int maxlenApprox, int claimMinIdleMs) {
        if (pool == null) {
            throw new IllegalArgumentException("pool is required");
        }
        this.pool = pool;
        this.streamKey = (streamKey == null || streamKey.isEmpty())
                ? DEFAULT_STREAM_KEY : streamKey;
        this.maxlenApprox = maxlenApprox > 0 ? maxlenApprox : DEFAULT_MAXLEN_APPROX;
        this.claimMinIdleMs = claimMinIdleMs >= 0 ? claimMinIdleMs : DEFAULT_CLAIM_MIN_IDLE_MS;
    }

    public String getStreamKey() {
        return streamKey;
    }

    public int getMaxlenApprox() {
        return maxlenApprox;
    }

    public int getClaimMinIdleMs() {
        return claimMinIdleMs;
    }

    /** A single stream entry: id plus its flat field/value map. */
    public static final class Entry {
        public final String id;
        public final Map<String, String> fields;

        public Entry(String id, Map<String, String> fields) {
            this.id = id;
            this.fields = fields;
        }
    }

    /** Result of one {@link #autoclaim} sweep across the PEL. */
    public static final class AutoClaimResult {
        public final List<Entry> claimed;
        public final List<String> deletedIds;

        public AutoClaimResult(List<Entry> claimed, List<String> deletedIds) {
            this.claimed = claimed;
            this.deletedIds = deletedIds;
        }
    }

    // ------------------------------------------------------------------
    // Producer
    // ------------------------------------------------------------------

    /** Append a single event. Returns the stream ID Redis assigned. */
    public String produce(String eventType, Map<String, String> payload) {
        List<Map.Entry<String, Map<String, String>>> events = new ArrayList<>(1);
        events.add(new java.util.AbstractMap.SimpleEntry<>(eventType, payload));
        return produceBatch(events).get(0);
    }

    /**
     * Pipeline several {@code XADD} calls in one round trip.
     *
     * <p>Each entry carries an approximate {@code MAXLEN} cap. The
     * {@code ~} flavour lets Redis trim at a macro-node boundary, which
     * is much cheaper than exact trimming and is the right call for a
     * retention guardrail rather than a hard size limit.</p>
     */
    public List<String> produceBatch(List<Map.Entry<String, Map<String, String>>> events) {
        List<String> ids = new ArrayList<>(events.size());
        try (Jedis jedis = pool.getResource()) {
            Pipeline pipe = jedis.pipelined();
            List<Response<StreamEntryID>> responses = new ArrayList<>(events.size());
            for (Map.Entry<String, Map<String, String>> event : events) {
                Map<String, String> fields = encodeFields(event.getKey(), event.getValue());
                XAddParams params = new XAddParams()
                        .maxLen(maxlenApprox)
                        .approximateTrimming();
                responses.add(pipe.xadd(streamKey, params, fields));
            }
            pipe.sync();
            for (Response<StreamEntryID> resp : responses) {
                StreamEntryID id = resp.get();
                ids.add(id == null ? null : id.toString());
            }
        }
        synchronized (statsLock) {
            producedTotal += ids.size();
        }
        return ids;
    }

    private static Map<String, String> encodeFields(String eventType, Map<String, String> payload) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("type", eventType);
        fields.put("ts_ms", Long.toString(System.currentTimeMillis()));
        if (payload != null) {
            for (Map.Entry<String, String> e : payload.entrySet()) {
                String key = e.getKey();
                String value = e.getValue();
                fields.put(key, value == null ? "" : value);
            }
        }
        return fields;
    }

    // ------------------------------------------------------------------
    // Consumer groups
    // ------------------------------------------------------------------

    /**
     * Create the consumer group if it doesn't exist.
     *
     * <p>{@code $} means "deliver only events appended after this point";
     * pass {@code 0-0} to replay the entire stream into a fresh group.
     * {@code BUSYGROUP} errors (group already exists) are swallowed.</p>
     */
    public void ensureGroup(String group, String startId) {
        try (Jedis jedis = pool.getResource()) {
            jedis.xgroupCreate(streamKey, group, new StreamEntryID(startId), true);
        } catch (JedisDataException exc) {
            if (exc.getMessage() == null || !exc.getMessage().contains("BUSYGROUP")) {
                throw exc;
            }
        }
    }

    public long deleteGroup(String group) {
        try (Jedis jedis = pool.getResource()) {
            return jedis.xgroupDestroy(streamKey, group);
        } catch (JedisDataException exc) {
            return 0L;
        }
    }

    /**
     * Read new entries for this consumer via {@code XREADGROUP}.
     *
     * <p>The {@code >} ID means "deliver entries this consumer group has
     * not delivered to <em>anyone</em> yet" — the at-least-once path.
     * Replaying an explicit ID instead would re-deliver entries already
     * in this consumer's pending list (see {@link #consumeOwnPel} for
     * that recovery path).</p>
     */
    public List<Entry> consume(String group, String consumer, int count, long blockMs) {
        try (Jedis jedis = pool.getResource()) {
            XReadGroupParams params = new XReadGroupParams()
                    .count(count)
                    .block((int) blockMs);
            Map<String, StreamEntryID> streams = new LinkedHashMap<>();
            // ``UNRECEIVED_ENTRY`` is the Jedis sentinel that serialises
            // to the special ID ``>``: "deliver entries this group has
            // not yet delivered to anyone". Same field name across 5.x
            // and 6.x; 6.x also exposes it as ``XREADGROUP_UNDELIVERED_ENTRY``.
            streams.put(streamKey, StreamEntryID.UNRECEIVED_ENTRY);
            List<Map.Entry<String, List<StreamEntry>>> result =
                    jedis.xreadGroup(group, consumer, params, streams);
            return flattenEntries(result);
        }
    }

    /**
     * Re-deliver entries already in this consumer's PEL.
     *
     * <p>Reading with an explicit ID ({@code 0-0}) instead of {@code >}
     * replays the entries already assigned to this consumer name
     * without advancing the group's {@code last-delivered-id}. This is
     * the canonical recovery path after a crash on the same consumer
     * name, and is also how a consumer picks up entries that another
     * consumer (or {@code XAUTOCLAIM}) handed to it.</p>
     */
    public List<Entry> consumeOwnPel(String group, String consumer, int count) {
        try (Jedis jedis = pool.getResource()) {
            XReadGroupParams params = new XReadGroupParams().count(count);
            Map<String, StreamEntryID> streams = new LinkedHashMap<>();
            streams.put(streamKey, new StreamEntryID(0L, 0L));
            List<Map.Entry<String, List<StreamEntry>>> result =
                    jedis.xreadGroup(group, consumer, params, streams);
            return flattenEntries(result);
        }
    }

    public long ack(String group, List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0L;
        }
        StreamEntryID[] entryIds = new StreamEntryID[ids.size()];
        for (int i = 0; i < ids.size(); i++) {
            entryIds[i] = new StreamEntryID(ids.get(i));
        }
        long acked;
        try (Jedis jedis = pool.getResource()) {
            acked = jedis.xack(streamKey, group, entryIds);
        }
        synchronized (statsLock) {
            ackedTotal += acked;
        }
        return acked;
    }

    /**
     * Sweep idle pending entries to {@code consumer}.
     *
     * <p>A single {@code XAUTOCLAIM} call scans up to {@code pageCount}
     * PEL entries starting at {@code startId} and returns a continuation
     * cursor. For a full sweep of the PEL, loop until the cursor returns
     * to {@code 0-0} (or hit {@code maxPages} as a safety net so a very
     * large PEL cannot monopolise the call).</p>
     *
     * <p>The {@code deletedIds} list contains PEL entries whose stream
     * payload had already been trimmed by the time this sweep ran
     * (typically because {@code MAXLEN ~} retention outran a slow
     * consumer). {@code XAUTOCLAIM} removes those dangling slots from
     * the PEL itself — the caller does <strong>not</strong> need to
     * {@code XACK} them — but they cannot be retried, so log and route
     * them to a dead-letter store for observability.</p>
     */
    public AutoClaimResult autoclaim(
            String group, String consumer, int pageCount, String startId, int maxPages) {
        List<Entry> claimedAll = new ArrayList<>();
        List<String> deletedAll = new ArrayList<>();
        String cursor = (startId == null || startId.isEmpty()) ? "0-0" : startId;
        try (Jedis jedis = pool.getResource()) {
            for (int page = 0; page < maxPages; page++) {
                // Use sendCommand to get the raw 3-element reply
                // (next-id, claimed-entries, deleted-ids). Jedis 6's
                // typed xautoclaim wrapper hides the deleted-ids slot.
                Object raw = jedis.sendCommand(
                        XAutoClaimRaw.XAUTOCLAIM,
                        streamKey, group, consumer,
                        Integer.toString(claimMinIdleMs),
                        cursor,
                        "COUNT", Integer.toString(pageCount));
                ParsedAutoClaim parsed = parseAutoClaim(raw);
                claimedAll.addAll(parsed.claimed);
                deletedAll.addAll(parsed.deletedIds);
                if ("0-0".equals(parsed.nextCursor)) {
                    break;
                }
                cursor = parsed.nextCursor;
            }
        }
        synchronized (statsLock) {
            claimedTotal += claimedAll.size();
        }
        return new AutoClaimResult(claimedAll, deletedAll);
    }

    private enum XAutoClaimRaw implements ProtocolCommand {
        XAUTOCLAIM;

        @Override
        public byte[] getRaw() {
            return SafeEncoder.encode("XAUTOCLAIM");
        }
    }

    private static final class ParsedAutoClaim {
        final String nextCursor;
        final List<Entry> claimed;
        final List<String> deletedIds;

        ParsedAutoClaim(String nextCursor, List<Entry> claimed, List<String> deletedIds) {
            this.nextCursor = nextCursor;
            this.claimed = claimed;
            this.deletedIds = deletedIds;
        }
    }

    @SuppressWarnings("unchecked")
    private static ParsedAutoClaim parseAutoClaim(Object raw) {
        if (!(raw instanceof List)) {
            return new ParsedAutoClaim("0-0", Collections.emptyList(), Collections.emptyList());
        }
        List<Object> arr = (List<Object>) raw;
        String nextCursor = decodeString(arr.get(0));
        List<Object> entriesRaw = arr.size() > 1 && arr.get(1) instanceof List
                ? (List<Object>) arr.get(1) : Collections.emptyList();
        List<Object> deletedRaw = arr.size() > 2 && arr.get(2) instanceof List
                ? (List<Object>) arr.get(2) : Collections.emptyList();

        List<Entry> claimed = new ArrayList<>(entriesRaw.size());
        for (Object item : entriesRaw) {
            if (!(item instanceof List)) {
                continue;
            }
            List<Object> entry = (List<Object>) item;
            if (entry.size() < 2) {
                continue;
            }
            String id = decodeString(entry.get(0));
            Map<String, String> fields = decodeFieldArray(entry.get(1));
            claimed.add(new Entry(id, fields));
        }
        List<String> deleted = new ArrayList<>(deletedRaw.size());
        for (Object item : deletedRaw) {
            deleted.add(decodeString(item));
        }
        return new ParsedAutoClaim(nextCursor, claimed, deleted);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> decodeFieldArray(Object raw) {
        Map<String, String> fields = new LinkedHashMap<>();
        if (!(raw instanceof List)) {
            return fields;
        }
        List<Object> arr = (List<Object>) raw;
        for (int i = 0; i + 1 < arr.size(); i += 2) {
            String key = decodeString(arr.get(i));
            String value = decodeString(arr.get(i + 1));
            fields.put(key, value == null ? "" : value);
        }
        return fields;
    }

    private static String decodeString(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof byte[]) {
            return SafeEncoder.encode((byte[]) raw);
        }
        return raw.toString();
    }

    /**
     * Drop a consumer from a group.
     *
     * <p>{@code XGROUP DELCONSUMER} destroys this consumer's PEL entries
     * — any entry it still owned is no longer tracked anywhere in the
     * group, and {@code XAUTOCLAIM} will never find it again. Always
     * {@link #handoverPending} (or {@code XCLAIM} it manually) to a
     * healthy consumer first; this method is the raw destructive call
     * and is exposed only for explicit cleanup.</p>
     */
    public long deleteConsumer(String group, String consumer) {
        try (Jedis jedis = pool.getResource()) {
            return jedis.xgroupDelConsumer(streamKey, group, consumer);
        } catch (JedisDataException exc) {
            return 0L;
        }
    }

    /**
     * Move every PEL entry owned by {@code fromConsumer} to
     * {@code toConsumer}.
     *
     * <p>Enumerates the source consumer's PEL with {@code XPENDING ...
     * CONSUMER} and reassigns each ID with {@code XCLAIM} at zero idle
     * time so the move is unconditional. ({@code XAUTOCLAIM} does not
     * filter by source consumer, so it cannot be used for a per-consumer
     * handover.)</p>
     *
     * <p>Call this before {@link #deleteConsumer} whenever the source
     * still has pending entries — otherwise {@code XGROUP DELCONSUMER}
     * would silently destroy them and they could never be recovered.</p>
     */
    public int handoverPending(String group, String fromConsumer, String toConsumer, int batch) {
        int total = 0;
        try (Jedis jedis = pool.getResource()) {
            while (true) {
                XPendingParams params = new XPendingParams()
                        .idle(0L)
                        .count(batch)
                        .consumer(fromConsumer);
                List<StreamPendingEntry> rows = jedis.xpending(streamKey, group, params);
                if (rows == null || rows.isEmpty()) {
                    break;
                }
                StreamEntryID[] ids = new StreamEntryID[rows.size()];
                for (int i = 0; i < rows.size(); i++) {
                    ids[i] = rows.get(i).getID();
                }
                XClaimParams claimParams = new XClaimParams();
                List<StreamEntry> claimed = jedis.xclaim(
                        streamKey, group, toConsumer, 0L, claimParams, ids);
                total += (claimed == null ? 0 : claimed.size());
                if (rows.size() < batch) {
                    break;
                }
            }
        }
        synchronized (statsLock) {
            claimedTotal += total;
        }
        return total;
    }

    // ------------------------------------------------------------------
    // Replay, length, trim
    // ------------------------------------------------------------------

    /**
     * Range read with {@code XRANGE} for replay or audit.
     *
     * <p>Read-only: ranges do not update any group cursor and do not ack
     * anything. Useful for bootstrapping a new projection, for building
     * an audit view, or for debugging what actually went through the
     * stream.</p>
     */
    public List<Entry> replay(String startId, String endId, int count) {
        try (Jedis jedis = pool.getResource()) {
            List<StreamEntry> rows = jedis.xrange(streamKey, startId, endId, count);
            return toEntries(rows);
        }
    }

    public long length() {
        try (Jedis jedis = pool.getResource()) {
            return jedis.xlen(streamKey);
        } catch (JedisDataException exc) {
            return 0L;
        }
    }

    public long trimMaxlen(long maxlen) {
        try (Jedis jedis = pool.getResource()) {
            XTrimParams params = new XTrimParams().maxLen(maxlen).approximateTrimming();
            return jedis.xtrim(streamKey, params);
        } catch (JedisDataException exc) {
            return 0L;
        }
    }

    public long trimMinid(String minid) {
        try (Jedis jedis = pool.getResource()) {
            XTrimParams params = new XTrimParams().minId(minid).approximateTrimming();
            return jedis.xtrim(streamKey, params);
        } catch (JedisDataException exc) {
            return 0L;
        }
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /** Subset of {@code XINFO STREAM} that's safe to JSON-encode. */
    public Map<String, Object> infoStream() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("length", 0L);
        info.put("last_generated_id", null);
        info.put("first_entry_id", null);
        info.put("last_entry_id", null);
        try (Jedis jedis = pool.getResource()) {
            StreamInfo raw = jedis.xinfoStream(streamKey);
            if (raw == null) {
                return info;
            }
            info.put("length", raw.getLength());
            info.put("last_generated_id",
                    raw.getLastGeneratedId() == null ? null : raw.getLastGeneratedId().toString());
            StreamEntry first = raw.getFirstEntry();
            StreamEntry last = raw.getLastEntry();
            info.put("first_entry_id", first == null ? null : first.getID().toString());
            info.put("last_entry_id", last == null ? null : last.getID().toString());
        } catch (JedisDataException exc) {
            // Key does not exist yet — return the default empty info.
        }
        return info;
    }

    public List<Map<String, Object>> infoGroups() {
        List<Map<String, Object>> out = new ArrayList<>();
        try (Jedis jedis = pool.getResource()) {
            List<StreamGroupInfo> rows = jedis.xinfoGroups(streamKey);
            if (rows == null) {
                return out;
            }
            for (StreamGroupInfo row : rows) {
                Map<String, Object> g = new LinkedHashMap<>();
                g.put("name", row.getName());
                g.put("consumers", row.getConsumers());
                g.put("pending", row.getPending());
                g.put("last_delivered_id",
                        row.getLastDeliveredId() == null ? null : row.getLastDeliveredId().toString());
                Map<String, Object> rawInfo = row.getGroupInfo();
                Object lag = rawInfo == null ? null : rawInfo.get("lag");
                g.put("lag", lag instanceof Number ? ((Number) lag).longValue() : null);
                out.add(g);
            }
        } catch (JedisDataException exc) {
            // Stream key not present.
        }
        return out;
    }

    public List<Map<String, Object>> infoConsumers(String group) {
        List<Map<String, Object>> out = new ArrayList<>();
        try (Jedis jedis = pool.getResource()) {
            List<StreamConsumerInfo> rows = jedis.xinfoConsumers2(streamKey, group);
            if (rows == null) {
                return out;
            }
            for (StreamConsumerInfo row : rows) {
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("name", row.getName());
                c.put("pending", (long) row.getPending());
                c.put("idle_ms", row.getIdle());
                out.add(c);
            }
        } catch (JedisDataException exc) {
            // Group does not exist.
        }
        return out;
    }

    /** Per-entry PEL view (id, consumer, idle, deliveries). */
    public List<Map<String, Object>> pendingDetail(String group, int count) {
        List<Map<String, Object>> out = new ArrayList<>();
        try (Jedis jedis = pool.getResource()) {
            XPendingParams params = new XPendingParams()
                    .start(StreamEntryID.MINIMUM_ID)
                    .end(StreamEntryID.MAXIMUM_ID)
                    .count(count);
            List<StreamPendingEntry> rows = jedis.xpending(streamKey, group, params);
            if (rows == null) {
                return out;
            }
            for (StreamPendingEntry row : rows) {
                Map<String, Object> p = new LinkedHashMap<>();
                p.put("id", row.getID().toString());
                p.put("consumer", row.getConsumerName());
                p.put("idle_ms", row.getIdleTime());
                p.put("deliveries", row.getDeliveredTimes());
                out.add(p);
            }
        } catch (JedisDataException exc) {
            // Group does not exist or stream missing.
        }
        return out;
    }

    /** Reverse-range tail read, used by the demo to render the most recent entries. */
    public List<Entry> tail(int count) {
        try (Jedis jedis = pool.getResource()) {
            List<StreamEntry> rows = jedis.xrevrange(streamKey, "+", "-", count);
            return toEntries(rows);
        } catch (JedisDataException exc) {
            return new ArrayList<>();
        }
    }

    public Map<String, Long> stats() {
        Map<String, Long> snapshot = new LinkedHashMap<>();
        synchronized (statsLock) {
            snapshot.put("produced_total", producedTotal);
            snapshot.put("acked_total", ackedTotal);
            snapshot.put("claimed_total", claimedTotal);
        }
        return snapshot;
    }

    public void resetStats() {
        synchronized (statsLock) {
            producedTotal = 0L;
            ackedTotal = 0L;
            claimedTotal = 0L;
        }
    }

    // ------------------------------------------------------------------
    // Demo housekeeping
    // ------------------------------------------------------------------

    /** Drop the stream key entirely. Used by the demo's reset path. */
    public void deleteStream() {
        try (Jedis jedis = pool.getResource()) {
            jedis.del(streamKey);
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static List<Entry> flattenEntries(
            List<Map.Entry<String, List<StreamEntry>>> raw) {
        List<Entry> out = new ArrayList<>();
        if (raw == null) {
            return out;
        }
        for (Map.Entry<String, List<StreamEntry>> stream : raw) {
            for (StreamEntry entry : stream.getValue()) {
                out.add(new Entry(entry.getID().toString(), entry.getFields()));
            }
        }
        return out;
    }

    private static List<Entry> toEntries(List<StreamEntry> rows) {
        List<Entry> out = new ArrayList<>();
        if (rows == null) {
            return out;
        }
        for (StreamEntry row : rows) {
            out.add(new Entry(row.getID().toString(), row.getFields()));
        }
        return out;
    }
}
