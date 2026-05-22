import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-memory stand-in for a slow primary database. Each read sleeps for
 * {@code readLatencyMs} milliseconds so the difference between a cache hit
 * and a miss is visible in the demo UI.
 */
public class MockPrimaryStore {

    private final int readLatencyMs;
    private final AtomicLong reads = new AtomicLong();
    private final Map<String, Map<String, String>> records = new HashMap<>();

    public MockPrimaryStore(int readLatencyMs) {
        this.readLatencyMs = readLatencyMs;
        seed("p-001", "Sourdough Loaf", "650", "42");
        seed("p-002", "Espresso Beans 250g", "1495", "120");
        seed("p-003", "Olive Oil 500ml", "1200", "8");
        seed("p-004", "Sea Salt Flakes", "475", "60");
    }

    public int getReadLatencyMs() {
        return readLatencyMs;
    }

    public List<String> listIds() {
        List<String> ids = new java.util.ArrayList<>(records.keySet());
        java.util.Collections.sort(ids);
        return ids;
    }

    /** Slow read of the record. Returns null if id is unknown. */
    public Map<String, String> read(String id) {
        try {
            Thread.sleep(readLatencyMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        }
        synchronized (records) {
            reads.incrementAndGet();
            Map<String, String> record = records.get(id);
            if (record == null) {
                return null;
            }
            return new LinkedHashMap<>(record);
        }
    }

    public boolean updateField(String id, String field, String value) {
        synchronized (records) {
            Map<String, String> record = records.get(id);
            if (record == null) {
                return false;
            }
            record.put(field, value);
            return true;
        }
    }

    public long getReads() {
        return reads.get();
    }

    public void resetReads() {
        reads.set(0);
    }

    private void seed(String id, String name, String priceCents, String stock) {
        Map<String, String> record = new LinkedHashMap<>();
        record.put("id", id);
        record.put("name", name);
        record.put("price_cents", priceCents);
        record.put("stock", stock);
        records.put(id, record);
    }
}
