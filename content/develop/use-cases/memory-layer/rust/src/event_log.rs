//! Append-only event log for an agent thread, backed by a Redis
//! Stream.
//!
//! Each thread gets a stream at `agent:events:{thread_id}`. Every
//! action the agent takes (a user turn arriving, a memory being
//! recalled, a memory being written, a tool being called) is one
//! `XADD` to that stream. Replay with `XREVRANGE` for the most recent
//! N events; bound retention with `XTRIM MAXLEN ~` so the log stays
//! cheap regardless of how long the thread has been running.
//!
//! The stream is independent of the session hash and the long-term
//! memory store: it answers the "what just happened" question
//! without competing with either of those for indexing or memory
//! budget. Consumer groups (not used in this demo) would let
//! downstream workers — summarisers, consolidators, audit pipelines —
//! replay the log without losing position.

use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use redis::{Client, Connection, FromRedisValue, RedisError, Value};
use serde::Serialize;

/// Approximate cap on stream length. `MAXLEN ~` lets Redis trim in
/// whole-node units instead of exactly-N units, which is much cheaper
/// at the cost of overshooting the bound by up to a node's worth.
pub const DEFAULT_MAX_LEN: i64 = 1000;

#[derive(Debug)]
pub enum EventLogError {
    Redis(RedisError),
}

impl std::fmt::Display for EventLogError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EventLogError::Redis(e) => write!(f, "redis: {}", e),
        }
    }
}

impl std::error::Error for EventLogError {}

impl From<RedisError> for EventLogError {
    fn from(e: RedisError) -> Self {
        EventLogError::Redis(e)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct AgentEvent {
    pub event_id: String,
    pub thread_id: String,
    pub action: String,
    pub detail: String,
    pub ts: f64,
}

pub struct AgentEventLog {
    conn: Mutex<Connection>,
    pub key_prefix: String,
    pub max_len: i64,
}

impl AgentEventLog {
    pub fn new(
        client: &Client,
        key_prefix: impl Into<String>,
        max_len: i64,
    ) -> Result<Self, EventLogError> {
        let conn = client.get_connection()?;
        Ok(Self {
            conn: Mutex::new(conn),
            key_prefix: key_prefix.into(),
            max_len,
        })
    }

    pub fn stream_key(&self, thread_id: &str) -> String {
        format!("{}{}", self.key_prefix, thread_id)
    }

    /// Append one event and return its stream id.
    ///
    /// `MAXLEN ~ N` keeps the stream bounded with near-zero overhead;
    /// an exact bound (`MAXLEN N` without the tilde) forces a scan
    /// and is rarely worth the cost.
    pub fn record(
        &self,
        thread_id: &str,
        action: &str,
        detail: &str,
    ) -> Result<String, EventLogError> {
        let ts = unix_secs();
        let id: String = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("XADD")
                .arg(self.stream_key(thread_id))
                .arg("MAXLEN")
                .arg("~")
                .arg(self.max_len)
                .arg("*")
                .arg("action").arg(action)
                .arg("detail").arg(detail)
                .arg("ts").arg(format!("{}", ts))
                .query(&mut *con)?
        };
        Ok(id)
    }

    /// Return the most recent events, newest first.
    pub fn recent(
        &self,
        thread_id: &str,
        count: usize,
    ) -> Result<Vec<AgentEvent>, EventLogError> {
        let value: Value = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("XREVRANGE")
                .arg(self.stream_key(thread_id))
                .arg("+")
                .arg("-")
                .arg("COUNT")
                .arg(count as i64)
                .query(&mut *con)?
        };
        Ok(parse_xrange(&value, thread_id))
    }

    #[allow(dead_code)]
    pub fn length(&self, thread_id: &str) -> Result<i64, EventLogError> {
        let n: i64 = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("XLEN").arg(self.stream_key(thread_id)).query(&mut *con)?
        };
        Ok(n)
    }

    pub fn clear(&self, thread_id: &str) -> Result<bool, EventLogError> {
        let n: i64 = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("DEL").arg(self.stream_key(thread_id)).query(&mut *con)?
        };
        Ok(n > 0)
    }
}

fn parse_xrange(value: &Value, thread_id: &str) -> Vec<AgentEvent> {
    // XRANGE / XREVRANGE shape: [[id, [field, val, field, val, ...]], ...]
    let items = match value {
        Value::Array(items) => items,
        _ => return Vec::new(),
    };
    let mut out = Vec::with_capacity(items.len());
    for item in items {
        let pair = match item {
            Value::Array(pair) => pair,
            _ => continue,
        };
        if pair.len() < 2 {
            continue;
        }
        let id = match redis_value_to_string(&pair[0]) {
            Some(s) => s,
            None => continue,
        };
        let fields = match &pair[1] {
            Value::Array(fs) => fs,
            _ => continue,
        };
        let mut action = String::new();
        let mut detail = String::new();
        let mut ts: f64 = 0.0;
        let mut iter = fields.iter();
        while let Some(k) = iter.next() {
            let v = match iter.next() {
                Some(v) => v,
                None => break,
            };
            let key = redis_value_to_string(k).unwrap_or_default();
            let val = redis_value_to_string(v).unwrap_or_default();
            match key.as_str() {
                "action" => action = val,
                "detail" => detail = val,
                "ts" => ts = val.parse::<f64>().unwrap_or(0.0),
                _ => {}
            }
        }
        out.push(AgentEvent {
            event_id: id,
            thread_id: thread_id.to_string(),
            action,
            detail,
            ts,
        });
    }
    out
}

fn redis_value_to_string(v: &Value) -> Option<String> {
    match v {
        Value::BulkString(bytes) => Some(String::from_utf8_lossy(bytes).into_owned()),
        Value::SimpleString(s) => Some(s.clone()),
        Value::VerbatimString { format: _, text } => Some(text.clone()),
        Value::Int(n) => Some(n.to_string()),
        Value::Double(d) => Some(d.to_string()),
        Value::Nil => None,
        _ => String::from_redis_value(v).ok(),
    }
}

fn unix_secs() -> f64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs_f64())
        .unwrap_or(0.0)
}
