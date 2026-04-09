//! Redis leaderboard implementation using a sorted set and per-user metadata hashes.

use redis::RedisResult;
use serde::Serialize;
use std::collections::HashMap;

pub type Metadata = HashMap<String, String>;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct LeaderboardEntry {
    pub rank: usize,
    pub user_id: String,
    pub score: f64,
    pub metadata: Metadata,
    pub trimmed_user_ids: Vec<String>,
}

impl LeaderboardEntry {
    fn new(
        rank: usize,
        user_id: &str,
        score: f64,
        metadata: Metadata,
        trimmed_user_ids: Vec<String>,
    ) -> Self {
        Self {
            rank,
            user_id: user_id.to_string(),
            score,
            metadata,
            trimmed_user_ids,
        }
    }
}

#[derive(Debug, Clone)]
pub struct RedisLeaderboard {
    key: String,
    max_entries: usize,
}

#[derive(Debug, Clone)]
pub struct AsyncRedisLeaderboard {
    key: String,
    max_entries: usize,
}

impl RedisLeaderboard {
    pub fn new(key: impl Into<String>, max_entries: usize) -> Self {
        Self {
            key: key.into(),
            max_entries: normalize_positive_int(max_entries, "max_entries"),
        }
    }

    pub fn key(&self) -> &str {
        &self.key
    }

    pub fn max_entries(&self) -> usize {
        self.max_entries
    }

    pub fn upsert_user(
        &self,
        con: &mut dyn redis::ConnectionLike,
        user_id: &str,
        score: f64,
        metadata: Option<Metadata>,
    ) -> RedisResult<LeaderboardEntry> {
        let payload = metadata.unwrap_or_default();

        let mut pipe = redis::pipe();
        pipe.atomic().cmd("ZADD").arg(&self.key).arg(score).arg(user_id);
        if !payload.is_empty() {
            pipe.cmd("HSET")
                .arg(self.metadata_key(user_id))
                .arg(flatten_metadata(&payload));
        }
        pipe.query::<()>(con)?;

        let trimmed_user_ids = self.trim_to_max_entries(con)?;
        Ok(self
            .get_user_entry(con, user_id)?
            .unwrap_or_else(|| LeaderboardEntry::new(0, user_id, score, payload, trimmed_user_ids.clone()))
            .with_trimmed(trimmed_user_ids))
    }

    pub fn increment_score(
        &self,
        con: &mut dyn redis::ConnectionLike,
        user_id: &str,
        amount: f64,
        metadata: Option<Metadata>,
    ) -> RedisResult<LeaderboardEntry> {
        let payload = metadata.unwrap_or_default();
        let mut pipe = redis::pipe();
        pipe.atomic()
            .cmd("ZINCRBY")
            .arg(&self.key)
            .arg(amount)
            .arg(user_id);
        if !payload.is_empty() {
            pipe.cmd("HSET")
                .arg(self.metadata_key(user_id))
                .arg(flatten_metadata(&payload));
        }
        let results: Vec<redis::Value> = pipe.query(con)?;
        let new_score = parse_score_value(results.first()).unwrap_or(0.0);

        let trimmed_user_ids = self.trim_to_max_entries(con)?;
        Ok(self
            .get_user_entry(con, user_id)?
            .unwrap_or_else(|| LeaderboardEntry::new(0, user_id, new_score, payload, trimmed_user_ids.clone()))
            .with_trimmed(trimmed_user_ids))
    }

    pub fn set_max_entries(
        &mut self,
        con: &mut dyn redis::ConnectionLike,
        max_entries: usize,
    ) -> RedisResult<Vec<String>> {
        self.max_entries = normalize_positive_int(max_entries, "max_entries");
        self.trim_to_max_entries(con)
    }

    pub fn get_top(
        &self,
        con: &mut dyn redis::ConnectionLike,
        count: usize,
    ) -> RedisResult<Vec<LeaderboardEntry>> {
        let count = normalize_positive_int(count, "count");
        let entries = zrevrange_with_scores(con, &self.key, 0, (count - 1) as isize)?;
        self.hydrate_entries(con, entries, 1)
    }

    pub fn get_around_rank(
        &self,
        con: &mut dyn redis::ConnectionLike,
        rank: usize,
        count: usize,
    ) -> RedisResult<Vec<LeaderboardEntry>> {
        let rank = normalize_positive_int(rank, "rank");
        let count = normalize_positive_int(count, "count");
        let total_entries = self.get_size(con)? as usize;
        if total_entries == 0 {
            return Ok(vec![]);
        }
        if total_entries <= count {
            return self.list_all(con);
        }

        let half_window = count / 2;
        let mut start = rank.saturating_sub(1 + half_window);
        let max_start = total_entries - count;
        if start > max_start {
            start = max_start;
        }
        let end = start + count - 1;

        let entries = zrevrange_with_scores(con, &self.key, start, end as isize)?;
        self.hydrate_entries(con, entries, start + 1)
    }

    pub fn get_rank(
        &self,
        con: &mut dyn redis::ConnectionLike,
        user_id: &str,
    ) -> RedisResult<Option<usize>> {
        let rank: Option<usize> = redis::cmd("ZREVRANK").arg(&self.key).arg(user_id).query(con)?;
        Ok(rank.map(|value| value + 1))
    }

    pub fn get_user_metadata(
        &self,
        con: &mut dyn redis::ConnectionLike,
        user_id: &str,
    ) -> RedisResult<Metadata> {
        redis::cmd("HGETALL")
            .arg(self.metadata_key(user_id))
            .query(con)
    }

    pub fn get_user_entry(
        &self,
        con: &mut dyn redis::ConnectionLike,
        user_id: &str,
    ) -> RedisResult<Option<LeaderboardEntry>> {
        let score: Option<f64> = redis::cmd("ZSCORE").arg(&self.key).arg(user_id).query(con)?;
        let rank = self.get_rank(con, user_id)?;
        match (score, rank) {
            (Some(score), Some(rank)) => Ok(Some(LeaderboardEntry::new(
                rank,
                user_id,
                score,
                self.get_user_metadata(con, user_id)?,
                vec![],
            ))),
            _ => Ok(None),
        }
    }

    pub fn list_all(&self, con: &mut dyn redis::ConnectionLike) -> RedisResult<Vec<LeaderboardEntry>> {
        let entries = zrevrange_with_scores(con, &self.key, 0, -1)?;
        self.hydrate_entries(con, entries, 1)
    }

    pub fn get_size(&self, con: &mut dyn redis::ConnectionLike) -> RedisResult<u64> {
        redis::cmd("ZCARD").arg(&self.key).query(con)
    }

    pub fn delete_user(
        &self,
        con: &mut dyn redis::ConnectionLike,
        user_id: &str,
    ) -> RedisResult<bool> {
        let (removed, _): (u64, u64) = redis::pipe()
            .atomic()
            .cmd("ZREM")
            .arg(&self.key)
            .arg(user_id)
            .cmd("DEL")
            .arg(self.metadata_key(user_id))
            .query(con)?;
        Ok(removed == 1)
    }

    pub fn clear(&self, con: &mut dyn redis::ConnectionLike) -> RedisResult<()> {
        let user_ids: Vec<String> = redis::cmd("ZRANGE").arg(&self.key).arg(0).arg(-1).query(con)?;
        let mut cmd = redis::cmd("DEL");
        cmd.arg(&self.key);
        for user_id in user_ids {
            cmd.arg(self.metadata_key(&user_id));
        }
        let _: () = cmd.query(con)?;
        Ok(())
    }

    fn metadata_key(&self, user_id: &str) -> String {
        format!("{}:user:{}", self.key, user_id)
    }

    fn trim_to_max_entries(&self, con: &mut dyn redis::ConnectionLike) -> RedisResult<Vec<String>> {
        let overflow = self.get_size(con)? as i64 - self.max_entries as i64;
        if overflow <= 0 {
            return Ok(vec![]);
        }

        let trimmed_user_ids: Vec<String> = redis::cmd("ZRANGE")
            .arg(&self.key)
            .arg(0)
            .arg(overflow - 1)
            .query(con)?;
        if trimmed_user_ids.is_empty() {
            return Ok(vec![]);
        }

        let _: () = redis::cmd("ZREMRANGEBYRANK")
            .arg(&self.key)
            .arg(0)
            .arg(overflow - 1)
            .query(con)?;
        let _: () = redis::cmd("DEL")
            .arg(trimmed_user_ids.iter().map(|user_id| self.metadata_key(user_id)).collect::<Vec<_>>())
            .query(con)?;
        Ok(trimmed_user_ids)
    }

    fn hydrate_entries(
        &self,
        con: &mut dyn redis::ConnectionLike,
        entries: Vec<(String, f64)>,
        start_rank: usize,
    ) -> RedisResult<Vec<LeaderboardEntry>> {
        let mut hydrated = Vec::with_capacity(entries.len());
        for (index, (user_id, score)) in entries.into_iter().enumerate() {
            hydrated.push(LeaderboardEntry::new(
                start_rank + index,
                &user_id,
                score,
                self.get_user_metadata(con, &user_id)?,
                vec![],
            ));
        }
        Ok(hydrated)
    }
}

impl AsyncRedisLeaderboard {
    pub fn new(key: impl Into<String>, max_entries: usize) -> Self {
        Self {
            key: key.into(),
            max_entries: normalize_positive_int(max_entries, "max_entries"),
        }
    }

    pub fn key(&self) -> &str {
        &self.key
    }

    pub fn max_entries(&self) -> usize {
        self.max_entries
    }

    pub async fn upsert_user(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
        user_id: &str,
        score: f64,
        metadata: Option<Metadata>,
    ) -> RedisResult<LeaderboardEntry> {
        let payload = metadata.unwrap_or_default();
        let mut pipe = redis::pipe();
        pipe.atomic().cmd("ZADD").arg(&self.key).arg(score).arg(user_id);
        if !payload.is_empty() {
            pipe.cmd("HSET")
                .arg(self.metadata_key(user_id))
                .arg(flatten_metadata(&payload));
        }
        pipe.query_async::<_, ()>(con).await?;

        let trimmed_user_ids = self.trim_to_max_entries(con).await?;
        Ok(self
            .get_user_entry(con, user_id)
            .await?
            .unwrap_or_else(|| LeaderboardEntry::new(0, user_id, score, payload, trimmed_user_ids.clone()))
            .with_trimmed(trimmed_user_ids))
    }

    pub async fn increment_score(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
        user_id: &str,
        amount: f64,
        metadata: Option<Metadata>,
    ) -> RedisResult<LeaderboardEntry> {
        let payload = metadata.unwrap_or_default();
        let mut pipe = redis::pipe();
        pipe.atomic()
            .cmd("ZINCRBY")
            .arg(&self.key)
            .arg(amount)
            .arg(user_id);
        if !payload.is_empty() {
            pipe.cmd("HSET")
                .arg(self.metadata_key(user_id))
                .arg(flatten_metadata(&payload));
        }
        let results: Vec<redis::Value> = pipe.query_async(con).await?;
        let new_score = parse_score_value(results.first()).unwrap_or(0.0);

        let trimmed_user_ids = self.trim_to_max_entries(con).await?;
        Ok(self
            .get_user_entry(con, user_id)
            .await?
            .unwrap_or_else(|| LeaderboardEntry::new(0, user_id, new_score, payload, trimmed_user_ids.clone()))
            .with_trimmed(trimmed_user_ids))
    }

    pub async fn set_max_entries(
        &mut self,
        con: &mut redis::aio::MultiplexedConnection,
        max_entries: usize,
    ) -> RedisResult<Vec<String>> {
        self.max_entries = normalize_positive_int(max_entries, "max_entries");
        self.trim_to_max_entries(con).await
    }

    pub async fn get_top(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
        count: usize,
    ) -> RedisResult<Vec<LeaderboardEntry>> {
        let count = normalize_positive_int(count, "count");
        let entries = zrevrange_with_scores_async(con, &self.key, 0, count as isize - 1).await?;
        self.hydrate_entries(con, entries, 1).await
    }

    pub async fn get_around_rank(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
        rank: usize,
        count: usize,
    ) -> RedisResult<Vec<LeaderboardEntry>> {
        let rank = normalize_positive_int(rank, "rank");
        let count = normalize_positive_int(count, "count");
        let total_entries = self.get_size(con).await? as usize;
        if total_entries == 0 {
            return Ok(vec![]);
        }
        if total_entries <= count {
            return self.list_all(con).await;
        }

        let half_window = count / 2;
        let mut start = rank.saturating_sub(1 + half_window);
        let max_start = total_entries - count;
        if start > max_start {
            start = max_start;
        }
        let end = start + count - 1;

        let entries = zrevrange_with_scores_async(con, &self.key, start as isize, end as isize).await?;
        self.hydrate_entries(con, entries, start + 1).await
    }

    pub async fn get_rank(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
        user_id: &str,
    ) -> RedisResult<Option<usize>> {
        let rank: Option<usize> = redis::cmd("ZREVRANK").arg(&self.key).arg(user_id).query_async(con).await?;
        Ok(rank.map(|value| value + 1))
    }

    pub async fn get_user_metadata(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
        user_id: &str,
    ) -> RedisResult<Metadata> {
        redis::cmd("HGETALL")
            .arg(self.metadata_key(user_id))
            .query_async(con)
            .await
    }

    pub async fn get_user_entry(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
        user_id: &str,
    ) -> RedisResult<Option<LeaderboardEntry>> {
        let score: Option<f64> = redis::cmd("ZSCORE").arg(&self.key).arg(user_id).query_async(con).await?;
        let rank = self.get_rank(con, user_id).await?;
        match (score, rank) {
            (Some(score), Some(rank)) => Ok(Some(LeaderboardEntry::new(
                rank,
                user_id,
                score,
                self.get_user_metadata(con, user_id).await?,
                vec![],
            ))),
            _ => Ok(None),
        }
    }

    pub async fn list_all(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
    ) -> RedisResult<Vec<LeaderboardEntry>> {
        let entries = zrevrange_with_scores_async(con, &self.key, 0, -1).await?;
        self.hydrate_entries(con, entries, 1).await
    }

    pub async fn get_size(&self, con: &mut redis::aio::MultiplexedConnection) -> RedisResult<u64> {
        redis::cmd("ZCARD").arg(&self.key).query_async(con).await
    }

    pub async fn clear(&self, con: &mut redis::aio::MultiplexedConnection) -> RedisResult<()> {
        let user_ids: Vec<String> = redis::cmd("ZRANGE").arg(&self.key).arg(0).arg(-1).query_async(con).await?;
        let mut cmd = redis::cmd("DEL");
        cmd.arg(&self.key);
        for user_id in user_ids {
            cmd.arg(self.metadata_key(&user_id));
        }
        let _: () = cmd.query_async(con).await?;
        Ok(())
    }

    fn metadata_key(&self, user_id: &str) -> String {
        format!("{}:user:{}", self.key, user_id)
    }

    async fn trim_to_max_entries(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
    ) -> RedisResult<Vec<String>> {
        let overflow = self.get_size(con).await? as i64 - self.max_entries as i64;
        if overflow <= 0 {
            return Ok(vec![]);
        }

        let trimmed_user_ids: Vec<String> = redis::cmd("ZRANGE")
            .arg(&self.key)
            .arg(0)
            .arg(overflow - 1)
            .query_async(con)
            .await?;
        if trimmed_user_ids.is_empty() {
            return Ok(vec![]);
        }

        let _: () = redis::cmd("ZREMRANGEBYRANK")
            .arg(&self.key)
            .arg(0)
            .arg(overflow - 1)
            .query_async(con)
            .await?;
        let _: () = redis::cmd("DEL")
            .arg(trimmed_user_ids.iter().map(|user_id| self.metadata_key(user_id)).collect::<Vec<_>>())
            .query_async(con)
            .await?;
        Ok(trimmed_user_ids)
    }

    async fn hydrate_entries(
        &self,
        con: &mut redis::aio::MultiplexedConnection,
        entries: Vec<(String, f64)>,
        start_rank: usize,
    ) -> RedisResult<Vec<LeaderboardEntry>> {
        let mut hydrated = Vec::with_capacity(entries.len());
        for (index, (user_id, score)) in entries.into_iter().enumerate() {
            hydrated.push(LeaderboardEntry::new(
                start_rank + index,
                &user_id,
                score,
                self.get_user_metadata(con, &user_id).await?,
                vec![],
            ));
        }
        Ok(hydrated)
    }
}

impl LeaderboardEntry {
    fn with_trimmed(mut self, trimmed_user_ids: Vec<String>) -> Self {
        self.trimmed_user_ids = trimmed_user_ids;
        self
    }
}

pub fn metadata_map(entries: &[(&str, &str)]) -> Metadata {
    entries
        .iter()
        .map(|(key, value)| ((*key).to_string(), (*value).to_string()))
        .collect()
}

fn normalize_positive_int(value: usize, field_name: &str) -> usize {
    if value < 1 {
        panic!("{field_name} must be at least 1");
    }
    value
}

fn flatten_metadata(metadata: &Metadata) -> Vec<String> {
    metadata
        .iter()
        .flat_map(|(field, value)| [field.clone(), value.clone()])
        .collect()
}

fn parse_score_value(value: Option<&redis::Value>) -> Option<f64> {
    match value {
        Some(redis::Value::Int(v)) => Some(*v as f64),
        Some(redis::Value::Data(v)) => String::from_utf8_lossy(v).parse::<f64>().ok(),
        Some(redis::Value::Bulk(items)) => items.first().and_then(|value| parse_score_value(Some(value))),
        _ => None,
    }
}

fn zrevrange_with_scores(
    con: &mut dyn redis::ConnectionLike,
    key: &str,
    start: usize,
    end: isize,
) -> RedisResult<Vec<(String, f64)>> {
    redis::cmd("ZREVRANGE")
        .arg(key)
        .arg(start)
        .arg(end)
        .arg("WITHSCORES")
        .query(con)
}

async fn zrevrange_with_scores_async(
    con: &mut redis::aio::MultiplexedConnection,
    key: &str,
    start: isize,
    end: isize,
) -> RedisResult<Vec<(String, f64)>> {
    redis::cmd("ZREVRANGE")
        .arg(key)
        .arg(start)
        .arg(end)
        .arg("WITHSCORES")
        .query_async(con)
        .await
}
