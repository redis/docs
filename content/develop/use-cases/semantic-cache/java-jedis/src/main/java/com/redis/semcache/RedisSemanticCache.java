package com.redis.semcache;

import redis.clients.jedis.AbstractTransaction;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.Response;
import redis.clients.jedis.exceptions.JedisDataException;
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
 * Redis semantic-cache helper backed by Redis Search.
 *
 * <p>Each cache entry lives as a Hash document at
 * {@code cache:<id>}. The hash stores the user's prompt and the
 * corresponding LLM response alongside the raw float32 bytes of the
 * prompt's 384-dimensional embedding and a small set of metadata
 * fields — tenant, locale, model version, and a safety flag.
 *
 * <p>A single Redis Search index covers the embedding plus every
 * metadata field, so one {@code FT.SEARCH} call does an
 * approximate-nearest-neighbour lookup against the cached prompts
 * with a TAG pre-filter applied in the same pass — no cross-store
 * joins, no extra round trips, and tenant isolation is enforced
 * <em>inside</em> the query rather than after the fact in
 * application code.
 *
 * <p>The lookup is thresholded: {@code FT.SEARCH} always returns the
 * closest cached prompt, but the cache only serves it as a hit when
 * the cosine distance is at or below {@code distanceThreshold}.
 * Anything further away is treated as a miss; the caller is expected
 * to run the underlying LLM and write the new prompt, response, and
 * embedding back with {@link #put}.
 *
 * <p>Each cache entry is written with {@code EXPIRE}, so stale
 * answers age out without manual cleanup; combine with an
 * {@code allkeys-lfu} eviction policy on the database to cap memory
 * under pressure too.
 */
public final class RedisSemanticCache {

    public static final int VECTOR_DIM_DEFAULT = 384;

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
    private final double distanceThreshold;
    private final long defaultTtlSeconds;

    public RedisSemanticCache(
            JedisPooled jedis,
            String indexName,
            String keyPrefix,
            int vectorDim,
            double distanceThreshold,
            long defaultTtlSeconds) {
        this.jedis = jedis;
        this.indexName = indexName;
        this.keyPrefix = keyPrefix;
        this.vectorDim = vectorDim;
        this.distanceThreshold = distanceThreshold;
        this.defaultTtlSeconds = defaultTtlSeconds;
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

    public long defaultTtlSeconds() {
        return defaultTtlSeconds;
    }

    public double distanceThreshold() {
        return distanceThreshold;
    }

    // ------------------------------------------------------------------
    // Keys
    // ------------------------------------------------------------------

    public String entryKey(String entryId) {
        return keyPrefix + entryId;
    }

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    /**
     * Create the Redis Search index if it doesn't already exist.
     *
     * <p>One index covers the embedding plus every metadata field, so
     * a single {@code FT.SEARCH} can pre-filter by tenant / locale /
     * model and then KNN-rank the matching documents in one pass.
     * The {@code prompt} and {@code response} fields are stored as
     * {@code TEXT} so admin tooling can grep the cache by content,
     * but the cache lookup itself is vector-only.
     */
    public void createIndex() {
        List<SchemaField> schema = List.of(
                TextField.of("prompt"),
                TextField.of("response"),
                TagField.of("tenant"),
                TagField.of("locale"),
                TagField.of("model_version"),
                TagField.of("safety"),
                NumericField.of("created_ts").sortable(),
                NumericField.of("hit_count").sortable(),
                VectorField.builder()
                        .fieldName("embedding")
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
                            .on(IndexDataType.HASH)
                            .addPrefix(keyPrefix),
                    schema
            );
        } catch (JedisDataException ex) {
            if (!String.valueOf(ex.getMessage()).contains("Index already exists")) {
                throw ex;
            }
        }
    }

    /** Drop the search index. Optionally also delete cached entries. */
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
    // Lookup
    // ------------------------------------------------------------------

    /**
     * Find the nearest in-scope cached prompt and decide hit / miss.
     *
     * <p>{@code FT.SEARCH} returns the single nearest entry that
     * satisfies the TAG pre-filters. The lookup is a hit only if the
     * reported cosine distance is at or below
     * {@code distanceThreshold} (or the instance default). Anything
     * further away is a miss with the candidate distance attached so
     * the caller can log it.
     *
     * <p>On a hit, the entry's {@code hit_count} is incremented
     * atomically with {@code HINCRBY} and the TTL is refreshed inside
     * the same {@code MULTI/EXEC} so a frequently used answer doesn't
     * age out under cold tail entries.
     */
    public LookupResult lookup(
            float[] queryVec,
            String tenant,
            String locale,
            String modelVersion,
            String safety,
            Double distanceThreshold) {

        // Match the shape check that `put` performs. A wrong-dim
        // vector would otherwise hit Redis as a malformed FT.SEARCH
        // parameter and surface as a server-side parse error instead
        // of a clear caller-side error.
        if (queryVec.length != vectorDim) {
            throw new IllegalArgumentException(
                    "queryVec length is " + queryVec.length
                            + "; index expects " + vectorDim
            );
        }

        double threshold = distanceThreshold != null
                ? distanceThreshold : this.distanceThreshold;

        String filterClause = buildFilterClause(tenant, locale, modelVersion, safety);
        String knnQuery = filterClause + "=>[KNN 1 @embedding $vec AS distance]";
        byte[] vecBytes = LocalEmbedder.toBytes(queryVec);

        Query q = new Query(knnQuery)
                .returnFields("prompt", "response", "tenant", "locale",
                        "model_version", "hit_count", "distance")
                .setSortBy("distance", true)
                .limit(0, 1)
                .addParam("vec", vecBytes)
                .dialect(2);

        SearchResult result = jedis.ftSearch(indexName, q);
        List<Document> docs = result.getDocuments();
        if (docs.isEmpty()) {
            return new CacheMiss(null, null);
        }

        Document doc = docs.get(0);
        String rawKey = doc.getId();
        String entryId = rawKey.startsWith(keyPrefix)
                ? rawKey.substring(keyPrefix.length()) : rawKey;
        double distance = parseDouble(doc.get("distance"), 0.0);

        if (distance > threshold) {
            return new CacheMiss(distance, entryId);
        }

        // The hash may have expired between FT.SEARCH returning the
        // row and us getting here — the search index lags expirations
        // by its periodic scan. If we just blindly HINCRBY-ed, Redis
        // would helpfully recreate the hash with only `hit_count`
        // set and the search index would then log it as an indexing
        // failure (no embedding, no metadata). EXISTS narrows that
        // race to the pipeline round-trip; a strictly race-free
        // version would wrap the bump in a Lua script that checks
        // existence and acts in one server-side step.
        String entryKey = entryKey(entryId);
        if (!jedis.exists(entryKey)) {
            return new CacheMiss(distance, entryId);
        }

        // MULTI/EXEC the three writes so they apply as a unit on the
        // server — a partial failure between HINCRBY and EXPIRE would
        // otherwise leave the entry without a refreshed TTL.
        long newHitCount;
        long ttl;
        try (AbstractTransaction tx = jedis.multi()) {
            Response<Long> hincrResp = tx.hincrBy(entryKey, "hit_count", 1);
            tx.expire(entryKey, defaultTtlSeconds);
            Response<Long> ttlResp = tx.ttl(entryKey);
            tx.exec();
            newHitCount = hincrResp.get();
            ttl = ttlResp.get();
        }

        return new CacheHit(
                entryId,
                nullSafe(doc.getString("prompt")),
                nullSafe(doc.getString("response")),
                nullSafe(doc.getString("tenant")),
                nullSafe(doc.getString("locale")),
                nullSafe(doc.getString("model_version")),
                distance,
                ttl > 0 ? ttl : defaultTtlSeconds,
                newHitCount
        );
    }

    // ------------------------------------------------------------------
    // Write
    // ------------------------------------------------------------------

    /**
     * Write a new cache entry and return its id.
     *
     * <p>The embedding is stored as raw little-endian float32 bytes —
     * the encoding Redis Search expects from a {@code FLOAT32} vector
     * field. {@code EXPIRE} on the key gives every entry a bounded
     * lifetime; combine with an {@code allkeys-lfu} eviction policy
     * on the database to cap memory under pressure too.
     */
    public String put(
            String prompt,
            String response,
            float[] embedding,
            String tenant,
            String locale,
            String modelVersion,
            String safety,
            Long ttlSeconds,
            String entryId) {

        if (embedding.length != vectorDim) {
            throw new IllegalArgumentException(
                    "embedding length is " + embedding.length
                            + "; index expects " + vectorDim
            );
        }

        String id = (entryId == null || entryId.isEmpty())
                ? UUID.randomUUID().toString().replace("-", "").substring(0, 12)
                : entryId;
        String key = entryKey(id);
        long ttl = ttlSeconds != null ? ttlSeconds : defaultTtlSeconds;
        byte[] vecBytes = LocalEmbedder.toBytes(embedding);

        byte[] keyBytes = key.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        // Build the byte-keyed hash mapping for the embedding field
        // (binary) and pair it with the textual fields. We have to
        // use the byte[] HSET overload for `embedding` because the
        // string variant would corrupt the float bytes; the textual
        // metadata can ride in the same multi-field byte[] HSET.
        Map<byte[], byte[]> mapping = new HashMap<>();
        putUtf8(mapping, "prompt", prompt);
        putUtf8(mapping, "response", response);
        putUtf8(mapping, "tenant", tenant);
        putUtf8(mapping, "locale", locale);
        putUtf8(mapping, "model_version", modelVersion);
        putUtf8(mapping, "safety", safety);
        putUtf8(mapping, "created_ts", String.format(Locale.ROOT, "%.6f",
                System.currentTimeMillis() / 1000.0));
        putUtf8(mapping, "hit_count", "0");
        mapping.put("embedding".getBytes(java.nio.charset.StandardCharsets.UTF_8), vecBytes);

        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. Without the transaction wrapper a connection drop
        // between the two writes could leave the entry without a TTL
        // and the cache would then keep an answer past its intended
        // lifetime (or forever, on a database with no eviction
        // policy).
        try (AbstractTransaction tx = jedis.multi()) {
            tx.hset(keyBytes, mapping);
            tx.expire(keyBytes, ttl);
            tx.exec();
        }
        return id;
    }

    private static void putUtf8(Map<byte[], byte[]> mapping, String field, String value) {
        if (value == null) value = "";
        mapping.put(
                field.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                value.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
    }

    // ------------------------------------------------------------------
    // Filter clause
    // ------------------------------------------------------------------

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

    static String buildFilterClause(
            String tenant, String locale, String modelVersion, String safety) {
        List<String> clauses = new ArrayList<>(4);
        if (tenant != null && !tenant.isEmpty()) {
            clauses.add("@tenant:{" + escapeTagValue(tenant) + "}");
        }
        if (locale != null && !locale.isEmpty()) {
            clauses.add("@locale:{" + escapeTagValue(locale) + "}");
        }
        if (modelVersion != null && !modelVersion.isEmpty()) {
            clauses.add("@model_version:{" + escapeTagValue(modelVersion) + "}");
        }
        if (safety != null && !safety.isEmpty()) {
            clauses.add("@safety:{" + escapeTagValue(safety) + "}");
        }
        if (clauses.isEmpty()) return "(*)";
        return "(" + String.join(" ", clauses) + ")";
    }

    // ------------------------------------------------------------------
    // Inspection / admin
    // ------------------------------------------------------------------

    /** Subset of {@code FT.INFO} useful for the demo UI. */
    public Map<String, Object> indexInfo() {
        Map<String, Object> out = new HashMap<>();
        out.put("num_docs", 0L);
        out.put("indexing_failures", 0L);
        out.put("vector_index_size_mb", 0.0);
        try {
            Map<String, Object> info = jedis.ftInfo(indexName);
            out.put("num_docs", parseLong(info.get("num_docs"), 0L));
            out.put("indexing_failures",
                    parseLong(info.get("hash_indexing_failures"), 0L));
            out.put("vector_index_size_mb",
                    parseDouble(info.get("vector_index_sz_mb"), 0.0));
        } catch (JedisDataException ignored) {
            // index does not exist
        }
        return out;
    }

    /** Return every cached entry (no embedding) for the admin UI. */
    public List<Map<String, Object>> listEntries(int limit) {
        Query q = new Query("*")
                .returnFields("prompt", "response", "tenant", "locale",
                        "model_version", "safety", "created_ts", "hit_count")
                .limit(0, limit)
                .setSortBy("created_ts", false)
                .dialect(2);

        List<Map<String, Object>> out = new ArrayList<>();
        SearchResult result = jedis.ftSearch(indexName, q);
        for (Document doc : result.getDocuments()) {
            String rawKey = doc.getId();
            String entryId = rawKey.startsWith(keyPrefix)
                    ? rawKey.substring(keyPrefix.length()) : rawKey;
            long ttl = jedis.ttl(entryKey(entryId));
            Map<String, Object> row = new HashMap<>();
            row.put("id", entryId);
            row.put("prompt", nullSafe(doc.getString("prompt")));
            row.put("response", nullSafe(doc.getString("response")));
            row.put("tenant", nullSafe(doc.getString("tenant")));
            row.put("locale", nullSafe(doc.getString("locale")));
            row.put("model_version", nullSafe(doc.getString("model_version")));
            row.put("safety", nullSafe(doc.getString("safety")));
            row.put("hit_count", parseLong(doc.get("hit_count"), 0L));
            row.put("ttl_seconds", ttl > 0 ? ttl : 0L);
            row.put("created_ts", parseDouble(doc.get("created_ts"), 0.0));
            out.add(row);
        }
        return out;
    }

    /** Drop a single entry. Returns {@code true} if the key existed. */
    public boolean deleteEntry(String entryId) {
        return jedis.del(entryKey(entryId)) > 0;
    }

    /**
     * Drop the index and every cached entry, then re-create the
     * index. Returns the count of entries that were removed.
     */
    public long clear() {
        long before = (long) indexInfo().getOrDefault("num_docs", 0L);
        dropIndex(true);
        createIndex();
        return before;
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static double parseDouble(Object value, double dflt) {
        if (value == null) return dflt;
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ex) {
            return dflt;
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
