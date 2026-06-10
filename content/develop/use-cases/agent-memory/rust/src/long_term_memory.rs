//! Long-term memory store for an agent, backed by Redis JSON and
//! Search.
//!
//! Each memory lives as one JSON document at `agent:mem:<id>`. The
//! document holds the memory text, its embedding vector, and a small
//! metadata block — user, namespace, kind, source thread, timestamps
//! — that lets the recall query scope results without falling back
//! to application-side filtering.
//!
//! A single Redis Search index covers the embedding plus every
//! metadata field, so one `FT.SEARCH` call performs approximate-
//! nearest-neighbour over the in-scope subset and returns the top-k
//! memories ranked by cosine distance. The same KNN check runs at
//! *write* time to deduplicate near-identical memories before they
//! enter the store, which keeps the index from filling with
//! paraphrases of the same fact as the agent reasons over similar
//! topics across sessions.
//!
//! Memories carry one of two kinds:
//!
//!   * `episodic` — "what happened" snapshots from a specific thread,
//!     written with a medium TTL so old session detail decays
//!     naturally.
//!   * `semantic` — distilled facts and preferences the agent should
//!     carry forward indefinitely. Written with no TTL by default.
//!
//! The split is enforced as a TAG on the index, so the recall query
//! can ask for one kind or both with a filter — no separate
//! keyspaces.

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use redis::{Client, Connection, FromRedisValue, RedisError, Value};
use serde::Serialize;
use serde_json::json;

use crate::embeddings::floats_to_bytes;

pub const VECTOR_DIM_DEFAULT: usize = 384;

/// How close (cosine distance) a candidate must be to an existing
/// memory to count as a duplicate at write time. Smaller = stricter.
/// 0.20 is calibrated to the `sentence-transformers/all-MiniLM-L6-v2`
/// embedding model used in the demo, where a paraphrase of an
/// existing memory lands in the 0.10 – 0.20 range and a distinct
/// memory lands above 0.50.
pub const DEFAULT_DEDUP_THRESHOLD: f64 = 0.20;

/// How close (cosine distance) a candidate must be to count as a
/// relevant recall result. Larger than the dedup threshold so the
/// agent gets a wider net at read time than at write time.
pub const DEFAULT_RECALL_THRESHOLD: f64 = 0.55;

/// TTL tiers, in seconds. `None` means "no TTL" — the memory
/// persists until explicitly deleted or evicted under memory
/// pressure.
pub fn default_ttl_for_kind(kind: &str) -> Option<i64> {
    match kind {
        "episodic" => Some(7 * 24 * 3600),
        "semantic" => None,
        _ => None,
    }
}

#[derive(Debug)]
pub enum MemoryError {
    Redis(RedisError),
    ShapeMismatch { expected: usize, got: usize },
    Parse(String),
}

impl std::fmt::Display for MemoryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MemoryError::Redis(e) => write!(f, "redis: {}", e),
            MemoryError::ShapeMismatch { expected, got } => write!(
                f,
                "embedding has dimension {}; index expects {}",
                got, expected
            ),
            MemoryError::Parse(msg) => write!(f, "parse: {}", msg),
        }
    }
}

impl std::error::Error for MemoryError {}

impl From<RedisError> for MemoryError {
    fn from(e: RedisError) -> Self {
        MemoryError::Redis(e)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct MemoryRecord {
    pub id: String,
    pub user: String,
    pub namespace: String,
    pub kind: String,
    pub source_thread: String,
    pub text: String,
    pub created_ts: f64,
    pub hit_count: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub distance: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ttl_seconds: Option<i64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WriteResult {
    pub id: String,
    pub deduped: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub existing_distance: Option<f64>,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct IndexSnapshot {
    pub num_docs: i64,
    pub indexing_failures: i64,
}

pub struct LongTermMemory {
    conn: Mutex<Connection>,
    pub index_name: String,
    pub key_prefix: String,
    pub vector_dim: usize,
    pub dedup_threshold: f64,
    pub recall_threshold: f64,
}

impl LongTermMemory {
    pub fn new(
        client: &Client,
        index_name: impl Into<String>,
        key_prefix: impl Into<String>,
        vector_dim: usize,
        dedup_threshold: f64,
        recall_threshold: f64,
    ) -> Result<Self, MemoryError> {
        let conn = client.get_connection()?;
        Ok(Self {
            conn: Mutex::new(conn),
            index_name: index_name.into(),
            key_prefix: key_prefix.into(),
            vector_dim,
            dedup_threshold,
            recall_threshold,
        })
    }

    pub fn memory_key(&self, memory_id: &str) -> String {
        format!("{}{}", self.key_prefix, memory_id)
    }

    /// Create the Redis Search index if it doesn't already exist.
    ///
    /// The index is declared on the JSON document type with alias
    /// names on each path; the same `FT.SEARCH` filter clause works
    /// here as on a HASH-backed index, and the field paths
    /// (`$.user`, `$.embedding`, ...) only show up in `FT.CREATE`.
    pub fn create_index(&self) -> Result<(), MemoryError> {
        let result: Result<Value, RedisError> = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("FT.CREATE")
                .arg(&self.index_name)
                .arg("ON").arg("JSON")
                .arg("PREFIX").arg(1).arg(&self.key_prefix)
                .arg("SCHEMA")
                .arg("$.text").arg("AS").arg("text").arg("TEXT")
                .arg("$.user").arg("AS").arg("user").arg("TAG")
                .arg("$.namespace").arg("AS").arg("namespace").arg("TAG")
                .arg("$.kind").arg("AS").arg("kind").arg("TAG")
                .arg("$.source_thread").arg("AS").arg("source_thread").arg("TAG")
                .arg("$.created_ts").arg("AS").arg("created_ts")
                .arg("NUMERIC").arg("SORTABLE")
                .arg("$.hit_count").arg("AS").arg("hit_count")
                .arg("NUMERIC").arg("SORTABLE")
                .arg("$.embedding").arg("AS").arg("embedding")
                .arg("VECTOR").arg("HNSW").arg(6)
                .arg("TYPE").arg("FLOAT32")
                .arg("DIM").arg(self.vector_dim as i64)
                .arg("DISTANCE_METRIC").arg("COSINE")
                .query(&mut *con)
        };
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                let msg = e.to_string().to_lowercase();
                if msg.contains("exists") && msg.contains("index") {
                    Ok(())
                } else {
                    Err(MemoryError::Redis(e))
                }
            }
        }
    }

    pub fn drop_index(&self, delete_documents: bool) -> Result<(), MemoryError> {
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
                    Err(MemoryError::Redis(e))
                }
            }
        }
    }

    /// Write a new memory, deduplicating against existing entries.
    ///
    /// Runs one in-scope `KNN(1)` against the index first. If the
    /// nearest existing memory is within `dedup_threshold`, the new
    /// memory is skipped (its content is already represented) and
    /// the existing memory's `hit_count` is bumped. Otherwise a
    /// fresh JSON document is written under a new id with a TTL
    /// derived from the memory's `kind`.
    ///
    /// The KNN-then-write sequence is not atomic; two workers that
    /// remember the same fact at the same time can both miss each
    /// other's in-flight write and insert duplicate memories. See
    /// the walkthrough's "Concurrency caveats" section for the
    /// production fix.
    pub fn remember(
        &self,
        text: &str,
        embedding: &[f32],
        user: &str,
        namespace: &str,
        kind: &str,
        source_thread: &str,
        ttl_seconds: Option<i64>,
    ) -> Result<WriteResult, MemoryError> {
        if embedding.len() != self.vector_dim {
            return Err(MemoryError::ShapeMismatch {
                expected: self.vector_dim,
                got: embedding.len(),
            });
        }

        let nearest = self.nearest(embedding, Some(user), Some(namespace), Some(kind), 1)?;
        let existing_distance = nearest.first().and_then(|r| r.distance);
        if let Some(first) = nearest.first() {
            if let Some(d) = first.distance {
                if d <= self.dedup_threshold {
                    self.bump_hit_count(&first.id)?;
                    return Ok(WriteResult {
                        id: first.id.clone(),
                        deduped: true,
                        existing_distance,
                    });
                }
            }
        }

        let id = new_id_12();
        let key = self.memory_key(&id);
        let now = unix_secs();
        let doc = json!({
            "id": id,
            "user": user,
            "namespace": namespace,
            "kind": kind,
            "source_thread": source_thread,
            "text": text,
            "embedding": embedding,
            "created_ts": now,
            "hit_count": 0,
        });
        let ttl = ttl_seconds.or_else(|| default_ttl_for_kind(kind));

        {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("JSON.SET")
                .arg(&key)
                .arg("$")
                .arg(doc.to_string())
                .query::<Value>(&mut *con)?;
            if let Some(t) = ttl {
                redis::cmd("EXPIRE").arg(&key).arg(t).query::<Value>(&mut *con)?;
            }
        }
        Ok(WriteResult {
            id,
            deduped: false,
            existing_distance,
        })
    }

    /// Return the top-k in-scope memories ranked by similarity.
    /// Memories beyond `distance_threshold` (or the instance default)
    /// are dropped — the index always returns *something* for KNN,
    /// so a recall result on an unrelated query would otherwise be a
    /// confidently-wrong false positive.
    pub fn recall(
        &self,
        query_embedding: &[f32],
        user: &str,
        namespace: Option<&str>,
        kind: Option<&str>,
        k: usize,
        distance_threshold: Option<f64>,
    ) -> Result<Vec<MemoryRecord>, MemoryError> {
        let threshold = distance_threshold.unwrap_or(self.recall_threshold);
        let candidates = self.nearest(query_embedding, Some(user), namespace, kind, k)?;
        Ok(candidates
            .into_iter()
            .filter(|c| c.distance.is_some_and(|d| d <= threshold))
            .collect())
    }

    fn nearest(
        &self,
        embedding: &[f32],
        user: Option<&str>,
        namespace: Option<&str>,
        kind: Option<&str>,
        k: usize,
    ) -> Result<Vec<MemoryRecord>, MemoryError> {
        if embedding.len() != self.vector_dim {
            return Err(MemoryError::ShapeMismatch {
                expected: self.vector_dim,
                got: embedding.len(),
            });
        }
        let filter_clause = build_filter_clause(user, namespace, kind);
        let query_str = format!("{}=>[KNN {} @embedding $vec AS distance]", filter_clause, k);
        let vec_bytes = floats_to_bytes(embedding);

        let value: Value = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("FT.SEARCH")
                .arg(&self.index_name)
                .arg(&query_str)
                .arg("PARAMS").arg(2).arg("vec").arg(&vec_bytes[..])
                .arg("SORTBY").arg("distance").arg("ASC")
                .arg("RETURN").arg(8)
                .arg("user").arg("namespace").arg("kind").arg("source_thread")
                .arg("text").arg("created_ts").arg("hit_count").arg("distance")
                .arg("LIMIT").arg(0).arg(k as i64)
                .arg("DIALECT").arg(2)
                .query(&mut *con)?
        };
        let docs = parse_ft_search(&value)?;
        let mut out = Vec::with_capacity(docs.len());
        for doc in docs {
            // `doc.id` is the full Redis key (e.g.
            // `agent:mem:abc123`). Strip the prefix so the returned
            // record exposes only the opaque id the UI and
            // `delete_memory` work with.
            let memory_id = doc
                .id
                .strip_prefix(&self.key_prefix)
                .unwrap_or(&doc.id)
                .to_string();
            let ttl: i64 = {
                let mut con = self.conn.lock().unwrap();
                redis::cmd("TTL").arg(self.memory_key(&memory_id)).query(&mut *con).unwrap_or(-2)
            };
            let ttl_seconds = if ttl > 0 { Some(ttl) } else { None };
            let distance = doc.field("distance").and_then(|s| s.parse::<f64>().ok());
            out.push(MemoryRecord {
                id: memory_id,
                user: doc.field("user").unwrap_or_default().to_string(),
                namespace: doc.field("namespace").unwrap_or_default().to_string(),
                kind: doc.field("kind").unwrap_or_default().to_string(),
                source_thread: doc.field("source_thread").unwrap_or_default().to_string(),
                text: doc.field("text").unwrap_or_default().to_string(),
                created_ts: doc
                    .field("created_ts")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0),
                hit_count: doc
                    .field("hit_count")
                    .and_then(|s| s.parse::<i64>().ok())
                    .unwrap_or(0),
                distance,
                ttl_seconds,
            });
        }
        Ok(out)
    }

    fn bump_hit_count(&self, memory_id: &str) -> Result<(), MemoryError> {
        let mut con = self.conn.lock().unwrap();
        // The doc may have expired between recall and bump — fine,
        // we just lose the hit count update. Discarding the error
        // keeps the demo from blowing up on that race.
        let _ = redis::cmd("JSON.NUMINCRBY")
            .arg(self.memory_key(memory_id))
            .arg("$.hit_count")
            .arg(1)
            .query::<Value>(&mut *con);
        Ok(())
    }

    pub fn index_info(&self) -> IndexSnapshot {
        let mut con = match self.conn.lock() {
            Ok(c) => c,
            Err(_) => return IndexSnapshot::default(),
        };
        let value: Value = match redis::cmd("FT.INFO")
            .arg(&self.index_name)
            .query(&mut *con)
        {
            Ok(v) => v,
            Err(_) => return IndexSnapshot::default(),
        };
        parse_ft_info(&value)
    }

    pub fn list_memories(
        &self,
        user: Option<&str>,
        namespace: Option<&str>,
        kind: Option<&str>,
        limit: usize,
    ) -> Result<Vec<MemoryRecord>, MemoryError> {
        let filter_clause = build_filter_clause(user, namespace, kind);
        let value: Value = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("FT.SEARCH")
                .arg(&self.index_name)
                .arg(&filter_clause)
                .arg("RETURN").arg(7)
                .arg("user").arg("namespace").arg("kind").arg("source_thread")
                .arg("text").arg("created_ts").arg("hit_count")
                .arg("SORTBY").arg("created_ts").arg("DESC")
                .arg("LIMIT").arg(0).arg(limit as i64)
                .arg("DIALECT").arg(2)
                .query(&mut *con)?
        };
        let docs = parse_ft_search(&value)?;
        let mut out = Vec::with_capacity(docs.len());
        for doc in docs {
            let memory_id = doc
                .id
                .strip_prefix(&self.key_prefix)
                .unwrap_or(&doc.id)
                .to_string();
            let ttl: i64 = {
                let mut con = self.conn.lock().unwrap();
                redis::cmd("TTL").arg(self.memory_key(&memory_id)).query(&mut *con).unwrap_or(-2)
            };
            let ttl_seconds = if ttl > 0 { Some(ttl) } else { None };
            out.push(MemoryRecord {
                id: memory_id,
                user: doc.field("user").unwrap_or_default().to_string(),
                namespace: doc.field("namespace").unwrap_or_default().to_string(),
                kind: doc.field("kind").unwrap_or_default().to_string(),
                source_thread: doc.field("source_thread").unwrap_or_default().to_string(),
                text: doc.field("text").unwrap_or_default().to_string(),
                created_ts: doc
                    .field("created_ts")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0),
                hit_count: doc
                    .field("hit_count")
                    .and_then(|s| s.parse::<i64>().ok())
                    .unwrap_or(0),
                distance: None,
                ttl_seconds,
            });
        }
        Ok(out)
    }

    pub fn delete_memory(&self, memory_id: &str) -> Result<bool, MemoryError> {
        let n: i64 = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("DEL").arg(self.memory_key(memory_id)).query(&mut *con)?
        };
        Ok(n > 0)
    }

    /// Drop the index and every memory document, then recreate the
    /// index. Returns the count of documents that were removed.
    pub fn clear(&self) -> Result<i64, MemoryError> {
        let before = self.index_info().num_docs;
        self.drop_index(true)?;
        self.create_index()?;
        Ok(before)
    }
}

// ---- FT.SEARCH / FT.INFO response parsing ----------------------------

#[derive(Debug)]
pub struct SearchDoc {
    pub id: String,
    pub fields: HashMap<String, String>,
}

impl SearchDoc {
    fn field(&self, name: &str) -> Option<&str> {
        self.fields.get(name).map(|s| s.as_str())
    }
}

fn parse_ft_search(value: &Value) -> Result<Vec<SearchDoc>, MemoryError> {
    let items = match value {
        Value::Array(items) => items,
        _ => return Err(MemoryError::Parse("FT.SEARCH did not return an array".into())),
    };
    if items.is_empty() {
        return Ok(vec![]);
    }
    let mut out = Vec::new();
    let mut iter = items.iter().skip(1);
    while let Some(key_value) = iter.next() {
        let key = redis_value_to_string(key_value)
            .ok_or_else(|| MemoryError::Parse("key is not a string".into()))?;
        let fields_value = match iter.next() {
            Some(v) => v,
            None => {
                out.push(SearchDoc { id: key, fields: HashMap::new() });
                continue;
            }
        };
        let field_items: Vec<&Value> = match fields_value {
            Value::Array(v) => v.iter().collect(),
            _ => {
                out.push(SearchDoc { id: key, fields: HashMap::new() });
                continue;
            }
        };
        let mut fields = HashMap::new();
        let mut f_iter = field_items.into_iter();
        while let Some(name_val) = f_iter.next() {
            let name = match redis_value_to_string(name_val) {
                Some(s) => s,
                None => continue,
            };
            let value = f_iter.next().and_then(redis_value_to_string).unwrap_or_default();
            fields.insert(name, value);
        }
        out.push(SearchDoc { id: key, fields });
    }
    Ok(out)
}

fn parse_ft_info(value: &Value) -> IndexSnapshot {
    let items = match value {
        Value::Array(items) => items,
        _ => return IndexSnapshot::default(),
    };
    let mut info = IndexSnapshot::default();
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
        Value::Nil => None,
        _ => String::from_redis_value(v).ok(),
    }
}

// ---- Filter clause helpers -----------------------------------------

/// Characters Redis Search treats as syntax inside a TAG value; any
/// of them in a user-supplied filter must be backslash-escaped or
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
    user: Option<&str>,
    namespace: Option<&str>,
    kind: Option<&str>,
) -> String {
    let mut clauses = Vec::new();
    if let Some(u) = user.filter(|s| !s.is_empty()) {
        clauses.push(format!("@user:{{{}}}", escape_tag_value(u)));
    }
    if let Some(n) = namespace.filter(|s| !s.is_empty()) {
        clauses.push(format!("@namespace:{{{}}}", escape_tag_value(n)));
    }
    if let Some(k) = kind.filter(|s| !s.is_empty()) {
        clauses.push(format!("@kind:{{{}}}", escape_tag_value(k)));
    }
    if clauses.is_empty() {
        "(*)".to_string()
    } else {
        format!("({})", clauses.join(" "))
    }
}

fn unix_secs() -> f64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs_f64())
        .unwrap_or(0.0)
}

fn new_id_12() -> String {
    let mut buf = [0u8; 6];
    getrandom::getrandom(&mut buf).expect("getrandom never fails on supported platforms");
    let mut s = String::with_capacity(12);
    for b in buf {
        s.push_str(&format!("{:02x}", b));
    }
    s
}
