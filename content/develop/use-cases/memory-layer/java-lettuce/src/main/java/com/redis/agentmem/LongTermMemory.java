package com.redis.agentmem;

import io.lettuce.core.RedisException;
import io.lettuce.core.TransactionResult;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.output.NestedMultiOutput;
import io.lettuce.core.output.StatusOutput;
import io.lettuce.core.output.ValueOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.ProtocolKeyword;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Long-term memory store for an agent, backed by Redis JSON and
 * Search.
 *
 * <p>Each memory lives as one JSON document at
 * {@code agent:mem:<id>}. The document holds the memory text, its
 * embedding vector, and a small metadata block — user, namespace,
 * kind, source thread, timestamps — that lets the recall query
 * scope results without falling back to application-side filtering.
 *
 * <p>A single Redis Search index covers the embedding plus every
 * metadata field, so one {@code FT.SEARCH} call performs
 * approximate-nearest-neighbour over the in-scope subset and
 * returns the top-k memories ranked by cosine distance. The same
 * KNN check runs at <em>write</em> time to deduplicate
 * near-identical memories before they enter the store.
 *
 * <p>Memories carry one of two kinds:
 *
 * <ul>
 *   <li>{@code episodic} — "what happened" snapshots from a specific
 *       thread, written with a medium TTL so old session detail
 *       decays naturally.</li>
 *   <li>{@code semantic} — distilled facts and preferences the
 *       agent should carry forward indefinitely. Written with no
 *       TTL by default.</li>
 * </ul>
 *
 * <p>Lettuce 6.7 doesn't ship first-class {@code FT.*} or
 * {@code JSON.*} bindings, so the helper sends them through
 * {@code dispatch()} with custom {@link ProtocolKeyword}s. Everything
 * else — {@code EXPIRE}, {@code TTL}, {@code DEL},
 * {@code MULTI}/{@code EXEC} — goes through the built-in synchronous
 * API on a {@code byte[]}-codec connection.
 */
public final class LongTermMemory {

    public static final int VECTOR_DIM_DEFAULT = 384;
    public static final double DEFAULT_DEDUP_THRESHOLD = 0.20;
    public static final double DEFAULT_RECALL_THRESHOLD = 0.55;

    /** Default per-kind TTLs (seconds); {@code null} value = no TTL. */
    public static Map<String, Long> defaultTtlByKind() {
        Map<String, Long> out = new HashMap<>();
        out.put("episodic", 7L * 24 * 3600);
        out.put("semantic", null);
        return out;
    }

    /**
     * Characters Redis Search treats as syntax inside a TAG value;
     * any of them in a user-supplied filter must be backslash-escaped
     * or the surrounding {@code {...}} block won't parse correctly.
     */
    private static final String TAG_SPECIAL = "\\,.<>{}[]\"':;!@#$%^&*()-+=~| ";

    /**
     * Custom {@link ProtocolKeyword}s for the Redis Search and Redis
     * JSON subcommands the helper sends via {@code dispatch()}.
     * Lettuce 6.7 has no native bindings; {@code dispatch()} accepts
     * any keyword whose {@code getBytes()} returns the raw command
     * name, so spelling each command out as its own keyword keeps
     * the wire bytes matching what {@code redis-cli} would send.
     */
    private enum ModuleCommand implements ProtocolKeyword {
        FT_CREATE("FT.CREATE"),
        FT_SEARCH("FT.SEARCH"),
        FT_INFO("FT.INFO"),
        FT_DROPINDEX("FT.DROPINDEX"),
        JSON_SET("JSON.SET"),
        JSON_NUMINCRBY("JSON.NUMINCRBY");

        private final byte[] bytes;
        private final String wire;

        ModuleCommand(String wire) {
            this.wire = wire;
            this.bytes = wire.getBytes(StandardCharsets.US_ASCII);
        }

        @Override
        public byte[] getBytes() {
            return bytes;
        }

        @Override
        public String toString() {
            return wire;
        }
    }

    private final RedisCommands<byte[], byte[]> sync;
    private final Object txLock;
    private final String indexName;
    private final String keyPrefix;
    private final byte[] indexNameBytes;
    private final byte[] keyPrefixBytes;
    private final int vectorDim;
    private final double dedupThreshold;
    private final double recallThreshold;
    private final Map<String, Long> ttlByKind;

    public LongTermMemory(
            StatefulRedisConnection<byte[], byte[]> connection,
            Object txLock,
            String indexName,
            String keyPrefix,
            int vectorDim,
            double dedupThreshold,
            double recallThreshold,
            Map<String, Long> ttlByKind) {
        this.sync = connection.sync();
        this.txLock = txLock;
        this.indexName = indexName;
        this.keyPrefix = keyPrefix;
        this.indexNameBytes = indexName.getBytes(StandardCharsets.UTF_8);
        this.keyPrefixBytes = keyPrefix.getBytes(StandardCharsets.UTF_8);
        this.vectorDim = vectorDim > 0 ? vectorDim : VECTOR_DIM_DEFAULT;
        // Thresholds are honored as-is. Zero is a legitimate value
        // ("exact matches only" for dedup, "nothing recalls" for
        // recall); silently rewriting them would make
        // --dedup-threshold 0 uncallable.
        this.dedupThreshold = dedupThreshold < 0 ? DEFAULT_DEDUP_THRESHOLD : dedupThreshold;
        this.recallThreshold = recallThreshold < 0 ? DEFAULT_RECALL_THRESHOLD : recallThreshold;
        this.ttlByKind = ttlByKind != null ? ttlByKind : defaultTtlByKind();
    }

    public String indexName() { return indexName; }
    public String keyPrefix() { return keyPrefix; }
    public int vectorDim() { return vectorDim; }
    public double dedupThreshold() { return dedupThreshold; }
    public double recallThreshold() { return recallThreshold; }

    public String memoryKey(String memoryId) {
        return keyPrefix + memoryId;
    }

    private byte[] memoryKeyBytes(String memoryId) {
        return memoryKey(memoryId).getBytes(StandardCharsets.UTF_8);
    }

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    public void createIndex() {
        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes)
                .add("ON").add("JSON")
                .add("PREFIX").add(1).add(keyPrefixBytes)
                .add("SCHEMA")
                .add("$.text").add("AS").add("text").add("TEXT")
                .add("$.user").add("AS").add("user").add("TAG")
                .add("$.namespace").add("AS").add("namespace").add("TAG")
                .add("$.kind").add("AS").add("kind").add("TAG")
                .add("$.source_thread").add("AS").add("source_thread").add("TAG")
                .add("$.created_ts").add("AS").add("created_ts")
                .add("NUMERIC").add("SORTABLE")
                .add("$.hit_count").add("AS").add("hit_count")
                .add("NUMERIC").add("SORTABLE")
                .add("$.embedding").add("AS").add("embedding")
                .add("VECTOR").add("HNSW").add(6)
                .add("TYPE").add("FLOAT32")
                .add("DIM").add(vectorDim)
                .add("DISTANCE_METRIC").add("COSINE");
        try {
            synchronized (txLock) {
                sync.dispatch(
                        ModuleCommand.FT_CREATE,
                        new StatusOutput<>(ByteArrayCodec.INSTANCE),
                        args);
            }
        } catch (RedisException ex) {
            if (!String.valueOf(ex.getMessage()).contains("Index already exists")) {
                throw ex;
            }
        }
    }

    public void dropIndex(boolean deleteDocuments) {
        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes);
        if (deleteDocuments) args.add("DD");
        try {
            synchronized (txLock) {
                sync.dispatch(
                        ModuleCommand.FT_DROPINDEX,
                        new StatusOutput<>(ByteArrayCodec.INSTANCE),
                        args);
            }
        } catch (RedisException ex) {
            String msg = String.valueOf(ex.getMessage()).toLowerCase(Locale.ROOT);
            if (!msg.contains("no such index") && !msg.contains("unknown index name")) {
                throw ex;
            }
        }
    }

    // ------------------------------------------------------------------
    // Write
    // ------------------------------------------------------------------

    /**
     * Write a new memory, deduplicating against existing entries.
     *
     * <p>Runs one in-scope KNN(1) against the index first. If the
     * nearest existing memory is within {@link #dedupThreshold()},
     * the new memory is skipped (its content is already represented)
     * and the existing memory's {@code hit_count} is bumped via
     * {@code JSON.NUMINCRBY}. Otherwise a fresh JSON document is
     * written under a new id with a TTL derived from the memory's
     * {@code kind}, inside a {@code MULTI/EXEC} so the JSON.SET and
     * EXPIRE apply as a unit.
     */
    public WriteResult remember(
            String text,
            float[] embedding,
            String user,
            String namespace,
            String kind,
            String sourceThread,
            Long ttlSeconds) {
        if (embedding.length != vectorDim) {
            throw new IllegalArgumentException(
                    "embedding length is " + embedding.length
                            + "; index expects " + vectorDim);
        }
        if (user == null || user.isEmpty()) user = "default";
        if (namespace == null || namespace.isEmpty()) namespace = "default";
        if (kind == null || kind.isEmpty()) kind = "episodic";

        List<MemoryRecord> nearest = nearest(embedding, user, namespace, kind, 1);
        Double existingDistance = !nearest.isEmpty() ? nearest.get(0).distance() : null;
        if (!nearest.isEmpty()
                && existingDistance != null
                && existingDistance <= dedupThreshold) {
            bumpHitCount(nearest.get(0).id());
            return new WriteResult(nearest.get(0).id(), true, existingDistance);
        }

        String id = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        byte[] keyBytes = memoryKeyBytes(id);
        double now = unixSecs();
        JSONObject doc = new JSONObject();
        doc.put("id", id);
        doc.put("user", user);
        doc.put("namespace", namespace);
        doc.put("kind", kind);
        doc.put("source_thread", sourceThread == null ? "" : sourceThread);
        doc.put("text", text == null ? "" : text);
        // org.json's JSONObject.put(String, Object) serializes a
        // float[] as a JSON array of numbers — exactly what the JSON
        // vector field expects at index time.
        doc.put("embedding", embedding);
        doc.put("created_ts", now);
        doc.put("hit_count", 0);
        byte[] docBytes = doc.toString().getBytes(StandardCharsets.UTF_8);

        Long ttl = ttlSeconds != null ? ttlSeconds : ttlByKind.get(kind);

        // MULTI/EXEC so JSON.SET and EXPIRE either both apply or
        // neither does — a connection drop between the two writes
        // would otherwise leave an episodic memory without its
        // intended seven-day TTL. The shared `txLock` serializes
        // this whole MULTI…EXEC span against any other transaction
        // on the connection.
        TransactionResult txResult;
        synchronized (txLock) {
            sync.multi();
            sync.dispatch(
                    ModuleCommand.JSON_SET,
                    new StatusOutput<>(ByteArrayCodec.INSTANCE),
                    new CommandArgs<>(ByteArrayCodec.INSTANCE)
                            .add(keyBytes)
                            .add("$")
                            .add(docBytes));
            if (ttl != null && ttl > 0) {
                sync.expire(keyBytes, ttl);
            }
            txResult = sync.exec();
        }
        if (txResult == null || txResult.wasDiscarded()) {
            throw new RedisException("MULTI/EXEC for remember was discarded");
        }
        return new WriteResult(id, false, existingDistance);
    }

    // ------------------------------------------------------------------
    // Recall
    // ------------------------------------------------------------------

    public List<MemoryRecord> recall(
            float[] queryEmbedding,
            String user,
            String namespace,
            String kind,
            int k,
            Double distanceThreshold) {
        if (k <= 0) k = 5;
        double threshold = distanceThreshold != null ? distanceThreshold : recallThreshold;
        List<MemoryRecord> candidates = nearest(queryEmbedding, user, namespace, kind, k);
        List<MemoryRecord> out = new ArrayList<>(candidates.size());
        for (MemoryRecord c : candidates) {
            if (c.distance() != null && c.distance() <= threshold) {
                out.add(c);
            }
        }
        return out;
    }

    // ------------------------------------------------------------------
    // Admin / inspection
    // ------------------------------------------------------------------

    public Map<String, Object> indexInfo() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("num_docs", 0L);
        out.put("indexing_failures", 0L);
        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes);
        List<Object> raw;
        try {
            synchronized (txLock) {
                raw = sync.dispatch(
                        ModuleCommand.FT_INFO,
                        new NestedMultiOutput<>(ByteArrayCodec.INSTANCE),
                        args);
            }
        } catch (RedisException ignored) {
            return out;
        }
        Map<String, Object> info = pairsToMap(raw);
        out.put("num_docs", parseLong(info.get("num_docs"), 0L));
        out.put("indexing_failures",
                parseLong(info.get("hash_indexing_failures"), 0L));
        return out;
    }

    public List<MemoryRecord> listMemories(
            String user, String namespace, String kind, int limit) {
        if (limit <= 0) limit = 100;
        String filterClause = buildFilterClause(user, namespace, kind);

        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes)
                .add(filterClause)
                .add("RETURN").add(7)
                .add("user").add("namespace").add("kind").add("source_thread")
                .add("text").add("created_ts").add("hit_count")
                .add("SORTBY").add("created_ts").add("DESC")
                .add("LIMIT").add(0).add(limit)
                .add("DIALECT").add(2);

        // Hold `txLock` for the whole FT.SEARCH + per-row TTL fetch
        // so this batch of commands lands together on the connection
        // and can't get tangled with another helper's MULTI/EXEC.
        synchronized (txLock) {
            List<Object> raw;
            try {
                raw = sync.dispatch(
                        ModuleCommand.FT_SEARCH,
                        new NestedMultiOutput<>(ByteArrayCodec.INSTANCE),
                        args);
            } catch (RedisException ex) {
                return new ArrayList<>();
            }
            List<SearchHit> hits = parseAllHits(raw);
            List<MemoryRecord> out = new ArrayList<>(hits.size());
            for (SearchHit hit : hits) {
                String memoryId = stripPrefix(hit.id);
                long ttl = sync.ttl(memoryKeyBytes(memoryId));
                Long ttlSeconds = ttl > 0 ? ttl : null;
                out.add(toRecord(memoryId, hit, null, ttlSeconds));
            }
            return out;
        }
    }

    public boolean deleteMemory(String memoryId) {
        synchronized (txLock) {
            return sync.del(memoryKeyBytes(memoryId)) > 0L;
        }
    }

    public long clear() {
        long before = parseLong(indexInfo().get("num_docs"), 0L);
        dropIndex(true);
        createIndex();
        return before;
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private List<MemoryRecord> nearest(
            float[] embedding, String user, String namespace, String kind, int k) {
        if (embedding.length != vectorDim) {
            throw new IllegalArgumentException(
                    "embedding length is " + embedding.length
                            + "; index expects " + vectorDim);
        }
        String filterClause = buildFilterClause(user, namespace, kind);
        String knnQuery = filterClause + "=>[KNN " + k + " @embedding $vec AS distance]";
        byte[] vecBytes = LocalEmbedder.toBytes(embedding);

        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes)
                .add(knnQuery)
                .add("RETURN").add(8)
                .add("user").add("namespace").add("kind").add("source_thread")
                .add("text").add("created_ts").add("hit_count").add("distance")
                .add("SORTBY").add("distance").add("ASC")
                .add("LIMIT").add(0).add(k)
                .add("PARAMS").add(2).add("vec".getBytes(StandardCharsets.UTF_8)).add(vecBytes)
                .add("DIALECT").add(2);

        // Same connection-discipline as `listMemories`: hold the
        // shared lock for FT.SEARCH + the per-row TTL fetches so the
        // batch can't tangle with a MULTI/EXEC on another helper.
        synchronized (txLock) {
            List<Object> raw = sync.dispatch(
                    ModuleCommand.FT_SEARCH,
                    new NestedMultiOutput<>(ByteArrayCodec.INSTANCE),
                    args);
            List<SearchHit> hits = parseAllHits(raw);
            List<MemoryRecord> out = new ArrayList<>(hits.size());
            for (SearchHit hit : hits) {
                // `hit.id` is the full Redis key (e.g. `agent:mem:abc123`).
                // Strip the prefix so the returned record exposes only
                // the opaque id the UI and `deleteMemory` work with.
                String memoryId = stripPrefix(hit.id);
                long ttl = sync.ttl(memoryKeyBytes(memoryId));
                Long ttlSeconds = ttl > 0 ? ttl : null;
                Double distance = parseDoubleOrNull(hit.fields.get("distance"));
                out.add(toRecord(memoryId, hit, distance, ttlSeconds));
            }
            return out;
        }
    }

    private void bumpHitCount(String memoryId) {
        try {
            // Fire-and-forget — the doc may have expired between
            // recall and bump, and discarding the error keeps the
            // demo from blowing up on that race; we just lose the
            // hit-count update. The shared lock keeps the
            // JSON.NUMINCRBY from landing inside another helper's
            // open MULTI on the connection.
            synchronized (txLock) {
                sync.dispatch(
                        ModuleCommand.JSON_NUMINCRBY,
                        new ValueOutput<>(ByteArrayCodec.INSTANCE),
                        new CommandArgs<>(ByteArrayCodec.INSTANCE)
                                .add(memoryKeyBytes(memoryId))
                                .add("$.hit_count")
                                .add(1));
            }
        } catch (RedisException ignored) {
            // memory expired or path not found
        }
    }

    private static MemoryRecord toRecord(
            String memoryId, SearchHit hit, Double distance, Long ttlSeconds) {
        return new MemoryRecord(
                memoryId,
                nullSafe(hit.fields.get("user")),
                nullSafe(hit.fields.get("namespace")),
                nullSafe(hit.fields.get("kind")),
                nullSafe(hit.fields.get("source_thread")),
                nullSafe(hit.fields.get("text")),
                parseDouble(hit.fields.get("created_ts"), 0.0),
                parseLong(hit.fields.get("hit_count"), 0L),
                distance,
                ttlSeconds);
    }

    private String stripPrefix(String rawKey) {
        return rawKey.startsWith(keyPrefix) ? rawKey.substring(keyPrefix.length()) : rawKey;
    }

    static String escapeTagValue(String value) {
        StringBuilder out = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (TAG_SPECIAL.indexOf(ch) >= 0) {
                out.append('\\');
            }
            out.append(ch);
        }
        return out.toString();
    }

    static String buildFilterClause(String user, String namespace, String kind) {
        List<String> clauses = new ArrayList<>(3);
        if (user != null && !user.isEmpty()) {
            clauses.add("@user:{" + escapeTagValue(user) + "}");
        }
        if (namespace != null && !namespace.isEmpty()) {
            clauses.add("@namespace:{" + escapeTagValue(namespace) + "}");
        }
        if (kind != null && !kind.isEmpty()) {
            clauses.add("@kind:{" + escapeTagValue(kind) + "}");
        }
        if (clauses.isEmpty()) return "(*)";
        return "(" + String.join(" ", clauses) + ")";
    }

    // ------------------------------------------------------------------
    // FT.SEARCH / FT.INFO parsing
    // ------------------------------------------------------------------

    private static final class SearchHit {
        final String id;
        final Map<String, String> fields;

        SearchHit(String id, Map<String, String> fields) {
            this.id = id;
            this.fields = fields;
        }
    }

    /** Parse every hit from an FT.SEARCH reply, preserving order. */
    private static List<SearchHit> parseAllHits(List<Object> raw) {
        List<SearchHit> out = new ArrayList<>();
        if (raw == null || raw.size() < 3) return out;
        // index 0 holds the total count; entries follow as
        // (key, fields)* pairs.
        for (int i = 1; i + 1 < raw.size(); i += 2) {
            String id = decode(raw.get(i));
            Map<String, String> fields = fieldsToMap(raw.get(i + 1));
            out.add(new SearchHit(id, fields));
        }
        return out;
    }

    private static Map<String, String> fieldsToMap(Object array) {
        Map<String, String> out = new HashMap<>();
        if (!(array instanceof List<?> list)) return out;
        for (int i = 0; i + 1 < list.size(); i += 2) {
            out.put(decode(list.get(i)), decode(list.get(i + 1)));
        }
        return out;
    }

    private static Map<String, Object> pairsToMap(List<Object> raw) {
        Map<String, Object> out = new HashMap<>();
        if (raw == null) return out;
        for (int i = 0; i + 1 < raw.size(); i += 2) {
            String key = decode(raw.get(i));
            Object value = raw.get(i + 1);
            if (value instanceof byte[] bytes) {
                out.put(key, new String(bytes, StandardCharsets.UTF_8));
            } else if (value != null) {
                out.put(key, value);
            }
        }
        return out;
    }

    private static String decode(Object value) {
        if (value == null) return null;
        if (value instanceof byte[] bytes) {
            return new String(bytes, StandardCharsets.UTF_8);
        }
        if (value instanceof String s) return s;
        return value.toString();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static double unixSecs() {
        return System.currentTimeMillis() / 1000.0;
    }

    private static double parseDouble(Object value, double dflt) {
        if (value == null) return dflt;
        if (value instanceof Number n) return n.doubleValue();
        String s = (value instanceof byte[] bytes)
                ? new String(bytes, StandardCharsets.UTF_8)
                : value.toString();
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException ex) {
            return dflt;
        }
    }

    private static Double parseDoubleOrNull(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.doubleValue();
        String s = (value instanceof byte[] bytes)
                ? new String(bytes, StandardCharsets.UTF_8)
                : value.toString();
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static long parseLong(Object value, long dflt) {
        if (value == null) return dflt;
        if (value instanceof Number n) return n.longValue();
        String s = (value instanceof byte[] bytes)
                ? new String(bytes, StandardCharsets.UTF_8)
                : value.toString();
        try {
            return Long.parseLong(s);
        } catch (NumberFormatException ex) {
            try {
                return (long) Double.parseDouble(s);
            } catch (NumberFormatException ignored) {
                return dflt;
            }
        }
    }
}
