package com.redis.agentmem;

import org.json.JSONObject;
import redis.clients.jedis.AbstractTransaction;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.exceptions.JedisDataException;
import redis.clients.jedis.json.Path2;
import redis.clients.jedis.search.Document;
import redis.clients.jedis.search.FTCreateParams;
import redis.clients.jedis.search.IndexDataType;
import redis.clients.jedis.search.Query;
import redis.clients.jedis.search.SearchResult;
import redis.clients.jedis.search.schemafields.NumericField;
import redis.clients.jedis.search.schemafields.SchemaField;
import redis.clients.jedis.search.schemafields.TagField;
import redis.clients.jedis.search.schemafields.TextField;
import redis.clients.jedis.search.schemafields.VectorField;
import redis.clients.jedis.search.schemafields.VectorField.VectorAlgorithm;

import java.util.ArrayList;
import java.util.HashMap;
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
 * kind, source thread, timestamps — that lets the recall query scope
 * results without falling back to application-side filtering.
 *
 * <p>A single Redis Search index covers the embedding plus every
 * metadata field, so one {@code FT.SEARCH} call performs
 * approximate-nearest-neighbour over the in-scope subset and returns
 * the top-k memories ranked by cosine distance. The same KNN check
 * runs at <em>write</em> time to deduplicate near-identical memories
 * before they enter the store, which keeps the index from filling
 * with paraphrases of the same fact as the agent reasons over
 * similar topics across sessions.
 *
 * <p>Memories carry one of two kinds:
 *
 * <ul>
 *   <li>{@code episodic} — "what happened" snapshots from a specific
 *       thread, written with a medium TTL so old session detail
 *       decays naturally.</li>
 *   <li>{@code semantic} — distilled facts and preferences the agent
 *       should carry forward indefinitely. Written with no TTL by
 *       default.</li>
 * </ul>
 *
 * <p>The split is enforced as a TAG on the index, so the recall
 * query can ask for one kind or both with a filter — no separate
 * keyspaces.
 */
public final class LongTermMemory {

    public static final int VECTOR_DIM_DEFAULT = 384;

    /**
     * Cosine-distance cutoff for write-time deduplication. Smaller =
     * stricter. 0.20 is calibrated to the
     * {@code sentence-transformers/all-MiniLM-L6-v2} embedding model:
     * a paraphrase of an existing memory lands in the 0.10 – 0.20
     * range and a distinct memory lands above 0.50.
     */
    public static final double DEFAULT_DEDUP_THRESHOLD = 0.20;

    /**
     * Cosine-distance cutoff for recall results. Larger than the
     * dedup threshold so the agent gets a wider net at read time
     * than at write time.
     */
    public static final double DEFAULT_RECALL_THRESHOLD = 0.55;

    /**
     * Default per-kind TTLs (seconds). A {@code null} pointer means
     * "no TTL" — the memory persists until explicitly deleted or
     * evicted under memory pressure.
     */
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

    private final JedisPooled jedis;
    private final String indexName;
    private final String keyPrefix;
    private final int vectorDim;
    private final double dedupThreshold;
    private final double recallThreshold;
    private final Map<String, Long> ttlByKind;

    public LongTermMemory(
            JedisPooled jedis,
            String indexName,
            String keyPrefix,
            int vectorDim,
            double dedupThreshold,
            double recallThreshold,
            Map<String, Long> ttlByKind) {
        this.jedis = jedis;
        this.indexName = indexName;
        this.keyPrefix = keyPrefix;
        this.vectorDim = vectorDim > 0 ? vectorDim : VECTOR_DIM_DEFAULT;
        // Thresholds are honoured as-is. Zero is a legitimate value
        // ("exact matches only" for dedup, "nothing recalls" for
        // recall); silently rewriting them would make
        // --dedup-threshold 0 uncallable.
        this.dedupThreshold = dedupThreshold < 0 ? DEFAULT_DEDUP_THRESHOLD : dedupThreshold;
        this.recallThreshold = recallThreshold < 0 ? DEFAULT_RECALL_THRESHOLD : recallThreshold;
        this.ttlByKind = ttlByKind != null ? ttlByKind : defaultTtlByKind();
    }

    public String indexName() {
        return indexName;
    }

    public String keyPrefix() {
        return keyPrefix;
    }

    public int vectorDim() {
        return vectorDim;
    }

    public double dedupThreshold() {
        return dedupThreshold;
    }

    public double recallThreshold() {
        return recallThreshold;
    }

    public String memoryKey(String memoryId) {
        return keyPrefix + memoryId;
    }

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    /**
     * Create the Redis Search index if it doesn't already exist.
     *
     * <p>The index is declared on the JSON document type with alias
     * names on each path; the same {@code FT.SEARCH} filter clause
     * works here as on a HASH-backed index, and the field paths
     * ({@code $.user}, {@code $.embedding}, ...) only show up in
     * {@code FT.CREATE}.
     */
    public void createIndex() {
        List<SchemaField> schema = List.of(
                TextField.of("$.text").as("text"),
                TagField.of("$.user").as("user"),
                TagField.of("$.namespace").as("namespace"),
                TagField.of("$.kind").as("kind"),
                TagField.of("$.source_thread").as("source_thread"),
                NumericField.of("$.created_ts").as("created_ts").sortable(),
                NumericField.of("$.hit_count").as("hit_count").sortable(),
                VectorField.builder()
                        .fieldName("$.embedding").as("embedding")
                        .algorithm(VectorAlgorithm.HNSW)
                        .attributes(Map.of(
                                "TYPE", "FLOAT32",
                                "DIM", vectorDim,
                                "DISTANCE_METRIC", "COSINE"
                        ))
                        .build()
        );
        try {
            jedis.ftCreate(
                    indexName,
                    FTCreateParams.createParams()
                            .on(IndexDataType.JSON)
                            .addPrefix(keyPrefix),
                    schema
            );
        } catch (JedisDataException ex) {
            if (!String.valueOf(ex.getMessage()).contains("Index already exists")) {
                throw ex;
            }
        }
    }

    /** Drop the search index. Optionally also delete the JSON docs. */
    public void dropIndex(boolean deleteDocuments) {
        try {
            if (deleteDocuments) {
                jedis.ftDropIndexDD(indexName);
            } else {
                jedis.ftDropIndex(indexName);
            }
        } catch (JedisDataException ex) {
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
     * {@code kind}.
     *
     * <p>The KNN-then-write sequence is not atomic; two workers that
     * remember the same fact at the same time can both miss each
     * other's in-flight write and insert duplicate memories. See the
     * walkthrough's "Concurrency caveats" section for the production
     * fix (periodic background consolidator that merges
     * near-duplicates).
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
        String key = memoryKey(id);
        double now = unixSecs();
        JSONObject doc = new JSONObject();
        doc.put("id", id);
        doc.put("user", user);
        doc.put("namespace", namespace);
        doc.put("kind", kind);
        doc.put("source_thread", sourceThread == null ? "" : sourceThread);
        doc.put("text", text == null ? "" : text);
        // org.json's JSONObject.put(String, Object) serialises a
        // float[] as a JSON array of numbers — exactly what the JSON
        // vector field expects at index time.
        doc.put("embedding", embedding);
        doc.put("created_ts", now);
        doc.put("hit_count", 0);

        Long ttl = ttlSeconds != null ? ttlSeconds : ttlByKind.get(kind);

        // MULTI/EXEC so JSON.SET and EXPIRE either both apply or
        // neither does. A connection drop between the two writes
        // would otherwise leave the memory without an expiry — the
        // index entry would still be there, but an `episodic` doc
        // would outlive its intended seven-day TTL.
        try (AbstractTransaction tx = jedis.multi()) {
            tx.jsonSet(key, Path2.ROOT_PATH, doc);
            if (ttl != null && ttl > 0) {
                tx.expire(key, ttl);
            }
            tx.exec();
        }
        return new WriteResult(id, false, existingDistance);
    }

    // ------------------------------------------------------------------
    // Recall
    // ------------------------------------------------------------------

    /**
     * Return the top-k in-scope memories ranked by similarity.
     * Memories beyond {@code distanceThreshold} (or the instance
     * default) are dropped — the index always returns
     * <em>something</em> for KNN, so a recall result on an unrelated
     * query would otherwise be a confidently-wrong false positive.
     */
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
        Map<String, Object> out = new HashMap<>();
        out.put("num_docs", 0L);
        out.put("indexing_failures", 0L);
        try {
            Map<String, Object> info = jedis.ftInfo(indexName);
            out.put("num_docs", parseLong(info.get("num_docs"), 0L));
            out.put("indexing_failures",
                    parseLong(info.get("hash_indexing_failures"), 0L));
        } catch (JedisDataException ignored) {
            // index does not exist
        }
        return out;
    }

    /** Return memories matching the filters, newest first. */
    public List<MemoryRecord> listMemories(
            String user, String namespace, String kind, int limit) {
        if (limit <= 0) limit = 100;
        String filterClause = buildFilterClause(user, namespace, kind);
        Query q = new Query(filterClause)
                .returnFields(
                        "user", "namespace", "kind", "source_thread",
                        "text", "created_ts", "hit_count")
                .limit(0, limit)
                .setSortBy("created_ts", false)
                .dialect(2);
        List<MemoryRecord> out = new ArrayList<>();
        SearchResult result;
        try {
            result = jedis.ftSearch(indexName, q);
        } catch (JedisDataException ex) {
            return out;
        }
        for (Document doc : result.getDocuments()) {
            String memoryId = stripPrefix(doc.getId());
            long ttl = jedis.ttl(memoryKey(memoryId));
            Long ttlSeconds = ttl > 0 ? ttl : null;
            out.add(toRecord(memoryId, doc, null, ttlSeconds));
        }
        return out;
    }

    public boolean deleteMemory(String memoryId) {
        return jedis.del(memoryKey(memoryId)) > 0;
    }

    /**
     * Drop the index and every memory document, then re-create the
     * index. Returns the count of documents that were removed.
     */
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

        Query q = new Query(knnQuery)
                .returnFields(
                        "user", "namespace", "kind", "source_thread",
                        "text", "created_ts", "hit_count", "distance")
                .setSortBy("distance", true)
                .limit(0, k)
                .addParam("vec", vecBytes)
                .dialect(2);

        SearchResult result = jedis.ftSearch(indexName, q);
        List<MemoryRecord> out = new ArrayList<>(result.getDocuments().size());
        for (Document doc : result.getDocuments()) {
            // `doc.getId()` is the full Redis key (e.g.
            // `agent:mem:abc123`). Strip the prefix so the returned
            // record exposes only the opaque id the UI and
            // `deleteMemory` work with.
            String memoryId = stripPrefix(doc.getId());
            long ttl = jedis.ttl(memoryKey(memoryId));
            Long ttlSeconds = ttl > 0 ? ttl : null;
            Double distance = parseDoubleOrNull(doc.get("distance"));
            out.add(toRecord(memoryId, doc, distance, ttlSeconds));
        }
        return out;
    }

    private void bumpHitCount(String memoryId) {
        try {
            // Fire-and-forget: the doc may have expired between
            // recall and bump, and discarding the error keeps the
            // demo from blowing up on that race; we just lose the
            // hit-count update.
            jedis.jsonNumIncrBy(memoryKey(memoryId), Path2.of("$.hit_count"), 1.0);
        } catch (JedisDataException ignored) {
            // memory expired or path not found
        }
    }

    private static MemoryRecord toRecord(
            String memoryId, Document doc, Double distance, Long ttlSeconds) {
        return new MemoryRecord(
                memoryId,
                nullSafe(doc.getString("user")),
                nullSafe(doc.getString("namespace")),
                nullSafe(doc.getString("kind")),
                nullSafe(doc.getString("source_thread")),
                nullSafe(doc.getString("text")),
                parseDouble(doc.get("created_ts"), 0.0),
                parseLong(doc.get("hit_count"), 0L),
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

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static double unixSecs() {
        return System.currentTimeMillis() / 1000.0;
    }

    private static double parseDouble(Object value, double dflt) {
        if (value == null) return dflt;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ex) {
            return dflt;
        }
    }

    private static Double parseDoubleOrNull(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static long parseLong(Object value, long dflt) {
        if (value == null) return dflt;
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException ex) {
            try {
                return (long) Double.parseDouble(value.toString());
            } catch (NumberFormatException ignored) {
                return dflt;
            }
        }
    }

}
