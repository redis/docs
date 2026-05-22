import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ExecutionException;

import io.lettuce.core.RedisFuture;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.output.NestedMultiOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.ProtocolKeyword;
import io.lettuce.core.search.SearchReply;
import io.lettuce.core.search.arguments.CreateArgs;
import io.lettuce.core.search.arguments.FieldArgs;
import io.lettuce.core.search.arguments.NumericFieldArgs;
import io.lettuce.core.search.arguments.QueryDialects;
import io.lettuce.core.search.arguments.SearchArgs;
import io.lettuce.core.search.arguments.SortByArgs;
import io.lettuce.core.search.arguments.TagFieldArgs;
import io.lettuce.core.search.arguments.TextFieldArgs;
import io.lettuce.core.search.arguments.VectorFieldArgs;
import io.lettuce.core.RedisCommandExecutionException;

/**
 * Redis recommendation-engine helper backed by Redis Search, Lettuce
 * edition.
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
 *
 * <p><b>Lettuce-specific notes</b>:</p>
 * <ul>
 *   <li>Lettuce's default {@code StringCodec} UTF-8-decodes hash values,
 *       which would corrupt the raw float32 bytes that the Redis Search
 *       vector field expects. This helper therefore holds <i>two</i>
 *       connections: a regular {@code <String, String>} connection for
 *       structured fields and {@code FT.*} index management, and a
 *       binary {@code <String, byte[]>} connection that owns every
 *       command which reads or writes the {@code embedding} field
 *       (including {@code FT.SEARCH}, since the query vector parameter
 *       is sent as raw bytes too).</li>
 *   <li>Batched {@code HSET} writes use the async API with
 *       {@code setAutoFlushCommands(false)} + {@code flushCommands()}
 *       to issue one round trip. This differs from Jedis's
 *       {@code pipelined()} API: in Lettuce the auto-flush toggle is
 *       <i>connection-wide</i>, so this helper owns the binary
 *       connection it pipelines on rather than borrowing a shared one.</li>
 * </ul>
 */
public class Recommender {

    public static final int VECTOR_DIM_DEFAULT = 384;
    public static final String DEFAULT_INDEX_NAME = "recommend:idx";
    public static final String DEFAULT_KEY_PREFIX = "product:";
    public static final String DEFAULT_USER_KEY_PREFIX = "user:";

    /** Lettuce 7 has no typed {@code FT.INFO} helper; we dispatch the raw command. */
    private static final ProtocolKeyword FT_INFO = new ProtocolKeyword() {
        private final byte[] bytes = "FT.INFO".getBytes(StandardCharsets.UTF_8);
        @Override public byte[] getBytes() { return bytes; }
        @Override public String toString() { return "FT.INFO"; }
        @Override public String name() { return "FT.INFO"; }
    };

    private final StatefulRedisConnection<String, String> connection;
    private final StatefulRedisConnection<String, byte[]> binConnection;
    private final String indexName;
    private final String keyPrefix;
    private final String userKeyPrefix;
    private final int vectorDim;

    public Recommender(StatefulRedisConnection<String, String> connection,
                       StatefulRedisConnection<String, byte[]> binConnection) {
        this(connection, binConnection, DEFAULT_INDEX_NAME, DEFAULT_KEY_PREFIX,
                DEFAULT_USER_KEY_PREFIX, VECTOR_DIM_DEFAULT);
    }

    public Recommender(StatefulRedisConnection<String, String> connection,
                       StatefulRedisConnection<String, byte[]> binConnection,
                       String indexName, String keyPrefix,
                       String userKeyPrefix, int vectorDim) {
        if (connection == null || binConnection == null) {
            throw new IllegalArgumentException("connection and binConnection are required");
        }
        this.connection = connection;
        this.binConnection = binConnection;
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
        List<FieldArgs<String>> schema = Arrays.asList(
                TextFieldArgs.<String>builder().name("name").weight(1L).build(),
                // Lettuce's TextField weight is a long: 1 == default weight,
                // we accept the loss of the 0.5 fractional weight on
                // description because Lettuce 7 does not expose a double
                // weight builder.
                TextFieldArgs.<String>builder().name("description").build(),
                TagFieldArgs.<String>builder().name("category").build(),
                TagFieldArgs.<String>builder().name("brand").build(),
                TagFieldArgs.<String>builder().name("in_stock").build(),
                NumericFieldArgs.<String>builder().name("price").sortable().build(),
                NumericFieldArgs.<String>builder().name("rating").sortable().build(),
                VectorFieldArgs.<String>builder()
                        .name("embedding")
                        .hnsw()
                        .type(VectorFieldArgs.VectorType.FLOAT32)
                        .dimensions(vectorDim)
                        .distanceMetric(VectorFieldArgs.DistanceMetric.COSINE)
                        .build());

        CreateArgs<String, String> createArgs = CreateArgs.<String, String>builder()
                .on(CreateArgs.TargetType.HASH)
                .withPrefix(keyPrefix)
                .build();
        try {
            connection.sync().ftCreate(indexName, createArgs, schema);
        } catch (RedisCommandExecutionException exc) {
            // Tolerate "Index already exists" for idempotent setup.
            String msg = String.valueOf(exc.getMessage());
            if (!msg.contains("Index already exists")) {
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
            connection.sync().ftDropindex(indexName, deleteDocuments);
        } catch (RedisCommandExecutionException exc) {
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
     * embedding as raw float32 bytes ({@link Product#embedding}).
     * Lettuce pipelines via {@code setAutoFlushCommands(false)} +
     * {@code flushCommands()} on the async API, instead of Jedis's
     * dedicated {@code Pipeline} object.</p>
     *
     * @return the number of products written.
     */
    public int indexProducts(List<Product> products) {
        // The binary connection's value codec is byte[], so structured
        // fields go through as their UTF-8 bytes here and Redis sees
        // exactly the same wire format Jedis would have produced via
        // SafeEncoder.encode(). All hash fields for one product land
        // in a single HSET — auto-flush off keeps the whole batch in
        // one round trip.
        RedisAsyncCommands<String, byte[]> async = binConnection.async();
        binConnection.setAutoFlushCommands(false);
        try {
            List<RedisFuture<Long>> futures = new ArrayList<>(products.size());
            for (Product p : products) {
                Map<String, byte[]> fields = new LinkedHashMap<>();
                fields.put("name", utf8(p.name));
                fields.put("description", utf8(p.description));
                fields.put("category", utf8(p.category));
                fields.put("brand", utf8(p.brand));
                fields.put("price", utf8(formatDouble(p.price)));
                fields.put("rating", utf8(formatDouble(p.rating)));
                fields.put("in_stock", utf8(p.inStock ? "true" : "false"));
                fields.put("embedding", p.embedding);
                futures.add(async.hset(productKey(p.id), fields));
            }
            binConnection.flushCommands();
            for (RedisFuture<Long> future : futures) {
                try {
                    future.get();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("indexProducts interrupted", e);
                } catch (ExecutionException e) {
                    throw new RuntimeException("indexProducts failed", e.getCause());
                }
            }
        } finally {
            binConnection.setAutoFlushCommands(true);
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

        // Build SearchArgs against the binary connection so the $vec
        // parameter goes through as raw bytes and the returned hash
        // field values come back as byte[] (we UTF-8-decode the text
        // fields ourselves below).
        SearchArgs<String, byte[]> args = SearchArgs.<String, byte[]>builder()
                .param("vec", floatsToBytes(effective))
                .returnField("name")
                .returnField("description")
                .returnField("category")
                .returnField("brand")
                .returnField("price")
                .returnField("rating")
                .returnField("in_stock")
                .returnField("vector_score")
                .sortBy(SortByArgs.<String>builder().attribute("vector_score").build())
                .limit(0, k)
                .dialect(QueryDialects.DIALECT2)
                .build();

        // ftSearch's V (value type) is byte[] on the binary connection,
        // so the query expression has to be supplied as UTF-8 bytes too.
        SearchReply<String, byte[]> reply = binConnection.sync()
                .ftSearch(indexName, utf8(queryStr), args);
        List<SearchReply.SearchResult<String, byte[]>> results =
                reply == null ? Collections.emptyList() : reply.getResults();
        List<Candidate> out = new ArrayList<>(results.size());
        for (SearchReply.SearchResult<String, byte[]> doc : results) {
            out.add(decodeCandidate(doc));
        }
        return out;
    }

    private Candidate decodeCandidate(SearchReply.SearchResult<String, byte[]> doc) {
        String rawKey = doc.getId();
        String bareId = rawKey.startsWith(keyPrefix)
                ? rawKey.substring(keyPrefix.length()) : rawKey;
        Map<String, byte[]> fields = doc.getFields();
        double dist = parseDouble(fromUtf8(fields.get("vector_score")), 0.0);
        double price = parseDouble(fromUtf8(fields.get("price")), 0.0);
        double rating = parseDouble(fromUtf8(fields.get("rating")), 0.0);
        boolean inStock = "true".equals(fromUtf8(fields.get("in_stock")));
        Candidate c = new Candidate();
        c.id = bareId;
        c.name = fromUtf8(fields.get("name"));
        c.description = fromUtf8(fields.get("description"));
        c.category = fromUtf8(fields.get("category"));
        c.brand = fromUtf8(fields.get("brand"));
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

        // Pull the embedding (binary) and category (text-as-bytes) in
        // one round trip via the binary connection so the embedding
        // arrives intact.
        RedisCommands<String, byte[]> binSync = binConnection.sync();
        List<io.lettuce.core.KeyValue<String, byte[]>> raw =
                binSync.hmget(productKey, "embedding", "category");
        byte[] rawEmbedding = null;
        byte[] rawCategory = null;
        if (raw != null) {
            for (io.lettuce.core.KeyValue<String, byte[]> kv : raw) {
                if (!kv.hasValue()) continue;
                if ("embedding".equals(kv.getKey())) rawEmbedding = kv.getValue();
                else if ("category".equals(kv.getKey())) rawCategory = kv.getValue();
            }
        }
        if (rawEmbedding == null) {
            throw new UnknownProductException(productId);
        }
        float[] clickedVec = bytesToFloats(rawEmbedding);
        String category = rawCategory == null ? "unknown" : fromUtf8(rawCategory);
        if (category.isEmpty()) category = "unknown";

        String userKey = userKey(userId);
        byte[] prevRaw = binSync.hget(userKey, "session_vec");
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
        // We could batch these four writes with
        // ``setAutoFlushCommands(false)`` + manual ``flushCommands()``,
        // but that toggle is connection-wide and a shared recommender
        // services concurrent HTTP threads — one click flipping the
        // flag would race against another's queued commands. Four
        // sequential sync calls against a local Redis cost sub-
        // millisecond in aggregate; correctness wins over the
        // micro-optimisation.
        Map<String, byte[]> stringFields = new LinkedHashMap<>();
        stringFields.put("last_clicked_id", utf8(productId));
        stringFields.put("last_clicked_category", utf8(category));
        binSync.hset(userKey, stringFields);
        binSync.hset(userKey, "session_vec", floatsToBytes(newSession));
        Double aff = binSync.hincrbyfloat(userKey, "aff:" + category, affinityStep);
        Long clicks = binSync.hincrby(userKey, "clicks", 1L);

        RecordClickResult out = new RecordClickResult();
        out.category = category;
        out.affinity = aff == null ? 0.0 : aff;
        out.clicks = clicks == null ? 0L : clicks;
        out.lastClickedId = productId;
        return out;
    }

    /** Read a user's session vector and affinities for re-ranking. */
    public UserFeatures getUserFeatures(String userId) {
        UserFeatures out = new UserFeatures();
        Map<String, byte[]> raw = binConnection.sync().hgetall(userKey(userId));
        if (raw == null || raw.isEmpty()) return out;
        for (Map.Entry<String, byte[]> entry : raw.entrySet()) {
            String field = entry.getKey();
            byte[] value = entry.getValue();
            if (value == null) continue;
            if ("session_vec".equals(field)) {
                if (value.length > 0) {
                    out.sessionVec = bytesToFloats(value);
                }
            } else if (field.startsWith("aff:")) {
                String cat = field.substring("aff:".length());
                try {
                    out.affinities.put(cat, Double.parseDouble(fromUtf8(value)));
                } catch (NumberFormatException ignored) {
                    // skip malformed counters
                }
            } else if ("clicks".equals(field)) {
                try {
                    out.clicks = Long.parseLong(fromUtf8(value));
                } catch (NumberFormatException ignored) {
                    // skip
                }
            } else if ("last_clicked_id".equals(field)) {
                out.lastClickedId = fromUtf8(value);
            } else if ("last_clicked_category".equals(field)) {
                out.lastClickedCategory = fromUtf8(value);
            }
        }
        return out;
    }

    /** Delete a user's feature hash. Next request starts cold. */
    public void resetUser(String userId) {
        connection.sync().del(userKey(userId));
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
        Long exists = connection.sync().exists(key);
        if (exists == null || exists == 0) {
            throw new UnknownProductException(productId);
        }
        binConnection.sync().hset(key, "embedding", floatsToBytes(newVector));
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /** Subset of {@code FT.INFO} useful for the demo UI. */
    public IndexStats indexInfo() {
        IndexStats stats = new IndexStats();
        stats.indexName = indexName;
        try {
            // Lettuce 7's RediSearchCommands has no typed ftInfo
            // wrapper, so we dispatch the raw command and read the
            // alternating key/value reply with NestedMultiOutput.
            CommandArgs<String, String> commandArgs = new CommandArgs<>(StringCodec.UTF8).add(indexName);
            Object reply = connection.sync().dispatch(
                    FT_INFO,
                    new NestedMultiOutput<>(StringCodec.UTF8),
                    commandArgs);
            Map<String, Object> info = pairList(reply);
            stats.numDocs = parseLong(info.get("num_docs"), 0L);
            stats.indexingFailures = parseLong(info.get("hash_indexing_failures"), 0L);
            Object vecMb = info.get("vector_index_sz_mb");
            stats.vectorIndexSizeMb = vecMb == null ? 0.0 : parseDouble(vecMb.toString(), 0.0);
        } catch (RedisCommandExecutionException exc) {
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
        SearchArgs<String, String> args = SearchArgs.<String, String>builder()
                .returnField("name")
                .returnField("category")
                .returnField("brand")
                .returnField("price")
                .returnField("rating")
                .returnField("in_stock")
                .sortBy(SortByArgs.<String>builder().attribute("price").build())
                .limit(0, limit)
                .dialect(QueryDialects.DIALECT2)
                .build();
        SearchReply<String, String> reply = connection.sync().ftSearch(indexName, "*", args);
        List<SearchReply.SearchResult<String, String>> results =
                reply == null ? Collections.emptyList() : reply.getResults();
        List<ProductSummary> out = new ArrayList<>(results.size());
        for (SearchReply.SearchResult<String, String> doc : results) {
            ProductSummary p = new ProductSummary();
            String rawKey = doc.getId();
            p.id = rawKey.startsWith(keyPrefix) ? rawKey.substring(keyPrefix.length()) : rawKey;
            Map<String, String> fields = doc.getFields();
            p.name = stringOrEmpty(fields.get("name"));
            p.category = stringOrEmpty(fields.get("category"));
            p.brand = stringOrEmpty(fields.get("brand"));
            p.price = parseDouble(fields.get("price"), 0.0);
            p.rating = parseDouble(fields.get("rating"), 0.0);
            p.inStock = "true".equals(fields.get("in_stock"));
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
            List<String> vals = connection.sync().ftTagvals(indexName, field);
            if (vals == null) return Collections.emptyList();
            TreeSet<String> sorted = new TreeSet<>(vals);
            return new ArrayList<>(sorted);
        } catch (RedisCommandExecutionException exc) {
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

    private static byte[] utf8(String value) {
        return value == null ? new byte[0] : value.getBytes(StandardCharsets.UTF_8);
    }

    private static String fromUtf8(byte[] value) {
        return value == null ? "" : new String(value, StandardCharsets.UTF_8);
    }

    /**
     * Convert the raw alternating-pair {@code FT.INFO} reply into a
     * map. The reply is a {@code List<Object>} with key/value
     * alternating, where some values themselves are nested lists.
     */
    @SuppressWarnings("unchecked")
    private static Map<String, Object> pairList(Object reply) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (!(reply instanceof List)) return out;
        List<Object> flat = (List<Object>) reply;
        for (int i = 0; i + 1 < flat.size(); i += 2) {
            Object key = flat.get(i);
            if (key == null) continue;
            out.put(String.valueOf(key), flat.get(i + 1));
        }
        return out;
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
