//! Working-memory store for an agent session, backed by a Redis Hash.
//!
//! Each session is one Hash document at `agent:session:{thread_id}`.
//! The hash holds the running scratchpad, the current goal, a rolling
//! window of recent turns (serialised as a JSON list to fit in one
//! field), and a few audit fields. One `HGETALL` returns the whole
//! session in a single round trip on every step of the agent loop.
//!
//! Every write refreshes the key's TTL with `EXPIRE`, so idle sessions
//! fall off without a separate cleanup job and active sessions stay
//! alive as long as the agent keeps touching them. A separate
//! `LongTermMemory` is what survives beyond a session's TTL.
//!
//! The turn window is bounded to `max_turns` in application code; the
//! hash itself doesn't grow, so the working set per thread stays
//! constant regardless of how long the agent has been running.

use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use redis::{Client, Connection, FromRedisValue, RedisError, Value};
use serde::{Deserialize, Serialize};

/// How many recent turns to keep inline on the session hash. Older
/// turns flow through the event log (see [`crate::event_log`]) and
/// the long-term memory store (see [`crate::long_term_memory`]).
pub const DEFAULT_MAX_TURNS: usize = 20;

#[derive(Debug)]
pub enum SessionError {
    Redis(RedisError),
    Parse(String),
}

impl std::fmt::Display for SessionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SessionError::Redis(e) => write!(f, "redis: {}", e),
            SessionError::Parse(msg) => write!(f, "parse: {}", msg),
        }
    }
}

impl std::error::Error for SessionError {}

impl From<RedisError> for SessionError {
    fn from(e: RedisError) -> Self {
        SessionError::Redis(e)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionTurn {
    pub role: String,
    pub content: String,
    pub ts: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct SessionState {
    pub thread_id: String,
    pub user: String,
    pub agent: String,
    pub goal: String,
    pub scratchpad: String,
    pub turn_count: i64,
    pub created_ts: f64,
    pub last_active_ts: f64,
    pub recent_turns: Vec<SessionTurn>,
    pub ttl_seconds: i64,
}

pub struct AgentSession {
    conn: Mutex<Connection>,
    pub key_prefix: String,
    pub default_ttl_seconds: i64,
    pub max_turns: usize,
}

impl AgentSession {
    pub fn new(
        client: &Client,
        key_prefix: impl Into<String>,
        default_ttl_seconds: i64,
        max_turns: usize,
    ) -> Result<Self, SessionError> {
        let conn = client.get_connection()?;
        Ok(Self {
            conn: Mutex::new(conn),
            key_prefix: key_prefix.into(),
            default_ttl_seconds,
            max_turns,
        })
    }

    pub fn session_key(&self, thread_id: &str) -> String {
        format!("{}{}", self.key_prefix, thread_id)
    }

    pub fn new_thread_id(&self) -> String {
        new_id_12()
    }

    /// Create a fresh working memory for a thread. Overwrites any
    /// existing session at the same key. The agent normally calls
    /// this once per thread at the first turn and relies on
    /// [`load`](Self::load) / [`append_turn`](Self::append_turn) for
    /// subsequent steps.
    pub fn start(
        &self,
        thread_id: &str,
        user: &str,
        agent: &str,
        goal: &str,
        ttl_seconds: Option<i64>,
    ) -> Result<SessionState, SessionError> {
        let ttl = ttl_seconds.unwrap_or(self.default_ttl_seconds);
        let now = unix_secs();
        let state = SessionState {
            thread_id: thread_id.to_string(),
            user: user.to_string(),
            agent: agent.to_string(),
            goal: goal.to_string(),
            scratchpad: String::new(),
            turn_count: 0,
            created_ts: now,
            last_active_ts: now,
            recent_turns: Vec::new(),
            ttl_seconds: ttl,
        };
        self.write(&state, ttl)?;
        Ok(state)
    }

    /// Return the session state, or `None` if it has expired.
    pub fn load(&self, thread_id: &str) -> Result<Option<SessionState>, SessionError> {
        let key = self.session_key(thread_id);
        let raw: Vec<(String, Value)> = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("HGETALL").arg(&key).query(&mut *con)?
        };
        if raw.is_empty() {
            return Ok(None);
        }
        let mut fields = std::collections::HashMap::new();
        for (k, v) in raw {
            if let Some(s) = redis_value_to_string(&v) {
                fields.insert(k, s);
            }
        }
        let ttl: i64 = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("TTL").arg(&key).query(&mut *con).unwrap_or(0)
        };
        let recent_turns = match fields.get("recent_turns") {
            Some(blob) => serde_json::from_str::<Vec<SessionTurn>>(blob).unwrap_or_default(),
            None => Vec::new(),
        };
        Ok(Some(SessionState {
            thread_id: thread_id.to_string(),
            user: fields.remove("user").unwrap_or_else(|| "default".to_string()),
            agent: fields.remove("agent").unwrap_or_else(|| "default".to_string()),
            goal: fields.remove("goal").unwrap_or_default(),
            scratchpad: fields.remove("scratchpad").unwrap_or_default(),
            turn_count: fields
                .get("turn_count")
                .and_then(|s| s.parse::<i64>().ok())
                .unwrap_or(0),
            created_ts: fields
                .get("created_ts")
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0),
            last_active_ts: fields
                .get("last_active_ts")
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0),
            recent_turns,
            ttl_seconds: if ttl > 0 { ttl } else { 0 },
        }))
    }

    /// Append a turn, bound the rolling window, refresh the TTL.
    ///
    /// `user` and `agent` are only consulted when the session does
    /// not yet exist — they seed the auto-created session so the
    /// working-memory hash matches the user the caller is operating
    /// against. On an existing session they're ignored; the original
    /// `start` values stand.
    ///
    /// Read-modify-write here is last-writer-wins on the turn list
    /// if two concurrent turns reach the same thread; the demo never
    /// triggers that race in practice (one browser, one turn at a
    /// time) but a multi-worker agent that shares a thread id would
    /// wrap this in `WATCH` / `MULTI` / `EXEC` or a Lua script that
    /// does the append atomically server-side.
    pub fn append_turn(
        &self,
        thread_id: &str,
        role: &str,
        content: &str,
        user: Option<&str>,
        agent: Option<&str>,
        ttl_seconds: Option<i64>,
    ) -> Result<SessionState, SessionError> {
        let mut state = match self.load(thread_id)? {
            Some(s) => s,
            None => self.start(
                thread_id,
                user.unwrap_or("default"),
                agent.unwrap_or("default"),
                "",
                ttl_seconds,
            )?,
        };
        state.recent_turns.push(SessionTurn {
            role: role.to_string(),
            content: content.to_string(),
            ts: unix_secs(),
        });
        if state.recent_turns.len() > self.max_turns {
            let drop_count = state.recent_turns.len() - self.max_turns;
            state.recent_turns.drain(0..drop_count);
        }
        state.turn_count += 1;
        state.last_active_ts = unix_secs();
        let ttl = ttl_seconds.unwrap_or(self.default_ttl_seconds);
        state.ttl_seconds = ttl;
        self.write(&state, ttl)?;
        Ok(state)
    }

    /// Update the agent's running scratchpad and refresh the TTL.
    /// Returns `None` when the session does not exist.
    #[allow(dead_code)]
    pub fn set_scratchpad(
        &self,
        thread_id: &str,
        text: &str,
        ttl_seconds: Option<i64>,
    ) -> Result<Option<SessionState>, SessionError> {
        let mut state = match self.load(thread_id)? {
            Some(s) => s,
            None => return Ok(None),
        };
        state.scratchpad = text.to_string();
        state.last_active_ts = unix_secs();
        let ttl = ttl_seconds.unwrap_or(self.default_ttl_seconds);
        state.ttl_seconds = ttl;
        self.write(&state, ttl)?;
        Ok(Some(state))
    }

    /// Update the goal field without touching turns or the
    /// scratchpad. Creates the session if it doesn't exist yet —
    /// setting a goal on a fresh thread is a sensible first step in
    /// the agent loop, so this method covers both the "rename the
    /// goal mid-session" and the "start a thread with this goal"
    /// cases.
    pub fn set_goal(
        &self,
        thread_id: &str,
        text: &str,
        user: Option<&str>,
        agent: Option<&str>,
        ttl_seconds: Option<i64>,
    ) -> Result<SessionState, SessionError> {
        let mut state = match self.load(thread_id)? {
            Some(s) => s,
            None => {
                return self.start(
                    thread_id,
                    user.unwrap_or("default"),
                    agent.unwrap_or("default"),
                    text,
                    ttl_seconds,
                );
            }
        };
        state.goal = text.to_string();
        state.last_active_ts = unix_secs();
        let ttl = ttl_seconds.unwrap_or(self.default_ttl_seconds);
        state.ttl_seconds = ttl;
        self.write(&state, ttl)?;
        Ok(state)
    }

    pub fn delete(&self, thread_id: &str) -> Result<bool, SessionError> {
        let n: i64 = {
            let mut con = self.conn.lock().unwrap();
            redis::cmd("DEL").arg(self.session_key(thread_id)).query(&mut *con)?
        };
        Ok(n > 0)
    }

    fn write(&self, state: &SessionState, ttl: i64) -> Result<(), SessionError> {
        let key = self.session_key(&state.thread_id);
        let turns_blob = serde_json::to_string(&state.recent_turns)
            .map_err(|e| SessionError::Parse(e.to_string()))?;
        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. A connection drop between the two writes would
        // otherwise leave the session without a TTL.
        let mut con = self.conn.lock().unwrap();
        redis::pipe()
            .atomic()
            .cmd("HSET")
            .arg(&key)
            .arg("thread_id").arg(&state.thread_id)
            .arg("user").arg(&state.user)
            .arg("agent").arg(&state.agent)
            .arg("goal").arg(&state.goal)
            .arg("scratchpad").arg(&state.scratchpad)
            .arg("turn_count").arg(state.turn_count.to_string())
            .arg("created_ts").arg(format!("{}", state.created_ts))
            .arg("last_active_ts").arg(format!("{}", state.last_active_ts))
            .arg("recent_turns").arg(turns_blob)
            .cmd("EXPIRE").arg(&key).arg(ttl)
            .query::<Value>(&mut *con)?;
        Ok(())
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
