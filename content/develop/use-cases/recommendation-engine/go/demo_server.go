// Redis recommendation-engine demo server.
//
// Run with:
//
//	go run ./cmd/demo_server --port 8084
//
// Visit http://localhost:8084 to drive a small product catalog indexed
// by Redis Search. The UI lets you embed a natural-language query,
// optionally with TAG / NUMERIC / TEXT filters, watch FT.SEARCH retrieve
// top-K candidates with a KNN pre-filter in a single round trip, feed
// clicks back as a session signal, and refresh an item's embedding
// live to demonstrate that the HNSW index reflects the new vector on
// the next query with no downtime.
//
// The server holds a single ``LocalEmbedder`` and reuses it for every
// query-embed step; ``catalog.json`` carries the item vectors
// pre-computed by ``BuildCatalog`` so startup stays fast.

package recommendationengine

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

const demoUserID = "demo"

// recentClick is the lightweight summary kept in-memory for the
// "recent clicks" list in the session-signal panel.
type recentClick struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// demoState bundles per-process state that's not in Redis: the
// recommender + embedder + a small in-memory ring of recent clicks
// for display. Access is guarded with a mutex because the standard
// http.Server runs each handler in its own goroutine.
type demoState struct {
	recommender *RedisRecommender
	embedder    *LocalEmbedder
	catalogPath string
	userID      string

	mu      sync.Mutex
	recents []recentClick
	model   string // cached from catalog.json so /state doesn't re-read
}

// DemoServerConfig is the knobs accepted by RunDemoServer.
type DemoServerConfig struct {
	Host         string
	Port         int
	RedisAddr    string
	IndexName    string
	KeyPrefix    string
	CatalogPath  string
	TopK         int
	ResetOnStart bool
	// EmbeddingModel and ModelDir tune LocalEmbedder; if empty they
	// fall back to the package defaults.
	EmbeddingModel string
	ModelDir       string
}

// DefaultDemoServerConfig returns a config pre-populated with the
// values used by the demo binary.
func DefaultDemoServerConfig() DemoServerConfig {
	return DemoServerConfig{
		Host:         "127.0.0.1",
		Port:         8084,
		RedisAddr:    "localhost:6379",
		IndexName:    DefaultIndexName,
		KeyPrefix:    DefaultKeyPrefix,
		CatalogPath:  "catalog.json",
		TopK:         10,
		ResetOnStart: true,
	}
}

// RunDemoServer wires up Redis, the embedder, and the HTTP routes,
// seeds the index if requested, and blocks until SIGINT/SIGTERM.
func RunDemoServer(cfg DemoServerConfig) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if _, err := os.Stat(cfg.CatalogPath); err != nil {
		return fmt.Errorf("catalog file not found at %s (run: go run ./cmd/build_catalog)", cfg.CatalogPath)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Protocol: 2, // go-redis marks FT.SEARCH RESP3 unstable.
	})
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		return fmt.Errorf("redis ping: %w", err)
	}

	recommender := NewRecommender(rdb,
		WithIndexName(cfg.IndexName),
		WithKeyPrefix(cfg.KeyPrefix),
	)

	log.Println("Loading embedding model (first run downloads ~80 MB)...")
	embedder, err := NewLocalEmbedder(ctx, cfg.EmbeddingModel, cfg.ModelDir)
	if err != nil {
		return fmt.Errorf("embedder: %w", err)
	}
	defer embedder.Close()

	state := &demoState{
		recommender: recommender,
		embedder:    embedder,
		catalogPath: cfg.CatalogPath,
		userID:      demoUserID,
	}

	if cfg.ResetOnStart {
		log.Printf("Dropping any existing index '%s' and re-seeding from %s.\n",
			cfg.IndexName, cfg.CatalogPath)
		if err := recommender.DropIndex(ctx, true); err != nil {
			return fmt.Errorf("DropIndex: %w", err)
		}
		if err := recommender.CreateIndex(ctx); err != nil {
			return fmt.Errorf("CreateIndex: %w", err)
		}
		n, err := state.seedIndex(ctx)
		if err != nil {
			return fmt.Errorf("seed: %w", err)
		}
		_ = recommender.ResetUser(ctx, state.userID)
		log.Printf("Indexed %d products.", n)
	} else {
		if err := recommender.CreateIndex(ctx); err != nil {
			return fmt.Errorf("CreateIndex: %w", err)
		}
	}

	mux := http.NewServeMux()
	handler := &demoHandler{state: state, defaultTopK: cfg.TopK}
	handler.register(mux)

	server := &http.Server{
		Addr:              fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigCh
		log.Println("Shutting down...")
		shutCtx, c := context.WithTimeout(context.Background(), 5*time.Second)
		defer c()
		_ = server.Shutdown(shutCtx)
	}()

	log.Printf("Redis recommendation engine demo listening on http://%s:%d", cfg.Host, cfg.Port)
	log.Printf("Using Redis at %s with index '%s'", cfg.RedisAddr, cfg.IndexName)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

// ParseDemoServerFlagsAndRun wires the standard ``flag`` package up to
// DemoServerConfig and runs the server. Use it from the cmd shim so
// the user-facing entry point is one line.
func ParseDemoServerFlagsAndRun(args []string) error {
	cfg := DefaultDemoServerConfig()
	fs := flag.NewFlagSet("demo_server", flag.ExitOnError)
	fs.StringVar(&cfg.Host, "host", cfg.Host, "HTTP bind host")
	fs.IntVar(&cfg.Port, "port", cfg.Port, "HTTP bind port")
	fs.StringVar(&cfg.RedisAddr, "redis-addr", cfg.RedisAddr, "Redis address (host:port)")
	fs.StringVar(&cfg.IndexName, "index-name", cfg.IndexName, "Redis Search index name")
	fs.StringVar(&cfg.KeyPrefix, "key-prefix", cfg.KeyPrefix, "Product hash key prefix")
	fs.StringVar(&cfg.CatalogPath, "catalog", cfg.CatalogPath, "Path to catalog.json")
	fs.IntVar(&cfg.TopK, "topk", cfg.TopK, "Default KNN top-K shown in the UI")
	fs.BoolVar(&cfg.ResetOnStart, "reset", cfg.ResetOnStart, "Drop and re-seed the index on startup")
	fs.StringVar(&cfg.EmbeddingModel, "model", "", "Override the embedding model (Hugging Face hub ID)")
	fs.StringVar(&cfg.ModelDir, "model-dir", "", "Override the local model-cache directory")
	if err := fs.Parse(args); err != nil {
		return err
	}
	return RunDemoServer(cfg)
}

// -----------------------------------------------------------------------------
// HTTP handlers
// -----------------------------------------------------------------------------

type demoHandler struct {
	state       *demoState
	defaultTopK int
}

func (h *demoHandler) register(mux *http.ServeMux) {
	mux.HandleFunc("/", h.routeRoot)
	mux.HandleFunc("/state", h.handleState)
	mux.HandleFunc("/search", h.handleSearch)
	mux.HandleFunc("/click", h.handleClick)
	mux.HandleFunc("/reset-user", h.handleResetUser)
	mux.HandleFunc("/reset-index", h.handleResetIndex)
	mux.HandleFunc("/refresh-embedding", h.handleRefreshEmbedding)
}

func (h *demoHandler) routeRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	page := strings.NewReplacer(
		"__INDEX_NAME__", h.state.recommender.IndexName,
		"__USER_KEY__", h.state.recommender.UserKey(h.state.userID),
		"__TOPK__", strconv.Itoa(h.defaultTopK),
	).Replace(htmlTemplate)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(page))
}

func (h *demoHandler) handleState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	ctx := r.Context()
	info, _ := h.state.recommender.IndexInfo(ctx)
	products, _ := h.state.recommender.ListProducts(ctx, 200)
	cats, _ := h.state.recommender.ListCategories(ctx)
	brands, _ := h.state.recommender.ListBrands(ctx)
	user := h.state.userView(ctx)
	model, _ := h.state.modelName()

	type stateView struct {
		User       userViewJSON    `json:"user"`
		Index      map[string]any  `json:"index"`
		Products   []ProductSummary `json:"products"`
		Categories []string         `json:"categories"`
		Brands     []string         `json:"brands"`
	}
	writeJSON(w, http.StatusOK, stateView{
		User: user,
		Index: map[string]any{
			"index_name":            info.IndexName,
			"num_docs":              info.NumDocs,
			"indexing_failures":     info.IndexingFailures,
			"vector_index_size_mb":  info.VectorIndexSizeMB,
			"model":                 model,
		},
		Products:   products,
		Categories: cats,
		Brands:     brands,
	})
}

func (h *demoHandler) handleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	params, err := readForm(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	queryText := strings.TrimSpace(params.Get("query"))
	if queryText == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "query is required"})
		return
	}

	ctx := r.Context()
	t0 := time.Now()
	queryVec, err := h.state.embedder.EncodeOne(ctx, queryText)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	embedMs := float64(time.Since(t0).Microseconds()) / 1000

	useSession := params.Get("use_session") != ""
	doRerank := params.Get("rerank") != ""
	features, err := h.state.recommender.GetUserFeatures(ctx, h.state.userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	var sessionVec []float32
	if useSession {
		sessionVec = features.SessionVec
	}

	k := h.defaultTopK
	if v := strings.TrimSpace(params.Get("k")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			k = n
		}
	}
	if k > 40 {
		k = 40
	}
	if k < 1 {
		k = 1
	}

	filter := FilterOptions{
		Category:    strings.TrimSpace(params.Get("category")),
		Brand:       strings.TrimSpace(params.Get("brand")),
		MinPrice:    floatPointer(params.Get("min_price")),
		MaxPrice:    floatPointer(params.Get("max_price")),
		MinRating:   floatPointer(params.Get("min_rating")),
		InStockOnly: params.Get("in_stock_only") != "",
		TextMatch:   strings.TrimSpace(params.Get("text_match")),
	}
	filterClause := BuildFilterClause(filter)

	tSearch := time.Now()
	cands, err := h.state.recommender.CandidateRetrieve(ctx, queryVec, RetrieveOptions{
		FilterOptions: filter,
		K:             k,
		SessionVec:    sessionVec,
		SessionWeight: 0.3,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	searchMs := float64(time.Since(tSearch).Microseconds()) / 1000

	tRerank := time.Now()
	if doRerank {
		cands = h.state.recommender.Rerank(cands, features, 0)
	}
	rerankMs := float64(time.Since(tRerank).Microseconds()) / 1000

	type resultRow struct {
		Candidate
		// Override the json tags so the wire format matches the
		// Python and Node.js demos exactly (rounded to four decimals).
	}
	rows := make([]map[string]any, len(cands))
	for i, c := range cands {
		rows[i] = map[string]any{
			"id":              c.ID,
			"name":            c.Name,
			"description":     c.Description,
			"category":        c.Category,
			"brand":           c.Brand,
			"price":           c.Price,
			"rating":          c.Rating,
			"in_stock":        c.InStock,
			"vector_distance": round4(c.VectorDistance),
			"score":           round4(c.Score),
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"candidates":     rows,
		"filter_clause":  filterClause,
		"used_session":   sessionVec != nil,
		"used_rerank":    doRerank && len(features.Affinities) > 0,
		"embed_ms":       embedMs,
		"search_ms":      searchMs,
		"rerank_ms":      rerankMs,
		"timing_ms":      embedMs + searchMs + rerankMs,
	})
}

func (h *demoHandler) handleClick(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	params, err := readForm(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	productID := strings.TrimSpace(params.Get("product_id"))
	if productID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "product_id is required"})
		return
	}
	ctx := r.Context()
	res, err := h.state.recommender.RecordClick(ctx, h.state.userID, productID, nil)
	if err != nil {
		if errors.Is(err, ErrUnknownProduct) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	// Remember the name for the recent-clicks list.
	name := h.state.rememberClick(ctx, productID)
	writeJSON(w, http.StatusOK, map[string]any{
		"category":        res.Category,
		"affinity":        res.Affinity,
		"clicks":          res.Clicks,
		"last_clicked_id": res.LastClickedID,
		"name":            name,
		"user":            h.state.userView(ctx),
	})
}

func (h *demoHandler) handleResetUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	_ = h.state.recommender.ResetUser(r.Context(), h.state.userID)
	h.state.mu.Lock()
	h.state.recents = nil
	h.state.mu.Unlock()
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *demoHandler) handleResetIndex(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	ctx := r.Context()
	if err := h.state.recommender.DropIndex(ctx, true); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if err := h.state.recommender.CreateIndex(ctx); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	n, err := h.state.seedIndex(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	_ = h.state.recommender.ResetUser(ctx, h.state.userID)
	h.state.mu.Lock()
	h.state.recents = nil
	h.state.mu.Unlock()
	writeJSON(w, http.StatusOK, map[string]int{"seeded": n})
}

func (h *demoHandler) handleRefreshEmbedding(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	params, err := readForm(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	productID := strings.TrimSpace(params.Get("product_id"))
	text := strings.TrimSpace(params.Get("text"))
	if productID == "" || text == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "product_id and text are required",
		})
		return
	}
	ctx := r.Context()
	t0 := time.Now()
	vec, err := h.state.embedder.EncodeOne(ctx, text)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	embedMs := float64(time.Since(t0).Microseconds()) / 1000
	if err := h.state.recommender.RefreshEmbedding(ctx, productID, vec); err != nil {
		if errors.Is(err, ErrUnknownProduct) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"product_id": productID,
		"embed_ms":   embedMs,
	})
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type userViewJSON struct {
	Clicks              int                `json:"clicks"`
	LastClickedID       string             `json:"last_clicked_id"`
	LastClickedCategory string             `json:"last_clicked_category"`
	Affinities          map[string]float64 `json:"affinities"`
	HasSessionVec       bool               `json:"has_session_vec"`
	SessionVecDim       int                `json:"session_vec_dim"`
	RecentClicks        []recentClick      `json:"recent_clicks"`
}

func (s *demoState) userView(ctx context.Context) userViewJSON {
	uf, err := s.recommender.GetUserFeatures(ctx, s.userID)
	if err != nil {
		return userViewJSON{Affinities: map[string]float64{}}
	}
	s.mu.Lock()
	recents := make([]recentClick, len(s.recents))
	copy(recents, s.recents)
	s.mu.Unlock()
	view := userViewJSON{
		Clicks:              uf.Clicks,
		LastClickedID:       uf.LastClickedID,
		LastClickedCategory: uf.LastClickedCategory,
		Affinities:          uf.Affinities,
		HasSessionVec:       uf.SessionVec != nil,
		SessionVecDim:       len(uf.SessionVec),
		RecentClicks:        recents,
	}
	if view.Affinities == nil {
		view.Affinities = map[string]float64{}
	}
	return view
}

func (s *demoState) rememberClick(ctx context.Context, productID string) string {
	name, _ := s.recommender.Client.HGet(ctx, s.recommender.ProductKey(productID), "name").Result()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.recents = append([]recentClick{{ID: productID, Name: name}}, s.recents...)
	if len(s.recents) > 6 {
		s.recents = s.recents[:6]
	}
	return name
}

func (s *demoState) seedIndex(ctx context.Context) (int, error) {
	cat, err := LoadCatalog(s.catalogPath)
	if err != nil {
		return 0, err
	}
	s.mu.Lock()
	s.model = cat.Model
	s.mu.Unlock()
	return s.recommender.IndexProducts(ctx, cat.Products)
}

func (s *demoState) modelName() (string, error) {
	s.mu.Lock()
	cached := s.model
	s.mu.Unlock()
	if cached != "" {
		return cached, nil
	}
	cat, err := LoadCatalog(s.catalogPath)
	if err != nil {
		return s.embedder.ModelName, nil
	}
	s.mu.Lock()
	s.model = cat.Model
	s.mu.Unlock()
	return cat.Model, nil
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func readForm(r *http.Request) (url.Values, error) {
	if err := r.ParseForm(); err != nil {
		return nil, err
	}
	return r.PostForm, nil
}

func floatPointer(raw string) *float64 {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return nil
	}
	return &v
}

func round4(v float64) float64 {
	return float64(int64(v*1e4)) / 1e4
}
