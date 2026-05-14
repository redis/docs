//! Redis event-stream helper backed by a single Redis Stream.
//!
//! Producers append events with `XADD`. Consumers belong to consumer
//! groups and read with `XREADGROUP`. The group as a whole tracks a
//! single `last-delivered-id` cursor, and each consumer gets its own
//! pending-entries list (PEL) of in-flight messages it has been
//! handed. Once a consumer has processed an entry it acknowledges it
//! with `XACK`; entries left unacknowledged past an idle threshold can
//! be swept to a healthy consumer with `XAUTOCLAIM` (or to a specific
//! one with `XCLAIM`).
//!
//! Each `XADD` carries an approximate `MAXLEN` so the stream stays
//! bounded as it rolls forward. `XRANGE` supports replay over the
//! retained history for debugging, audit, or rebuilding a downstream
//! projection. Note that approximate trimming can release entries that
//! are still in a group's PEL: those entries appear in `XAUTOCLAIM`'s
//! deleted-IDs list, which the caller should log and route to a
//! dead-letter store. Redis 7+ removes them from the PEL inside the
//! `XAUTOCLAIM` call itself, so no explicit `XACK` is needed.
//!
//! The same stream can be read by any number of consumer groups — each
//! group has its own cursor and its own pending lists, so analytics,
//! notifications, and audit can all process the full event flow at
//! their own pace without coordinating with each other.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use redis::aio::ConnectionManager;
use redis::streams::{
    StreamMaxlen, StreamPendingCountReply, StreamRangeReply, StreamReadOptions, StreamReadReply,
};
use redis::{AsyncCommands, RedisError, RedisResult, Value};

/// A single stream entry: `(id, field/value map)`.
pub type Entry = (String, HashMap<String, String>);

/// One pending-entry row from `XPENDING ... <count>`.
#[derive(Debug, Clone)]
pub struct PendingEntry {
    pub id: String,
    pub consumer: String,
    pub idle_ms: u64,
    pub deliveries: u64,
}

/// Cached snapshot of `XINFO STREAM` for the demo UI.
#[derive(Debug, Clone, Default)]
pub struct StreamInfo {
    pub length: u64,
    pub last_generated_id: Option<String>,
    pub first_entry_id: Option<String>,
    pub last_entry_id: Option<String>,
}

/// Per-group info from `XINFO GROUPS`.
#[derive(Debug, Clone, Default)]
pub struct GroupInfo {
    pub name: String,
    pub consumers: u64,
    pub pending: u64,
    pub last_delivered_id: String,
    /// `lag` is only reported when the group is fully caught up with
    /// stream additions; older Redis versions and certain edge cases
    /// leave it absent, so it is optional here.
    pub lag: Option<i64>,
}

/// Per-consumer info from `XINFO CONSUMERS <stream> <group>`.
#[derive(Debug, Clone, Default)]
pub struct ConsumerInfo {
    pub name: String,
    pub pending: u64,
    pub idle_ms: u64,
}

#[derive(Default)]
struct EventStreamStats {
    produced_total: AtomicU64,
    acked_total: AtomicU64,
    claimed_total: AtomicU64,
}

/// Producer/consumer helper for a single Redis Stream with consumer
/// groups.
///
/// Holds a cloneable `ConnectionManager` plus three counters. Every
/// helper method is `async` and takes `&self`; clone the struct cheaply
/// to share it across tasks.
#[derive(Clone)]
pub struct EventStream {
    conn: ConnectionManager,
    pub stream_key: String,
    pub maxlen_approx: usize,
    pub claim_min_idle_ms: u64,
    stats: Arc<EventStreamStats>,
}

impl EventStream {
    pub fn new(
        conn: ConnectionManager,
        stream_key: impl Into<String>,
        maxlen_approx: usize,
        claim_min_idle_ms: u64,
    ) -> Self {
        Self {
            conn,
            stream_key: stream_key.into(),
            maxlen_approx,
            claim_min_idle_ms,
            stats: Arc::new(EventStreamStats::default()),
        }
    }

    // ------------------------------------------------------------------
    // Producer
    // ------------------------------------------------------------------

    /// Append a single event. Returns the stream ID Redis assigned.
    #[allow(dead_code)]
    pub async fn produce(
        &self,
        event_type: &str,
        payload: HashMap<String, String>,
    ) -> RedisResult<String> {
        let mut ids = self.produce_batch(vec![(event_type.to_string(), payload)]).await?;
        // produce_batch always returns one id per input event.
        Ok(ids.pop().unwrap_or_default())
    }

    /// Pipeline several `XADD` calls in one round trip.
    ///
    /// Each entry carries an approximate `MAXLEN` cap. The `~` flavour
    /// lets Redis trim at a macro-node boundary, which is much cheaper
    /// than exact trimming and is the right call for a retention
    /// guardrail rather than a hard size limit.
    pub async fn produce_batch(
        &self,
        events: Vec<(String, HashMap<String, String>)>,
    ) -> RedisResult<Vec<String>> {
        if events.is_empty() {
            return Ok(Vec::new());
        }
        let mut pipe = redis::pipe();
        for (event_type, payload) in &events {
            let fields = encode_fields(event_type, payload);
            // redis-rs xadd_maxlen takes ownership of the maxlen flavour,
            // so we have to build the (key, value) pairs as Vec<(String, String)>.
            let pairs: Vec<(String, String)> =
                fields.into_iter().collect();
            pipe.cmd("XADD")
                .arg(&self.stream_key)
                .arg("MAXLEN")
                .arg("~")
                .arg(self.maxlen_approx)
                .arg("*");
            for (k, v) in &pairs {
                pipe.arg(k).arg(v);
            }
        }
        let mut conn = self.conn.clone();
        let ids: Vec<String> = pipe.query_async(&mut conn).await?;
        self.stats
            .produced_total
            .fetch_add(ids.len() as u64, Ordering::Relaxed);
        Ok(ids)
    }

    // ------------------------------------------------------------------
    // Consumer groups
    // ------------------------------------------------------------------

    /// Create the consumer group if it doesn't exist.
    ///
    /// `$` means "deliver only events appended after this point"; pass
    /// `0-0` to replay the entire stream into a fresh group. `BUSYGROUP`
    /// errors are swallowed so this method is idempotent.
    pub async fn ensure_group(&self, group: &str, start_id: &str) -> RedisResult<()> {
        let mut conn = self.conn.clone();
        let res: RedisResult<()> = redis::cmd("XGROUP")
            .arg("CREATE")
            .arg(&self.stream_key)
            .arg(group)
            .arg(start_id)
            .arg("MKSTREAM")
            .query_async(&mut conn)
            .await;
        match res {
            Ok(()) => Ok(()),
            Err(err) if is_busygroup(&err) => Ok(()),
            Err(err) => Err(err),
        }
    }

    /// Read new entries for this consumer via `XREADGROUP`.
    ///
    /// The `>` ID means "deliver entries this consumer group has not
    /// delivered to anyone yet" — that is the at-least-once path.
    /// Replaying an explicit ID instead would re-deliver an entry that
    /// is already in this consumer's pending list (see
    /// `consume_own_pel` for that recovery path).
    pub async fn consume(
        &self,
        group: &str,
        consumer: &str,
        count: usize,
        block_ms: usize,
    ) -> RedisResult<Vec<Entry>> {
        let opts = StreamReadOptions::default()
            .group(group, consumer)
            .count(count)
            .block(block_ms);
        let mut conn = self.conn.clone();
        let reply: Option<StreamReadReply> = conn
            .xread_options(&[self.stream_key.as_str()], &[">"], &opts)
            .await?;
        Ok(flatten_read_reply(reply))
    }

    /// Re-deliver entries already in this consumer's PEL.
    ///
    /// Reading with an explicit ID (`0` here) instead of `>` replays
    /// the entries already assigned to this consumer name without
    /// advancing the group's `last-delivered-id`. This is the
    /// canonical recovery path after a crash on the same consumer name.
    #[allow(dead_code)]
    pub async fn consume_own_pel(
        &self,
        group: &str,
        consumer: &str,
        count: usize,
    ) -> RedisResult<Vec<Entry>> {
        let opts = StreamReadOptions::default()
            .group(group, consumer)
            .count(count);
        let mut conn = self.conn.clone();
        let reply: Option<StreamReadReply> = conn
            .xread_options(&[self.stream_key.as_str()], &["0"], &opts)
            .await?;
        Ok(flatten_read_reply(reply))
    }

    /// `XACK` a batch of entry IDs. Returns the number actually acked.
    pub async fn ack(&self, group: &str, ids: Vec<String>) -> RedisResult<i64> {
        if ids.is_empty() {
            return Ok(0);
        }
        let mut conn = self.conn.clone();
        let n: i64 = conn.xack(&self.stream_key, group, &ids).await?;
        self.stats.acked_total.fetch_add(n as u64, Ordering::Relaxed);
        Ok(n)
    }

    /// Sweep idle pending entries to `consumer`.
    ///
    /// A single `XAUTOCLAIM` call scans up to `page_count` PEL entries
    /// starting at `start_id` and returns a continuation cursor. For a
    /// full sweep of the PEL, loop until the cursor returns to `0-0`
    /// (or hit `max_pages` as a safety net so a very large PEL can't
    /// monopolise the call).
    ///
    /// Returns `(claimed, deleted_ids)`. `deleted_ids` are PEL entries
    /// whose stream payload had already been trimmed by the time this
    /// sweep ran (typically because `MAXLEN ~` retention outran a slow
    /// consumer). `XAUTOCLAIM` removes those dangling slots from the
    /// PEL itself — the caller does not need to `XACK` them — but they
    /// cannot be retried, so log and route them to a dead-letter store
    /// for observability.
    pub async fn autoclaim(
        &self,
        group: &str,
        consumer: &str,
        page_count: usize,
        start_id: &str,
        max_pages: usize,
    ) -> RedisResult<(Vec<Entry>, Vec<String>)> {
        let mut claimed_all: Vec<Entry> = Vec::new();
        let mut deleted_all: Vec<String> = Vec::new();
        let mut cursor = start_id.to_string();
        let mut conn = self.conn.clone();
        for _ in 0..max_pages {
            // XAUTOCLAIM <key> <group> <consumer> <min-idle-time> <start> [COUNT count]
            // Reply (Redis 7+): [ next-cursor, [ [id, [field, value, ...]], ... ], [deleted-id, ...] ]
            //
            // redis-rs 0.24 has no typed wrapper for XAUTOCLAIM; we
            // build it by hand and decode the three-element reply into
            // (cursor, entries, deleted). The Vec<Value>::from_redis_value
            // implementation is exposed via redis::FromRedisValue.
            let raw: Value = redis::cmd("XAUTOCLAIM")
                .arg(&self.stream_key)
                .arg(group)
                .arg(consumer)
                .arg(self.claim_min_idle_ms)
                .arg(&cursor)
                .arg("COUNT")
                .arg(page_count)
                .query_async(&mut conn)
                .await?;
            let (next_cursor, claimed, deleted) = parse_autoclaim_reply(raw)?;
            claimed_all.extend(claimed);
            deleted_all.extend(deleted);
            if next_cursor == "0-0" {
                break;
            }
            cursor = next_cursor;
        }
        self.stats
            .claimed_total
            .fetch_add(claimed_all.len() as u64, Ordering::Relaxed);
        Ok((claimed_all, deleted_all))
    }

    /// `XGROUP DELCONSUMER` — destroys the consumer's PEL entries
    /// outright. Always call `handover_pending` first if the source
    /// still owns entries.
    pub async fn delete_consumer(&self, group: &str, consumer: &str) -> RedisResult<i64> {
        let mut conn = self.conn.clone();
        let res: RedisResult<i64> = redis::cmd("XGROUP")
            .arg("DELCONSUMER")
            .arg(&self.stream_key)
            .arg(group)
            .arg(consumer)
            .query_async(&mut conn)
            .await;
        match res {
            Ok(n) => Ok(n),
            Err(_) => Ok(0),
        }
    }

    /// Move every PEL entry owned by `from_consumer` to `to_consumer`.
    ///
    /// Enumerates the source consumer's PEL with `XPENDING ... CONSUMER`
    /// and reassigns each ID with `XCLAIM` at zero idle time so the
    /// move is unconditional. (`XAUTOCLAIM` does not filter by source
    /// consumer, so it cannot be used for a per-consumer handover.)
    /// Returns the number of entries that were actually moved.
    pub async fn handover_pending(
        &self,
        group: &str,
        from_consumer: &str,
        to_consumer: &str,
        batch: usize,
    ) -> RedisResult<usize> {
        let mut conn = self.conn.clone();
        let mut moved: usize = 0;
        loop {
            let reply: StreamPendingCountReply = redis::cmd("XPENDING")
                .arg(&self.stream_key)
                .arg(group)
                .arg("-")
                .arg("+")
                .arg(batch)
                .arg(from_consumer)
                .query_async(&mut conn)
                .await?;
            if reply.ids.is_empty() {
                break;
            }
            let ids: Vec<String> = reply.ids.iter().map(|row| row.id.clone()).collect();
            // XCLAIM <key> <group> <to-consumer> <min-idle-time> id [id ...]
            // We don't care about the parsed reply shape here; JUSTID
            // avoids decoding payloads for entries the demo isn't going
            // to process inline.
            let claimed_ids: Vec<String> = redis::cmd("XCLAIM")
                .arg(&self.stream_key)
                .arg(group)
                .arg(to_consumer)
                .arg(0)
                .arg(&ids)
                .arg("JUSTID")
                .query_async(&mut conn)
                .await?;
            moved += claimed_ids.len();
            if reply.ids.len() < batch {
                break;
            }
        }
        self.stats
            .claimed_total
            .fetch_add(moved as u64, Ordering::Relaxed);
        Ok(moved)
    }

    // ------------------------------------------------------------------
    // Replay, length, trim
    // ------------------------------------------------------------------

    /// Range read with `XRANGE` for replay or audit.
    ///
    /// Read-only: ranges do not update any group cursor and do not ack
    /// anything. Useful for bootstrapping a new projection, for building
    /// an audit view, or for debugging what actually went through the
    /// stream.
    pub async fn replay(
        &self,
        start_id: &str,
        end_id: &str,
        count: usize,
    ) -> RedisResult<Vec<Entry>> {
        let mut conn = self.conn.clone();
        let reply: StreamRangeReply = conn
            .xrange_count(&self.stream_key, start_id, end_id, count)
            .await?;
        Ok(stream_ids_to_entries(reply.ids))
    }

    /// Newest-first range, used for the demo's "tail" view.
    pub async fn tail(&self, count: usize) -> RedisResult<Vec<Entry>> {
        let mut conn = self.conn.clone();
        let reply: StreamRangeReply = conn
            .xrevrange_count(&self.stream_key, "+", "-", count)
            .await?;
        Ok(stream_ids_to_entries(reply.ids))
    }

    #[allow(dead_code)]
    pub async fn length(&self) -> RedisResult<i64> {
        let mut conn = self.conn.clone();
        Ok(conn.xlen(&self.stream_key).await?)
    }

    pub async fn trim_maxlen(&self, maxlen: usize) -> RedisResult<i64> {
        let mut conn = self.conn.clone();
        Ok(conn.xtrim(&self.stream_key, StreamMaxlen::Approx(maxlen)).await?)
    }

    #[allow(dead_code)]
    pub async fn trim_minid(&self, minid: &str) -> RedisResult<i64> {
        let mut conn = self.conn.clone();
        Ok(redis::cmd("XTRIM")
            .arg(&self.stream_key)
            .arg("MINID")
            .arg("~")
            .arg(minid)
            .query_async(&mut conn)
            .await
            .unwrap_or(0))
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /// Subset of `XINFO STREAM` that's safe to JSON-encode.
    pub async fn info_stream(&self) -> StreamInfo {
        let mut conn = self.conn.clone();
        // The typed `StreamInfoStreamReply` would work for length and
        // last_generated_id, but it parses the radix-tree fields as
        // usize and panics on streams Redis returns without them. We
        // decode `XINFO STREAM` by hand into a plain `HashMap<String,
        // Value>` and read out only the fields the demo needs.
        let raw: Value = match redis::cmd("XINFO")
            .arg("STREAM")
            .arg(&self.stream_key)
            .query_async(&mut conn)
            .await
        {
            Ok(v) => v,
            Err(_) => return StreamInfo::default(),
        };
        let map: HashMap<String, Value> = match redis::FromRedisValue::from_redis_value(&raw) {
            Ok(m) => m,
            Err(_) => return StreamInfo::default(),
        };
        let length: u64 = map
            .get("length")
            .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok())
            .unwrap_or(0);
        let last_generated_id: Option<String> = map
            .get("last-generated-id")
            .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok());
        let first_entry_id = entry_id_from_value(map.get("first-entry"));
        let last_entry_id = entry_id_from_value(map.get("last-entry"));
        StreamInfo {
            length,
            last_generated_id,
            first_entry_id,
            last_entry_id,
        }
    }

    /// `XINFO GROUPS` with the lag field surfaced (Redis 7+).
    pub async fn info_groups(&self) -> Vec<GroupInfo> {
        let mut conn = self.conn.clone();
        let raw: Value = match redis::cmd("XINFO")
            .arg("GROUPS")
            .arg(&self.stream_key)
            .query_async(&mut conn)
            .await
        {
            Ok(v) => v,
            Err(_) => return Vec::new(),
        };
        // Each group is a flat alternating key/value array. Decode as
        // a vec of HashMap<String, Value> so we can pull only the keys
        // we care about (and tolerate version differences).
        let rows: Vec<HashMap<String, Value>> =
            match redis::FromRedisValue::from_redis_value(&raw) {
                Ok(v) => v,
                Err(_) => return Vec::new(),
            };
        rows.into_iter()
            .map(|map| GroupInfo {
                name: map
                    .get("name")
                    .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok())
                    .unwrap_or_default(),
                consumers: map
                    .get("consumers")
                    .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok())
                    .unwrap_or(0),
                pending: map
                    .get("pending")
                    .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok())
                    .unwrap_or(0),
                last_delivered_id: map
                    .get("last-delivered-id")
                    .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok())
                    .unwrap_or_default(),
                lag: map
                    .get("lag")
                    .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok()),
            })
            .collect()
    }

    /// `XINFO CONSUMERS <stream> <group>`.
    pub async fn info_consumers(&self, group: &str) -> Vec<ConsumerInfo> {
        let mut conn = self.conn.clone();
        let raw: Value = match redis::cmd("XINFO")
            .arg("CONSUMERS")
            .arg(&self.stream_key)
            .arg(group)
            .query_async(&mut conn)
            .await
        {
            Ok(v) => v,
            Err(_) => return Vec::new(),
        };
        let rows: Vec<HashMap<String, Value>> =
            match redis::FromRedisValue::from_redis_value(&raw) {
                Ok(v) => v,
                Err(_) => return Vec::new(),
            };
        rows.into_iter()
            .map(|map| ConsumerInfo {
                name: map
                    .get("name")
                    .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok())
                    .unwrap_or_default(),
                pending: map
                    .get("pending")
                    .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok())
                    .unwrap_or(0),
                idle_ms: map
                    .get("idle")
                    .and_then(|v| redis::FromRedisValue::from_redis_value(v).ok())
                    .unwrap_or(0),
            })
            .collect()
    }

    /// Per-entry PEL view (`XPENDING <key> <group> - + <count>`).
    pub async fn pending_detail(&self, group: &str, count: usize) -> Vec<PendingEntry> {
        let mut conn = self.conn.clone();
        let reply: RedisResult<StreamPendingCountReply> = redis::cmd("XPENDING")
            .arg(&self.stream_key)
            .arg(group)
            .arg("-")
            .arg("+")
            .arg(count)
            .query_async(&mut conn)
            .await;
        match reply {
            Ok(r) => r
                .ids
                .into_iter()
                .map(|row| PendingEntry {
                    id: row.id,
                    consumer: row.consumer,
                    idle_ms: row.last_delivered_ms as u64,
                    deliveries: row.times_delivered as u64,
                })
                .collect(),
            Err(_) => Vec::new(),
        }
    }

    // ------------------------------------------------------------------
    // Stats and demo housekeeping
    // ------------------------------------------------------------------

    pub fn stats(&self) -> Stats {
        Stats {
            produced_total: self.stats.produced_total.load(Ordering::Relaxed),
            acked_total: self.stats.acked_total.load(Ordering::Relaxed),
            claimed_total: self.stats.claimed_total.load(Ordering::Relaxed),
        }
    }

    pub fn reset_stats(&self) {
        self.stats.produced_total.store(0, Ordering::Relaxed);
        self.stats.acked_total.store(0, Ordering::Relaxed);
        self.stats.claimed_total.store(0, Ordering::Relaxed);
    }

    /// Drop the stream key entirely. Used by the demo's reset path.
    pub async fn delete_stream(&self) {
        let mut conn = self.conn.clone();
        let _: RedisResult<i64> = conn.del(&self.stream_key).await;
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct Stats {
    pub produced_total: u64,
    pub acked_total: u64,
    pub claimed_total: u64,
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

fn encode_fields(event_type: &str, payload: &HashMap<String, String>) -> Vec<(String, String)> {
    let mut out: Vec<(String, String)> = Vec::with_capacity(payload.len() + 2);
    out.push(("type".to_string(), event_type.to_string()));
    out.push(("ts_ms".to_string(), now_unix_ms_str()));
    for (k, v) in payload {
        out.push((k.clone(), v.clone()));
    }
    out
}

fn now_unix_ms_str() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

fn is_busygroup(err: &RedisError) -> bool {
    // Both detail() and to_string() include the BUSYGROUP token on a
    // duplicate-create; check both for safety across redis-rs versions.
    if let Some(detail) = err.detail() {
        if detail.contains("BUSYGROUP") {
            return true;
        }
    }
    err.to_string().contains("BUSYGROUP")
}

fn flatten_read_reply(reply: Option<StreamReadReply>) -> Vec<Entry> {
    let mut out: Vec<Entry> = Vec::new();
    let Some(reply) = reply else {
        return out;
    };
    for key in reply.keys {
        for sid in key.ids {
            out.push((sid.id, fields_from_stream_map(&sid.map)));
        }
    }
    out
}

fn stream_ids_to_entries(ids: Vec<redis::streams::StreamId>) -> Vec<Entry> {
    ids.into_iter()
        .map(|sid| (sid.id, fields_from_stream_map(&sid.map)))
        .collect()
}

fn fields_from_stream_map(map: &HashMap<String, Value>) -> HashMap<String, String> {
    let mut out: HashMap<String, String> = HashMap::with_capacity(map.len());
    for (k, v) in map {
        let s: String = redis::FromRedisValue::from_redis_value(v).unwrap_or_default();
        out.insert(k.clone(), s);
    }
    out
}

fn entry_id_from_value(v: Option<&Value>) -> Option<String> {
    // first-entry / last-entry come back as `[id, [field, value, ...]]`
    // or as Nil if the stream is empty. We only need the id.
    let Some(v) = v else { return None };
    if matches!(v, Value::Nil) {
        return None;
    }
    if let Value::Bulk(items) = v {
        if let Some(first) = items.first() {
            if let Ok(id) = redis::FromRedisValue::from_redis_value(first) {
                return Some(id);
            }
        }
    }
    None
}

/// Decode a Redis 7+ `XAUTOCLAIM` reply:
/// `[ next-cursor, [ [id, [field, value, ...]], ... ], [deleted-id, ...] ]`.
fn parse_autoclaim_reply(raw: Value) -> RedisResult<(String, Vec<Entry>, Vec<String>)> {
    let parts = match raw {
        Value::Bulk(parts) => parts,
        _ => {
            return Err(RedisError::from((
                redis::ErrorKind::TypeError,
                "XAUTOCLAIM: expected array reply",
            )))
        }
    };
    let mut iter = parts.into_iter();
    let cursor_v = iter
        .next()
        .ok_or_else(|| RedisError::from((redis::ErrorKind::TypeError, "XAUTOCLAIM: missing cursor")))?;
    let entries_v = iter
        .next()
        .ok_or_else(|| RedisError::from((redis::ErrorKind::TypeError, "XAUTOCLAIM: missing entries")))?;
    let deleted_v = iter.next(); // Redis 7.0+; absent on 6.2 (not supported)

    let next_cursor: String = redis::FromRedisValue::from_redis_value(&cursor_v)?;

    // Re-use the StreamRangeReply decoder for the entries vec: the
    // wire shape is identical to `XRANGE` (an array of [id, [field,
    // value, ...]] pairs).
    let range: StreamRangeReply = redis::FromRedisValue::from_redis_value(&entries_v)?;
    let entries = stream_ids_to_entries(range.ids);

    let deleted: Vec<String> = match deleted_v {
        Some(v) => redis::FromRedisValue::from_redis_value(&v).unwrap_or_default(),
        None => Vec::new(),
    };

    Ok((next_cursor, entries, deleted))
}
