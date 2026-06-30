// Redis semantic-cache helper backed by Redis Search.
//
// Each cache entry lives as a Hash document at `cache:<id>`. The hash
// stores the user's prompt and the corresponding LLM response
// alongside the raw float32 bytes of the prompt's 384-dimensional
// embedding and a small set of metadata fields — tenant, locale,
// model version, and a safety flag.
//
// A single Redis Search index covers the embedding plus every
// metadata field, so one `FT.SEARCH` call does an
// approximate-nearest-neighbour lookup against the cached prompts
// with a TAG pre-filter applied in the same pass — no cross-store
// joins, no extra round trips, and tenant isolation is enforced
// *inside* the query rather than after the fact in application code.
//
// The lookup is thresholded: `FT.SEARCH` always returns the closest
// cached prompt, but the cache only serves it as a hit when the
// cosine distance is at or below `DistanceThreshold`. Anything
// further away is treated as a miss; the caller is expected to run
// the underlying LLM and write the new prompt, response, and
// embedding back with `Put`.
//
// Each cache entry is written with `EXPIRE`, so stale answers age out
// without manual cleanup; combine with an `allkeys-lfu` eviction
// policy on the database to cap memory under pressure too.

package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const vectorDimDefault = 384

// CacheHit is what `Lookup` returns when the nearest cached prompt
// passes the threshold. `Distance` is the cosine distance reported
// by FT.SEARCH (0 = identical, 2 = opposite); it is always at or
// below the threshold the lookup ran with.
type CacheHit struct {
	ID           string
	Prompt       string
	Response     string
	Tenant       string
	Locale       string
	ModelVersion string
	Distance     float64
	TTLSeconds   int
	HitCount     int
}

// CacheMiss is what `Lookup` returns when the nearest candidate is
// too far away, or when no candidate satisfied the metadata filter
// at all. `NearestDistance` is non-nil only in the "candidate too
// far" case — the demo UI uses that distinction to display either
// "no candidate" or "candidate too far".
type CacheMiss struct {
	NearestDistance *float64
	NearestID       string
}

// LookupResult is a tagged union: exactly one of Hit and Miss is set.
type LookupResult struct {
	Hit  *CacheHit
	Miss *CacheMiss
}

// RedisSemanticCache wraps the Redis Search index and lookup / write
// flow for a thresholded semantic cache.
type RedisSemanticCache struct {
	Client            *redis.Client
	IndexName         string
	KeyPrefix         string
	VectorDim         int
	DistanceThreshold float64
	DefaultTTLSeconds int
}

// NewRedisSemanticCache returns a cache helper with the supplied
// client. Pass zero values for any field to use the defaults
// (semcache:idx / cache: / 384 / 0.5 / 3600).
func NewRedisSemanticCache(
	client *redis.Client,
	indexName, keyPrefix string,
	vectorDim int,
	distanceThreshold float64,
	defaultTTLSeconds int,
) *RedisSemanticCache {
	if indexName == "" {
		indexName = "semcache:idx"
	}
	if keyPrefix == "" {
		keyPrefix = "cache:"
	}
	if vectorDim <= 0 {
		vectorDim = vectorDimDefault
	}
	// distanceThreshold is honoured as-is. Zero is a legitimate value
	// ("exact matches only") and negative numbers are clamped by the
	// HTTP boundary anyway. Silently rewriting `0` to a default would
	// make `--threshold 0` uncallable — see audit-checklist row 28.
	if defaultTTLSeconds <= 0 {
		defaultTTLSeconds = 3600
	}
	return &RedisSemanticCache{
		Client:            client,
		IndexName:         indexName,
		KeyPrefix:         keyPrefix,
		VectorDim:         vectorDim,
		DistanceThreshold: distanceThreshold,
		DefaultTTLSeconds: defaultTTLSeconds,
	}
}

// EntryKey returns the Redis key for an entry id.
func (c *RedisSemanticCache) EntryKey(entryID string) string {
	return c.KeyPrefix + entryID
}

// CreateIndex creates the Redis Search index if it doesn't already
// exist. One index covers the embedding plus every metadata field,
// so a single FT.SEARCH can pre-filter by tenant / locale / model
// and then KNN-rank the matching documents in one pass. The `prompt`
// and `response` fields are stored as TEXT so admin tooling can grep
// the cache by content, but the cache lookup itself is vector-only.
func (c *RedisSemanticCache) CreateIndex(ctx context.Context) error {
	_, err := c.Client.FTCreate(ctx,
		c.IndexName,
		&redis.FTCreateOptions{
			OnHash: true,
			Prefix: []any{c.KeyPrefix},
		},
		&redis.FieldSchema{FieldName: "prompt", FieldType: redis.SearchFieldTypeText},
		&redis.FieldSchema{FieldName: "response", FieldType: redis.SearchFieldTypeText},
		&redis.FieldSchema{FieldName: "tenant", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "locale", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "model_version", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "safety", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "created_ts", FieldType: redis.SearchFieldTypeNumeric, Sortable: true},
		&redis.FieldSchema{FieldName: "hit_count", FieldType: redis.SearchFieldTypeNumeric, Sortable: true},
		&redis.FieldSchema{
			FieldName: "embedding",
			FieldType: redis.SearchFieldTypeVector,
			VectorArgs: &redis.FTVectorArgs{
				HNSWOptions: &redis.FTHNSWOptions{
					Type:           "FLOAT32",
					Dim:            c.VectorDim,
					DistanceMetric: "COSINE",
				},
			},
		},
	).Result()
	if err != nil && !strings.Contains(err.Error(), "Index already exists") {
		return err
	}
	return nil
}

// DropIndex drops the Redis Search index. If `deleteDocuments` is
// true the cached entry hashes are deleted alongside the index.
func (c *RedisSemanticCache) DropIndex(ctx context.Context, deleteDocuments bool) error {
	_, err := c.Client.FTDropIndexWithArgs(ctx,
		c.IndexName,
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

// LookupParams collects the optional metadata filters and threshold
// override for a lookup. Using a struct keeps the call site readable
// when only a couple of fields are set.
type LookupParams struct {
	Tenant            string
	Locale            string
	ModelVersion      string
	Safety            string // empty string => "ok"; pass "-" to disable
	DistanceThreshold *float64
}

// Lookup runs the thresholded FT.SEARCH and decides hit vs. miss.
//
// FT.SEARCH returns the single nearest entry that satisfies the TAG
// pre-filters. The lookup is a hit only if the reported cosine
// distance is at or below the threshold (instance default or
// override). Anything further away is a miss with the candidate
// distance attached so the caller can log it.
//
// On a hit, the entry's `hit_count` is incremented atomically with
// HINCRBY so the demo UI can show which entries are load-bearing.
// The TTL is refreshed on every hit so frequently used answers don't
// age out under cold tail entries.
func (c *RedisSemanticCache) Lookup(
	ctx context.Context,
	queryVec []float32,
	params LookupParams,
) (LookupResult, error) {
	// Match the shape check that `Put` performs. A wrong-dim vector
	// would otherwise hit Redis as a malformed FT.SEARCH parameter
	// and surface as a server-side parse error instead of a clear
	// caller-side error.
	if len(queryVec) != c.VectorDim {
		return LookupResult{}, fmt.Errorf(
			"queryVec length is %d; index expects %d",
			len(queryVec), c.VectorDim,
		)
	}

	threshold := c.DistanceThreshold
	if params.DistanceThreshold != nil {
		threshold = *params.DistanceThreshold
	}

	safety := params.Safety
	if safety == "" {
		safety = "ok"
	} else if safety == "-" {
		safety = ""
	}

	filterClause := buildFilterClause(params.Tenant, params.Locale, params.ModelVersion, safety)
	queryStr := filterClause + "=>[KNN 1 @embedding $vec AS distance]"

	res, err := c.Client.FTSearchWithArgs(ctx,
		c.IndexName,
		queryStr,
		&redis.FTSearchOptions{
			DialectVersion: 2,
			Params:         map[string]any{"vec": FloatsToBytes(queryVec)},
			SortBy: []redis.FTSearchSortBy{
				{FieldName: "distance", Asc: true},
			},
			Return: []redis.FTSearchReturn{
				{FieldName: "prompt"},
				{FieldName: "response"},
				{FieldName: "tenant"},
				{FieldName: "locale"},
				{FieldName: "model_version"},
				{FieldName: "hit_count"},
				{FieldName: "distance"},
			},
			LimitOffset: 0,
			Limit:       1,
		},
	).Result()
	if err != nil {
		return LookupResult{}, fmt.Errorf("FT.SEARCH: %w", err)
	}

	if len(res.Docs) == 0 {
		return LookupResult{Miss: &CacheMiss{NearestDistance: nil, NearestID: ""}}, nil
	}

	doc := res.Docs[0]
	rawKey := doc.ID
	entryID := strings.TrimPrefix(rawKey, c.KeyPrefix)

	distance, _ := strconv.ParseFloat(doc.Fields["distance"], 64)

	if distance > threshold {
		d := distance
		return LookupResult{Miss: &CacheMiss{NearestDistance: &d, NearestID: entryID}}, nil
	}

	// The hash may have expired between FT.SEARCH returning the row
	// and us getting here — the search index lags expirations by its
	// periodic scan. If we just blindly HINCRBY-ed, Redis would
	// helpfully recreate the hash with only `hit_count` set and the
	// search index would then log it as an indexing failure (no
	// embedding, no metadata). EXISTS narrows that race to the
	// pipeline round-trip; a strictly race-free version would wrap
	// the bump in a Lua script that checks existence and acts in one
	// server-side step.
	entryKey := c.EntryKey(entryID)
	exists, err := c.Client.Exists(ctx, entryKey).Result()
	if err != nil {
		return LookupResult{}, fmt.Errorf("EXISTS: %w", err)
	}
	if exists == 0 {
		d := distance
		return LookupResult{Miss: &CacheMiss{NearestDistance: &d, NearestID: entryID}}, nil
	}

	// MULTI/EXEC the three writes so they apply as a unit on the
	// server — a partial failure between HINCRBY and EXPIRE would
	// otherwise leave the entry without a refreshed TTL.
	var hincrCmd *redis.IntCmd
	var ttlCmd *redis.DurationCmd
	if _, err := c.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		hincrCmd = pipe.HIncrBy(ctx, entryKey, "hit_count", 1)
		pipe.Expire(ctx, entryKey, time.Duration(c.DefaultTTLSeconds)*time.Second)
		ttlCmd = pipe.TTL(ctx, entryKey)
		return nil
	}); err != nil {
		return LookupResult{}, fmt.Errorf("hit-count bump MULTI/EXEC: %w", err)
	}

	newHitCount := hincrCmd.Val()
	ttlSeconds := int(ttlCmd.Val() / time.Second)
	if ttlSeconds <= 0 {
		ttlSeconds = c.DefaultTTLSeconds
	}

	return LookupResult{Hit: &CacheHit{
		ID:           entryID,
		Prompt:       doc.Fields["prompt"],
		Response:     doc.Fields["response"],
		Tenant:       doc.Fields["tenant"],
		Locale:       doc.Fields["locale"],
		ModelVersion: doc.Fields["model_version"],
		Distance:     distance,
		TTLSeconds:   ttlSeconds,
		HitCount:     int(newHitCount),
	}}, nil
}

// PutParams collects the fields of a new cache entry.
type PutParams struct {
	Prompt       string
	Response     string
	Embedding    []float32
	Tenant       string // default "default"
	Locale       string // default "en"
	ModelVersion string // default "gpt-4.5-2026"
	Safety       string // default "ok"
	TTLSeconds   int    // 0 => use DefaultTTLSeconds
	EntryID      string // empty => generate a random 12-hex id
}

// Put writes a new cache entry and returns its id.
//
// The embedding is stored as raw little-endian float32 bytes — the
// encoding Redis Search expects from a FLOAT32 vector field. EXPIRE
// on the key gives every entry a bounded lifetime; combine with an
// `allkeys-lfu` eviction policy on the database to cap memory under
// pressure too.
func (c *RedisSemanticCache) Put(ctx context.Context, p PutParams) (string, error) {
	if len(p.Embedding) != c.VectorDim {
		return "", fmt.Errorf(
			"embedding length is %d; index expects %d",
			len(p.Embedding), c.VectorDim,
		)
	}

	entryID := p.EntryID
	if entryID == "" {
		var err error
		entryID, err = newEntryID()
		if err != nil {
			return "", fmt.Errorf("generating entry id: %w", err)
		}
	}
	tenant := p.Tenant
	if tenant == "" {
		tenant = "default"
	}
	locale := p.Locale
	if locale == "" {
		locale = "en"
	}
	modelVersion := p.ModelVersion
	if modelVersion == "" {
		modelVersion = "gpt-4.5-2026"
	}
	safety := p.Safety
	if safety == "" {
		safety = "ok"
	}
	ttl := p.TTLSeconds
	if ttl <= 0 {
		ttl = c.DefaultTTLSeconds
	}

	key := c.EntryKey(entryID)
	mapping := map[string]any{
		"prompt":        p.Prompt,
		"response":      p.Response,
		"tenant":        tenant,
		"locale":        locale,
		"model_version": modelVersion,
		"safety":        safety,
		"created_ts":    strconv.FormatFloat(float64(time.Now().UnixNano())/1e9, 'f', -1, 64),
		"hit_count":     "0",
		"embedding":     FloatsToBytes(p.Embedding),
	}

	// MULTI/EXEC so HSET and EXPIRE either both apply or neither
	// does. Without the transaction wrapper a connection drop
	// between the two writes could leave the entry without a TTL
	// and the cache would then keep an answer past its intended
	// lifetime (or forever, on a database with no eviction policy).
	if _, err := c.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.HSet(ctx, key, mapping)
		pipe.Expire(ctx, key, time.Duration(ttl)*time.Second)
		return nil
	}); err != nil {
		return "", fmt.Errorf("put MULTI/EXEC: %w", err)
	}
	return entryID, nil
}

// ----- Filter clause helpers ------------------------------------------

// tagSpecial is the set of characters Redis Search treats as syntax
// inside a TAG value; any of them in a user-supplied filter must be
// backslash-escaped or the surrounding `{...}` block won't parse
// correctly.
var tagSpecial = map[rune]struct{}{
	'\\': {}, ',': {}, '.': {}, '<': {}, '>': {}, '{': {}, '}': {},
	'[': {}, ']': {}, '"': {}, '\'': {}, ':': {}, ';': {}, '!': {},
	'@': {}, '#': {}, '$': {}, '%': {}, '^': {}, '&': {}, '*': {},
	'(': {}, ')': {}, '-': {}, '+': {}, '=': {}, '~': {}, '|': {},
	' ': {},
}

func escapeTagValue(v string) string {
	var b strings.Builder
	b.Grow(len(v))
	for _, r := range v {
		if _, ok := tagSpecial[r]; ok {
			b.WriteByte('\\')
		}
		b.WriteRune(r)
	}
	return b.String()
}

func buildFilterClause(tenant, locale, modelVersion, safety string) string {
	var clauses []string
	if tenant != "" {
		clauses = append(clauses, "@tenant:{"+escapeTagValue(tenant)+"}")
	}
	if locale != "" {
		clauses = append(clauses, "@locale:{"+escapeTagValue(locale)+"}")
	}
	if modelVersion != "" {
		clauses = append(clauses, "@model_version:{"+escapeTagValue(modelVersion)+"}")
	}
	if safety != "" {
		clauses = append(clauses, "@safety:{"+escapeTagValue(safety)+"}")
	}
	if len(clauses) == 0 {
		return "(*)"
	}
	return "(" + strings.Join(clauses, " ") + ")"
}

// ----- Inspection / admin ---------------------------------------------

// IndexInfo is a subset of FT.INFO useful for the demo UI.
type IndexInfo struct {
	NumDocs           int     `json:"num_docs"`
	IndexingFailures  int     `json:"indexing_failures"`
	VectorIndexSizeMB float64 `json:"vector_index_size_mb"`
}

// FTInfo returns a small subset of FT.INFO. Failures (for example,
// an index that hasn't been created yet) return zeroed counters
// rather than surface as an error to the caller, since the demo UI
// just renders "0 entries" in that case.
func (c *RedisSemanticCache) FTInfo(ctx context.Context) IndexInfo {
	info, err := c.Client.FTInfo(ctx, c.IndexName).Result()
	if err != nil {
		return IndexInfo{}
	}
	return IndexInfo{
		NumDocs:           info.NumDocs,
		IndexingFailures:  info.HashIndexingFailures,
		VectorIndexSizeMB: info.VectorIndexSzMB,
	}
}

// Entry is the public shape of a cached entry as the demo UI sees it.
// The embedding bytes are intentionally not included; the UI doesn't
// render them and shipping them over JSON wastes bandwidth.
type Entry struct {
	ID           string  `json:"id"`
	Prompt       string  `json:"prompt"`
	Response     string  `json:"response"`
	Tenant       string  `json:"tenant"`
	Locale       string  `json:"locale"`
	ModelVersion string  `json:"model_version"`
	Safety       string  `json:"safety"`
	HitCount     int     `json:"hit_count"`
	TTLSeconds   int     `json:"ttl_seconds"`
	CreatedTS    float64 `json:"created_ts"`
}

// ListEntries returns every cached entry (no embedding) for the
// admin panel. The result is sorted by created_ts descending so the
// most recently written entry is at the top of the table.
func (c *RedisSemanticCache) ListEntries(ctx context.Context, limit int) ([]Entry, error) {
	if limit <= 0 {
		limit = 100
	}
	res, err := c.Client.FTSearchWithArgs(ctx,
		c.IndexName,
		"*",
		&redis.FTSearchOptions{
			DialectVersion: 2,
			Return: []redis.FTSearchReturn{
				{FieldName: "prompt"},
				{FieldName: "response"},
				{FieldName: "tenant"},
				{FieldName: "locale"},
				{FieldName: "model_version"},
				{FieldName: "safety"},
				{FieldName: "created_ts"},
				{FieldName: "hit_count"},
			},
			SortBy: []redis.FTSearchSortBy{
				{FieldName: "created_ts", Desc: true},
			},
			LimitOffset: 0,
			Limit:       limit,
		},
	).Result()
	if err != nil {
		return nil, fmt.Errorf("FT.SEARCH '*': %w", err)
	}

	out := make([]Entry, 0, len(res.Docs))
	for _, doc := range res.Docs {
		rawKey := doc.ID
		entryID := strings.TrimPrefix(rawKey, c.KeyPrefix)
		ttl, _ := c.Client.TTL(ctx, c.EntryKey(entryID)).Result()
		ttlSeconds := int(ttl / time.Second)
		if ttlSeconds < 0 {
			ttlSeconds = 0
		}
		hitCount, _ := strconv.Atoi(doc.Fields["hit_count"])
		createdTS, _ := strconv.ParseFloat(doc.Fields["created_ts"], 64)
		out = append(out, Entry{
			ID:           entryID,
			Prompt:       doc.Fields["prompt"],
			Response:     doc.Fields["response"],
			Tenant:       doc.Fields["tenant"],
			Locale:       doc.Fields["locale"],
			ModelVersion: doc.Fields["model_version"],
			Safety:       doc.Fields["safety"],
			HitCount:     hitCount,
			TTLSeconds:   ttlSeconds,
			CreatedTS:    createdTS,
		})
	}
	// Belt-and-braces sort in case Redis returns an unsorted top-N.
	sort.SliceStable(out, func(i, j int) bool {
		return out[i].CreatedTS > out[j].CreatedTS
	})
	return out, nil
}

// DeleteEntry drops a single entry. Returns true if the key existed.
func (c *RedisSemanticCache) DeleteEntry(ctx context.Context, entryID string) (bool, error) {
	n, err := c.Client.Del(ctx, c.EntryKey(entryID)).Result()
	if err != nil {
		return false, fmt.Errorf("DEL: %w", err)
	}
	return n > 0, nil
}

// Clear drops the index and every cached entry, then recreates the
// index. Returns the number of entries that were removed. Used by
// the demo's "reset" button — in production the equivalent is just
// FLUSHDB on a dedicated cache database, or letting TTLs expire
// naturally.
func (c *RedisSemanticCache) Clear(ctx context.Context) (int, error) {
	before := c.FTInfo(ctx).NumDocs
	if err := c.DropIndex(ctx, true); err != nil {
		return 0, err
	}
	if err := c.CreateIndex(ctx); err != nil {
		return 0, err
	}
	return before, nil
}

// newEntryID returns a random 12-hex-character id, matching the
// shape the Python and Node helpers produce.
func newEntryID() (string, error) {
	var b [6]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]), nil
}
