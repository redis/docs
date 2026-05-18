//! Redis recommendation-engine helper backed by Redis Search.
//!
//! Items live as Hash documents at `product:<id>`. Each hash stores the
//! item's structured metadata (name, description, category, brand,
//! price, in-stock flag, rating) alongside the raw float32 bytes of its
//! 384-dimensional embedding. A single Redis Search index covers every
//! field, so one `FT.SEARCH` call does the KNN over the embedding and
//! the TAG / NUMERIC / TEXT pre-filter in the same pass — no
//! cross-store joins, no extra round trips.
//!
//! Per-user state lives in `user:<id>:features`: a session vector
//! written as an exponentially weighted average of recently-clicked
//! item embeddings, plus per-category affinity counters incremented
//! atomically with `HINCRBYFLOAT`. The next time the application reads
//! that hash to build a query, it sees the click — no batch cycle, no
//! cache invalidation.
//!
//! The recommendation flow has two paths:
//!
//! * Query path (per recommendation request): `FT.SEARCH` with `KNN`
//!   over the embedding, optionally pre-filtered by structured
//!   attributes and optionally biased toward a session vector blended
//!   into the query, followed by a log-scaled category-affinity
//!   re-rank.
//! * Click path (per user interaction): the click writes a new
//!   EWMA-blended session vector and increments the category affinity
//!   in the user features hash. The next query path picks both up.

#![allow(dead_code)]

use std::collections::HashMap;

use base64::Engine as _;
use redis::aio::ConnectionManager;
use redis::{AsyncCommands, RedisError, RedisResult, Value};
use serde::Serialize;

use crate::catalog_seed::Product;
use crate::embeddings::{bytes_to_floats, floats_to_bytes, l2_normalise};

pub const DEFAULT_INDEX_NAME: &str = "recommend:idx";
pub const DEFAULT_KEY_PREFIX: &str = "product:";
pub const DEFAULT_USER_KEY_PREFIX: &str = "user:";
pub const DEFAULT_VECTOR_DIM: usize = 384;

/// One result row from the candidate-retrieval stage. `vector_distance`
/// is the cosine distance returned by `FT.SEARCH` (0 means identical,
/// 2 means opposite). `score` starts equal to it and may be reduced by
/// `rerank` when the user has category affinities. Lower is better in
/// both fields.
#[derive(Debug, Clone, Serialize)]
pub struct Candidate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub brand: String,
    pub price: f64,
    pub rating: f64,
    pub in_stock: bool,
    pub vector_distance: f64,
    pub score: f64,
}

/// Readable form of a user's features hash.
#[derive(Debug, Clone, Default)]
pub struct UserFeatures {
    pub session_vec: Option<Vec<f32>>,
    pub affinities: HashMap<String, f64>,
    pub clicks: i64,
    pub last_clicked_id: Option<String>,
    pub last_clicked_category: Option<String>,
}

/// Structured-filter knob set for `candidate_retrieve`.
#[derive(Debug, Clone, Default)]
pub struct FilterOptions {
    pub category: Option<String>,
    pub brand: Option<String>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub in_stock_only: bool,
    pub min_rating: Option<f64>,
    pub text_match: Option<String>,
    /// Defaults to `"description"` when empty.
    pub text_field: Option<String>,
}

/// Filter + KNN + session-blend settings for one retrieval call.
#[derive(Debug, Clone, Default)]
pub struct RetrieveOptions {
    pub filter: FilterOptions,
    /// Defaults to 10 when zero.
    pub k: usize,
    pub session_vec: Option<Vec<f32>>,
    /// Defaults to 0.3 when `session_vec` is set and weight is zero.
    pub session_weight: f64,
}

/// Returned from `record_click` so the UI can show the new state in
/// one round trip.
#[derive(Debug, Clone, Serialize)]
pub struct RecordClickResult {
    pub category: String,
    pub affinity: f64,
    pub clicks: i64,
    pub last_clicked_id: String,
}

/// Subset of `FT.INFO` useful for the demo UI.
#[derive(Debug, Clone, Default, Serialize)]
pub struct IndexStats {
    pub index_name: String,
    pub num_docs: i64,
    pub indexing_failures: i64,
    pub vector_index_size_mb: f64,
}

/// Lightweight catalog row the UI displays.
#[derive(Debug, Clone, Serialize)]
pub struct ProductSummary {
    pub id: String,
    pub name: String,
    pub category: String,
    pub brand: String,
    pub price: f64,
    pub rating: f64,
    pub in_stock: bool,
}

/// Wraps a Redis Search index and the retrieval flow. Cheap to clone:
/// the underlying `ConnectionManager` is reference-counted under the
/// hood.
#[derive(Clone)]
pub struct RedisRecommender {
    conn: ConnectionManager,
    pub index_name: String,
    pub key_prefix: String,
    pub user_key_prefix: String,
    pub vector_dim: usize,
}

impl RedisRecommender {
    pub fn new(conn: ConnectionManager) -> Self {
        Self {
            conn,
            index_name: DEFAULT_INDEX_NAME.to_string(),
            key_prefix: DEFAULT_KEY_PREFIX.to_string(),
            user_key_prefix: DEFAULT_USER_KEY_PREFIX.to_string(),
            vector_dim: DEFAULT_VECTOR_DIM,
        }
    }

    pub fn with_index_name(mut self, name: impl Into<String>) -> Self {
        self.index_name = name.into();
        self
    }

    pub fn with_key_prefix(mut self, prefix: impl Into<String>) -> Self {
        self.key_prefix = prefix.into();
        self
    }

    pub fn with_vector_dim(mut self, dim: usize) -> Self {
        self.vector_dim = dim;
        self
    }

    pub fn product_key(&self, id: &str) -> String {
        format!("{}{}", self.key_prefix, id)
    }

    pub fn user_key(&self, id: &str) -> String {
        format!("{}{}:features", self.user_key_prefix, id)
    }

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    /// Create the Redis Search index if it doesn't already exist. One
    /// index covers every queryable field. The vector field is HNSW
    /// with cosine distance so KNN is approximate but fast, and TAG /
    /// NUMERIC / TEXT fields share the same index so a single
    /// `FT.SEARCH` can pre-filter and KNN-rank in one pass.
    pub async fn create_index(&self) -> RedisResult<()> {
        let mut conn = self.conn.clone();
        let res: RedisResult<Value> = redis::cmd("FT.CREATE")
            .arg(&self.index_name)
            .arg("ON")
            .arg("HASH")
            .arg("PREFIX")
            .arg(1)
            .arg(&self.key_prefix)
            .arg("SCHEMA")
            .arg("name").arg("TEXT").arg("WEIGHT").arg("1.0")
            .arg("description").arg("TEXT").arg("WEIGHT").arg("0.5")
            .arg("category").arg("TAG")
            .arg("brand").arg("TAG")
            .arg("in_stock").arg("TAG")
            .arg("price").arg("NUMERIC").arg("SORTABLE")
            .arg("rating").arg("NUMERIC").arg("SORTABLE")
            .arg("embedding")
            .arg("VECTOR")
            .arg("HNSW")
            .arg(6)
            .arg("TYPE").arg("FLOAT32")
            .arg("DIM").arg(self.vector_dim)
            .arg("DISTANCE_METRIC").arg("COSINE")
            .query_async(&mut conn)
            .await;
        match res {
            Ok(_) => Ok(()),
            Err(err) if is_index_already_exists(&err) => Ok(()),
            Err(err) => Err(err),
        }
    }

    /// Drop the search index. If `delete_documents` is true the indexed
    /// hashes are removed too. Missing-index errors are tolerated so
    /// the call is idempotent.
    pub async fn drop_index(&self, delete_documents: bool) -> RedisResult<()> {
        let mut conn = self.conn.clone();
        let mut cmd = redis::cmd("FT.DROPINDEX");
        cmd.arg(&self.index_name);
        if delete_documents {
            cmd.arg("DD");
        }
        let res: RedisResult<Value> = cmd.query_async(&mut conn).await;
        match res {
            Ok(_) => Ok(()),
            Err(err) if is_unknown_index(&err) => Ok(()),
            Err(err) => Err(err),
        }
    }

    // ------------------------------------------------------------------
    // Catalog ingest
    // ------------------------------------------------------------------

    /// Pipeline a batch of `HSET` writes for the catalog. Each product
    /// must include `embedding_b64` (base64 of float32 little-endian
    /// bytes) — that's what the catalog builder writes into
    /// `catalog.json`.
    pub async fn index_products(&self, products: &[Product]) -> RedisResult<usize> {
        if products.is_empty() {
            return Ok(0);
        }
        let mut pipe = redis::pipe();
        for p in products {
            let key = self.product_key(&p.id);
            let vec_bytes = decode_embedding(p).map_err(|e| {
                RedisError::from((redis::ErrorKind::TypeError, "encode product", e))
            })?;
            // Build the field list explicitly so we can mix string and
            // byte values in the same HSET. Strings go through as
            // strings, the embedding goes through as raw bytes.
            pipe.cmd("HSET")
                .arg(&key)
                .arg("name").arg(&p.name)
                .arg("description").arg(&p.description)
                .arg("category").arg(&p.category)
                .arg("brand").arg(&p.brand)
                .arg("price").arg(format!("{}", p.price))
                .arg("rating").arg(format!("{}", p.rating))
                .arg("in_stock").arg(if p.in_stock { "true" } else { "false" })
                .arg("embedding").arg(vec_bytes.as_slice());
        }
        let mut conn = self.conn.clone();
        let _: Vec<i64> = pipe.query_async(&mut conn).await?;
        Ok(products.len())
    }

    // ------------------------------------------------------------------
    // Candidate retrieval (KNN + optional pre-filter)
    // ------------------------------------------------------------------

    /// Retrieve top-K candidates with `FT.SEARCH` KNN + filters.
    /// Pre-filter knobs are TAG (category, brand, in_stock_only),
    /// NUMERIC (min_price / max_price, min_rating), and TEXT
    /// (text_match against text_field, default `description`). They
    /// combine with an implicit AND in front of the `KNN` clause, so
    /// Redis evaluates them first and then KNN-ranks only the matching
    /// documents.
    ///
    /// If `session_vec` is provided, the query vector is blended with
    /// it before retrieval — that's the real-time signal path.
    /// Returns `Candidate` rows ordered by ascending cosine distance
    /// (closest first); `score` is initialised to the distance and may
    /// be reduced by `rerank` when the user has affinities.
    pub async fn candidate_retrieve(
        &self,
        query_vec: &[f32],
        opts: RetrieveOptions,
    ) -> RedisResult<Vec<Candidate>> {
        let k = if opts.k == 0 { 10 } else { opts.k };
        let effective = blend_vectors(
            query_vec,
            opts.session_vec.as_deref(),
            if opts.session_weight == 0.0 && opts.session_vec.is_some() {
                0.3
            } else {
                opts.session_weight
            },
        );
        let filter_clause = build_filter_clause(&opts.filter);
        let query = format!(
            "{}=>[KNN {} @embedding $vec AS vector_score]",
            filter_clause, k
        );

        let mut conn = self.conn.clone();
        let raw: Value = redis::cmd("FT.SEARCH")
            .arg(&self.index_name)
            .arg(&query)
            .arg("RETURN").arg(8)
            .arg("name").arg("description").arg("category").arg("brand")
            .arg("price").arg("rating").arg("in_stock").arg("vector_score")
            .arg("SORTBY").arg("vector_score")
            .arg("LIMIT").arg(0).arg(k)
            .arg("PARAMS").arg(2).arg("vec").arg(floats_to_bytes(&effective).as_slice())
            .arg("DIALECT").arg(2)
            .query_async(&mut conn)
            .await?;
        parse_search_reply(raw, &self.key_prefix)
    }

    // ------------------------------------------------------------------
    // Re-ranking with user affinities
    // ------------------------------------------------------------------

    /// Apply a per-category affinity bonus and re-sort.
    ///
    /// `affinities` is a `{category: weight}` map accumulated from
    /// previous clicks. The bonus is shaped by
    /// `log(1 + affinity) * affinity_weight` so repeated clicks see
    /// diminishing returns and a single dominant category can't push
    /// the bonus arbitrarily large. The bonus is subtracted from the
    /// cosine distance, so a category the user has shown interest in
    /// pulls its members up the list (closer to zero) without
    /// overwhelming the vector signal.
    pub fn rerank(
        &self,
        candidates: &mut Vec<Candidate>,
        features: &UserFeatures,
        affinity_weight: f64,
    ) {
        let weight = if affinity_weight <= 0.0 {
            0.15
        } else {
            affinity_weight
        };
        if features.affinities.is_empty() {
            candidates.sort_by(|a, b| {
                a.score.partial_cmp(&b.score).unwrap_or(std::cmp::Ordering::Equal)
            });
            return;
        }
        for c in candidates.iter_mut() {
            let raw_aff = *features.affinities.get(&c.category).unwrap_or(&0.0);
            let raw_aff = if raw_aff < 0.0 { 0.0 } else { raw_aff };
            let bonus = (1.0_f64 + raw_aff).ln() * weight;
            c.score = c.vector_distance - bonus;
        }
        candidates.sort_by(|a, b| {
            a.score.partial_cmp(&b.score).unwrap_or(std::cmp::Ordering::Equal)
        });
    }

    // ------------------------------------------------------------------
    // Session signals (clicks)
    // ------------------------------------------------------------------

    /// Update a user's session vector and category affinity.
    ///
    /// Reads the clicked item's embedding from its hash, blends it into
    /// the user's session vector with an exponentially weighted moving
    /// average, and bumps the category counter and click total.
    ///
    /// `ewma_alpha` is the weight given to the new click; the previous
    /// session keeps `1 - alpha`. Default 0.4 biases history over the
    /// latest click so a single accidental click doesn't swing the
    /// session.
    ///
    /// The category-affinity bump and click-count bump use
    /// `HINCRBYFLOAT` / `HINCRBY` so they're atomic against any
    /// concurrent caller. The session vector blend is inherently
    /// read-modify-write — the new vector depends on the previous one
    /// — and is *not* atomic against a concurrent click for the same
    /// user. For the per-user data this helper writes, that window is
    /// rare in practice; if it matters in a given deployment, wrap the
    /// read and the writeback in `WATCH/MULTI/EXEC` (or move the whole
    /// blend into a Lua script).
    pub async fn record_click(
        &self,
        user_id: &str,
        product_id: &str,
    ) -> RedisResult<RecordClickResult> {
        self.record_click_with(user_id, product_id, 0.4, 1.0).await
    }

    pub async fn record_click_with(
        &self,
        user_id: &str,
        product_id: &str,
        ewma_alpha: f64,
        affinity_step: f64,
    ) -> RedisResult<RecordClickResult> {
        let product_key = self.product_key(product_id);
        let mut conn = self.conn.clone();

        // Pull the fields we need from the product hash in one round trip.
        // `HMGET` returns `[Option<bytes>, Option<bytes>]` here because the
        // embedding is binary.
        let fields: Vec<Option<Vec<u8>>> = conn
            .hget(&product_key, &["embedding", "category"])
            .await?;
        let clicked_bytes = match fields.get(0).and_then(|v| v.as_ref()) {
            Some(b) => b.clone(),
            None => {
                return Err(RedisError::from((
                    redis::ErrorKind::TypeError,
                    "unknown product",
                    format!("no hash at {}", product_key),
                )))
            }
        };
        let clicked_vec = bytes_to_floats(&clicked_bytes).map_err(|e| {
            RedisError::from((redis::ErrorKind::TypeError, "decode embedding", e))
        })?;
        let category = fields
            .get(1)
            .and_then(|v| v.as_ref())
            .map(|b| String::from_utf8_lossy(b).into_owned())
            .unwrap_or_else(|| "unknown".to_string());

        let user_key = self.user_key(user_id);
        let previous: Option<Vec<u8>> = conn.hget(&user_key, "session_vec").await?;

        let new_session = match previous {
            Some(prev_bytes) if !prev_bytes.is_empty() => {
                let prev_vec = bytes_to_floats(&prev_bytes).map_err(|e| {
                    RedisError::from((redis::ErrorKind::TypeError, "decode session_vec", e))
                })?;
                ewma_blend(&prev_vec, &clicked_vec, ewma_alpha)
            }
            _ => clicked_vec.clone(),
        };

        // Affinity and click counters are independent atomic increments;
        // only the session vector needs the read-modify-write because it
        // depends on the previous value. Pipeline the three writes so
        // they go out in a single round trip.
        let new_session_bytes = floats_to_bytes(&new_session);
        let mut pipe = redis::pipe();
        pipe.cmd("HSET")
            .arg(&user_key)
            .arg("session_vec").arg(new_session_bytes.as_slice())
            .arg("last_clicked_id").arg(product_id)
            .arg("last_clicked_category").arg(&category)
            .ignore();
        pipe.cmd("HINCRBYFLOAT")
            .arg(&user_key)
            .arg(format!("aff:{}", category))
            .arg(affinity_step);
        pipe.cmd("HINCRBY").arg(&user_key).arg("clicks").arg(1);
        let (new_aff, new_clicks): (String, i64) = pipe.query_async(&mut conn).await?;
        let affinity: f64 = new_aff.parse().unwrap_or(0.0);

        Ok(RecordClickResult {
            category,
            affinity,
            clicks: new_clicks,
            last_clicked_id: product_id.to_string(),
        })
    }

    /// Read a user's session vector and affinities for re-ranking and
    /// UI display.
    pub async fn get_user_features(&self, user_id: &str) -> RedisResult<UserFeatures> {
        let mut conn = self.conn.clone();
        let key = self.user_key(user_id);
        // Use HGETALL and decode by hand: the session vector field is
        // binary while the other fields are UTF-8. redis-rs gives us
        // bytes for every value when we ask for `Vec<(Vec<u8>,
        // Vec<u8>)>`, which lets us route each one based on its name.
        let raw: Vec<(Vec<u8>, Vec<u8>)> = conn.hgetall(&key).await?;
        let mut out = UserFeatures::default();
        if raw.is_empty() {
            return Ok(out);
        }
        for (k, v) in raw {
            let field = String::from_utf8_lossy(&k).into_owned();
            match field.as_str() {
                "session_vec" => {
                    let vec = bytes_to_floats(&v).map_err(|e| {
                        RedisError::from((
                            redis::ErrorKind::TypeError,
                            "decode session_vec",
                            e,
                        ))
                    })?;
                    out.session_vec = Some(vec);
                }
                "clicks" => {
                    let s = String::from_utf8_lossy(&v);
                    out.clicks = s.parse().unwrap_or(0);
                }
                "last_clicked_id" => {
                    out.last_clicked_id = Some(String::from_utf8_lossy(&v).into_owned());
                }
                "last_clicked_category" => {
                    out.last_clicked_category =
                        Some(String::from_utf8_lossy(&v).into_owned());
                }
                f if f.starts_with("aff:") => {
                    let s = String::from_utf8_lossy(&v);
                    if let Ok(n) = s.parse::<f64>() {
                        out.affinities
                            .insert(f.trim_start_matches("aff:").to_string(), n);
                    }
                }
                _ => {}
            }
        }
        Ok(out)
    }

    /// Delete a user's feature hash so the next request starts cold.
    pub async fn reset_user(&self, user_id: &str) -> RedisResult<()> {
        let mut conn = self.conn.clone();
        let _: i64 = conn.del(self.user_key(user_id)).await?;
        Ok(())
    }

    // ------------------------------------------------------------------
    // Hot embedding refresh (no serving downtime)
    // ------------------------------------------------------------------

    /// Overwrite the embedding for one product.
    ///
    /// The HNSW index reflects the change as soon as the `HSET`
    /// commits, so subsequent `FT.SEARCH` calls see the new vector
    /// without any index rebuild or serving downtime. Returns
    /// `ErrorKind::TypeError` (with detail "unknown product") if the
    /// product hash does not exist (HSET would otherwise happily
    /// create a partial document that the index then picks up). Also
    /// rejects vectors with the wrong dimensionality so a model swap
    /// doesn't quietly corrupt the index.
    pub async fn refresh_embedding(
        &self,
        product_id: &str,
        new_vector: &[f32],
    ) -> RedisResult<()> {
        if new_vector.len() != self.vector_dim {
            return Err(RedisError::from((
                redis::ErrorKind::TypeError,
                "bad vector dim",
                format!(
                    "new_vector has length {}; index expects {}",
                    new_vector.len(),
                    self.vector_dim
                ),
            )));
        }
        let key = self.product_key(product_id);
        let mut conn = self.conn.clone();
        let exists: i64 = conn.exists(&key).await?;
        if exists == 0 {
            return Err(RedisError::from((
                redis::ErrorKind::TypeError,
                "unknown product",
                format!("no hash at {}", key),
            )));
        }
        let bytes = floats_to_bytes(new_vector);
        let _: i64 = conn.hset(&key, "embedding", bytes.as_slice()).await?;
        Ok(())
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /// Read the index stats that the demo UI displays. Missing-index
    /// errors are translated to a zero-valued stats struct so callers
    /// can render an empty state.
    pub async fn index_info(&self) -> IndexStats {
        let mut conn = self.conn.clone();
        let raw: RedisResult<Value> = redis::cmd("FT.INFO")
            .arg(&self.index_name)
            .query_async(&mut conn)
            .await;
        let mut stats = IndexStats {
            index_name: self.index_name.clone(),
            ..Default::default()
        };
        let Ok(value) = raw else {
            return stats;
        };
        let pairs = match flat_array_to_map(&value) {
            Some(m) => m,
            None => return stats,
        };
        if let Some(n) = pairs.get("num_docs").and_then(value_as_i64) {
            stats.num_docs = n;
        }
        if let Some(n) = pairs.get("hash_indexing_failures").and_then(value_as_i64) {
            stats.indexing_failures = n;
        }
        if let Some(n) = pairs.get("vector_index_sz_mb").and_then(value_as_f64) {
            stats.vector_index_size_mb = n;
        }
        stats
    }

    /// Return every indexed product (metadata only, no vector), sorted
    /// by price.
    pub async fn list_products(&self, limit: usize) -> RedisResult<Vec<ProductSummary>> {
        let limit = if limit == 0 { 100 } else { limit };
        let mut conn = self.conn.clone();
        let raw: Value = redis::cmd("FT.SEARCH")
            .arg(&self.index_name)
            .arg("*")
            .arg("RETURN").arg(6)
            .arg("name").arg("category").arg("brand")
            .arg("price").arg("rating").arg("in_stock")
            .arg("SORTBY").arg("price")
            .arg("LIMIT").arg(0).arg(limit)
            .arg("DIALECT").arg(2)
            .query_async(&mut conn)
            .await?;
        let cands = parse_search_reply(raw, &self.key_prefix)?;
        Ok(cands
            .into_iter()
            .map(|c| ProductSummary {
                id: c.id,
                name: c.name,
                category: c.category,
                brand: c.brand,
                price: c.price,
                rating: c.rating,
                in_stock: c.in_stock,
            })
            .collect())
    }

    /// Fetch one product's `name` field. Returns `None` if the hash
    /// doesn't exist. Used by the demo's recent-clicks list.
    pub async fn get_product_name(&self, product_id: &str) -> Option<String> {
        let mut conn = self.conn.clone();
        let key = self.product_key(product_id);
        let raw: RedisResult<Option<String>> = conn.hget(&key, "name").await;
        raw.ok().flatten()
    }

    pub async fn list_categories(&self) -> RedisResult<Vec<String>> {
        self.list_tag_vals("category").await
    }

    pub async fn list_brands(&self) -> RedisResult<Vec<String>> {
        self.list_tag_vals("brand").await
    }

    async fn list_tag_vals(&self, field: &str) -> RedisResult<Vec<String>> {
        let mut conn = self.conn.clone();
        let raw: RedisResult<Vec<String>> = redis::cmd("FT.TAGVALS")
            .arg(&self.index_name)
            .arg(field)
            .query_async(&mut conn)
            .await;
        let mut out = raw.unwrap_or_default();
        out.sort();
        Ok(out)
    }
}

// ----------------------------------------------------------------------
// Filter-clause construction
// ----------------------------------------------------------------------

/// Characters Redis Search treats as syntax inside a TAG value; any of
/// them appearing in a user-supplied filter must be backslash-escaped
/// or the surrounding `{...}` block won't parse correctly. The list
/// comes from the Redis Search query-syntax documentation. The
/// backslash itself is included so a value containing a literal `\`
/// can't eat the next character's escape.
const TAG_SPECIAL: &[char] = &[
    '\\', ',', '.', '<', '>', '{', '}', '[', ']', '"', '\'', ':', ';',
    '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=',
    '~', '|', ' ',
];

/// Backslash-escape characters that have meaning inside `@tag:{...}`.
pub fn escape_tag_value(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        if TAG_SPECIAL.contains(&ch) {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

/// Render the pre-filter clause that goes in front of the KNN clause.
/// Empty filters return `(*)`, which is a no-op pre-filter in dialect 2.
pub fn build_filter_clause(f: &FilterOptions) -> String {
    let mut clauses: Vec<String> = Vec::new();
    if let Some(category) = f.category.as_deref().filter(|s| !s.is_empty()) {
        clauses.push(format!("@category:{{{}}}", escape_tag_value(category)));
    }
    if let Some(brand) = f.brand.as_deref().filter(|s| !s.is_empty()) {
        clauses.push(format!("@brand:{{{}}}", escape_tag_value(brand)));
    }
    if f.min_price.is_some() || f.max_price.is_some() {
        let lo = f
            .min_price
            .map(|v| format!("{}", v))
            .unwrap_or_else(|| "-inf".to_string());
        let hi = f
            .max_price
            .map(|v| format!("{}", v))
            .unwrap_or_else(|| "+inf".to_string());
        clauses.push(format!("@price:[{} {}]", lo, hi));
    }
    if let Some(min_rating) = f.min_rating {
        clauses.push(format!("@rating:[{} +inf]", min_rating));
    }
    if f.in_stock_only {
        clauses.push("@in_stock:{true}".to_string());
    }
    if let Some(text) = f.text_match.as_deref().filter(|s| !s.is_empty()) {
        let field = f
            .text_field
            .as_deref()
            .filter(|s| !s.is_empty())
            .unwrap_or("description");
        // Wrapping in quotes makes the value a single phrase and avoids
        // tripping the query parser on operators (`-`, `|`, `"`, etc.)
        // that a user might legitimately type in a search box.
        let safe = text.replace('\\', "\\\\").replace('"', "\\\"");
        clauses.push(format!("@{}:\"{}\"", field, safe));
    }
    if clauses.is_empty() {
        "(*)".to_string()
    } else {
        format!("({})", clauses.join(" "))
    }
}

// ----------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------

fn decode_embedding(p: &Product) -> Result<Vec<u8>, String> {
    if p.embedding_b64.is_empty() {
        return Err(format!(
            "product {}: no embedding (embedding_b64 missing)",
            p.id
        ));
    }
    base64::engine::general_purpose::STANDARD
        .decode(&p.embedding_b64)
        .map_err(|e| format!("product {}: base64 decode failed: {}", p.id, e))
}

fn blend_vectors(query: &[f32], session: Option<&[f32]>, weight: f64) -> Vec<f32> {
    match session {
        Some(s) if weight > 0.0 && s.len() == query.len() => {
            let w = weight.min(1.0);
            let mut mixed: Vec<f32> = query
                .iter()
                .zip(s.iter())
                .map(|(q, sv)| {
                    ((1.0 - w) * (*q as f64) + w * (*sv as f64)) as f32
                })
                .collect();
            l2_normalise(&mut mixed);
            mixed
        }
        _ => query.to_vec(),
    }
}

fn ewma_blend(prev: &[f32], next: &[f32], alpha: f64) -> Vec<f32> {
    let mut mixed: Vec<f32> = prev
        .iter()
        .zip(next.iter())
        .map(|(p, n)| (alpha * (*n as f64) + (1.0 - alpha) * (*p as f64)) as f32)
        .collect();
    l2_normalise(&mut mixed);
    mixed
}

fn is_index_already_exists(err: &RedisError) -> bool {
    let s = err.to_string();
    s.contains("Index already exists")
}

fn is_unknown_index(err: &RedisError) -> bool {
    let s = err.to_string().to_lowercase();
    s.contains("no such index") || s.contains("unknown index name")
}

/// Decode an `FT.SEARCH` reply.
///
/// The wire shape under DIALECT 2 is:
///   `[ total, key1, [field1, value1, field2, value2, ...], key2, [...], ... ]`
///
/// Each value pair is a flat alternating array; the embedding field is
/// omitted from `RETURN` so we don't have to worry about binary fields
/// here, but `vector_score` is a numeric string.
fn parse_search_reply(raw: Value, key_prefix: &str) -> RedisResult<Vec<Candidate>> {
    let items = match raw {
        Value::Array(items) => items,
        _ => {
            return Err(RedisError::from((
                redis::ErrorKind::TypeError,
                "FT.SEARCH: expected array reply",
            )));
        }
    };
    let mut iter = items.into_iter();
    let _total: i64 = match iter.next() {
        Some(v) => redis::FromRedisValue::from_redis_value(&v).unwrap_or(0),
        None => 0,
    };
    let mut out: Vec<Candidate> = Vec::new();
    while let Some(key_v) = iter.next() {
        let key: String =
            redis::FromRedisValue::from_redis_value(&key_v).unwrap_or_default();
        let Some(fields_v) = iter.next() else { break };
        let fields = match fields_v {
            Value::Array(items) => items,
            _ => continue,
        };
        let mut map: HashMap<String, String> = HashMap::new();
        let mut field_iter = fields.into_iter();
        while let (Some(k), Some(v)) = (field_iter.next(), field_iter.next()) {
            let kk: String =
                redis::FromRedisValue::from_redis_value(&k).unwrap_or_default();
            let vv: String =
                redis::FromRedisValue::from_redis_value(&v).unwrap_or_default();
            map.insert(kk, vv);
        }
        let bare_id = key.strip_prefix(key_prefix).unwrap_or(&key).to_string();
        let vector_distance: f64 = map
            .get("vector_score")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0);
        let price: f64 = map
            .get("price")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0);
        let rating: f64 = map
            .get("rating")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0);
        out.push(Candidate {
            id: bare_id,
            name: map.get("name").cloned().unwrap_or_default(),
            description: map.get("description").cloned().unwrap_or_default(),
            category: map.get("category").cloned().unwrap_or_default(),
            brand: map.get("brand").cloned().unwrap_or_default(),
            price,
            rating,
            in_stock: map.get("in_stock").map(|s| s == "true").unwrap_or(false),
            vector_distance,
            score: vector_distance,
        });
    }
    Ok(out)
}

/// `FT.INFO` returns a flat alternating array of `[name, value, name,
/// value, ...]`. Convert that to a name -> raw-value map so we can
/// pull out only the fields we care about (and tolerate version
/// differences in the surrounding shape).
fn flat_array_to_map(v: &Value) -> Option<HashMap<String, Value>> {
    let items = match v {
        Value::Array(items) => items,
        _ => return None,
    };
    let mut out: HashMap<String, Value> = HashMap::new();
    let mut iter = items.iter();
    while let (Some(k), Some(value)) = (iter.next(), iter.next()) {
        let kk: String = match redis::FromRedisValue::from_redis_value(k) {
            Ok(s) => s,
            Err(_) => continue,
        };
        out.insert(kk, value.clone());
    }
    Some(out)
}

fn value_as_i64(v: &Value) -> Option<i64> {
    redis::FromRedisValue::from_redis_value(v).ok()
}

fn value_as_f64(v: &Value) -> Option<f64> {
    // FT.INFO returns size-in-mb as a string in many versions; tolerate
    // both forms.
    let as_f: RedisResult<f64> = redis::FromRedisValue::from_redis_value(v);
    if let Ok(n) = as_f {
        return Some(n);
    }
    let as_s: RedisResult<String> = redis::FromRedisValue::from_redis_value(v);
    if let Ok(s) = as_s {
        if let Ok(n) = s.parse::<f64>() {
            return Some(n);
        }
    }
    None
}
