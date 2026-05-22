import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Mock primary data store for the prefetch-cache demo.
 *
 * <p>This stands in for a source-of-truth database (Postgres, MySQL,
 * Mongo, etc.) that holds reference data the application serves to
 * users.</p>
 *
 * <p>Every mutation appends a change event to an in-process queue,
 * which the sync worker drains and applies to Redis. In a real system
 * the queue is replaced by a CDC pipeline — Redis Data Integration,
 * Debezium plus a lightweight consumer, or an equivalent tool that
 * tails the source's binlog/WAL and pushes changes into Redis.</p>
 *
 * <p>The store also exposes a read-latency knob so the demo can
 * illustrate how much slower a direct primary read would be than a
 * Redis hit.</p>
 */
public class MockPrimaryStore {

    public static final String CHANGE_OP_UPSERT = "upsert";
    public static final String CHANGE_OP_DELETE = "delete";

    private final int readLatencyMs;
    private final AtomicLong reads = new AtomicLong();
    private final Object lock = new Object();
    private final Map<String, Map<String, String>> records = new LinkedHashMap<>();
    private final LinkedBlockingQueue<Map<String, Object>> changes = new LinkedBlockingQueue<>();

    public MockPrimaryStore() {
        this(80);
    }

    public MockPrimaryStore(int readLatencyMs) {
        this.readLatencyMs = readLatencyMs;
        seed("cat-001", "Beverages", "1", "true", "");
        seed("cat-002", "Bakery", "2", "true", "");
        seed("cat-003", "Pantry Staples", "3", "false", "");
        seed("cat-004", "Frozen", "4", "false", "");
        seed("cat-005", "Specialty Cheeses", "5", "false", "cat-002");
    }

    public int getReadLatencyMs() {
        return readLatencyMs;
    }

    /** Sorted list of every record id. No sleep, no counter increment (metadata-only). */
    public List<String> listIds() {
        List<String> ids;
        synchronized (lock) {
            ids = new ArrayList<>(records.keySet());
        }
        Collections.sort(ids);
        return ids;
    }

    /** Return every record. Used by the cache's bulk-load path on startup. */
    public List<Map<String, String>> listRecords() {
        sleepReadLatency();
        synchronized (lock) {
            reads.incrementAndGet();
            List<Map<String, String>> out = new ArrayList<>(records.size());
            for (Map<String, String> record : records.values()) {
                out.add(new LinkedHashMap<>(record));
            }
            return out;
        }
    }

    /** Single-record read. Not on the demo's normal read path. */
    public Map<String, String> read(String entityId) {
        sleepReadLatency();
        synchronized (lock) {
            reads.incrementAndGet();
            Map<String, String> record = records.get(entityId);
            return record == null ? null : new LinkedHashMap<>(record);
        }
    }

    public boolean addRecord(Map<String, String> record) {
        if (record == null) return false;
        String entityId = record.getOrDefault("id", "").trim();
        if (entityId.isEmpty()) return false;
        synchronized (lock) {
            if (records.containsKey(entityId)) {
                return false;
            }
            records.put(entityId, new LinkedHashMap<>(record));
            // Emit while the lock is held so the queue order matches
            // the mutation order. Two concurrent callers cannot
            // interleave mutation A → mutation B → emit B → emit A.
            emitChangeLocked(CHANGE_OP_UPSERT, entityId, new LinkedHashMap<>(record));
        }
        return true;
    }

    public boolean updateField(String entityId, String field, String value) {
        synchronized (lock) {
            Map<String, String> record = records.get(entityId);
            if (record == null) {
                return false;
            }
            record.put(field, value);
            emitChangeLocked(CHANGE_OP_UPSERT, entityId, new LinkedHashMap<>(record));
        }
        return true;
    }

    public boolean deleteRecord(String entityId) {
        synchronized (lock) {
            if (!records.containsKey(entityId)) {
                return false;
            }
            records.remove(entityId);
            emitChangeLocked(CHANGE_OP_DELETE, entityId, null);
        }
        return true;
    }

    /**
     * Block up to {@code timeoutMs} for the next change event. Returns
     * {@code null} on timeout.
     */
    public Map<String, Object> nextChange(long timeoutMs) {
        try {
            return changes.poll(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        }
    }

    public long reads() {
        return reads.get();
    }

    public void resetReads() {
        reads.set(0);
    }

    /**
     * Append a change event to the feed. Caller must hold {@link #lock}.
     *
     * <p>{@link LinkedBlockingQueue#offer(Object)} is itself thread-safe
     * and never tries to acquire {@link #lock}, so calling it while
     * holding the records lock cannot deadlock. Holding the lock here
     * is what guarantees the queue order matches the order in which
     * the records map was mutated.</p>
     */
    private void emitChangeLocked(String op, String entityId, Map<String, String> fields) {
        Map<String, Object> event = new HashMap<>();
        event.put("op", op);
        event.put("id", entityId);
        event.put("fields", fields);
        event.put("timestamp_ms", (double) System.currentTimeMillis());
        changes.offer(event);
    }

    private void sleepReadLatency() {
        if (readLatencyMs <= 0) return;
        try {
            Thread.sleep(readLatencyMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void seed(String id, String name, String displayOrder, String featured, String parentId) {
        Map<String, String> record = new LinkedHashMap<>();
        record.put("id", id);
        record.put("name", name);
        record.put("display_order", displayOrder);
        record.put("featured", featured);
        record.put("parent_id", parentId);
        records.put(id, record);
    }
}
