package com.redis.semcache;

import io.lettuce.core.RedisException;
import io.lettuce.core.TransactionResult;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.output.NestedMultiOutput;
import io.lettuce.core.output.StatusOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.ProtocolKeyword;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
 *
 * <p>Lettuce 6.7 doesn't yet ship first-class {@code FT.*} bindings,
 * so the cache uses {@code dispatch()} with a custom
 * {@link ProtocolKeyword} for {@code FT.CREATE}, {@code FT.SEARCH},
 * {@code FT.INFO}, and {@code FT.DROPINDEX}. Everything else —
 * {@code HSET}, {@code HINCRBY}, {@code EXPIRE}, {@code TTL},
 * {@code MULTI}/{@code EXEC} — goes through the built-in synchronous
 * API on a {@code byte[]}-codec connection so binary embedding bytes
 * and UTF-8 text can share the same hash without separate connections.
 */
public final class RedisSemanticCache {

    public static final int VECTOR_DIM_DEFAULT = 384;

    /**
     * Characters Redis Search treats as syntax inside a TAG value;
     * any of them in a user-supplied filter must be backslash-escaped
     * or the surrounding {@code {...}} block won't parse correctly.
     */
    private static final String TAG_SPECIAL = "\\,.<>{}[]\"':;!@#$%^&*()-+=~| ";

    /**
     * Custom {@link ProtocolKeyword}s for the Redis Search
     * subcommands we send via {@code dispatch()}. Lettuce 6.7 has no
     * native {@code FT.*} bindings, but {@code dispatch()} accepts
     * any keyword whose {@code getBytes()} returns the raw command
     * name. We deliberately spell out each one as its own keyword
     * (rather than {@code add("CREATE")} on a single {@code FT}
     * keyword) so the wire bytes match the standard Redis Search
     * tooling — {@code MONITOR}, {@code LATENCY HISTORY}, server-side
     * ACL rules — exactly as if the commands had been typed in
     * {@code redis-cli}.
     */
    private enum FtCommand implements ProtocolKeyword {
        FT_CREATE("FT.CREATE"),
        FT_SEARCH("FT.SEARCH"),
        FT_INFO("FT.INFO"),
        FT_DROPINDEX("FT.DROPINDEX");

        private final byte[] bytes;
        private final String wire;

        FtCommand(String wire) {
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

    private final StatefulRedisConnection<byte[], byte[]> connection;
    /**
     * Lettuce connections are thread-safe for individual command
     * dispatch, but transaction state ({@code MULTI}/queued commands/
     * {@code EXEC}) is connection-scoped. Two concurrent handler
     * threads sharing one connection can interleave their queued
     * writes into the same transaction, with each thread's
     * {@code EXEC} returning a mix of replies. We serialise the
     * entire {@code MULTI…EXEC} span on this lock so transactions
     * see consistent state. A higher-throughput deployment would
     * use a small pool of connections via Lettuce's
     * {@code ConnectionPoolSupport} instead.
     */
    private final Object txLock = new Object();
    private final RedisCommands<byte[], byte[]> sync;
    private final String indexName;
    private final String keyPrefix;
    private final byte[] indexNameBytes;
    private final int vectorDim;
    private final double distanceThreshold;
    private final long defaultTtlSeconds;

    public RedisSemanticCache(
            StatefulRedisConnection<byte[], byte[]> connection,
            String indexName,
            String keyPrefix,
            int vectorDim,
            double distanceThreshold,
            long defaultTtlSeconds) {
        this.connection = connection;
        this.sync = connection.sync();
        this.indexName = indexName;
        this.keyPrefix = keyPrefix;
        this.indexNameBytes = indexName.getBytes(StandardCharsets.UTF_8);
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

    private byte[] entryKeyBytes(String entryId) {
        return entryKey(entryId).getBytes(StandardCharsets.UTF_8);
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
        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes)
                .add("ON").add("HASH")
                .add("PREFIX").add(1).add(keyPrefix.getBytes(StandardCharsets.UTF_8))
                .add("SCHEMA")
                .add("prompt").add("TEXT")
                .add("response").add("TEXT")
                .add("tenant").add("TAG")
                .add("locale").add("TAG")
                .add("model_version").add("TAG")
                .add("safety").add("TAG")
                .add("created_ts").add("NUMERIC").add("SORTABLE")
                .add("hit_count").add("NUMERIC").add("SORTABLE")
                .add("embedding").add("VECTOR").add("HNSW").add(6)
                .add("TYPE").add("FLOAT32")
                .add("DIM").add(vectorDim)
                .add("DISTANCE_METRIC").add("COSINE");
        try {
            sync.dispatch(
                    FtCommand.FT_CREATE,
                    new StatusOutput<>(ByteArrayCodec.INSTANCE),
                    args
            );
        } catch (RedisException ex) {
            if (!String.valueOf(ex.getMessage()).contains("Index already exists")) {
                throw ex;
            }
        }
    }

    /** Drop the search index. Optionally also delete cached entries. */
    public void dropIndex(boolean deleteDocuments) {
        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes);
        if (deleteDocuments) {
            args.add("DD");
        }
        try {
            sync.dispatch(
                    FtCommand.FT_DROPINDEX,
                    new StatusOutput<>(ByteArrayCodec.INSTANCE),
                    args
            );
        } catch (RedisException ex) {
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

        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes)
                .add(knnQuery)
                .add("RETURN").add(7)
                .add("prompt").add("response").add("tenant").add("locale")
                .add("model_version").add("hit_count").add("distance")
                .add("SORTBY").add("distance").add("ASC")
                .add("LIMIT").add(0).add(1)
                .add("PARAMS").add(2).add("vec".getBytes(StandardCharsets.UTF_8)).add(vecBytes)
                .add("DIALECT").add(2);

        List<Object> raw = sync.dispatch(
                FtCommand.FT_SEARCH,
                new NestedMultiOutput<>(ByteArrayCodec.INSTANCE),
                args
        );

        SearchHit hit = parseFirstHit(raw);
        if (hit == null) {
            return new CacheMiss(null, null);
        }

        String entryId = hit.id.startsWith(keyPrefix)
                ? hit.id.substring(keyPrefix.length()) : hit.id;
        double distance = parseDouble(hit.fields.get("distance"), 0.0);

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
        byte[] entryKey = entryKeyBytes(entryId);
        if (sync.exists(entryKey) == 0L) {
            return new CacheMiss(distance, entryId);
        }

        // MULTI/EXEC the three writes so they apply as a unit on the
        // server — a partial failure between HINCRBY and EXPIRE would
        // otherwise leave the entry without a refreshed TTL. In
        // Lettuce sync mode the queued commands' return values are
        // null; the real responses come back in order on the
        // TransactionResult that exec() returns. The `txLock`
        // synchronisation serialises this whole MULTI…EXEC block
        // against any concurrent transaction on the same connection
        // — see the `txLock` field comment for why.
        TransactionResult txResult;
        synchronized (txLock) {
            sync.multi();
            sync.hincrby(entryKey, "hit_count".getBytes(StandardCharsets.UTF_8), 1);
            sync.expire(entryKey, defaultTtlSeconds);
            sync.ttl(entryKey);
            txResult = sync.exec();
        }
        if (txResult == null || txResult.wasDiscarded() || txResult.size() < 3) {
            // Lettuce returns a discarded transaction on connection-
            // level errors. Fall back to a single TTL read so the UI
            // still gets a sensible number, but treat the bookkeeping
            // as best-effort — the cached response is the load-bearing
            // bit, not the hit_count.
            long ttlOnly = sync.ttl(entryKey);
            return new CacheHit(
                    entryId,
                    nullSafe(hit.fields.get("prompt")),
                    nullSafe(hit.fields.get("response")),
                    nullSafe(hit.fields.get("tenant")),
                    nullSafe(hit.fields.get("locale")),
                    nullSafe(hit.fields.get("model_version")),
                    distance,
                    ttlOnly > 0 ? ttlOnly : defaultTtlSeconds,
                    parseLong(hit.fields.get("hit_count"), 0L)
            );
        }

        long newHitCount = parseLong(txResult.get(0), 0L);
        long ttl = parseLong(txResult.get(2), 0L);

        return new CacheHit(
                entryId,
                nullSafe(hit.fields.get("prompt")),
                nullSafe(hit.fields.get("response")),
                nullSafe(hit.fields.get("tenant")),
                nullSafe(hit.fields.get("locale")),
                nullSafe(hit.fields.get("model_version")),
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
        byte[] key = entryKeyBytes(id);
        long ttl = ttlSeconds != null ? ttlSeconds : defaultTtlSeconds;
        byte[] vecBytes = LocalEmbedder.toBytes(embedding);

        // Build a byte[]-keyed hash mapping. The ByteArrayCodec
        // connection lets the binary embedding share an HSET call
        // with the UTF-8 text fields, so a single round trip lands
        // both halves of the entry on the server.
        Map<byte[], byte[]> mapping = new LinkedHashMap<>();
        putUtf8(mapping, "prompt", prompt);
        putUtf8(mapping, "response", response);
        putUtf8(mapping, "tenant", tenant);
        putUtf8(mapping, "locale", locale);
        putUtf8(mapping, "model_version", modelVersion);
        putUtf8(mapping, "safety", safety);
        putUtf8(mapping, "created_ts", String.format(Locale.ROOT, "%.6f",
                System.currentTimeMillis() / 1000.0));
        putUtf8(mapping, "hit_count", "0");
        mapping.put("embedding".getBytes(StandardCharsets.UTF_8), vecBytes);

        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. Without the transaction wrapper a connection drop
        // between the two writes could leave the entry without a TTL
        // and the cache would then keep an answer past its intended
        // lifetime (or forever, on a database with no eviction
        // policy). The `txLock` synchronisation prevents concurrent
        // transactions on the shared Lettuce connection from
        // interleaving — see the field comment.
        TransactionResult txResult;
        synchronized (txLock) {
            sync.multi();
            sync.hset(key, mapping);
            sync.expire(key, ttl);
            txResult = sync.exec();
        }
        if (txResult == null || txResult.wasDiscarded()) {
            throw new RedisException("MULTI/EXEC for cache put was discarded");
        }
        return id;
    }

    private static void putUtf8(Map<byte[], byte[]> mapping, String field, String value) {
        if (value == null) value = "";
        mapping.put(
                field.getBytes(StandardCharsets.UTF_8),
                value.getBytes(StandardCharsets.UTF_8)
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
        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes);
        List<Object> raw;
        try {
            raw = sync.dispatch(
                    FtCommand.FT_INFO,
                    new NestedMultiOutput<>(ByteArrayCodec.INSTANCE),
                    args
            );
        } catch (RedisException ignored) {
            return out;
        }
        Map<String, Object> info = pairsToMap(raw);
        out.put("num_docs", parseLong(info.get("num_docs"), 0L));
        out.put("indexing_failures",
                parseLong(info.get("hash_indexing_failures"), 0L));
        out.put("vector_index_size_mb",
                parseDouble(info.get("vector_index_sz_mb"), 0.0));
        return out;
    }

    /** Return every cached entry (no embedding) for the admin UI. */
    public List<Map<String, Object>> listEntries(int limit) {
        CommandArgs<byte[], byte[]> args = new CommandArgs<>(ByteArrayCodec.INSTANCE)
                .add(indexNameBytes)
                .add("*")
                .add("RETURN").add(8)
                .add("prompt").add("response").add("tenant").add("locale")
                .add("model_version").add("safety").add("created_ts").add("hit_count")
                .add("SORTBY").add("created_ts").add("DESC")
                .add("LIMIT").add(0).add(limit)
                .add("DIALECT").add(2);

        List<Object> raw = sync.dispatch(
                FtCommand.FT_SEARCH,
                new NestedMultiOutput<>(ByteArrayCodec.INSTANCE),
                args
        );

        List<SearchHit> hits = parseAllHits(raw);
        List<Map<String, Object>> out = new ArrayList<>(hits.size());
        for (SearchHit hit : hits) {
            String entryId = hit.id.startsWith(keyPrefix)
                    ? hit.id.substring(keyPrefix.length()) : hit.id;
            long ttl = sync.ttl(entryKeyBytes(entryId));
            Map<String, Object> row = new HashMap<>();
            row.put("id", entryId);
            row.put("prompt", nullSafe(hit.fields.get("prompt")));
            row.put("response", nullSafe(hit.fields.get("response")));
            row.put("tenant", nullSafe(hit.fields.get("tenant")));
            row.put("locale", nullSafe(hit.fields.get("locale")));
            row.put("model_version", nullSafe(hit.fields.get("model_version")));
            row.put("safety", nullSafe(hit.fields.get("safety")));
            row.put("hit_count", parseLong(hit.fields.get("hit_count"), 0L));
            row.put("ttl_seconds", ttl > 0 ? ttl : 0L);
            row.put("created_ts", parseDouble(hit.fields.get("created_ts"), 0.0));
            out.add(row);
        }
        return out;
    }

    /** Drop a single entry. Returns {@code true} if the key existed. */
    public boolean deleteEntry(String entryId) {
        return sync.del(entryKeyBytes(entryId)) > 0L;
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

    public StatefulRedisConnection<byte[], byte[]> connection() {
        return connection;
    }

    // ------------------------------------------------------------------
    // FT.SEARCH / FT.INFO parsing
    // ------------------------------------------------------------------

    /** A single FT.SEARCH row: the document key plus its field map. */
    private static final class SearchHit {
        final String id;
        final Map<String, String> fields;

        SearchHit(String id, Map<String, String> fields) {
            this.id = id;
            this.fields = fields;
        }
    }

    /**
     * Parse the first hit from an FT.SEARCH reply. The RESP2 shape
     * is [count, key1, [field, value, field, value, ...], key2, ...].
     * Returns {@code null} when count is 0 or the reply is shorter
     * than expected.
     */
    private static SearchHit parseFirstHit(List<Object> raw) {
        if (raw == null || raw.isEmpty()) return null;
        long count = parseLong(raw.get(0), 0L);
        if (count <= 0 || raw.size() < 3) return null;
        String id = decode(raw.get(1));
        Map<String, String> fields = fieldsToMap(raw.get(2));
        return new SearchHit(id, fields);
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

    /**
     * Turn the [field, value, field, value, ...] array inside an
     * FT.SEARCH document into a {@code Map<String, String>}, decoding
     * every entry as UTF-8.
     */
    private static Map<String, String> fieldsToMap(Object array) {
        Map<String, String> out = new HashMap<>();
        if (!(array instanceof List<?> list)) return out;
        for (int i = 0; i + 1 < list.size(); i += 2) {
            String field = decode(list.get(i));
            String value = decode(list.get(i + 1));
            out.put(field, value);
        }
        return out;
    }

    /**
     * FT.INFO returns a flat alternating [key, value, key, value, ...]
     * list. Sub-values that are themselves arrays (e.g. {@code attributes})
     * are kept as the {@code List} {@code NestedMultiOutput} produced —
     * the demo only needs scalar fields.
     */
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
