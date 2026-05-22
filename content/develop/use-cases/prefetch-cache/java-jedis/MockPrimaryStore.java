import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * Mock primary data store for the prefetch-cache demo.
 *
 * <p>This stands in for a source-of-truth database (Postgres, MySQL,
 * Mongo, etc.) that holds reference data the application serves to
 * users. Every mutation appends a change event to an in-process queue,
 * which the sync worker drains and applies to Redis. In a real system
 * the queue is replaced by a CDC pipeline &mdash; Redis Data
 * Integration, Debezium plus a lightweight consumer, or an equivalent
 * tool that tails the source's binlog/WAL and pushes events into
 * Redis.</p>
 *
 * <p>The store also exposes {@code readLatencyMs} so the demo can
 * illustrate how much slower a direct primary read would be than a
 * Redis hit.</p>
 */
public class MockPrimaryStore {

    public static final String OP_UPSERT = "upsert";
    public static final String OP_DELETE = "delete";

    private final int readLatencyMs;
    private final Object lock = new Object();
    private long reads;
    private final LinkedBlockingQueue<Map<String, Object>> changes = new LinkedBlockingQueue<>();
    private final Map<String, Map<String, String>> records = new TreeMap<>();

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

    /** Sorted IDs. No sleep, no counter increment (metadata-only query). */
    public List<String> listIds() {
        synchronized (lock) {
            List<String> ids = new ArrayList<>(records.keySet());
            Collections.sort(ids);
            return ids;
        }
    }

    /** Slow read of every record. Used by the cache's bulk-load path. */
    public List<Map<String, String>> listRecords() {
        sleepLatency();
        synchronized (lock) {
            reads++;
            List<Map<String, String>> out = new ArrayList<>(records.size());
            for (Map<String, String> record : records.values()) {
                out.add(new LinkedHashMap<>(record));
            }
            return out;
        }
    }

    /** Single-record read. Not on the demo's normal read path. */
    public Map<String, String> read(String entityId) {
        sleepLatency();
        synchronized (lock) {
            reads++;
            Map<String, String> record = records.get(entityId);
            return record == null ? null : new LinkedHashMap<>(record);
        }
    }

    public boolean addRecord(Map<String, String> record) {
        if (record == null) {
            return false;
        }
        String entityId = record.getOrDefault("id", "").trim();
        if (entityId.isEmpty()) {
            return false;
        }
        synchronized (lock) {
            if (records.containsKey(entityId)) {
                return false;
            }
            Map<String, String> stored = new LinkedHashMap<>(record);
            records.put(entityId, stored);
            // Emit while the lock is held so the queue order matches the
            // mutation order. Two concurrent callers cannot interleave
            // mutation A -> mutation B -> emit B -> emit A.
            emitChangeLocked(OP_UPSERT, entityId, new LinkedHashMap<>(stored));
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
            emitChangeLocked(OP_UPSERT, entityId, new LinkedHashMap<>(record));
        }
        return true;
    }

    public boolean deleteRecord(String entityId) {
        synchronized (lock) {
            if (!records.containsKey(entityId)) {
                return false;
            }
            records.remove(entityId);
            emitChangeLocked(OP_DELETE, entityId, null);
        }
        return true;
    }

    /** Block up to {@code timeoutMs} milliseconds for the next change event. */
    public Map<String, Object> nextChange(long timeoutMs) throws InterruptedException {
        return changes.poll(timeoutMs, TimeUnit.MILLISECONDS);
    }

    public long getReads() {
        synchronized (lock) {
            return reads;
        }
    }

    public void resetReads() {
        synchronized (lock) {
            reads = 0;
        }
    }

    private void emitChangeLocked(String op, String entityId, Map<String, String> fields) {
        // queue.put is thread-safe and never tries to acquire `lock`, so
        // calling it while holding the records lock cannot deadlock.
        // Holding the lock here is what guarantees that the queue order
        // matches the order in which the records map was mutated.
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("op", op);
        event.put("id", entityId);
        event.put("fields", fields);
        event.put("timestamp_ms", (double) System.currentTimeMillis());
        changes.add(event);
    }

    private void sleepLatency() {
        if (readLatencyMs <= 0) {
            return;
        }
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
