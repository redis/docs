// Long-term memory store for an agent, backed by Redis JSON and
// Search.
//
// Each memory lives as one JSON document at `agent:mem:<id>`. The
// document holds the memory text, its embedding vector, and a small
// metadata block — user, namespace, kind, source thread, timestamps
// — that lets the recall query scope results without falling back to
// application-side filtering.
//
// A single Redis Search index covers the embedding plus every
// metadata field, so one `FT.SEARCH` call performs approximate-
// nearest-neighbour over the in-scope subset and returns the top-k
// memories ranked by cosine distance. The same KNN check runs at
// *write* time to deduplicate near-identical memories before they
// enter the store, which keeps the index from filling with
// paraphrases of the same fact as the agent reasons over similar
// topics across sessions.
//
// Memories carry one of two kinds:
//
//   - `episodic` — "what happened" snapshots from a specific thread,
//     written with a medium TTL so old session detail decays
//     naturally.
//   - `semantic` — distilled facts and preferences the agent should
//     carry forward indefinitely. Written with no TTL by default.
//
// The split is enforced as a TAG on the index, so the recall query
// can ask for one kind or both with a filter — no separate
// keyspaces.

package main

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// VectorDim is the embedding dimension produced by the
// `sentence-transformers/all-MiniLM-L6-v2` model the demo uses.
const VectorDim = 384

// DefaultDedupThreshold is how close (cosine distance) a candidate
// must be to an existing memory to count as a duplicate at write
// time. Smaller = stricter. 0.20 is calibrated to MiniLM, where a
// paraphrase of an existing memory lands in the 0.10 – 0.20 range
// and a distinct memory lands above 0.50.
const DefaultDedupThreshold = 0.20

// DefaultRecallThreshold is how close (cosine distance) a candidate
// must be to count as a relevant recall result. Larger than the
// dedup threshold so the agent gets a wider net at read time than at
// write time.
const DefaultRecallThreshold = 0.55

// defaultTTLByKind holds the per-kind TTLs in seconds. A nil pointer
// means "no TTL" — the memory persists until explicitly deleted or
// evicted under memory pressure.
var defaultTTLByKind = map[string]*int{
	"episodic": intPtr(7 * 24 * 3600),
	"semantic": nil,
}

func intPtr(v int) *int { return &v }

// MemoryRecord is the public shape of a memory document.
//
// `Distance` is set only when the record comes back from a KNN
// query; `TTLSeconds` is nil for memories with no TTL (e.g.
// `kind=semantic` under the default tier map).
type MemoryRecord struct {
	ID           string   `json:"id"`
	User         string   `json:"user"`
	Namespace    string   `json:"namespace"`
	Kind         string   `json:"kind"`
	SourceThread string   `json:"source_thread"`
	Text         string   `json:"text"`
	CreatedTS    float64  `json:"created_ts"`
	HitCount     int      `json:"hit_count"`
	Distance     *float64 `json:"distance,omitempty"`
	TTLSeconds   *int     `json:"ttl_seconds"`
}

// WriteResult is what `Remember` returns.
//
// `Deduped` is true when the write skipped because a similar memory
// already existed; `ID` is then the existing memory's id.
// `ExistingDistance` is the cosine distance to that nearest memory
// regardless of which branch was taken — useful for tracing.
type WriteResult struct {
	ID               string   `json:"id"`
	Deduped          bool     `json:"deduped"`
	ExistingDistance *float64 `json:"existing_distance"`
}

// IndexSnapshot is a small subset of FT.INFO useful for the demo UI.
type IndexSnapshot struct {
	NumDocs          int `json:"num_docs"`
	IndexingFailures int `json:"indexing_failures"`
}

// LongTermMemory owns the JSON documents, the vector index, the
// recall query, and the write-time deduplication.
type LongTermMemory struct {
	Client           *redis.Client
	IndexName        string
	KeyPrefix        string
	VectorDim        int
	DedupThreshold   float64
	RecallThreshold  float64
	TTLByKind        map[string]*int
}

// NewLongTermMemory returns a memory helper with the supplied client.
// Pass zero values for any field to use the defaults.
func NewLongTermMemory(
	client *redis.Client,
	indexName, keyPrefix string,
	vectorDim int,
	dedupThreshold, recallThreshold float64,
	ttlByKind map[string]*int,
) *LongTermMemory {
	if indexName == "" {
		indexName = "agentmem:idx"
	}
	if keyPrefix == "" {
		keyPrefix = "agent:mem:"
	}
	if vectorDim <= 0 {
		vectorDim = VectorDim
	}
	// The thresholds are honoured as-is. Zero is a legitimate value
	// ("exact matches only" for dedup, "nothing recalls" for recall)
	// and negative numbers are clamped by the HTTP boundary anyway.
	// Silently rewriting `0` to a default would make
	// `--dedup-threshold 0` and `--recall-threshold 0` uncallable.
	if dedupThreshold < 0 {
		dedupThreshold = DefaultDedupThreshold
	}
	if recallThreshold < 0 {
		recallThreshold = DefaultRecallThreshold
	}
	if ttlByKind == nil {
		ttlByKind = defaultTTLByKind
	}
	return &LongTermMemory{
		Client:          client,
		IndexName:       indexName,
		KeyPrefix:       keyPrefix,
		VectorDim:       vectorDim,
		DedupThreshold:  dedupThreshold,
		RecallThreshold: recallThreshold,
		TTLByKind:       ttlByKind,
	}
}

// MemoryKey returns the Redis key for a memory id.
func (m *LongTermMemory) MemoryKey(memoryID string) string {
	return m.KeyPrefix + memoryID
}

// CreateIndex creates the Redis Search index if it doesn't already
// exist. The index is declared on the JSON document type with alias
// names on each path; the same `FT.SEARCH` filter clause works here
// as on a HASH-backed index, and the field paths (`$.user`,
// `$.embedding`, ...) only show up in `FT.CREATE`.
func (m *LongTermMemory) CreateIndex(ctx context.Context) error {
	_, err := m.Client.FTCreate(ctx,
		m.IndexName,
		&redis.FTCreateOptions{
			OnJSON: true,
			Prefix: []any{m.KeyPrefix},
		},
		&redis.FieldSchema{FieldName: "$.text", As: "text", FieldType: redis.SearchFieldTypeText},
		&redis.FieldSchema{FieldName: "$.user", As: "user", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "$.namespace", As: "namespace", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "$.kind", As: "kind", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "$.source_thread", As: "source_thread", FieldType: redis.SearchFieldTypeTag},
		&redis.FieldSchema{FieldName: "$.created_ts", As: "created_ts", FieldType: redis.SearchFieldTypeNumeric, Sortable: true},
		&redis.FieldSchema{FieldName: "$.hit_count", As: "hit_count", FieldType: redis.SearchFieldTypeNumeric, Sortable: true},
		&redis.FieldSchema{
			FieldName: "$.embedding",
			As:        "embedding",
			FieldType: redis.SearchFieldTypeVector,
			VectorArgs: &redis.FTVectorArgs{
				HNSWOptions: &redis.FTHNSWOptions{
					Type:           "FLOAT32",
					Dim:            m.VectorDim,
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
// true the JSON memory documents are deleted alongside the index.
func (m *LongTermMemory) DropIndex(ctx context.Context, deleteDocuments bool) error {
	_, err := m.Client.FTDropIndexWithArgs(ctx,
		m.IndexName,
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

// RememberParams collects the fields of a new memory.
type RememberParams struct {
	Text         string
	Embedding    []float32
	User         string // default "default"
	Namespace    string // default "default"
	Kind         string // "episodic" or "semantic"
	SourceThread string
	// TTLSeconds: nil => resolve from kind; non-nil pointer to 0 => no TTL.
	TTLSeconds *int
}

// Remember writes a new memory, deduplicating against existing
// entries.
//
// Runs one in-scope KNN(1) against the index first. If the nearest
// existing memory is within `DedupThreshold`, the new memory is
// skipped (its content is already represented) and the existing
// memory's `hit_count` is bumped via `JSON.NUMINCRBY`. Otherwise a
// fresh JSON document is written under a new id with a TTL derived
// from the memory's `kind`.
//
// The KNN-then-write sequence is not atomic; two workers that
// remember the same fact at the same time can both miss each other's
// in-flight write and insert duplicate memories. See the
// walkthrough's "Concurrency caveats" section for the production fix.
func (m *LongTermMemory) Remember(ctx context.Context, p RememberParams) (WriteResult, error) {
	if len(p.Embedding) != m.VectorDim {
		return WriteResult{}, fmt.Errorf(
			"embedding length is %d; index expects %d",
			len(p.Embedding), m.VectorDim,
		)
	}
	user := p.User
	if user == "" {
		user = "default"
	}
	ns := p.Namespace
	if ns == "" {
		ns = "default"
	}
	kind := p.Kind
	if kind == "" {
		kind = "episodic"
	}

	nearest, err := m.nearest(ctx, p.Embedding, user, ns, kind, 1)
	if err != nil {
		return WriteResult{}, err
	}
	var existingDistance *float64
	if len(nearest) > 0 && nearest[0].Distance != nil {
		existingDistance = nearest[0].Distance
		if *existingDistance <= m.DedupThreshold {
			m.bumpHitCount(ctx, nearest[0].ID)
			return WriteResult{
				ID:               nearest[0].ID,
				Deduped:          true,
				ExistingDistance: existingDistance,
			}, nil
		}
	}

	id, err := newMemoryID()
	if err != nil {
		return WriteResult{}, fmt.Errorf("generating memory id: %w", err)
	}
	key := m.MemoryKey(id)
	now := unixSecs()
	doc := map[string]any{
		"id":            id,
		"user":          user,
		"namespace":     ns,
		"kind":          kind,
		"source_thread": p.SourceThread,
		"text":          p.Text,
		"embedding":     p.Embedding,
		"created_ts":    now,
		"hit_count":     0,
	}

	ttl := p.TTLSeconds
	if ttl == nil {
		ttl = m.TTLByKind[kind]
	}

	// MULTI/EXEC so JSON.SET and EXPIRE either both apply or neither
	// does. A connection drop (or context cancellation) between the
	// two writes would otherwise leave the memory without an expiry
	// — the index entry would still be there, but the document would
	// outlive its intended `kind`-derived TTL.
	if _, err := m.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.JSONSet(ctx, key, "$", doc)
		if ttl != nil && *ttl > 0 {
			pipe.Expire(ctx, key, time.Duration(*ttl)*time.Second)
		}
		return nil
	}); err != nil {
		return WriteResult{}, fmt.Errorf("remember MULTI/EXEC: %w", err)
	}
	return WriteResult{ID: id, Deduped: false, ExistingDistance: existingDistance}, nil
}

// RecallParams collects the optional filters for a recall query.
type RecallParams struct {
	QueryEmbedding    []float32
	User              string
	Namespace         string
	Kind              string // empty => any kind
	K                 int    // 0 => 5
	DistanceThreshold *float64
}

// Recall returns the top-k in-scope memories ranked by similarity.
// Memories beyond `DistanceThreshold` (or the instance default) are
// dropped — the index always returns *something* for KNN, so a
// recall result on an unrelated query would otherwise be a
// confidently-wrong false positive.
func (m *LongTermMemory) Recall(ctx context.Context, p RecallParams) ([]MemoryRecord, error) {
	k := p.K
	if k <= 0 {
		k = 5
	}
	threshold := m.RecallThreshold
	if p.DistanceThreshold != nil {
		threshold = *p.DistanceThreshold
	}
	candidates, err := m.nearest(ctx, p.QueryEmbedding, p.User, p.Namespace, p.Kind, k)
	if err != nil {
		return nil, err
	}
	out := make([]MemoryRecord, 0, len(candidates))
	for _, c := range candidates {
		if c.Distance != nil && *c.Distance <= threshold {
			out = append(out, c)
		}
	}
	return out, nil
}

func (m *LongTermMemory) nearest(
	ctx context.Context,
	embedding []float32,
	user, namespace, kind string,
	k int,
) ([]MemoryRecord, error) {
	if len(embedding) != m.VectorDim {
		return nil, fmt.Errorf(
			"embedding length is %d; index expects %d",
			len(embedding), m.VectorDim,
		)
	}
	filterClause := buildMemoryFilter(user, namespace, kind)
	queryStr := fmt.Sprintf("%s=>[KNN %d @embedding $vec AS distance]", filterClause, k)

	res, err := m.Client.FTSearchWithArgs(ctx,
		m.IndexName,
		queryStr,
		&redis.FTSearchOptions{
			DialectVersion: 2,
			Params:         map[string]any{"vec": FloatsToBytes(embedding)},
			SortBy: []redis.FTSearchSortBy{
				{FieldName: "distance", Asc: true},
			},
			Return: []redis.FTSearchReturn{
				{FieldName: "user"},
				{FieldName: "namespace"},
				{FieldName: "kind"},
				{FieldName: "source_thread"},
				{FieldName: "text"},
				{FieldName: "created_ts"},
				{FieldName: "hit_count"},
				{FieldName: "distance"},
			},
			LimitOffset: 0,
			Limit:       k,
		},
	).Result()
	if err != nil {
		return nil, fmt.Errorf("FT.SEARCH: %w", err)
	}
	out := make([]MemoryRecord, 0, len(res.Docs))
	for _, doc := range res.Docs {
		// `doc.ID` is the full Redis key (e.g. `agent:mem:abc123`).
		// Strip the prefix so the returned record exposes only the
		// opaque id the UI and `DeleteMemory` work with.
		memoryID := strings.TrimPrefix(doc.ID, m.KeyPrefix)
		ttl, _ := m.Client.TTL(ctx, m.MemoryKey(memoryID)).Result()
		var ttlSeconds *int
		if ttl > 0 {
			s := int(ttl / time.Second)
			ttlSeconds = &s
		}
		distanceVal, _ := strconv.ParseFloat(doc.Fields["distance"], 64)
		distance := distanceVal
		hitCount, _ := strconv.Atoi(doc.Fields["hit_count"])
		createdTS, _ := strconv.ParseFloat(doc.Fields["created_ts"], 64)
		out = append(out, MemoryRecord{
			ID:           memoryID,
			User:         doc.Fields["user"],
			Namespace:    doc.Fields["namespace"],
			Kind:         doc.Fields["kind"],
			SourceThread: doc.Fields["source_thread"],
			Text:         doc.Fields["text"],
			CreatedTS:    createdTS,
			HitCount:     hitCount,
			Distance:     &distance,
			TTLSeconds:   ttlSeconds,
		})
	}
	return out, nil
}

func (m *LongTermMemory) bumpHitCount(ctx context.Context, memoryID string) {
	// Fire-and-forget — the doc may have expired between recall and
	// bump (search index lags TTL by its periodic scan). Discarding
	// the error keeps the demo from blowing up on that race; we just
	// lose the hit count update.
	_, _ = m.Client.JSONNumIncrBy(ctx, m.MemoryKey(memoryID), "$.hit_count", 1).Result()
}

// IndexInfo returns a small subset of FT.INFO. Failures (e.g. an
// index that hasn't been created yet) return zeroed counters rather
// than surface as an error, since the demo UI just renders "0
// entries" in that case.
func (m *LongTermMemory) IndexInfo(ctx context.Context) IndexSnapshot {
	info, err := m.Client.FTInfo(ctx, m.IndexName).Result()
	if err != nil {
		return IndexSnapshot{}
	}
	return IndexSnapshot{
		NumDocs:          info.NumDocs,
		IndexingFailures: info.HashIndexingFailures,
	}
}

// ListMemories returns memories matching the filters, newest first.
func (m *LongTermMemory) ListMemories(
	ctx context.Context,
	user, namespace, kind string,
	limit int,
) ([]MemoryRecord, error) {
	if limit <= 0 {
		limit = 100
	}
	filterClause := buildMemoryFilter(user, namespace, kind)
	res, err := m.Client.FTSearchWithArgs(ctx,
		m.IndexName,
		filterClause,
		&redis.FTSearchOptions{
			DialectVersion: 2,
			Return: []redis.FTSearchReturn{
				{FieldName: "user"},
				{FieldName: "namespace"},
				{FieldName: "kind"},
				{FieldName: "source_thread"},
				{FieldName: "text"},
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
		return nil, fmt.Errorf("FT.SEARCH: %w", err)
	}
	out := make([]MemoryRecord, 0, len(res.Docs))
	for _, doc := range res.Docs {
		memoryID := strings.TrimPrefix(doc.ID, m.KeyPrefix)
		ttl, _ := m.Client.TTL(ctx, m.MemoryKey(memoryID)).Result()
		var ttlSeconds *int
		if ttl > 0 {
			s := int(ttl / time.Second)
			ttlSeconds = &s
		}
		hitCount, _ := strconv.Atoi(doc.Fields["hit_count"])
		createdTS, _ := strconv.ParseFloat(doc.Fields["created_ts"], 64)
		out = append(out, MemoryRecord{
			ID:           memoryID,
			User:         doc.Fields["user"],
			Namespace:    doc.Fields["namespace"],
			Kind:         doc.Fields["kind"],
			SourceThread: doc.Fields["source_thread"],
			Text:         doc.Fields["text"],
			CreatedTS:    createdTS,
			HitCount:     hitCount,
			Distance:     nil,
			TTLSeconds:   ttlSeconds,
		})
	}
	// Belt-and-braces sort in case Redis returns an unsorted top-N.
	sort.SliceStable(out, func(i, j int) bool {
		return out[i].CreatedTS > out[j].CreatedTS
	})
	return out, nil
}

// DeleteMemory drops a single memory. Returns true if the key
// existed.
func (m *LongTermMemory) DeleteMemory(ctx context.Context, memoryID string) (bool, error) {
	n, err := m.Client.Del(ctx, m.MemoryKey(memoryID)).Result()
	if err != nil {
		return false, fmt.Errorf("DEL: %w", err)
	}
	return n > 0, nil
}

// Clear drops the index and every memory document, then recreates
// the index. Returns the count of documents that were removed.
func (m *LongTermMemory) Clear(ctx context.Context) (int, error) {
	before := m.IndexInfo(ctx).NumDocs
	if err := m.DropIndex(ctx, true); err != nil {
		return 0, err
	}
	if err := m.CreateIndex(ctx); err != nil {
		return 0, err
	}
	return before, nil
}

// ----- Filter clause helpers -----------------------------------------

func buildMemoryFilter(user, namespace, kind string) string {
	var clauses []string
	if user != "" {
		clauses = append(clauses, "@user:{"+escapeTagValue(user)+"}")
	}
	if namespace != "" {
		clauses = append(clauses, "@namespace:{"+escapeTagValue(namespace)+"}")
	}
	if kind != "" {
		clauses = append(clauses, "@kind:{"+escapeTagValue(kind)+"}")
	}
	if len(clauses) == 0 {
		return "(*)"
	}
	return "(" + strings.Join(clauses, " ") + ")"
}

// tagSpecialMem is the set of characters Redis Search treats as
// syntax inside a TAG value; any of them in a user-supplied filter
// must be backslash-escaped or the surrounding `{...}` block won't
// parse correctly.
var tagSpecialMem = map[rune]struct{}{
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
		if _, ok := tagSpecialMem[r]; ok {
			b.WriteByte('\\')
		}
		b.WriteRune(r)
	}
	return b.String()
}

func newMemoryID() (string, error) {
	return newThreadID()
}
