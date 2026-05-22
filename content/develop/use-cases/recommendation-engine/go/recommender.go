// Package recommendationengine provides a Redis-backed recommendation
// helper built on top of Redis Search.
//
// Items live as Hash documents at ``product:<id>``. Each hash stores
// the item's structured metadata (name, description, category, brand,
// price, in-stock flag, rating) alongside the raw float32 bytes of its
// 384-dimensional embedding. A single Redis Search index covers every
// field, so one FT.SEARCH call does the KNN over the embedding and
// the TAG / NUMERIC / TEXT pre-filter in the same pass — no
// cross-store joins, no extra round trips.
//
// Per-user state lives in ``user:<id>:features``: a session vector
// written as an exponentially weighted average of recently-clicked item
// embeddings, plus per-category affinity counters incremented atomically
// with HINCRBYFLOAT. The next time the application reads that hash to
// build a query, it sees the click — no batch cycle, no cache
// invalidation.
//
// The recommendation flow has two paths:
//
//   - Query path (per recommendation request): FT.SEARCH with KNN over
//     the embedding, optionally pre-filtered by structured attributes
//     and optionally biased toward a session vector blended into the
//     query, followed by a log-scaled category-affinity re-rank.
//   - Click path (per user interaction): the click writes a new
//     EWMA-blended session vector and increments the category affinity
//     in the user features hash. The next query path picks both up.
package recommendationengine

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"

	"github.com/redis/go-redis/v9"
)

const (
	// DefaultIndexName is the Redis Search index name the helper
	// creates and queries against.
	DefaultIndexName = "recommend:idx"
	// DefaultKeyPrefix is the hash-key prefix indexed by the schema.
	DefaultKeyPrefix = "product:"
	// DefaultUserKeyPrefix prefixes per-user feature hashes.
	DefaultUserKeyPrefix = "user:"
	// DefaultVectorDim is the embedding length used when not
	// overridden by the embedder.
	DefaultVectorDim = 384
)

// ErrUnknownProduct is returned by RecordClick and RefreshEmbedding
// when the supplied product ID has no hash in Redis.
var ErrUnknownProduct = errors.New("unknown product")

// Candidate is one result row from the candidate-retrieval stage.
// VectorDistance is the cosine distance returned by FT.SEARCH (0 means
// identical, 2 means opposite). Score starts equal to it and may be
// reduced by Rerank when the user has category affinities. Lower is
// better in both fields.
type Candidate struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	Category       string  `json:"category"`
	Brand          string  `json:"brand"`
	Price          float64 `json:"price"`
	Rating         float64 `json:"rating"`
	InStock        bool    `json:"in_stock"`
	VectorDistance float64 `json:"vector_distance"`
	Score          float64 `json:"score"`
}

// UserFeatures is the readable form of a user's features hash.
type UserFeatures struct {
	SessionVec          []float32          `json:"-"`
	Affinities          map[string]float64 `json:"affinities"`
	Clicks              int                `json:"clicks"`
	LastClickedID       string             `json:"last_clicked_id"`
	LastClickedCategory string             `json:"last_clicked_category"`
}

// FilterOptions is the structured-filter knob set for
// CandidateRetrieve. Empty fields are ignored.
type FilterOptions struct {
	Category    string
	Brand       string
	MinPrice    *float64
	MaxPrice    *float64
	InStockOnly bool
	MinRating   *float64
	TextMatch   string
	TextField   string // defaults to "description"
}

// RetrieveOptions bundles filter + KNN + session-blend settings.
type RetrieveOptions struct {
	FilterOptions
	K             int       // defaults to 10
	SessionVec    []float32 // optional
	SessionWeight float64   // defaults to 0.3 when SessionVec is non-nil
}

// RedisRecommender wraps a Redis Search index and the retrieval flow.
// A single instance is safe to share across goroutines; go-redis handles
// connection pooling under the hood.
type RedisRecommender struct {
	Client        *redis.Client
	IndexName     string
	KeyPrefix     string
	UserKeyPrefix string
	VectorDim     int
}

// NewRecommender constructs a RedisRecommender with defaults applied
// for any empty field.
func NewRecommender(client *redis.Client, opts ...RecommenderOption) *RedisRecommender {
	r := &RedisRecommender{
		Client:        client,
		IndexName:     DefaultIndexName,
		KeyPrefix:     DefaultKeyPrefix,
		UserKeyPrefix: DefaultUserKeyPrefix,
		VectorDim:     DefaultVectorDim,
	}
	for _, opt := range opts {
		opt(r)
	}
	return r
}

// RecommenderOption customises a RedisRecommender at construction.
type RecommenderOption func(*RedisRecommender)

// WithIndexName overrides the Redis Search index name.
func WithIndexName(name string) RecommenderOption {
	return func(r *RedisRecommender) { r.IndexName = name }
}

// WithKeyPrefix overrides the product-hash key prefix.
func WithKeyPrefix(p string) RecommenderOption {
	return func(r *RedisRecommender) { r.KeyPrefix = p }
}

// WithVectorDim overrides the embedding dimensionality.
func WithVectorDim(dim int) RecommenderOption {
	return func(r *RedisRecommender) { r.VectorDim = dim }
}

// ProductKey returns the Redis key for a product id.
func (r *RedisRecommender) ProductKey(id string) string {
	return r.KeyPrefix + id
}

// UserKey returns the Redis key for a user features hash.
func (r *RedisRecommender) UserKey(id string) string {
	return r.UserKeyPrefix + id + ":features"
}

// -----------------------------------------------------------------------------
// Index management
// -----------------------------------------------------------------------------

// CreateIndex creates the Redis Search index if it doesn't already
// exist. One index covers every queryable field. The vector field is
// HNSW with cosine distance so KNN is approximate but fast, and
// TAG / NUMERIC / TEXT fields share the same index so a single
// FT.SEARCH can pre-filter and KNN-rank in one pass.
func (r *RedisRecommender) CreateIndex(ctx context.Context) error {
	_, err := r.Client.FTCreate(ctx,
		r.IndexName,
		&redis.FTCreateOptions{
			OnHash: true,
			Prefix: []any{r.KeyPrefix},
		},
		&redis.FieldSchema{
			FieldName: "name",
			FieldType: redis.SearchFieldTypeText,
			Weight:    1,
		},
		&redis.FieldSchema{
			FieldName: "description",
			FieldType: redis.SearchFieldTypeText,
			Weight:    0.5,
		},
		&redis.FieldSchema{FieldName: "category", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "brand", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "in_stock", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{
			FieldName: "price",
			FieldType: redis.SearchFieldTypeNumeric,
			Sortable:  true,
		},
		&redis.FieldSchema{
			FieldName: "rating",
			FieldType: redis.SearchFieldTypeNumeric,
			Sortable:  true,
		},
		&redis.FieldSchema{
			FieldName: "embedding",
			FieldType: redis.SearchFieldTypeVector,
			VectorArgs: &redis.FTVectorArgs{
				HNSWOptions: &redis.FTHNSWOptions{
					Dim:            r.VectorDim,
					DistanceMetric: "COSINE",
					Type:           "FLOAT32",
				},
			},
		},
	).Result()
	if err != nil && !strings.Contains(err.Error(), "Index already exists") {
		return err
	}
	return nil
}

// DropIndex drops the Redis Search index. If deleteDocuments is true
// the indexed hashes are removed too. Missing-index errors are
// tolerated so the call is idempotent.
func (r *RedisRecommender) DropIndex(ctx context.Context, deleteDocuments bool) error {
	_, err := r.Client.FTDropIndexWithArgs(ctx, r.IndexName,
		&redis.FTDropIndexOptions{DeleteDocs: deleteDocuments},
	).Result()
	if err == nil {
		return nil
	}
	msg := strings.ToLower(err.Error())
	if strings.Contains(msg, "no such index") || strings.Contains(msg, "unknown index name") {
		return nil
	}
	return err
}

// -----------------------------------------------------------------------------
// Catalog ingest
// -----------------------------------------------------------------------------

// IndexProducts writes a batch of products to Redis as Hash documents.
// Each product must include an embedding (either Embedding or
// EmbeddingB64 — that's what BuildCatalog writes into catalog.json).
// Returns the number indexed.
func (r *RedisRecommender) IndexProducts(ctx context.Context, products []Product) (int, error) {
	pipe := r.Client.Pipeline()
	for _, p := range products {
		fields, err := r.encodeProduct(p)
		if err != nil {
			return 0, fmt.Errorf("encode %s: %w", p.ID, err)
		}
		pipe.HSet(ctx, r.ProductKey(p.ID), fields)
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return 0, err
	}
	return len(products), nil
}

func (r *RedisRecommender) encodeProduct(p Product) (map[string]any, error) {
	vec, err := decodeEmbedding(p)
	if err != nil {
		return nil, err
	}
	inStock := "false"
	if p.InStock {
		inStock = "true"
	}
	return map[string]any{
		// Product id lives in the key itself; not repeated in the hash.
		"name":        p.Name,
		"description": p.Description,
		"category":    p.Category,
		"brand":       p.Brand,
		"price":       strconv.FormatFloat(p.Price, 'f', -1, 64),
		"rating":      strconv.FormatFloat(p.Rating, 'f', -1, 64),
		"in_stock":    inStock,
		"embedding":   vec,
	}, nil
}

func decodeEmbedding(p Product) ([]byte, error) {
	if p.EmbeddingB64 != "" {
		return base64.StdEncoding.DecodeString(p.EmbeddingB64)
	}
	return nil, fmt.Errorf("product %s: no embedding (embedding_b64 missing)", p.ID)
}

// CountIndexed returns the number of indexed documents via a cheap
// FT.SEARCH * LIMIT 0 0.
func (r *RedisRecommender) CountIndexed(ctx context.Context) (int, error) {
	out, err := r.Client.FTSearchWithArgs(ctx, r.IndexName, "*",
		&redis.FTSearchOptions{CountOnly: true},
	).Result()
	if err != nil {
		return 0, err
	}
	return out.Total, nil
}

// -----------------------------------------------------------------------------
// Candidate retrieval
// -----------------------------------------------------------------------------

// CandidateRetrieve retrieves top-K candidates with FT.SEARCH KNN +
// filters. Returns Candidate rows ordered by ascending cosine distance
// (closest first); ``Score`` is initialised to the distance and may be
// reduced by ``Rerank`` when the user has affinities.
func (r *RedisRecommender) CandidateRetrieve(
	ctx context.Context, queryVec []float32, opts RetrieveOptions,
) ([]Candidate, error) {
	if opts.K <= 0 {
		opts.K = 10
	}
	effective := blendVectors(queryVec, opts.SessionVec, opts.SessionWeight)
	filter := BuildFilterClause(opts.FilterOptions)
	query := fmt.Sprintf("%s=>[KNN %d @embedding $vec AS vector_score]", filter, opts.K)

	out, err := r.Client.FTSearchWithArgs(ctx, r.IndexName, query,
		&redis.FTSearchOptions{
			Return: []redis.FTSearchReturn{
				{FieldName: "name"},
				{FieldName: "description"},
				{FieldName: "category"},
				{FieldName: "brand"},
				{FieldName: "price"},
				{FieldName: "rating"},
				{FieldName: "in_stock"},
				{FieldName: "vector_score"},
			},
			SortBy: []redis.FTSearchSortBy{
				{FieldName: "vector_score", Asc: true},
			},
			LimitOffset:    0,
			Limit:          opts.K,
			Params:         map[string]any{"vec": FloatsToBytes(effective)},
			DialectVersion: 2,
		}).Result()
	if err != nil {
		return nil, err
	}

	results := make([]Candidate, 0, len(out.Docs))
	for _, d := range out.Docs {
		c, err := r.decodeCandidate(d)
		if err != nil {
			return nil, err
		}
		results = append(results, c)
	}
	return results, nil
}

func (r *RedisRecommender) decodeCandidate(doc redis.Document) (Candidate, error) {
	bare := strings.TrimPrefix(doc.ID, r.KeyPrefix)
	dist, _ := strconv.ParseFloat(doc.Fields["vector_score"], 64)
	price, _ := strconv.ParseFloat(doc.Fields["price"], 64)
	rating, _ := strconv.ParseFloat(doc.Fields["rating"], 64)
	return Candidate{
		ID:             bare,
		Name:           doc.Fields["name"],
		Description:    doc.Fields["description"],
		Category:       doc.Fields["category"],
		Brand:          doc.Fields["brand"],
		Price:          price,
		Rating:         rating,
		InStock:        doc.Fields["in_stock"] == "true",
		VectorDistance: dist,
		Score:          dist,
	}, nil
}

// Rerank applies a per-category affinity bonus and re-sorts in place.
//
// ``UserFeatures.Affinities`` is a {category: weight} map accumulated
// from previous clicks. The bonus is shaped by
// ``log(1 + affinity) * affinityWeight`` so repeated clicks see
// diminishing returns and a single dominant category can't push the
// bonus arbitrarily large. The bonus is subtracted from the cosine
// distance, so a category the user has shown interest in pulls its
// members up the list (closer to zero) without overwhelming the vector
// signal.
func (r *RedisRecommender) Rerank(
	candidates []Candidate, features UserFeatures, affinityWeight float64,
) []Candidate {
	if affinityWeight <= 0 {
		affinityWeight = 0.15
	}
	if len(features.Affinities) == 0 {
		sort.SliceStable(candidates, func(i, j int) bool {
			return candidates[i].Score < candidates[j].Score
		})
		return candidates
	}
	for i := range candidates {
		raw := features.Affinities[candidates[i].Category]
		if raw < 0 {
			raw = 0
		}
		bonus := math.Log1p(raw) * affinityWeight
		candidates[i].Score = candidates[i].VectorDistance - bonus
	}
	sort.SliceStable(candidates, func(i, j int) bool {
		return candidates[i].Score < candidates[j].Score
	})
	return candidates
}

// -----------------------------------------------------------------------------
// Filter clause construction
// -----------------------------------------------------------------------------

// tagSpecial collects the characters Redis Search treats as syntax
// inside a TAG value; any of them appearing in a user-supplied filter
// must be backslash-escaped or the surrounding ``{...}`` block won't
// parse correctly. The list comes from the Redis Search query-syntax
// documentation. The backslash itself is included so a value
// containing a literal ``\`` can't eat the next character's escape.
var tagSpecial = func() map[rune]bool {
	m := make(map[rune]bool)
	for _, ch := range `\,.<>{}[]"':;!@#$%^&*()-+=~| ` {
		m[ch] = true
	}
	return m
}()

// EscapeTagValue backslash-escapes characters that have meaning inside
// ``@tag:{...}`` so a TAG filter built from external input can't
// accidentally close the brace, inject an additional clause, or
// misparse a value that simply contains a space or a hyphen.
func EscapeTagValue(value string) string {
	var b strings.Builder
	b.Grow(len(value))
	for _, ch := range value {
		if tagSpecial[ch] {
			b.WriteByte('\\')
		}
		b.WriteRune(ch)
	}
	return b.String()
}

// BuildFilterClause renders the pre-filter clause that goes in front
// of the KNN clause. Empty filters return ``(*)``, which is a no-op
// pre-filter in DIALECT 2.
func BuildFilterClause(f FilterOptions) string {
	clauses := make([]string, 0, 6)
	if f.Category != "" {
		clauses = append(clauses, "@category:{"+EscapeTagValue(f.Category)+"}")
	}
	if f.Brand != "" {
		clauses = append(clauses, "@brand:{"+EscapeTagValue(f.Brand)+"}")
	}
	if f.MinPrice != nil || f.MaxPrice != nil {
		lo := "-inf"
		hi := "+inf"
		if f.MinPrice != nil {
			lo = strconv.FormatFloat(*f.MinPrice, 'f', -1, 64)
		}
		if f.MaxPrice != nil {
			hi = strconv.FormatFloat(*f.MaxPrice, 'f', -1, 64)
		}
		clauses = append(clauses, "@price:["+lo+" "+hi+"]")
	}
	if f.MinRating != nil {
		clauses = append(clauses, "@rating:["+strconv.FormatFloat(*f.MinRating, 'f', -1, 64)+" +inf]")
	}
	if f.InStockOnly {
		clauses = append(clauses, "@in_stock:{true}")
	}
	if f.TextMatch != "" {
		field := f.TextField
		if field == "" {
			field = "description"
		}
		// Wrapping in quotes makes the value a single phrase and
		// avoids tripping the query parser on operators (``-``,
		// ``|``, ``"``, etc.) that a user might legitimately type.
		safe := strings.NewReplacer(`\`, `\\`, `"`, `\"`).Replace(f.TextMatch)
		clauses = append(clauses, "@"+field+":\""+safe+"\"")
	}
	if len(clauses) == 0 {
		return "(*)"
	}
	return "(" + strings.Join(clauses, " ") + ")"
}

// -----------------------------------------------------------------------------
// Session signals (clicks)
// -----------------------------------------------------------------------------

// RecordClickOptions tunes EWMA + per-category bumps in RecordClick.
type RecordClickOptions struct {
	// EWMAAlpha is the weight given to the new click; the previous
	// session keeps (1 - alpha). Default 0.4 biases history over the
	// latest click so a single accidental click doesn't swing the
	// session.
	EWMAAlpha float64
	// AffinityStep is added to ``aff:<category>``. Default 1.0.
	AffinityStep float64
}

// RecordClickResult is the small summary returned from RecordClick for
// the UI to display.
type RecordClickResult struct {
	Category      string  `json:"category"`
	Affinity      float64 `json:"affinity"`
	Clicks        int     `json:"clicks"`
	LastClickedID string  `json:"last_clicked_id"`
}

// RecordClick updates a user's session vector and category affinity.
//
// Reads the clicked item's embedding from its hash, blends it into the
// user's session vector with an exponentially weighted moving average,
// and bumps the category counter and click total.
//
// The category-affinity bump and click-count bump use HINCRBYFLOAT /
// HINCRBY so they're atomic against any concurrent caller. The session
// vector blend is inherently read-modify-write — the new vector
// depends on the previous one — and is *not* atomic against a
// concurrent click for the same user. For the per-user data this
// helper writes, that window is rare in practice; if it matters in a
// given deployment, wrap the read and the writeback in
// WATCH/MULTI/EXEC or move the whole blend into a Lua script.
func (r *RedisRecommender) RecordClick(
	ctx context.Context, userID, productID string, opts *RecordClickOptions,
) (RecordClickResult, error) {
	if opts == nil {
		// Nil opts means "use the documented defaults". An explicitly
		// passed zero EWMAAlpha or AffinityStep is honoured — zero is
		// the disable escape hatch (audit-checklist row 28).
		opts = &RecordClickOptions{EWMAAlpha: 0.4, AffinityStep: 1.0}
	}

	productKey := r.ProductKey(productID)
	// Pull the fields we need from the product hash in one round trip.
	got, err := r.Client.HMGet(ctx, productKey, "embedding", "category").Result()
	if err != nil {
		return RecordClickResult{}, err
	}
	if got[0] == nil {
		return RecordClickResult{}, fmt.Errorf("%w: %s", ErrUnknownProduct, productID)
	}
	clickedBytes := []byte(got[0].(string))
	clickedVec, err := BytesToFloats(clickedBytes)
	if err != nil {
		return RecordClickResult{}, err
	}
	category := ""
	if got[1] != nil {
		category, _ = got[1].(string)
	}
	if category == "" {
		category = "unknown"
	}

	userKey := r.UserKey(userID)
	prevRaw, err := r.Client.HGet(ctx, userKey, "session_vec").Result()
	var newSession []float32
	if err == redis.Nil {
		// First click — the clicked vector is already unit-normalised.
		newSession = clickedVec
	} else if err != nil {
		return RecordClickResult{}, err
	} else {
		prevVec, perr := BytesToFloats([]byte(prevRaw))
		if perr != nil {
			return RecordClickResult{}, perr
		}
		newSession = ewmaBlend(prevVec, clickedVec, opts.EWMAAlpha)
	}

	// Affinity and click counters are independent atomic increments;
	// only the session vector needs the read-modify-write because it
	// depends on the previous value. Pipeline the three writes.
	pipe := r.Client.Pipeline()
	pipe.HSet(ctx, userKey, map[string]any{
		"session_vec":           FloatsToBytes(newSession),
		"last_clicked_id":       productID,
		"last_clicked_category": category,
	})
	affCmd := pipe.HIncrByFloat(ctx, userKey, "aff:"+category, opts.AffinityStep)
	clicksCmd := pipe.HIncrBy(ctx, userKey, "clicks", 1)
	if _, err := pipe.Exec(ctx); err != nil {
		return RecordClickResult{}, err
	}

	return RecordClickResult{
		Category:      category,
		Affinity:      affCmd.Val(),
		Clicks:        int(clicksCmd.Val()),
		LastClickedID: productID,
	}, nil
}

// GetUserFeatures reads a user's session vector and affinities for
// re-ranking and UI display.
func (r *RedisRecommender) GetUserFeatures(ctx context.Context, userID string) (UserFeatures, error) {
	raw, err := r.Client.HGetAll(ctx, r.UserKey(userID)).Result()
	if err != nil {
		return UserFeatures{}, err
	}
	out := UserFeatures{Affinities: map[string]float64{}}
	if len(raw) == 0 {
		return out, nil
	}
	if v, ok := raw["session_vec"]; ok && v != "" {
		vec, ferr := BytesToFloats([]byte(v))
		if ferr != nil {
			return out, ferr
		}
		// A stored session vector with the wrong length means the
		// embedding model has changed since the click that wrote it
		// (e.g. the catalog was rebuilt under a different model and
		// the demo started with --no-reset). The blended-query path
		// would panic on length mismatch, so we drop the stale vector
		// here — the caller sees no session signal until the user
		// clicks again under the current model.
		if len(vec) == r.VectorDim {
			out.SessionVec = vec
		}
	}
	for k, v := range raw {
		if strings.HasPrefix(k, "aff:") {
			if n, ferr := strconv.ParseFloat(v, 64); ferr == nil {
				out.Affinities[strings.TrimPrefix(k, "aff:")] = n
			}
		}
	}
	if v, ok := raw["clicks"]; ok {
		if n, ferr := strconv.Atoi(v); ferr == nil {
			out.Clicks = n
		}
	}
	out.LastClickedID = raw["last_clicked_id"]
	out.LastClickedCategory = raw["last_clicked_category"]
	return out, nil
}

// ResetUser deletes a user's feature hash so the next request starts cold.
func (r *RedisRecommender) ResetUser(ctx context.Context, userID string) error {
	return r.Client.Del(ctx, r.UserKey(userID)).Err()
}

// -----------------------------------------------------------------------------
// Hot embedding refresh (no serving downtime)
// -----------------------------------------------------------------------------

// RefreshEmbedding overwrites the embedding for one product. The HNSW
// index reflects the change as soon as the HSET commits, so subsequent
// FT.SEARCH calls see the new vector without an index rebuild or
// serving downtime. Returns ErrUnknownProduct if the product hash does
// not exist (HSET would otherwise happily create a partial document
// that the index then picks up).
func (r *RedisRecommender) RefreshEmbedding(
	ctx context.Context, productID string, newVector []float32,
) error {
	if len(newVector) != r.VectorDim {
		return fmt.Errorf("newVector has length %d; index expects %d", len(newVector), r.VectorDim)
	}
	key := r.ProductKey(productID)
	exists, err := r.Client.Exists(ctx, key).Result()
	if err != nil {
		return err
	}
	if exists == 0 {
		return fmt.Errorf("%w: %s", ErrUnknownProduct, productID)
	}
	return r.Client.HSet(ctx, key, "embedding", FloatsToBytes(newVector)).Err()
}

// -----------------------------------------------------------------------------
// Inspection
// -----------------------------------------------------------------------------

// IndexStats is the subset of FT.INFO the demo UI displays.
type IndexStats struct {
	IndexName          string  `json:"index_name"`
	NumDocs            int     `json:"num_docs"`
	IndexingFailures   int     `json:"indexing_failures"`
	VectorIndexSizeMB  float64 `json:"vector_index_size_mb"`
}

// IndexInfo returns a small struct safe to JSON-encode for the UI.
// Missing-index errors are translated to a zero-valued stats struct
// so callers can render an empty state.
func (r *RedisRecommender) IndexInfo(ctx context.Context) (IndexStats, error) {
	info, err := r.Client.FTInfo(ctx, r.IndexName).Result()
	if err != nil {
		msg := strings.ToLower(err.Error())
		if strings.Contains(msg, "no such index") || strings.Contains(msg, "unknown index name") {
			return IndexStats{IndexName: r.IndexName}, nil
		}
		return IndexStats{IndexName: r.IndexName}, err
	}
	return IndexStats{
		IndexName:         r.IndexName,
		NumDocs:           info.NumDocs,
		IndexingFailures:  info.HashIndexingFailures,
		VectorIndexSizeMB: info.VectorIndexSzMB,
	}, nil
}

// ProductSummary is the lightweight catalog row the UI displays.
type ProductSummary struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Brand    string  `json:"brand"`
	Price    float64 `json:"price"`
	Rating   float64 `json:"rating"`
	InStock  bool    `json:"in_stock"`
}

// ListProducts returns every indexed product (metadata only, no
// vector) sorted by price, for the demo UI.
func (r *RedisRecommender) ListProducts(ctx context.Context, limit int) ([]ProductSummary, error) {
	if limit <= 0 {
		limit = 100
	}
	out, err := r.Client.FTSearchWithArgs(ctx, r.IndexName, "*",
		&redis.FTSearchOptions{
			Return: []redis.FTSearchReturn{
				{FieldName: "name"},
				{FieldName: "category"},
				{FieldName: "brand"},
				{FieldName: "price"},
				{FieldName: "rating"},
				{FieldName: "in_stock"},
			},
			SortBy: []redis.FTSearchSortBy{
				{FieldName: "price", Asc: true},
			},
			LimitOffset:    0,
			Limit:          limit,
			DialectVersion: 2,
		}).Result()
	if err != nil {
		return nil, err
	}
	results := make([]ProductSummary, 0, len(out.Docs))
	for _, d := range out.Docs {
		price, _ := strconv.ParseFloat(d.Fields["price"], 64)
		rating, _ := strconv.ParseFloat(d.Fields["rating"], 64)
		results = append(results, ProductSummary{
			ID:       strings.TrimPrefix(d.ID, r.KeyPrefix),
			Name:     d.Fields["name"],
			Category: d.Fields["category"],
			Brand:    d.Fields["brand"],
			Price:    price,
			Rating:   rating,
			InStock:  d.Fields["in_stock"] == "true",
		})
	}
	return results, nil
}

// ListCategories returns the distinct category values from the TAG
// index, for the UI dropdown.
func (r *RedisRecommender) ListCategories(ctx context.Context) ([]string, error) {
	return r.listTagVals(ctx, "category")
}

// ListBrands is the brand-field equivalent of ListCategories.
func (r *RedisRecommender) ListBrands(ctx context.Context) ([]string, error) {
	return r.listTagVals(ctx, "brand")
}

func (r *RedisRecommender) listTagVals(ctx context.Context, field string) ([]string, error) {
	vals, err := r.Client.FTTagVals(ctx, r.IndexName, field).Result()
	if err != nil {
		return nil, err
	}
	sort.Strings(vals)
	return vals, nil
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

func blendVectors(query, session []float32, weight float64) []float32 {
	// A nil session (or a length mismatch — e.g. a stale session from a
	// different-dim model still sitting in the user features hash) means
	// no signal to blend; return the query unchanged. ``GetUserFeatures``
	// already drops mismatched session vectors, but the defensive check
	// here keeps the blend safe even if a caller wires its own session
	// source.
	if session == nil || weight <= 0 || len(session) != len(query) {
		return query
	}
	if weight > 1 {
		weight = 1
	}
	mixed := make([]float32, len(query))
	for i := range query {
		mixed[i] = float32((1-weight)*float64(query[i]) + weight*float64(session[i]))
	}
	return l2Normalise(mixed)
}

func ewmaBlend(prev, next []float32, alpha float64) []float32 {
	// Length mismatch shouldn't happen — both vectors come from the
	// same embedder — but bail out defensively rather than panicking
	// on an out-of-range index.
	if len(prev) != len(next) {
		return next
	}
	mixed := make([]float32, len(prev))
	for i := range prev {
		mixed[i] = float32(alpha*float64(next[i]) + (1-alpha)*float64(prev[i]))
	}
	return l2Normalise(mixed)
}
