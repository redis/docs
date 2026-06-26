//! Redis semantic-cache helper backed by Redis Search.
//!
//! Each cache entry lives as a Hash document at `cache:<id>`. The hash
//! stores the user's prompt and the corresponding LLM response
//! alongside the raw float32 bytes of the prompt's 384-dimensional
//! embedding and a small set of metadata fields — tenant, locale,
//! model version, and a safety flag.
//!
//! A single Redis Search index covers the embedding plus every
//! metadata field, so one `FT.SEARCH` call does an
//! approximate-nearest-neighbour lookup against the cached prompts
//! with a TAG pre-filter applied in the same pass — no cross-store
//! joins, no extra round trips, and tenant isolation is enforced
//! *inside* the query rather than after the fact in application code.
//!
//! The lookup is thresholded: `FT.SEARCH` always returns the closest
//! cached prompt, but the cache only serves it as a hit when the
//! cosine distance is at or below `distance_threshold`. Anything
//! further away is treated as a miss; the caller is expected to run
//! the underlying LLM and write the new prompt, response, and
//! embedding back with `put`.
//!
//! Each cache entry is written with `EXPIRE`, so stale answers age out
//! without manual cleanup; combine with an `allkeys-lfu` eviction
//! policy on the database to cap memory under pressure too.

use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use redis::{Client, Commands, Connection, FromRedisValue, RedisError, Value};

use crate::embeddings::floats_to_bytes;

pub const VECTOR_DIM_DEFAULT: usize = 384;

#[derive(Debug)]
pub enum CacheError {
    Redis(RedisError),
    ShapeMismatch { expected: usize, got: usize },
    Parse(String),
}

impl std::fmt::Display for CacheError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CacheError::Redis(e) => write!(f, "redis: {}", e),
            CacheError::ShapeMismatch { expected, got } => write!(
                f,
                "embedding has dimension {}; index expects {}",
                got, expected
            ),
            CacheError::Parse(msg) => write!(f, "parse: {}", msg),
        }
    }
}

impl std::error::Error for CacheError {}

impl From<RedisError> for CacheError {
    fn from(e: RedisError) -> Self {
        CacheError::Redis(e)
    }
}

// `tenant`, `locale`, and `model_version` aren't read by the demo
// HTTP layer (the UI only displays distance + response) but they are
// part of the public CacheHit surface for any caller that wants to
// audit which scope served a hit. `nearest_id` is similarly part of
// the diagnostic surface for "candidate too far" misses even though
// the UI ignores it.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct CacheHit {
    pub id: String,
    pub prompt: String,
    pub response: String,
    pub tenant: String,
    pub locale: String,
    pub model_version: String,
    pub distance: f64,
    pub ttl_seconds: i64,
    pub hit_count: i64,
}

#[derive(Debug, Clone, Default)]
#[allow(dead_code)]
pub struct CacheMiss {
    /// `None` means "no candidate in scope at all"; `Some` means
    /// "candidate too far". The demo UI uses that distinction to
    /// display either "no candidate" or "candidate too far".
    pub nearest_distance: Option<f64>,
    pub nearest_id: Option<String>,
}

#[derive(Debug)]
pub enum LookupResult {
    Hit(CacheHit),
    Miss(CacheMiss),
}

pub struct LookupParams<'a> {
    pub tenant: Option<&'a str>,
    pub locale: Option<&'a str>,
    pub model_version: Option<&'a str>,
    /// `Some("ok")` matches Python; pass `Some("-")` to skip the
    /// safety filter; pass `None` to use the default ("ok").
    pub safety: Option<&'a str>,
    pub distance_threshold: Option<f64>,
}

pub struct PutParams<'a> {
    pub prompt: &'a str,
    pub response: &'a str,
    pub embedding: &'a [f32],
    pub tenant: &'a str,
    pub locale: &'a str,
    pub model_version: &'a str,
    pub safety: &'a str,
    pub ttl_seconds: Option<i64>,
    pub entry_id: Option<&'a str>,
}

#[derive(Debug, Clone, Default)]
pub struct IndexInfo {
    pub num_docs: i64,
    pub indexing_failures: i64,
    pub vector_index_size_mb: f64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Entry {
    pub id: String,
    pub prompt: String,
    pub response: String,
    pub tenant: String,
    pub locale: String,
    pub model_version: String,
    pub safety: String,
    pub hit_count: i64,
    pub ttl_seconds: i64,
    pub created_ts: f64,
}

pub struct RedisSemanticCache {
    client: Client,
    /// The cache holds the only Redis connection. The demo is
    /// single-threaded for /query (one tiny_http worker thread handles
    /// each request) but we need synchronisation because the same
    /// cache instance is shared across worker threads.
    conn: Mutex<Connection>,
    pub index_name: String,
    pub key_prefix: String,
    pub vector_dim: usize,
    pub distance_threshold: f64,
    pub default_ttl_seconds: i64,
}

impl RedisSemanticCache {
    pub fn new(
        client: Client,
        index_name: impl Into<String>,
        key_prefix: impl Into<String>,
        vector_dim: usize,
        distance_threshold: f64,
        default_ttl_seconds: i64,
    ) -> Result<Self, CacheError> {
        let conn = client.get_connection()?;
        Ok(Self {
            client,
            conn: Mutex::new(conn),
            index_name: index_name.into(),
            key_prefix: key_prefix.into(),
            vector_dim,
            distance_threshold,
            default_ttl_seconds,
        })
    }

    pub fn entry_key(&self, entry_id: &str) -> String {
        format!("{}{}", self.key_prefix, entry_id)
    }

    /// Create the Redis Search index if it doesn't already exist. One
    /// index covers the embedding plus every metadata field, so a
    /// single FT.SEARCH can pre-filter by tenant / locale / model and
    /// then KNN-rank the matching documents in one pass.
    pub fn create_index(&self) -> Result<(), CacheError> {
        let mut con = self.conn.lock().unwrap();
        let result: Result<Value, RedisError> = redis::cmd("FT.CREATE")
            .arg(&self.index_name)
            .arg("ON")
            .arg("HASH")
            .arg("PREFIX")
            .arg(1)
            .arg(&self.key_prefix)
            .arg("SCHEMA")
            .arg("prompt").arg("TEXT")
            .arg("response").arg("TEXT")
            .arg("tenant").arg("TAG")
            .arg("locale").arg("TAG")
            .arg("model_version").arg("TAG")
            .arg("safety").arg("TAG")
            .arg("created_ts").arg("NUMERIC").arg("SORTABLE")
            .arg("hit_count").arg("NUMERIC").arg("SORTABLE")
            .arg("embedding")
            .arg("VECTOR").arg("HNSW").arg(6)
            .arg("TYPE").arg("FLOAT32")
            .arg("DIM").arg(self.vector_dim as i64)
            .arg("DISTANCE_METRIC").arg("COSINE")
            .query(&mut *con);

        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                // Redis returns this either as "Index already exists"
                // (older builds) or "Index: already exists" (newer
                // RESP3 ServerError formatting in redis-rs 0.27). The
                // distinguishing token is the bare word "exists" in
                // an index-related error.
                let msg = e.to_string().to_lowercase();
                if msg.contains("exists") && msg.contains("index") {
                    Ok(())
                } else {
                    Err(CacheError::Redis(e))
                }
            }
        }
    }

    pub fn drop_index(&self, delete_documents: bool) -> Result<(), CacheError> {
        let mut con = self.conn.lock().unwrap();
        let mut cmd = redis::cmd("FT.DROPINDEX");
        cmd.arg(&self.index_name);
        if delete_documents {
            cmd.arg("DD");
        }
        match cmd.query::<Value>(&mut *con) {
            Ok(_) => Ok(()),
            Err(e) => {
                let msg = e.to_string().to_lowercase();
                if msg.contains("no such index") || msg.contains("unknown index name") {
                    Ok(())
                } else {
                    Err(CacheError::Redis(e))
                }
            }
        }
    }

    /// Run the thresholded FT.SEARCH and decide hit vs. miss.
    ///
    /// FT.SEARCH returns the single nearest entry that satisfies the
    /// TAG pre-filters. The lookup is a hit only if the reported
    /// cosine distance is at or below the threshold (instance default
    /// or override). Anything further away is a miss with the
    /// candidate distance attached so the caller can log it.
    ///
    /// On a hit, the entry's `hit_count` is incremented atomically
    /// with HINCRBY so the demo UI can show which entries are
    /// load-bearing. The TTL is refreshed on every hit so frequently
    /// used answers don't age out under cold tail entries.
    pub fn lookup(
        &self,
        query_vec: &[f32],
        params: LookupParams<'_>,
    ) -> Result<LookupResult, CacheError> {
        // Match the shape check that `put` performs. A wrong-dim vector
        // would otherwise hit Redis as a malformed FT.SEARCH parameter
        // and surface as a server-side parse error instead of a clear
        // caller-side error.
        if query_vec.len() != self.vector_dim {
            return Err(CacheError::ShapeMismatch {
                expected: self.vector_dim,
                got: query_vec.len(),
            });
        }

        let threshold = params
            .distance_threshold
            .unwrap_or(self.distance_threshold);
        let safety = match params.safety {
            Some("-") => None,
            Some(s) if !s.is_empty() => Some(s),
            Some(_) | None => Some("ok"),
        };

        let filter_clause =
            build_filter_clause(params.tenant, params.locale, params.model_version, safety);
        let query_str = format!("{}=>[KNN 1 @embedding $vec AS distance]", filter_clause);
        let vec_bytes = floats_to_bytes(query_vec);

        let value: Value = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("FT.SEARCH")
                .arg(&self.index_name)
                .arg(&query_str)
                .arg("PARAMS").arg(2).arg("vec").arg(&vec_bytes[..])
                .arg("SORTBY").arg("distance").arg("ASC")
                .arg("RETURN").arg(7)
                .arg("prompt").arg("response").arg("tenant").arg("locale")
                .arg("model_version").arg("hit_count").arg("distance")
                .arg("LIMIT").arg(0).arg(1)
                .arg("DIALECT").arg(2)
                .query(&mut *con)?
        };

        let docs = parse_ft_search(&value)?;
        if docs.is_empty() {
            return Ok(LookupResult::Miss(CacheMiss::default()));
        }

        let doc = &docs[0];
        let raw_key = &doc.id;
        let entry_id = raw_key
            .strip_prefix(&self.key_prefix)
            .unwrap_or(raw_key)
            .to_string();
        let distance: f64 = doc
            .field("distance")
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(0.0);

        if distance > threshold {
            return Ok(LookupResult::Miss(CacheMiss {
                nearest_distance: Some(distance),
                nearest_id: Some(entry_id),
            }));
        }

        // The hash may have expired between FT.SEARCH returning the
        // row and us getting here — the search index lags expirations
        // by its periodic scan. If we just blindly HINCRBY-ed, Redis
        // would helpfully recreate the hash with only `hit_count` set
        // and the search index would then log it as an indexing
        // failure (no embedding, no metadata). EXISTS narrows that
        // race to the pipeline round-trip; a strictly race-free
        // version would wrap the bump in a Lua script that checks
        // existence and acts in one server-side step.
        let entry_key = self.entry_key(&entry_id);
        let exists: i64 = {
            let mut con = self.conn.lock().unwrap();
            con.exists(&entry_key)?
        };
        if exists == 0 {
            return Ok(LookupResult::Miss(CacheMiss {
                nearest_distance: Some(distance),
                nearest_id: Some(entry_id),
            }));
        }

        // MULTI/EXEC the three writes so they apply as a unit on the
        // server — a partial failure between HINCRBY and EXPIRE would
        // otherwise leave the entry without a refreshed TTL.
        let (new_hit_count, _expired, ttl): (i64, i64, i64) = {
            let mut con = self.conn.lock().unwrap();
            redis::pipe()
                .atomic()
                .cmd("HINCRBY").arg(&entry_key).arg("hit_count").arg(1)
                .cmd("EXPIRE").arg(&entry_key).arg(self.default_ttl_seconds)
                .cmd("TTL").arg(&entry_key)
                .query(&mut *con)?
        };
        let ttl_seconds = if ttl > 0 {
            ttl
        } else {
            self.default_ttl_seconds
        };

        Ok(LookupResult::Hit(CacheHit {
            id: entry_id,
            prompt: doc.field("prompt").unwrap_or_default().to_string(),
            response: doc.field("response").unwrap_or_default().to_string(),
            tenant: doc.field("tenant").unwrap_or_default().to_string(),
            locale: doc.field("locale").unwrap_or_default().to_string(),
            model_version: doc.field("model_version").unwrap_or_default().to_string(),
            distance,
            ttl_seconds,
            hit_count: new_hit_count,
        }))
    }

    /// Write a new cache entry and return its id.
    ///
    /// The embedding is stored as raw little-endian float32 bytes —
    /// the encoding Redis Search expects from a FLOAT32 vector field.
    /// EXPIRE on the key gives every entry a bounded lifetime.
    pub fn put(&self, p: PutParams<'_>) -> Result<String, CacheError> {
        if p.embedding.len() != self.vector_dim {
            return Err(CacheError::ShapeMismatch {
                expected: self.vector_dim,
                got: p.embedding.len(),
            });
        }
        let entry_id = match p.entry_id {
            Some(s) if !s.is_empty() => s.to_string(),
            _ => new_entry_id(),
        };
        let ttl = p.ttl_seconds.unwrap_or(self.default_ttl_seconds);
        let key = self.entry_key(&entry_id);

        let created_ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs_f64())
            .unwrap_or(0.0);

        let emb_bytes = floats_to_bytes(p.embedding);

        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. Without the transaction wrapper a connection drop
        // between the two writes could leave the entry without a TTL
        // and the cache would then keep an answer past its intended
        // lifetime (or forever, on a database with no eviction
        // policy).
        let mut con = self.conn.lock().unwrap();
        redis::pipe()
            .atomic()
            .cmd("HSET")
            .arg(&key)
            .arg("prompt").arg(p.prompt)
            .arg("response").arg(p.response)
            .arg("tenant").arg(p.tenant)
            .arg("locale").arg(p.locale)
            .arg("model_version").arg(p.model_version)
            .arg("safety").arg(p.safety)
            .arg("created_ts").arg(format_f64(created_ts))
            .arg("hit_count").arg("0")
            .arg("embedding").arg(&emb_bytes[..])
            .cmd("EXPIRE")
            .arg(&key)
            .arg(ttl)
            .query::<Value>(&mut *con)?;
        Ok(entry_id)
    }

    /// Returns a small subset of FT.INFO. Failures (for example, an
    /// index that hasn't been created yet) return zeroed counters
    /// rather than surface as an error to the caller, since the demo
    /// UI just renders "0 entries" in that case.
    pub fn index_info(&self) -> IndexInfo {
        let mut con = match self.conn.lock() {
            Ok(c) => c,
            Err(_) => return IndexInfo::default(),
        };
        let value: Value = match redis::cmd("FT.INFO")
            .arg(&self.index_name)
            .query(&mut *con)
        {
            Ok(v) => v,
            Err(_) => return IndexInfo::default(),
        };
        parse_ft_info(&value)
    }

    /// Returns every cached entry (no embedding) for the admin panel.
    /// The result is sorted by created_ts descending so the most
    /// recently written entry is at the top of the table.
    pub fn list_entries(&self, limit: usize) -> Result<Vec<Entry>, CacheError> {
        let value: Value = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("FT.SEARCH")
                .arg(&self.index_name)
                .arg("*")
                .arg("RETURN").arg(8)
                .arg("prompt").arg("response").arg("tenant").arg("locale")
                .arg("model_version").arg("safety").arg("created_ts").arg("hit_count")
                .arg("SORTBY").arg("created_ts").arg("DESC")
                .arg("LIMIT").arg(0).arg(limit as i64)
                .arg("DIALECT").arg(2)
                .query(&mut *con)?
        };
        let docs = parse_ft_search(&value)?;
        let mut out = Vec::with_capacity(docs.len());
        for doc in docs {
            let entry_id = doc
                .id
                .strip_prefix(&self.key_prefix)
                .unwrap_or(&doc.id)
                .to_string();
            let ttl: i64 = {
                let mut con = self.conn.lock().unwrap();
                redis::cmd("TTL").arg(self.entry_key(&entry_id)).query(&mut *con).unwrap_or(0)
            };
            let ttl_seconds = if ttl > 0 { ttl } else { 0 };
            let hit_count: i64 = doc
                .field("hit_count")
                .and_then(|s| s.parse::<i64>().ok())
                .unwrap_or(0);
            let created_ts: f64 = doc
                .field("created_ts")
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0);
            out.push(Entry {
                id: entry_id,
                prompt: doc.field("prompt").unwrap_or_default().to_string(),
                response: doc.field("response").unwrap_or_default().to_string(),
                tenant: doc.field("tenant").unwrap_or_default().to_string(),
                locale: doc.field("locale").unwrap_or_default().to_string(),
                model_version: doc.field("model_version").unwrap_or_default().to_string(),
                safety: doc.field("safety").unwrap_or_default().to_string(),
                hit_count,
                ttl_seconds,
                created_ts,
            });
        }
        // Belt-and-braces sort in case Redis returns an unsorted top-N.
        out.sort_by(|a, b| b.created_ts.partial_cmp(&a.created_ts).unwrap_or(std::cmp::Ordering::Equal));
        Ok(out)
    }

    pub fn delete_entry(&self, entry_id: &str) -> Result<bool, CacheError> {
        let mut con = self.conn.lock().unwrap();
        let n: i64 = con.del(self.entry_key(entry_id))?;
        Ok(n > 0)
    }

    /// Drop the index and every cached entry, then recreate the
    /// index. Returns the number of entries that were removed.
    pub fn clear(&self) -> Result<i64, CacheError> {
        let before = self.index_info().num_docs;
        self.drop_index(true)?;
        self.create_index()?;
        Ok(before)
    }

    /// Open a fresh Redis connection. Used by the smoketest harness
    /// only; the regular hot path uses the connection cached in
    /// `self.conn`.
    #[allow(dead_code)]
    pub fn fresh_connection(&self) -> Result<Connection, CacheError> {
        Ok(self.client.get_connection()?)
    }
}

// ---- FT.SEARCH / FT.INFO response parsing ----------------------------

#[derive(Debug)]
pub struct SearchDoc {
    pub id: String,
    pub fields: Vec<(String, String)>,
}

impl SearchDoc {
    fn field(&self, name: &str) -> Option<&str> {
        self.fields
            .iter()
            .find(|(k, _)| k == name)
            .map(|(_, v)| v.as_str())
    }
}

fn parse_ft_search(value: &Value) -> Result<Vec<SearchDoc>, CacheError> {
    // FT.SEARCH RESP shape (RESP2): [count, key1, [field, val, ...], key2, [field, val, ...], ...]
    let items = match value {
        Value::Array(items) => items,
        _ => {
            return Err(CacheError::Parse(
                "FT.SEARCH did not return an array".into(),
            ))
        }
    };
    if items.is_empty() {
        return Ok(vec![]);
    }
    // First element is the total count; ignore it.
    let mut out = Vec::new();
    let mut iter = items.iter().skip(1);
    while let Some(key_value) = iter.next() {
        let key = redis_value_to_string(key_value)
            .ok_or_else(|| CacheError::Parse("key is not a string".into()))?;
        // The next element is either an array of [field, value, field, value, ...]
        // or absent (if the user passed NOCONTENT).
        let fields_value = match iter.next() {
            Some(v) => v,
            None => {
                out.push(SearchDoc {
                    id: key,
                    fields: vec![],
                });
                continue;
            }
        };
        let field_items: Vec<&Value> = match fields_value {
            Value::Array(v) => v.iter().collect(),
            _ => {
                out.push(SearchDoc {
                    id: key,
                    fields: vec![],
                });
                continue;
            }
        };
        let mut fields = Vec::new();
        let mut f_iter = field_items.into_iter();
        while let Some(name_val) = f_iter.next() {
            let name = match redis_value_to_string(name_val) {
                Some(s) => s,
                None => continue,
            };
            let value = f_iter
                .next()
                .and_then(redis_value_to_string)
                .unwrap_or_default();
            fields.push((name, value));
        }
        out.push(SearchDoc { id: key, fields });
    }
    Ok(out)
}

fn parse_ft_info(value: &Value) -> IndexInfo {
    // FT.INFO returns a flat [k1, v1, k2, v2, ...] array.
    let items = match value {
        Value::Array(items) => items,
        _ => return IndexInfo::default(),
    };
    let mut info = IndexInfo::default();
    let mut iter = items.iter();
    while let Some(k) = iter.next() {
        let key = redis_value_to_string(k).unwrap_or_default();
        let v = match iter.next() {
            Some(v) => v,
            None => break,
        };
        match key.as_str() {
            "num_docs" => {
                info.num_docs = match v {
                    Value::Int(n) => *n,
                    _ => redis_value_to_string(v)
                        .and_then(|s| s.parse::<i64>().ok())
                        .unwrap_or(0),
                };
            }
            "hash_indexing_failures" => {
                info.indexing_failures = match v {
                    Value::Int(n) => *n,
                    _ => redis_value_to_string(v)
                        .and_then(|s| s.parse::<i64>().ok())
                        .unwrap_or(0),
                };
            }
            "vector_index_sz_mb" => {
                info.vector_index_size_mb = match v {
                    Value::Double(d) => *d,
                    _ => redis_value_to_string(v)
                        .and_then(|s| s.parse::<f64>().ok())
                        .unwrap_or(0.0),
                };
            }
            _ => {}
        }
    }
    info
}

fn redis_value_to_string(v: &Value) -> Option<String> {
    match v {
        Value::BulkString(bytes) => Some(String::from_utf8_lossy(bytes).into_owned()),
        Value::SimpleString(s) => Some(s.clone()),
        Value::VerbatimString { format: _, text } => Some(text.clone()),
        Value::Int(n) => Some(n.to_string()),
        Value::Double(d) => Some(d.to_string()),
        Value::Boolean(b) => Some(b.to_string()),
        Value::Okay => Some("OK".to_string()),
        Value::Nil => None,
        _ => {
            // Fall back to FromRedisValue's String impl for any
            // variants we didn't list explicitly (Map, Set, BigNumber,
            // etc — these shouldn't appear in FT.SEARCH replies but
            // future protocol additions could).
            String::from_redis_value(v).ok()
        }
    }
}

// ---- Filter clause helpers ------------------------------------------

/// The characters Redis Search treats as syntax inside a TAG value;
/// any of them in a user-supplied filter must be backslash-escaped or
/// the surrounding `{...}` block won't parse correctly.
const TAG_SPECIAL: &str = "\\,.<>{}[]\"':;!@#$%^&*()-+=~| ";

pub fn escape_tag_value(v: &str) -> String {
    let mut out = String::with_capacity(v.len());
    for ch in v.chars() {
        if TAG_SPECIAL.contains(ch) {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

pub fn build_filter_clause(
    tenant: Option<&str>,
    locale: Option<&str>,
    model_version: Option<&str>,
    safety: Option<&str>,
) -> String {
    let mut clauses = Vec::new();
    if let Some(t) = tenant.filter(|s| !s.is_empty()) {
        clauses.push(format!("@tenant:{{{}}}", escape_tag_value(t)));
    }
    if let Some(l) = locale.filter(|s| !s.is_empty()) {
        clauses.push(format!("@locale:{{{}}}", escape_tag_value(l)));
    }
    if let Some(m) = model_version.filter(|s| !s.is_empty()) {
        clauses.push(format!("@model_version:{{{}}}", escape_tag_value(m)));
    }
    if let Some(s) = safety.filter(|s| !s.is_empty()) {
        clauses.push(format!("@safety:{{{}}}", escape_tag_value(s)));
    }
    if clauses.is_empty() {
        "(*)".to_string()
    } else {
        format!("({})", clauses.join(" "))
    }
}

fn new_entry_id() -> String {
    let mut buf = [0u8; 6];
    getrandom::getrandom(&mut buf).expect("getrandom never fails on supported platforms");
    let mut s = String::with_capacity(12);
    for b in buf {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

fn format_f64(v: f64) -> String {
    // Match the Python/Node/Go demos: no scientific notation, no
    // trailing zeros. e.g. 1715990400.123
    let s = format!("{}", v);
    s
}
