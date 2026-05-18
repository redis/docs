import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import redis.clients.jedis.AbstractPipeline;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.Response;
import redis.clients.jedis.exceptions.JedisDataException;
import redis.clients.jedis.search.Document;
import redis.clients.jedis.search.FTCreateParams;
import redis.clients.jedis.search.FTSearchParams;
import redis.clients.jedis.search.IndexDataType;
import redis.clients.jedis.search.Query;
import redis.clients.jedis.search.SearchResult;
import redis.clients.jedis.search.schemafields.NumericField;
import redis.clients.jedis.search.schemafields.SchemaField;
import redis.clients.jedis.search.schemafields.TagField;
import redis.clients.jedis.search.schemafields.TextField;
import redis.clients.jedis.search.schemafields.VectorField;
import redis.clients.jedis.search.schemafields.VectorField.VectorAlgorithm;
import redis.clients.jedis.util.SafeEncoder;

/**
 * Redis recommendation-engine helper backed by Redis Search.
 *
 * <p>Items live as Hash documents at {@code product:<id>}. Each hash
 * stores the item's structured metadata (name, description, category,
 * brand, price, in-stock flag, rating) alongside the raw float32 bytes
 * of its 384-dimensional embedding. A single Redis Search index covers
 * every field, so one {@code FT.SEARCH} call does the KNN over the
 * embedding and the TAG / NUMERIC / TEXT pre-filter in the same pass
 * &mdash; no cross-store joins, no extra round trips.</p>
 *
 * <p>Per-user state lives in {@code user:<id>:features}: a session
 * vector written as an exponentially weighted average of recently-
 * clicked item embeddings, plus per-category affinity counters
 * incremented atomically with {@code HINCRBYFLOAT}. The next time the
 * application reads that hash to build a query, it sees the click
 * &mdash; no batch cycle, no cache invalidation.</p>
 *
 * <p>The recommendation flow has two paths:</p>
 *
 * <ul>
 *   <li><b>Query path</b> (per recommendation request)
 *     <ol>
 *       <li><i>Candidate retrieval</i> &mdash; {@code FT.SEARCH} with
 *           {@code KNN} over the embedding, optionally pre-filtered by
 *           structured attributes, optionally biased toward a session
 *           vector blended into the query.</li>
 *       <li><i>Re-ranking</i> &mdash; the client takes the top-N
 *           candidates and adds a log-scaled per-category affinity
 *           bonus pulled from the user features hash.</li>
 *     </ol>
 *   </li>
 *   <li><b>Click path</b> (per user interaction) &mdash; the click
 *       writes a new EWMA-blended session vector and increments the
 *       category affinity in the user features hash. The next query
 *       path picks both up.</li>
 * </ul>
 */
public class Recommender {

    public static final int VECTOR_DIM_DEFAULT = 384;
    public static final String DEFAULT_INDEX_NAME = "recommend:idx";
    public static final String DEFAULT_KEY_PREFIX = "product:";
    public static final String DEFAULT_USER_KEY_PREFIX = "user:";

    private final JedisPooled client;
    private final String indexName;
    private final String keyPrefix;
    private final String userKeyPrefix;
    private final int vectorDim;

    public Recommender(JedisPooled client) {
        this(client, DEFAULT_INDEX_NAME, DEFAULT_KEY_PREFIX,
                DEFAULT_USER_KEY_PREFIX, VECTOR_DIM_DEFAULT);
    }

    public Recommender(JedisPooled client, String indexName, String keyPrefix,
                       String userKeyPrefix, int vectorDim) {
        if (client == null) {
            throw new IllegalArgumentException("client is required");
        }
        this.client = client;
        this.indexName = (indexName == null || indexName.isEmpty())
                ? DEFAULT_INDEX_NAME : indexName;
        this.keyPrefix = (keyPrefix == null || keyPrefix.isEmpty())
                ? DEFAULT_KEY_PREFIX : keyPrefix;
        this.userKeyPrefix = (userKeyPrefix == null || userKeyPrefix.isEmpty())
                ? DEFAULT_USER_KEY_PREFIX : userKeyPrefix;
        this.vectorDim = vectorDim > 0 ? vectorDim : VECTOR_DIM_DEFAULT;
    }

    public String getIndexName() { return indexName; }
    public String getKeyPrefix() { return keyPrefix; }
    public String getUserKeyPrefix() { return userKeyPrefix; }
    public int getVectorDim() { return vectorDim; }

    public String productKey(String productId) {
        return keyPrefix + productId;
    }

    public String userKey(String userId) {
        return userKeyPrefix + userId + ":features";
    }

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    /**
     * Create the Redis Search index if it doesn't already exist.
     *
     * <p>One index covers every queryable field. The vector field is
     * HNSW with cosine distance so KNN is approximate but fast, and
     * TAG / NUMERIC / TEXT fields share the same index so a single
     * {@code FT.SEARCH} can pre-filter and then KNN-rank in one pass.</p>
     */
    public void createIndex() {
        List<SchemaField> schema = Arrays.asList(
                TextField.of("name").weight(1.0),
                TextField.of("description").weight(0.5),
                TagField.of("category"),
                TagField.of("brand"),
                TagField.of("in_stock"),
                NumericField.of("price").sortable(),
                NumericField.of("rating").sortable(),
                VectorField.builder()
                        .fieldName("embedding")
                        .algorithm(VectorAlgorithm.HNSW)
                        .attributes(Map.of(
                                "TYPE", "FLOAT32",
                                "DIM", vectorDim,
                                "DISTANCE_METRIC", "COSINE"))
                        .build());
        try {
            client.ftCreate(indexName,
                    FTCreateParams.createParams()
                            .on(IndexDataType.HASH)
                            .prefix(keyPrefix),
                    schema);
        } catch (JedisDataException exc) {
            // Tolerate "Index already exists" for idempotent setup.
            if (!String.valueOf(exc.getMessage()).contains("Index already exists")) {
                throw exc;
            }
        }
    }

    /**
     * Drop the search index. Optionally also delete the indexed
     * documents. Missing-index errors are tolerated so the call is
     * idempotent.
     */
    public void dropIndex(boolean deleteDocuments) {
        try {
            if (deleteDocuments) {
                client.ftDropIndexDD(indexName);
            } else {
                client.ftDropIndex(indexName);
            }
        } catch (JedisDataException exc) {
            String msg = String.valueOf(exc.getMessage()).toLowerCase();
            // Different Redis Search versions phrase the missing-index
            // error differently; tolerate either.
            if (!msg.contains("no such index") && !msg.contains("unknown index name")) {
                throw exc;
            }
        }
    }

    // ------------------------------------------------------------------
    // Catalogue ingest
    // ------------------------------------------------------------------

    /**
     * Pipeline a batch of {@code HSET} writes for the catalog.
     *
     * <p>Each product must include the structured fields plus its
     * embedding as raw float32 bytes ({@link Product#embedding}).</p>
     *
     * @return the number of products written.
     */
    public int indexProducts(List<Product> products) {
        try (AbstractPipeline pipe = client.pipelined()) {
            for (Product p : products) {
                // The string fields go via the String-overload of HSET.
                Map<String, String> stringFields = new LinkedHashMap<>();
                stringFields.put("name", p.name);
                stringFields.put("description", p.description);
                stringFields.put("category", p.category);
                stringFields.put("brand", p.brand);
                stringFields.put("price", formatDouble(p.price));
                stringFields.put("rating", formatDouble(p.rating));
                stringFields.put("in_stock", p.inStock ? "true" : "false");
                pipe.hset(productKey(p.id), stringFields);
                // The binary embedding has to go via the byte[]-overload
                // of HSET because a String-typed hash field would
                // UTF-8-mangle the raw float32 bytes.
                pipe.hset(
                        SafeEncoder.encode(productKey(p.id)),
                        SafeEncoder.encode("embedding"),
                        p.embedding);
            }
            pipe.sync();
        }
        return products.size();
    }

    // ------------------------------------------------------------------
    // Candidate retrieval (KNN + optional pre-filter)
    // ------------------------------------------------------------------

    /** Options bundle for {@link #candidateRetrieve}. */
    public static class RetrieveOptions {
        public String category;
        public String brand;
        public Double minPrice;
        public Double maxPrice;
        public boolean inStockOnly;
        public Double minRating;
        public String textMatch;
        public String textField = "description";
        public int k = 10;
        public float[] sessionVec;
        public double sessionWeight = 0.3;
    }

    /**
     * Retrieve top-{@code k} candidates with {@code FT.SEARCH} KNN +
     * filters.
     *
     * <p>Pre-filter knobs are TAG ({@code category}, {@code brand},
     * {@code inStockOnly}), NUMERIC ({@code minPrice}/{@code maxPrice},
     * {@code minRating}) and TEXT ({@code textMatch} against
     * {@code textField}, default {@code description}). They combine
     * with an implicit AND in front of the {@code KNN} clause, so
     * Redis evaluates them first and then KNN-ranks only the matching
     * documents.</p>
     *
     * <p>If {@code sessionVec} is provided, the query vector is
     * blended with it before retrieval &mdash; that's the real-time
     * signal path. Returns {@link Candidate} rows ordered by ascending
     * cosine distance (closest first); {@code score} starts equal to
     * the distance and may be reduced by {@link #rerank}.</p>
     */
    public List<Candidate> candidateRetrieve(float[] queryVec, RetrieveOptions opts) {
        if (opts == null) opts = new RetrieveOptions();
        int k = opts.k > 0 ? opts.k : 10;

        // Blend query + session signal so the user's recent clicks
        // pull the next retrieval toward the things they've been
        // engaging with. Both inputs are unit-normalised so cosine
        // scores stay comparable.
        float[] effective = blendVectors(queryVec, opts.sessionVec, opts.sessionWeight);

        String filterClause = buildFilterClause(
                opts.category, opts.brand, opts.minPrice, opts.maxPrice,
                opts.inStockOnly, opts.minRating, opts.textMatch, opts.textField);
        String queryStr = filterClause + "=>[KNN " + k + " @embedding $vec AS vector_score]";

        // Build a Query that mirrors the Python:
        //   .sort_by("vector_score").paging(0, k)
        //   .return_fields("name", "description", ...)
        //   .dialect(2)
        Query q = new Query(queryStr)
                .addParam("vec", floatsToBytes(effective))
                .returnFields(
                        "name", "description", "category", "brand",
                        "price", "rating", "in_stock", "vector_score")
                .setSortBy("vector_score", true)
                .limit(0, k)
                .dialect(2);

        SearchResult result = client.ftSearch(indexName, q);
        List<Candidate> out = new ArrayList<>(result.getDocuments().size());
        for (Document doc : result.getDocuments()) {
            out.add(decodeCandidate(doc));
        }
        return out;
    }

    private Candidate decodeCandidate(Document doc) {
        String rawKey = doc.getId();
        String bareId = rawKey.startsWith(keyPrefix)
                ? rawKey.substring(keyPrefix.length()) : rawKey;
        double dist = parseDouble(String.valueOf(doc.get("vector_score")), 0.0);
        double price = parseDouble(String.valueOf(doc.get("price")), 0.0);
        double rating = parseDouble(String.valueOf(doc.get("rating")), 0.0);
        boolean inStock = "true".equals(String.valueOf(doc.get("in_stock")));
        Candidate c = new Candidate();
        c.id = bareId;
        c.name = stringOrEmpty(doc.get("name"));
        c.description = stringOrEmpty(doc.get("description"));
        c.category = stringOrEmpty(doc.get("category"));
        c.brand = stringOrEmpty(doc.get("brand"));
        c.price = price;
        c.rating = rating;
        c.inStock = inStock;
        c.vectorDistance = dist;
        c.score = dist;
        return c;
    }

    // ------------------------------------------------------------------
    // Re-ranking with user affinities
    // ------------------------------------------------------------------

    /**
     * Apply a per-category affinity bonus and re-sort.
     *
     * <p>{@code userFeatures.affinities} is a {@code {category: weight}}
     * map accumulated from previous clicks. The bonus is shaped by
     * {@code log(1 + affinity) * affinityWeight} so repeated clicks
     * see diminishing returns and a single dominant category can't
     * push the bonus arbitrarily large. The bonus is subtracted from
     * the cosine distance, so a category the user has shown interest
     * in pulls its members up the list (closer to zero) without
     * overwhelming the vector signal.</p>
     */
    public List<Candidate> rerank(List<Candidate> candidates, UserFeatures features, double affinityWeight) {
        Map<String, Double> affinities = features == null ? Collections.emptyMap() : features.affinities;
        // ``affinityWeight <= 0`` disables the bonus and is the
        // documented "rerank off" escape hatch (matching redis-py).
        if (affinities == null || affinities.isEmpty() || affinityWeight <= 0) {
            candidates.sort((a, b) -> Double.compare(a.score, b.score));
            return candidates;
        }
        for (Candidate c : candidates) {
            double raw = affinities.getOrDefault(c.category, 0.0);
            if (raw < 0) raw = 0;
            double bonus = Math.log1p(raw) * affinityWeight;
            c.score = c.vectorDistance - bonus;
        }
        candidates.sort((a, b) -> Double.compare(a.score, b.score));
        return candidates;
    }

    // ------------------------------------------------------------------
    // Filter clause construction
    // ------------------------------------------------------------------

    // Characters Redis Search treats as syntax inside a TAG value; any
    // of them appearing in a user-supplied filter must be backslash-
    // escaped or the surrounding ``{...}`` block won't parse correctly.
    // The list comes from the Redis Search query-syntax docs. The
    // backslash itself is included so a value containing a literal
    // backslash can't ``eat`` the next character's escape.
    private static final Set<Character> TAG_SPECIAL;
    static {
        Set<Character> s = new java.util.HashSet<>();
        for (char ch : "\\,.<>{}[]\"':;!@#$%^&*()-+=~| ".toCharArray()) {
            s.add(ch);
        }
        TAG_SPECIAL = Collections.unmodifiableSet(s);
    }

    /**
     * Backslash-escape characters that have meaning inside
     * {@code @tag:{...}} so a TAG filter built from external input
     * can't accidentally close the brace, inject an additional clause,
     * or misparse a value that simply contains a space or a hyphen.
     */
    public static String escapeTagValue(String value) {
        StringBuilder sb = new StringBuilder(value.length() + 4);
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (TAG_SPECIAL.contains(ch)) sb.append('\\');
            sb.append(ch);
        }
        return sb.toString();
    }

    /**
     * Build the pre-filter clause that goes in front of the KNN
     * clause. Empty filters return {@code (*)}, which is a no-op
     * pre-filter under {@code DIALECT 2}.
     */
    public static String buildFilterClause(
            String category, String brand,
            Double minPrice, Double maxPrice,
            boolean inStockOnly, Double minRating,
            String textMatch, String textField) {
        List<String> clauses = new ArrayList<>();
        if (category != null && !category.isEmpty()) {
            clauses.add("@category:{" + escapeTagValue(category) + "}");
        }
        if (brand != null && !brand.isEmpty()) {
            clauses.add("@brand:{" + escapeTagValue(brand) + "}");
        }
        if (minPrice != null || maxPrice != null) {
            String lo = minPrice == null ? "-inf" : formatDouble(minPrice);
            String hi = maxPrice == null ? "+inf" : formatDouble(maxPrice);
            clauses.add("@price:[" + lo + " " + hi + "]");
        }
        if (minRating != null) {
            clauses.add("@rating:[" + formatDouble(minRating) + " +inf]");
        }
        if (inStockOnly) {
            clauses.add("@in_stock:{true}");
        }
        if (textMatch != null && !textMatch.isEmpty()) {
            String field = (textField == null || textField.isEmpty()) ? "description" : textField;
            // Wrapping in quotes makes the value a single phrase and
            // avoids tripping the query parser on operators (``-``,
            // ``|``, ``"``, etc.) that a user might legitimately type.
            String safe = textMatch.replace("\\", "\\\\").replace("\"", "\\\"");
            clauses.add("@" + field + ":\"" + safe + "\"");
        }
        if (clauses.isEmpty()) return "(*)";
        return "(" + String.join(" ", clauses) + ")";
    }

    // ------------------------------------------------------------------
    // Session signals (clicks)
    // ------------------------------------------------------------------

    /** Result of one {@link #recordClick} call, for the UI. */
    public static class RecordClickResult {
        public String category;
        public double affinity;
        public long clicks;
        public String lastClickedId;
    }

    /**
     * Update a user's session vector and category affinity.
     *
     * <p>Reads the clicked item's embedding from its hash, blends it
     * into the user's session vector with an exponentially weighted
     * moving average, and bumps the category counter and click total.</p>
     *
     * <p>{@code ewmaAlpha} is the weight given to the <i>new</i> click;
     * the previous session keeps {@code 1 - ewmaAlpha}. The default
     * biases history (0.6) over the latest click (0.4) so a single
     * accidental click doesn't swing the session.</p>
     *
     * <p>The category-affinity bump and click-count bump use
     * {@code HINCRBYFLOAT}/{@code HINCRBY} so they're atomic against
     * any concurrent caller. The session vector blend is inherently
     * read-modify-write &mdash; the new vector depends on the previous
     * one &mdash; and is <i>not</i> atomic against a concurrent click
     * for the same user. For the per-user data this helper writes,
     * that window is rare in practice; if it matters in a given
     * deployment, wrap the read and the writeback in
     * {@code WATCH}/{@code MULTI}/{@code EXEC} or move the whole
     * blend into a Lua script.</p>
     */
    /**
     * Two-arg convenience overload using the documented defaults
     * ({@code ewmaAlpha=0.4}, {@code affinityStep=1.0}). Callers that
     * want to disable a contribution (alpha=0 keeps the session
     * unchanged; step=0 records the click without bumping affinity)
     * use the four-arg form explicitly — passing zero here would
     * select this overload, not silently coerce.
     */
    public RecordClickResult recordClick(String userId, String productId) {
        return recordClick(userId, productId, 0.4, 1.0);
    }

    public RecordClickResult recordClick(String userId, String productId,
                                          double ewmaAlpha, double affinityStep) {
        // Honour every value the caller passed in — including zero,
        // which is the documented "disable this contribution" escape
        // hatch (audit-checklist row 28). Use the two-arg overload
        // above if you want the defaults.
        String productKey = productKey(productId);

        // Pull the embedding (binary) and category (text) in one
        // round trip. The byte[]-typed hmget gives us back the raw
        // bytes for the embedding without UTF-8 mangling.
        byte[] keyBytes = SafeEncoder.encode(productKey);
        List<byte[]> raw = client.hmget(keyBytes,
                SafeEncoder.encode("embedding"),
                SafeEncoder.encode("category"));
        if (raw == null || raw.size() < 2 || raw.get(0) == null) {
            throw new UnknownProductException(productId);
        }
        float[] clickedVec = bytesToFloats(raw.get(0));
        String category = raw.get(1) == null ? "unknown" : SafeEncoder.encode(raw.get(1));
        if (category == null || category.isEmpty()) category = "unknown";

        String userKey = userKey(userId);
        byte[] prevRaw = client.hget(
                SafeEncoder.encode(userKey),
                SafeEncoder.encode("session_vec"));
        float[] newSession;
        if (prevRaw == null) {
            // First click: the clicked vector is already unit-normalised.
            newSession = clickedVec;
        } else {
            float[] prevVec = bytesToFloats(prevRaw);
            newSession = ewmaBlend(prevVec, clickedVec, ewmaAlpha);
        }

        // Affinity and click counters are independent atomic
        // increments; only the session vector needs the
        // read-modify-write because it depends on the previous value.
        // Pipeline the writes so they go in one round trip.
        try (AbstractPipeline pipe = client.pipelined()) {
            Map<String, String> stringFields = new LinkedHashMap<>();
            stringFields.put("last_clicked_id", productId);
            stringFields.put("last_clicked_category", category);
            pipe.hset(userKey, stringFields);
            pipe.hset(
                    SafeEncoder.encode(userKey),
                    SafeEncoder.encode("session_vec"),
                    floatsToBytes(newSession));
            Response<Double> aff = pipe.hincrByFloat(userKey, "aff:" + category, affinityStep);
            Response<Long> clicks = pipe.hincrBy(userKey, "clicks", 1);
            pipe.sync();

            RecordClickResult out = new RecordClickResult();
            out.category = category;
            out.affinity = aff.get();
            out.clicks = clicks.get();
            out.lastClickedId = productId;
            return out;
        }
    }

    /** Read a user's session vector and affinities for re-ranking. */
    public UserFeatures getUserFeatures(String userId) {
        UserFeatures out = new UserFeatures();
        byte[] userKeyBytes = SafeEncoder.encode(userKey(userId));
        Map<byte[], byte[]> raw = client.hgetAll(userKeyBytes);
        if (raw == null || raw.isEmpty()) return out;
        for (Map.Entry<byte[], byte[]> entry : raw.entrySet()) {
            String field = SafeEncoder.encode(entry.getKey());
            byte[] value = entry.getValue();
            if ("session_vec".equals(field)) {
                if (value != null && value.length > 0) {
                    out.sessionVec = bytesToFloats(value);
                }
            } else if (field.startsWith("aff:")) {
                String cat = field.substring("aff:".length());
                try {
                    out.affinities.put(cat, Double.parseDouble(SafeEncoder.encode(value)));
                } catch (NumberFormatException ignored) {
                    // skip malformed counters
                }
            } else if ("clicks".equals(field)) {
                try {
                    out.clicks = Long.parseLong(SafeEncoder.encode(value));
                } catch (NumberFormatException ignored) {
                    // skip
                }
            } else if ("last_clicked_id".equals(field)) {
                out.lastClickedId = SafeEncoder.encode(value);
            } else if ("last_clicked_category".equals(field)) {
                out.lastClickedCategory = SafeEncoder.encode(value);
            }
        }
        return out;
    }

    /** Delete a user's feature hash. Next request starts cold. */
    public void resetUser(String userId) {
        client.del(userKey(userId));
    }

    // ------------------------------------------------------------------
    // Hot embedding refresh (no serving downtime)
    // ------------------------------------------------------------------

    /**
     * Overwrite the embedding for one product.
     *
     * <p>The HNSW index reflects the change as soon as the
     * {@code HSET} commits, so subsequent {@code FT.SEARCH} calls see
     * the new vector without an index rebuild or serving downtime.</p>
     *
     * @throws UnknownProductException if the product hash does not
     *         exist (an {@code HSET} would otherwise create a partial
     *         document that the index then picks up).
     * @throws IllegalArgumentException if the new vector has the wrong
     *         dimensionality (a quiet model-swap corruption guard).
     */
    public void refreshEmbedding(String productId, float[] newVector) {
        if (newVector == null || newVector.length != vectorDim) {
            throw new IllegalArgumentException(
                    "newVector has length "
                            + (newVector == null ? 0 : newVector.length)
                            + "; index expects " + vectorDim);
        }
        String key = productKey(productId);
        if (!client.exists(key)) {
            throw new UnknownProductException(productId);
        }
        client.hset(
                SafeEncoder.encode(key),
                SafeEncoder.encode("embedding"),
                floatsToBytes(newVector));
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /** Subset of {@code FT.INFO} useful for the demo UI. */
    public IndexStats indexInfo() {
        IndexStats stats = new IndexStats();
        stats.indexName = indexName;
        try {
            Map<String, Object> info = client.ftInfo(indexName);
            stats.numDocs = parseLong(info.get("num_docs"), 0L);
            stats.indexingFailures = parseLong(info.get("hash_indexing_failures"), 0L);
            Object vecMb = info.get("vector_index_sz_mb");
            stats.vectorIndexSizeMb = vecMb == null ? 0.0 : parseDouble(vecMb.toString(), 0.0);
        } catch (JedisDataException exc) {
            String msg = String.valueOf(exc.getMessage()).toLowerCase();
            if (!msg.contains("no such index") && !msg.contains("unknown index name")) {
                throw exc;
            }
        }
        return stats;
    }

    /**
     * Return every indexed product (metadata only, no vector) sorted
     * by price, for the demo UI.
     */
    public List<ProductSummary> listProducts(int limit) {
        if (limit <= 0) limit = 100;
        Query q = new Query("*")
                .returnFields("name", "category", "brand", "price", "rating", "in_stock")
                .setSortBy("price", true)
                .limit(0, limit)
                .dialect(2);
        SearchResult result = client.ftSearch(indexName, q);
        List<ProductSummary> out = new ArrayList<>(result.getDocuments().size());
        for (Document doc : result.getDocuments()) {
            ProductSummary p = new ProductSummary();
            String rawKey = doc.getId();
            p.id = rawKey.startsWith(keyPrefix) ? rawKey.substring(keyPrefix.length()) : rawKey;
            p.name = stringOrEmpty(doc.get("name"));
            p.category = stringOrEmpty(doc.get("category"));
            p.brand = stringOrEmpty(doc.get("brand"));
            p.price = parseDouble(String.valueOf(doc.get("price")), 0.0);
            p.rating = parseDouble(String.valueOf(doc.get("rating")), 0.0);
            p.inStock = "true".equals(String.valueOf(doc.get("in_stock")));
            out.add(p);
        }
        return out;
    }

    /** Distinct category values from the TAG index, sorted for the UI. */
    public List<String> listCategories() {
        return listTagVals("category");
    }

    public List<String> listBrands() {
        return listTagVals("brand");
    }

    private List<String> listTagVals(String field) {
        try {
            Set<String> vals = client.ftTagVals(indexName, field);
            TreeSet<String> sorted = new TreeSet<>(vals);
            return new ArrayList<>(sorted);
        } catch (JedisDataException exc) {
            return Collections.emptyList();
        }
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    /**
     * Pack a 1-D float vector into the little-endian byte blob Redis
     * Search expects for a FLOAT32 vector field.
     */
    public static byte[] floatsToBytes(float[] vec) {
        ByteBuffer buf = ByteBuffer.allocate(vec.length * Float.BYTES).order(ByteOrder.LITTLE_ENDIAN);
        buf.asFloatBuffer().put(vec);
        return buf.array();
    }

    /**
     * Decode a little-endian float32 blob written by
     * {@link #floatsToBytes}. Returns an empty array on null input;
     * throws if the byte length isn't a multiple of four.
     */
    public static float[] bytesToFloats(byte[] buf) {
        if (buf == null) return new float[0];
        if (buf.length % 4 != 0) {
            throw new IllegalArgumentException(
                    "expected float32 buffer (multiple of 4 bytes), got " + buf.length);
        }
        float[] out = new float[buf.length / 4];
        ByteBuffer bb = ByteBuffer.wrap(buf).order(ByteOrder.LITTLE_ENDIAN);
        bb.asFloatBuffer().get(out);
        return out;
    }

    static float[] blendVectors(float[] query, float[] session, double weight) {
        if (session == null || weight <= 0) return query;
        if (weight > 1) weight = 1;
        float[] mixed = new float[query.length];
        for (int i = 0; i < query.length; i++) {
            mixed[i] = (float) ((1 - weight) * query[i] + weight * session[i]);
        }
        return l2Normalise(mixed);
    }

    static float[] ewmaBlend(float[] prev, float[] next, double alpha) {
        float[] mixed = new float[prev.length];
        for (int i = 0; i < prev.length; i++) {
            mixed[i] = (float) (alpha * next[i] + (1 - alpha) * prev[i]);
        }
        return l2Normalise(mixed);
    }

    public static float[] l2Normalise(float[] v) {
        double sq = 0;
        for (float x : v) sq += (double) x * x;
        double norm = Math.sqrt(sq);
        if (norm == 0) return v;
        float inv = (float) (1.0 / norm);
        for (int i = 0; i < v.length; i++) v[i] *= inv;
        return v;
    }

    private static String formatDouble(double v) {
        // Match Python's repr for round-trippable doubles. Drop the
        // trailing ".0" only for true integers to keep the wire format
        // similar to other ports.
        if (v == Math.floor(v) && !Double.isInfinite(v)) {
            return Long.toString((long) v) + ".0";
        }
        return Double.toString(v);
    }

    private static double parseDouble(Object value, double dflt) {
        if (value == null) return dflt;
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException exc) {
            return dflt;
        }
    }

    private static long parseLong(Object value, long dflt) {
        if (value == null) return dflt;
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException exc) {
            return dflt;
        }
    }

    private static String stringOrEmpty(Object value) {
        return value == null ? "" : value.toString();
    }

    // ------------------------------------------------------------------
    // Value types
    // ------------------------------------------------------------------

    /** One product, with its embedding as raw float32 LE bytes. */
    public static class Product {
        public String id;
        public String name;
        public String description;
        public String category;
        public String brand;
        public double price;
        public boolean inStock;
        public double rating;
        public byte[] embedding;
    }

    /** One result row from the candidate-retrieval stage. */
    public static class Candidate {
        public String id;
        public String name;
        public String description;
        public String category;
        public String brand;
        public double price;
        public double rating;
        public boolean inStock;
        // Cosine *distance* (0 identical, 2 opposite); lower is better.
        public double vectorDistance;
        // Final ranking score, initialised to vectorDistance and
        // optionally reduced by rerank(). Lower is better.
        public double score;
    }

    /** The lightweight catalog row the UI displays. */
    public static class ProductSummary {
        public String id;
        public String name;
        public String category;
        public String brand;
        public double price;
        public double rating;
        public boolean inStock;
    }

    /** The readable form of a user's features hash. */
    public static class UserFeatures {
        public float[] sessionVec;
        public Map<String, Double> affinities = new LinkedHashMap<>();
        public long clicks;
        public String lastClickedId = "";
        public String lastClickedCategory = "";
    }

    /** Subset of {@code FT.INFO} the demo UI displays. */
    public static class IndexStats {
        public String indexName;
        public long numDocs;
        public long indexingFailures;
        public double vectorIndexSizeMb;
    }

    /** Thrown when a click or refresh names a product that's gone. */
    public static class UnknownProductException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        public UnknownProductException(String productId) {
            super("unknown product " + productId);
        }
    }
}
