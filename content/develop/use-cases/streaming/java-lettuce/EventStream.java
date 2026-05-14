import io.lettuce.core.Consumer;
import io.lettuce.core.Limit;
import io.lettuce.core.Range;
import io.lettuce.core.RedisBusyException;
import io.lettuce.core.RedisCommandExecutionException;
import io.lettuce.core.RedisFuture;
import io.lettuce.core.StreamMessage;
import io.lettuce.core.XAddArgs;
import io.lettuce.core.XAutoClaimArgs;
import io.lettuce.core.XClaimArgs;
import io.lettuce.core.XGroupCreateArgs;
import io.lettuce.core.XPendingArgs;
import io.lettuce.core.XReadArgs;
import io.lettuce.core.XTrimArgs;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.models.stream.ClaimedMessages;
import io.lettuce.core.models.stream.PendingMessage;
import io.lettuce.core.output.NestedMultiOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.CommandType;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Redis event-stream helper backed by a single Redis Stream.
 *
 * <p>Producers append events with {@code XADD}. Consumers belong to
 * consumer groups and read with {@code XREADGROUP}. The group as a
 * whole tracks a single {@code last-delivered-id} cursor, and each
 * consumer gets its own pending-entries list (PEL) of in-flight
 * messages it has been handed. Once a consumer has processed an entry
 * it acknowledges it with {@code XACK}; entries left unacknowledged
 * past an idle threshold can be swept to a healthy consumer with
 * {@code XAUTOCLAIM} (or to a specific one with {@code XCLAIM}).</p>
 *
 * <p>Each {@code XADD} carries an approximate {@code MAXLEN} so the
 * stream stays bounded as it rolls forward. {@code XRANGE} supports
 * replay over the retained history for debugging, audit, or rebuilding
 * a downstream projection.</p>
 *
 * <p>The same stream can be read by any number of consumer groups —
 * each group has its own cursor and its own pending lists, so
 * analytics, notifications, and audit can all process the full event
 * flow at their own pace without coordinating with each other.</p>
 *
 * <p>Lettuce-specific notes:</p>
 * <ul>
 *   <li>A single {@link StatefulRedisConnection} is thread-safe for
 *   individual command calls; this class shares one connection across
 *   threads. No transactions are issued, so no client-side lock is
 *   required around commands here.</li>
 *   <li>Lettuce's {@code xautoclaim} method returns a
 *   {@link ClaimedMessages} that only exposes the continuation cursor
 *   and claimed messages — it does <em>not</em> surface the third
 *   reply element (deleted IDs) that Redis 7+ introduced. To preserve
 *   the textbook {@code (cursor, claimed, deleted_ids)} shape that the
 *   reference implementation returns, this helper dispatches the
 *   {@code XAUTOCLAIM} command itself with a
 *   {@link NestedMultiOutput} so it can parse the third slot.</li>
 *   <li>{@link #produceBatch(Iterable)} uses the async API with
 *   {@code setAutoFlushCommands(false)} so the batch is one round
 *   trip. The sync API would block on every command's future and
 *   deadlock with auto-flush off.</li>
 * </ul>
 */
public class EventStream {

    /** A single stream entry: {@code (id, fields)}. */
    public static final class Entry {
        public final String id;
        public final Map<String, String> fields;

        public Entry(String id, Map<String, String> fields) {
            this.id = id;
            this.fields = fields;
        }
    }

    /** Result of an {@link #autoclaim(String, String, long, String, int)} sweep. */
    public static final class AutoClaimResult {
        public final List<Entry> claimed;
        public final List<String> deletedIds;
        public final String nextCursor;

        public AutoClaimResult(List<Entry> claimed, List<String> deletedIds, String nextCursor) {
            this.claimed = claimed;
            this.deletedIds = deletedIds;
            this.nextCursor = nextCursor;
        }
    }

    /** Per-entry pending detail. */
    public static final class PendingEntry {
        public final String id;
        public final String consumer;
        public final long idleMs;
        public final long deliveries;

        public PendingEntry(String id, String consumer, long idleMs, long deliveries) {
            this.id = id;
            this.consumer = consumer;
            this.idleMs = idleMs;
            this.deliveries = deliveries;
        }
    }

    private final StatefulRedisConnection<String, String> connection;
    private final String streamKey;
    private final long maxlenApprox;
    private final long claimMinIdleMs;

    private final AtomicLong producedTotal = new AtomicLong();
    private final AtomicLong ackedTotal = new AtomicLong();
    private final AtomicLong claimedTotal = new AtomicLong();

    public EventStream(StatefulRedisConnection<String, String> connection) {
        this(connection, "demo:events:orders", 10_000L, 15_000L);
    }

    public EventStream(
            StatefulRedisConnection<String, String> connection,
            String streamKey,
            long maxlenApprox,
            long claimMinIdleMs) {
        if (connection == null) {
            throw new IllegalArgumentException("connection is required");
        }
        if (streamKey == null || streamKey.isEmpty()) {
            throw new IllegalArgumentException("streamKey is required");
        }
        this.connection = connection;
        this.streamKey = streamKey;
        this.maxlenApprox = maxlenApprox;
        this.claimMinIdleMs = claimMinIdleMs;
    }

    public String getStreamKey() { return streamKey; }
    public long getMaxlenApprox() { return maxlenApprox; }
    public long getClaimMinIdleMs() { return claimMinIdleMs; }

    // ------------------------------------------------------------------
    // Producer
    // ------------------------------------------------------------------

    /** Append a single event. Returns the stream ID Redis assigned. */
    public String produce(String eventType, Map<String, String> payload) {
        Map<String, String> fields = encodeFields(eventType, payload);
        XAddArgs args = XAddArgs.Builder.maxlen(maxlenApprox).approximateTrimming();
        String id = connection.sync().xadd(streamKey, args, fields);
        producedTotal.incrementAndGet();
        return id;
    }

    /**
     * Pipeline several {@code XADD} calls via the async API.
     *
     * <p>Lettuce's async API lets us queue commands and await their
     * futures in bulk, but {@link StatefulConnection#setAutoFlushCommands}
     * is <em>connection-wide</em>: turning auto-flush off so we can
     * batch this method's writes would also stall every other thread
     * that is currently issuing sync commands on the same connection
     * (the consumer workers' {@code XREADGROUP} loops, in this demo).
     * That deadlocks silently — no exception, just a hung consumer
     * whose command sits in the buffer until something else triggers
     * a flush.</p>
     *
     * <p>The safe pattern here is to leave auto-flush on and queue the
     * async {@code XADD} calls. Lettuce still pipelines them when they
     * arrive faster than the round-trip latency, and the futures
     * complete independently of any other thread's traffic. For
     * truly large batches you would use a dedicated connection so
     * {@code setAutoFlushCommands(false)} can't affect other threads.</p>
     */
    public List<String> produceBatch(Iterable<Map.Entry<String, Map<String, String>>> events) {
        RedisAsyncCommands<String, String> async = connection.async();
        List<RedisFuture<String>> futures = new ArrayList<>();
        for (Map.Entry<String, Map<String, String>> event : events) {
            if (event == null) continue;
            Map<String, String> fields = encodeFields(event.getKey(), event.getValue());
            XAddArgs args = XAddArgs.Builder.maxlen(maxlenApprox).approximateTrimming();
            futures.add(async.xadd(streamKey, args, fields));
        }
        List<String> ids = new ArrayList<>(futures.size());
        for (RedisFuture<String> future : futures) {
            try {
                ids.add(future.get());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("produceBatch interrupted", e);
            } catch (ExecutionException e) {
                throw new RuntimeException("produceBatch failed", e.getCause());
            }
        }
        if (!ids.isEmpty()) producedTotal.addAndGet(ids.size());
        return ids;
    }

    private static Map<String, String> encodeFields(String eventType, Map<String, String> payload) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("type", eventType);
        fields.put("ts_ms", Long.toString(System.currentTimeMillis()));
        if (payload != null) {
            for (Map.Entry<String, String> kv : payload.entrySet()) {
                fields.put(kv.getKey(), kv.getValue() == null ? "" : kv.getValue());
            }
        }
        return fields;
    }

    // ------------------------------------------------------------------
    // Consumer groups
    // ------------------------------------------------------------------

    /**
     * Create the consumer group if it doesn't exist. Pass {@code "$"}
     * for "only events appended after now", or {@code "0-0"} to replay
     * everything from the beginning of the stream.
     */
    public void ensureGroup(String group, String startId) {
        XReadArgs.StreamOffset<String> offset = XReadArgs.StreamOffset.from(streamKey, startId);
        try {
            connection.sync().xgroupCreate(offset, group, XGroupCreateArgs.Builder.mkstream());
        } catch (RedisBusyException ignored) {
            // BUSYGROUP — group already exists, swallow.
        } catch (RedisCommandExecutionException exc) {
            // Some Lettuce builds throw the generic execution exception
            // for BUSYGROUP instead of the typed RedisBusyException;
            // sniff the message rather than crash on a benign duplicate.
            String msg = exc.getMessage();
            if (msg == null || !msg.contains("BUSYGROUP")) {
                throw exc;
            }
        }
    }

    public long deleteGroup(String group) {
        Boolean destroyed = connection.sync().xgroupDestroy(streamKey, group);
        return Boolean.TRUE.equals(destroyed) ? 1L : 0L;
    }

    /**
     * Read new entries for {@code consumer} via {@code XREADGROUP >}.
     *
     * <p>The {@code >} offset means "deliver entries this group has not
     * delivered to anyone yet" — the at-least-once path. Use
     * {@link #consumeOwnPel(String, String, long)} for the recovery
     * path that re-delivers entries already in this consumer's PEL.</p>
     */
    public List<Entry> consume(String group, String consumer, long count, long blockMs) {
        XReadArgs.StreamOffset<String> offset = XReadArgs.StreamOffset.lastConsumed(streamKey);
        XReadArgs args = XReadArgs.Builder.count(count).block(blockMs);
        List<StreamMessage<String, String>> raw = connection.sync()
                .xreadgroup(Consumer.from(group, consumer), args, offset);
        return toEntries(raw);
    }

    /**
     * Re-deliver entries already in this consumer's PEL (offset
     * {@code "0"}).
     *
     * <p>Reading with an explicit ID instead of {@code >} replays the
     * entries already assigned to this consumer name without advancing
     * the group's {@code last-delivered-id}. Canonical recovery path
     * after a crash on the same consumer name, and also how a consumer
     * picks up entries that {@code XAUTOCLAIM} or {@code XCLAIM} just
     * handed it.</p>
     */
    public List<Entry> consumeOwnPel(String group, String consumer, long count) {
        XReadArgs.StreamOffset<String> offset = XReadArgs.StreamOffset.from(streamKey, "0");
        XReadArgs args = XReadArgs.Builder.count(count);
        List<StreamMessage<String, String>> raw = connection.sync()
                .xreadgroup(Consumer.from(group, consumer), args, offset);
        return toEntries(raw);
    }

    public long ack(String group, Collection<String> ids) {
        if (ids == null || ids.isEmpty()) return 0L;
        Long n = connection.sync().xack(streamKey, group, ids.toArray(new String[0]));
        long count = n == null ? 0L : n;
        if (count > 0) ackedTotal.addAndGet(count);
        return count;
    }

    /**
     * Sweep idle pending entries to {@code consumer}, paging through
     * the PEL with {@code XAUTOCLAIM}'s continuation cursor.
     *
     * <p>For a full sweep, loop until the cursor returns to
     * {@code "0-0"} (or {@code maxPages} as a safety net so a very
     * large PEL can't monopolise the call).</p>
     *
     * <p>{@code deletedIds} are PEL entries whose stream payload had
     * already been trimmed by the time this sweep ran (typically
     * because {@code MAXLEN ~} retention outran a slow consumer).
     * {@code XAUTOCLAIM} on Redis 7+ removes those dangling slots from
     * the PEL itself — the caller does <strong>not</strong> need to
     * {@code XACK} them — but they cannot be retried, so log and route
     * them to a dead-letter store for observability.</p>
     *
     * <p>Lettuce's high-level {@code xautoclaim} method does not surface
     * the third (deleted-IDs) element of the reply, so this method
     * dispatches the command directly with a
     * {@link NestedMultiOutput} and parses all three slots.</p>
     */
    public AutoClaimResult autoclaim(
            String group, String consumer, long pageCount, String startId, int maxPages) {
        List<Entry> claimedAll = new ArrayList<>();
        List<String> deletedAll = new ArrayList<>();
        String cursor = startId == null ? "0-0" : startId;
        String lastCursor = cursor;
        for (int i = 0; i < maxPages; i++) {
            AutoClaimPage page = autoclaimPage(group, consumer, pageCount, cursor);
            claimedAll.addAll(page.claimed);
            deletedAll.addAll(page.deletedIds);
            lastCursor = page.nextCursor;
            if ("0-0".equals(page.nextCursor)) break;
            cursor = page.nextCursor;
        }
        if (!claimedAll.isEmpty()) claimedTotal.addAndGet(claimedAll.size());
        return new AutoClaimResult(claimedAll, deletedAll, lastCursor);
    }

    private static final class AutoClaimPage {
        final List<Entry> claimed;
        final List<String> deletedIds;
        final String nextCursor;

        AutoClaimPage(List<Entry> claimed, List<String> deletedIds, String nextCursor) {
            this.claimed = claimed;
            this.deletedIds = deletedIds;
            this.nextCursor = nextCursor;
        }
    }

    /**
     * Dispatch {@code XAUTOCLAIM} as a raw command so we can read the
     * Redis 7+ third reply slot (deleted IDs). Lettuce's typed helper
     * returns {@link ClaimedMessages}, which only exposes the cursor
     * and the claimed messages.
     */
    @SuppressWarnings("unchecked")
    private AutoClaimPage autoclaimPage(String group, String consumer, long count, String startId) {
        CommandArgs<String, String> commandArgs = new CommandArgs<>(StringCodec.UTF8)
                .addKey(streamKey)
                .add(group)
                .add(consumer)
                .add(claimMinIdleMs)
                .add(startId)
                .add("COUNT")
                .add(count);
        List<Object> reply = connection.sync().dispatch(
                CommandType.XAUTOCLAIM,
                new NestedMultiOutput<>(StringCodec.UTF8),
                commandArgs);
        String nextCursor = "0-0";
        List<Entry> claimed = new ArrayList<>();
        List<String> deletedIds = new ArrayList<>();
        if (reply != null) {
            if (reply.size() >= 1 && reply.get(0) instanceof String) {
                nextCursor = (String) reply.get(0);
            }
            if (reply.size() >= 2 && reply.get(1) instanceof List) {
                for (Object item : (List<Object>) reply.get(1)) {
                    if (!(item instanceof List)) continue;
                    List<Object> entryList = (List<Object>) item;
                    if (entryList.size() < 2) continue;
                    String id = String.valueOf(entryList.get(0));
                    Map<String, String> fields = new LinkedHashMap<>();
                    Object fieldObj = entryList.get(1);
                    if (fieldObj instanceof List) {
                        List<Object> flat = (List<Object>) fieldObj;
                        for (int k = 0; k + 1 < flat.size(); k += 2) {
                            fields.put(String.valueOf(flat.get(k)), String.valueOf(flat.get(k + 1)));
                        }
                    }
                    claimed.add(new Entry(id, fields));
                }
            }
            if (reply.size() >= 3 && reply.get(2) instanceof List) {
                for (Object item : (List<Object>) reply.get(2)) {
                    deletedIds.add(String.valueOf(item));
                }
            }
        }
        return new AutoClaimPage(claimed, deletedIds, nextCursor);
    }

    /**
     * Drop a consumer from a group.
     *
     * <p>{@code XGROUP DELCONSUMER} destroys this consumer's PEL
     * entries — any entry it still owned is no longer tracked anywhere
     * in the group, and {@code XAUTOCLAIM} will never find it again.
     * Call {@link #handoverPending(String, String, String, int)} (or
     * {@code XCLAIM} manually) to a healthy consumer first; this method
     * is the raw destructive call and is exposed only for explicit
     * cleanup.</p>
     */
    public long deleteConsumer(String group, String consumer) {
        try {
            Long n = connection.sync().xgroupDelconsumer(streamKey, Consumer.from(group, consumer));
            return n == null ? 0L : n;
        } catch (RedisCommandExecutionException exc) {
            return 0L;
        }
    }

    /**
     * Move every PEL entry owned by {@code fromConsumer} to
     * {@code toConsumer}.
     *
     * <p>Enumerates the source consumer's PEL with
     * {@code XPENDING ... CONSUMER} and reassigns each ID with
     * {@code XCLAIM} at zero idle time so the move is unconditional.
     * ({@code XAUTOCLAIM} does not filter by source consumer, so it
     * cannot be used for a per-consumer handover.)</p>
     *
     * <p>Call this before {@link #deleteConsumer(String, String)}
     * whenever the source still has pending entries — otherwise
     * {@code XGROUP DELCONSUMER} would silently destroy them.</p>
     */
    public int handoverPending(String group, String fromConsumer, String toConsumer, int batch) {
        RedisCommands<String, String> sync = connection.sync();
        Consumer<String> source = Consumer.from(group, fromConsumer);
        Consumer<String> target = Consumer.from(group, toConsumer);
        int handed = 0;
        while (true) {
            XPendingArgs<String> args = XPendingArgs.Builder.xpending(
                    source, Range.unbounded(), Limit.from(batch));
            List<PendingMessage> rows = sync.xpending(streamKey, args);
            if (rows == null || rows.isEmpty()) break;
            String[] ids = new String[rows.size()];
            for (int i = 0; i < rows.size(); i++) ids[i] = rows.get(i).getId();
            List<StreamMessage<String, String>> claimed = sync.xclaim(
                    streamKey, target, XClaimArgs.Builder.minIdleTime(0L), ids);
            handed += claimed == null ? 0 : claimed.size();
            if (rows.size() < batch) break;
        }
        if (handed > 0) claimedTotal.addAndGet(handed);
        return handed;
    }

    // ------------------------------------------------------------------
    // Replay, length, trim
    // ------------------------------------------------------------------

    /**
     * Range read with {@code XRANGE} for replay or audit. Read-only:
     * ranges do not update any group cursor and do not ack anything.
     */
    public List<Entry> replay(String startId, String endId, long count) {
        Range<String> range = Range.create(
                startId == null ? "-" : startId,
                endId == null ? "+" : endId);
        List<StreamMessage<String, String>> raw = connection.sync()
                .xrange(streamKey, range, Limit.from(count));
        return toEntries(raw);
    }

    /** Most-recent entries first, via {@code XREVRANGE}. */
    public List<Entry> tail(long count) {
        List<StreamMessage<String, String>> raw = connection.sync()
                .xrevrange(streamKey, Range.create("-", "+"), Limit.from(count));
        return toEntries(raw);
    }

    public long length() {
        Long n = connection.sync().xlen(streamKey);
        return n == null ? 0L : n;
    }

    public long trimMaxlen(long maxlen) {
        Long n = connection.sync().xtrim(streamKey,
                new XTrimArgs().maxlen(maxlen).approximateTrimming());
        return n == null ? 0L : n;
    }

    public long trimMinid(String minid) {
        Long n = connection.sync().xtrim(streamKey,
                new XTrimArgs().minId(minid).approximateTrimming());
        return n == null ? 0L : n;
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /** Subset of {@code XINFO STREAM} safe to JSON-encode. */
    public Map<String, Object> infoStream() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("length", 0L);
        out.put("last_generated_id", null);
        out.put("first_entry_id", null);
        out.put("last_entry_id", null);
        try {
            List<Object> raw = connection.sync().xinfoStream(streamKey);
            Map<String, Object> info = pairList(raw);
            Object lengthObj = info.get("length");
            if (lengthObj instanceof Number) out.put("length", ((Number) lengthObj).longValue());
            out.put("last_generated_id", info.get("last-generated-id"));
            out.put("first_entry_id", firstEntryId(info.get("first-entry")));
            out.put("last_entry_id", firstEntryId(info.get("last-entry")));
        } catch (RedisCommandExecutionException ignored) {
            // Stream does not exist yet.
        }
        return out;
    }

    /** {@code XINFO GROUPS} as a JSON-friendly list of maps. */
    public List<Map<String, Object>> infoGroups() {
        List<Map<String, Object>> out = new ArrayList<>();
        try {
            List<Object> raw = connection.sync().xinfoGroups(streamKey);
            if (raw == null) return out;
            for (Object groupObj : raw) {
                if (!(groupObj instanceof List)) continue;
                Map<String, Object> info = pairList((List<Object>) groupObj);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", String.valueOf(info.get("name")));
                row.put("consumers", asLong(info.get("consumers")));
                row.put("pending", asLong(info.get("pending")));
                row.put("last_delivered_id", info.get("last-delivered-id"));
                Object lag = info.get("lag");
                row.put("lag", lag instanceof Number ? ((Number) lag).longValue() : null);
                out.add(row);
            }
        } catch (RedisCommandExecutionException ignored) {
        }
        return out;
    }

    /** {@code XINFO CONSUMERS} as a JSON-friendly list of maps. */
    public List<Map<String, Object>> infoConsumers(String group) {
        List<Map<String, Object>> out = new ArrayList<>();
        try {
            List<Object> raw = connection.sync().xinfoConsumers(streamKey, group);
            if (raw == null) return out;
            for (Object consumerObj : raw) {
                if (!(consumerObj instanceof List)) continue;
                Map<String, Object> info = pairList((List<Object>) consumerObj);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", String.valueOf(info.get("name")));
                row.put("pending", asLong(info.get("pending")));
                row.put("idle_ms", asLong(info.get("idle")));
                out.add(row);
            }
        } catch (RedisCommandExecutionException ignored) {
        }
        return out;
    }

    /** Per-entry PEL view: id, consumer, idle, deliveries. */
    public List<PendingEntry> pendingDetail(String group, int count) {
        List<PendingEntry> out = new ArrayList<>();
        try {
            List<PendingMessage> rows = connection.sync().xpending(
                    streamKey, group, Range.unbounded(), Limit.from(count));
            if (rows == null) return out;
            for (PendingMessage row : rows) {
                out.add(new PendingEntry(
                        row.getId(),
                        row.getConsumer(),
                        row.getMsSinceLastDelivery(),
                        row.getRedeliveryCount()));
            }
        } catch (RedisCommandExecutionException ignored) {
        }
        return out;
    }

    // ------------------------------------------------------------------
    // Stats and demo housekeeping
    // ------------------------------------------------------------------

    public Map<String, Long> stats() {
        Map<String, Long> out = new LinkedHashMap<>();
        out.put("produced_total", producedTotal.get());
        out.put("acked_total", ackedTotal.get());
        out.put("claimed_total", claimedTotal.get());
        return out;
    }

    public void resetStats() {
        producedTotal.set(0);
        ackedTotal.set(0);
        claimedTotal.set(0);
    }

    /** Drop the stream key entirely. Used by the demo's reset path. */
    public void deleteStream() {
        connection.sync().del(streamKey);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static List<Entry> toEntries(List<StreamMessage<String, String>> raw) {
        if (raw == null || raw.isEmpty()) return Collections.emptyList();
        List<Entry> out = new ArrayList<>(raw.size());
        for (StreamMessage<String, String> msg : raw) {
            Map<String, String> body = msg.getBody();
            out.add(new Entry(msg.getId(), body == null ? new LinkedHashMap<>() : body));
        }
        return out;
    }

    /**
     * Convert a Redis flat alternating list (key, value, key, value, ...)
     * into a Map. Used to parse XINFO replies, which Lettuce returns as
     * a raw {@code List<Object>}.
     */
    @SuppressWarnings("unchecked")
    private static Map<String, Object> pairList(List<Object> flat) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (flat == null) return out;
        for (int i = 0; i + 1 < flat.size(); i += 2) {
            Object keyObj = flat.get(i);
            if (keyObj == null) continue;
            out.put(String.valueOf(keyObj), flat.get(i + 1));
        }
        return out;
    }

    /**
     * XINFO STREAM's {@code first-entry} / {@code last-entry} comes
     * back as {@code [id, [field, value, ...]]} or {@code nil}. We
     * only need the ID for the demo's state view.
     */
    private static String firstEntryId(Object value) {
        if (!(value instanceof List)) return null;
        List<?> entry = (List<?>) value;
        if (entry.isEmpty()) return null;
        Object id = entry.get(0);
        return id == null ? null : String.valueOf(id);
    }

    private static long asLong(Object value) {
        if (value instanceof Number) return ((Number) value).longValue();
        if (value instanceof String) {
            try { return Long.parseLong((String) value); } catch (NumberFormatException ignored) { return 0L; }
        }
        return 0L;
    }
}
