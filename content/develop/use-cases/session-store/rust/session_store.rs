//! Redis-backed session storage for Rust web applications.
//!
//! This module stores session data in Redis hashes and uses key expiration
//! to remove inactive sessions automatically.

use redis::{AsyncCommands, Commands, ErrorKind, RedisError, RedisResult};
use std::collections::{HashMap, HashSet};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

/// Store session data in Redis using hash keys and TTL-based expiration.
#[derive(Debug, Clone)]
pub struct RedisSessionStore {
    prefix: String,
    ttl: usize,
}

impl RedisSessionStore {
    /// Reserved internal session fields.
    pub fn reserved_session_fields() -> HashSet<&'static str> {
        HashSet::from(["created_at", "last_accessed_at", "session_ttl"])
    }

    /// Create a new session store.
    pub fn new(prefix: &str, ttl: usize) -> RedisResult<Self> {
        let normalized_ttl = Self::normalize_ttl_value(ttl)?;
        Ok(Self {
            prefix: if prefix.is_empty() {
                "session:".to_string()
            } else {
                prefix.to_string()
            },
            ttl: normalized_ttl,
        })
    }

    /// Create a new session and return its opaque session ID.
    #[allow(dead_code)]
    pub fn create_session(
        &self,
        con: &mut impl redis::ConnectionLike,
        data: &HashMap<String, String>,
        ttl: Option<usize>,
    ) -> RedisResult<String> {
        let session_id = self.create_session_id();
        let key = self.session_key(&session_id);
        let now = self.timestamp()?;
        let session_ttl = self.normalize_ttl(ttl)?;

        let payload = self.session_payload(data, &now, session_ttl);
        let payload_pairs = Self::hash_pairs(&payload);

        let _: () = con.hset_multiple(&key, &payload_pairs)?;
        let _: bool = con.expire(&key, session_ttl as i64)?;

        Ok(session_id)
    }

    /// Create a new session asynchronously and return its opaque session ID.
    pub async fn create_session_async<C>(
        &self,
        con: &mut C,
        data: &HashMap<String, String>,
        ttl: Option<usize>,
    ) -> RedisResult<String>
    where
        C: redis::aio::ConnectionLike + Send,
    {
        let session_id = self.create_session_id();
        let key = self.session_key(&session_id);
        let now = self.timestamp()?;
        let session_ttl = self.normalize_ttl(ttl)?;

        let payload = self.session_payload(data, &now, session_ttl);
        let payload_pairs = Self::hash_pairs(&payload);

        let _: () = con.hset_multiple(&key, &payload_pairs).await?;
        let _: bool = con.expire(&key, session_ttl as i64).await?;

        Ok(session_id)
    }

    /// Return the configured TTL for a session.
    #[allow(dead_code)]
    pub fn get_configured_ttl(
        &self,
        con: &mut impl redis::ConnectionLike,
        session_id: &str,
    ) -> RedisResult<Option<usize>> {
        let stored_ttl: Option<usize> = con.hget(self.session_key(session_id), "session_ttl")?;
        match stored_ttl {
            Some(ttl) => Ok(Some(self.normalize_ttl(Some(ttl))?)),
            None => Ok(None),
        }
    }

    /// Return the configured TTL for a session asynchronously.
    pub async fn get_configured_ttl_async<C>(
        &self,
        con: &mut C,
        session_id: &str,
    ) -> RedisResult<Option<usize>>
    where
        C: redis::aio::ConnectionLike + Send,
    {
        let stored_ttl: Option<usize> = con.hget(self.session_key(session_id), "session_ttl").await?;
        match stored_ttl {
            Some(ttl) => Ok(Some(self.normalize_ttl(Some(ttl))?)),
            None => Ok(None),
        }
    }

    /// Return session data for a session ID, or None if it does not exist.
    #[allow(dead_code)]
    pub fn get_session(
        &self,
        con: &mut impl redis::ConnectionLike,
        session_id: &str,
        refresh_ttl: bool,
    ) -> RedisResult<Option<HashMap<String, String>>> {
        let key = self.session_key(session_id);
        let session: HashMap<String, String> = con.hgetall(&key)?;
        if !self.is_valid_session(&session) {
            return Ok(None);
        }

        if !refresh_ttl {
            return Ok(Some(session));
        }

        let session_ttl = self.normalize_ttl(Some(Self::parse_ttl(&session)?))?;
        let now = self.timestamp()?;

        let _: usize = con.hset(&key, "last_accessed_at", now)?;
        let _: bool = con.expire(&key, session_ttl as i64)?;
        let refreshed: HashMap<String, String> = con.hgetall(&key)?;

        Ok(self.is_valid_session(&refreshed).then_some(refreshed))
    }

    /// Return session data for a session ID asynchronously, or None if it does not exist.
    pub async fn get_session_async<C>(
        &self,
        con: &mut C,
        session_id: &str,
        refresh_ttl: bool,
    ) -> RedisResult<Option<HashMap<String, String>>>
    where
        C: redis::aio::ConnectionLike + Send,
    {
        let key = self.session_key(session_id);
        let session: HashMap<String, String> = con.hgetall(&key).await?;
        if !self.is_valid_session(&session) {
            return Ok(None);
        }

        if !refresh_ttl {
            return Ok(Some(session));
        }

        let session_ttl = self.normalize_ttl(Some(Self::parse_ttl(&session)?))?;
        let now = self.timestamp()?;

        let _: usize = con.hset(&key, "last_accessed_at", now).await?;
        let _: bool = con.expire(&key, session_ttl as i64).await?;
        let refreshed: HashMap<String, String> = con.hgetall(&key).await?;

        Ok(self.is_valid_session(&refreshed).then_some(refreshed))
    }

    /// Update session fields and refresh the TTL.
    #[allow(dead_code)]
    pub fn update_session(
        &self,
        con: &mut impl redis::ConnectionLike,
        session_id: &str,
        data: &HashMap<String, String>,
    ) -> RedisResult<bool> {
        let key = self.session_key(session_id);
        let session: HashMap<String, String> = con.hgetall(&key)?;
        if !self.is_valid_session(&session) {
            return Ok(false);
        }

        let mut payload: HashMap<String, String> = data
            .iter()
            .filter(|(field, _)| !Self::reserved_session_fields().contains(field.as_str()))
            .map(|(field, value)| (field.clone(), value.clone()))
            .collect();

        if payload.is_empty() {
            return Ok(true);
        }

        let session_ttl = self.normalize_ttl(Some(Self::parse_ttl(&session)?))?;
        payload.insert("last_accessed_at".to_string(), self.timestamp()?);
        let payload_pairs = Self::hash_pairs(&payload);

        let _: () = con.hset_multiple(&key, &payload_pairs)?;
        let _: bool = con.expire(&key, session_ttl as i64)?;
        Ok(true)
    }

    /// Update session fields asynchronously and refresh the TTL.
    #[allow(dead_code)]
    pub async fn update_session_async<C>(
        &self,
        con: &mut C,
        session_id: &str,
        data: &HashMap<String, String>,
    ) -> RedisResult<bool>
    where
        C: redis::aio::ConnectionLike + Send,
    {
        let key = self.session_key(session_id);
        let session: HashMap<String, String> = con.hgetall(&key).await?;
        if !self.is_valid_session(&session) {
            return Ok(false);
        }

        let mut payload: HashMap<String, String> = data
            .iter()
            .filter(|(field, _)| !Self::reserved_session_fields().contains(field.as_str()))
            .map(|(field, value)| (field.clone(), value.clone()))
            .collect();

        if payload.is_empty() {
            return Ok(true);
        }

        let session_ttl = self.normalize_ttl(Some(Self::parse_ttl(&session)?))?;
        payload.insert("last_accessed_at".to_string(), self.timestamp()?);
        let payload_pairs = Self::hash_pairs(&payload);

        let _: () = con.hset_multiple(&key, &payload_pairs).await?;
        let _: bool = con.expire(&key, session_ttl as i64).await?;
        Ok(true)
    }

    /// Increment a numeric session field and refresh the TTL.
    #[allow(dead_code)]
    pub fn increment_field(
        &self,
        con: &mut impl redis::ConnectionLike,
        session_id: &str,
        field: &str,
        amount: i64,
    ) -> RedisResult<Option<i64>> {
        let key = self.session_key(session_id);
        let session: HashMap<String, String> = con.hgetall(&key)?;
        if !self.is_valid_session(&session) {
            return Ok(None);
        }

        let session_ttl = self.normalize_ttl(Some(Self::parse_ttl(&session)?))?;
        let new_value: i64 = con.hincr(&key, field, amount)?;
        let _: usize = con.hset(&key, "last_accessed_at", self.timestamp()?)?;
        let _: bool = con.expire(&key, session_ttl as i64)?;

        Ok(Some(new_value))
    }

    /// Increment a numeric session field asynchronously and refresh the TTL.
    pub async fn increment_field_async<C>(
        &self,
        con: &mut C,
        session_id: &str,
        field: &str,
        amount: i64,
    ) -> RedisResult<Option<i64>>
    where
        C: redis::aio::ConnectionLike + Send,
    {
        let key = self.session_key(session_id);
        let session: HashMap<String, String> = con.hgetall(&key).await?;
        if !self.is_valid_session(&session) {
            return Ok(None);
        }

        let session_ttl = self.normalize_ttl(Some(Self::parse_ttl(&session)?))?;
        let new_value: i64 = con.hincr(&key, field, amount).await?;
        let _: usize = con.hset(&key, "last_accessed_at", self.timestamp()?).await?;
        let _: bool = con.expire(&key, session_ttl as i64).await?;

        Ok(Some(new_value))
    }

    /// Update the configured TTL for a session and apply it immediately.
    #[allow(dead_code)]
    pub fn set_session_ttl(
        &self,
        con: &mut impl redis::ConnectionLike,
        session_id: &str,
        ttl: usize,
    ) -> RedisResult<bool> {
        let key = self.session_key(session_id);
        let session: HashMap<String, String> = con.hgetall(&key)?;
        if !self.is_valid_session(&session) {
            return Ok(false);
        }

        let session_ttl = self.normalize_ttl(Some(ttl))?;
        let _: () = con.hset_multiple(
            &key,
            &[
                ("session_ttl", session_ttl.to_string()),
                ("last_accessed_at", self.timestamp()?),
            ],
        )?;
        let _: bool = con.expire(&key, session_ttl as i64)?;
        Ok(true)
    }

    /// Update the configured TTL for a session asynchronously and apply it immediately.
    pub async fn set_session_ttl_async<C>(
        &self,
        con: &mut C,
        session_id: &str,
        ttl: usize,
    ) -> RedisResult<bool>
    where
        C: redis::aio::ConnectionLike + Send,
    {
        let key = self.session_key(session_id);
        let session: HashMap<String, String> = con.hgetall(&key).await?;
        if !self.is_valid_session(&session) {
            return Ok(false);
        }

        let session_ttl = self.normalize_ttl(Some(ttl))?;
        let payload = vec![
            ("session_ttl".to_string(), session_ttl.to_string()),
            ("last_accessed_at".to_string(), self.timestamp()?),
        ];
        let _: () = con.hset_multiple(&key, &payload).await?;
        let _: bool = con.expire(&key, session_ttl as i64).await?;
        Ok(true)
    }

    /// Delete a session from Redis.
    #[allow(dead_code)]
    pub fn delete_session(
        &self,
        con: &mut impl redis::ConnectionLike,
        session_id: &str,
    ) -> RedisResult<bool> {
        let deleted: i64 = con.del(self.session_key(session_id))?;
        Ok(deleted == 1)
    }

    /// Delete a session from Redis asynchronously.
    pub async fn delete_session_async<C>(
        &self,
        con: &mut C,
        session_id: &str,
    ) -> RedisResult<bool>
    where
        C: redis::aio::ConnectionLike + Send,
    {
        let deleted: i64 = con.del(self.session_key(session_id)).await?;
        Ok(deleted == 1)
    }

    /// Return the remaining TTL for a session in seconds.
    #[allow(dead_code)]
    pub fn get_ttl(
        &self,
        con: &mut impl redis::ConnectionLike,
        session_id: &str,
    ) -> RedisResult<i64> {
        con.ttl(self.session_key(session_id))
    }

    /// Return the remaining TTL for a session in seconds asynchronously.
    pub async fn get_ttl_async<C>(
        &self,
        con: &mut C,
        session_id: &str,
    ) -> RedisResult<i64>
    where
        C: redis::aio::ConnectionLike + Send,
    {
        con.ttl(self.session_key(session_id)).await
    }

    fn normalize_ttl(&self, ttl: Option<usize>) -> RedisResult<usize> {
        Self::normalize_ttl_value(ttl.unwrap_or(self.ttl))
    }

    fn normalize_ttl_value(ttl: usize) -> RedisResult<usize> {
        if ttl < 1 {
            Err(RedisError::from((ErrorKind::TypeError, "TTL must be at least 1 second")))
        } else {
            Ok(ttl)
        }
    }

    fn session_key(&self, session_id: &str) -> String {
        format!("{}{}", self.prefix, session_id)
    }

    fn timestamp(&self) -> RedisResult<String> {
        let mut ts = OffsetDateTime::now_utc()
            .replace_nanosecond(0)
            .map_err(|_| RedisError::from((ErrorKind::TypeError, "invalid timestamp")))?;
        ts = ts.to_offset(time::UtcOffset::UTC);
        let formatted = ts
            .format(&Rfc3339)
            .map_err(|_| RedisError::from((ErrorKind::TypeError, "invalid timestamp format")))?;
        Ok(formatted.replace('Z', "+00:00"))
    }

    fn create_session_id(&self) -> String {
        let bytes: [u8; 32] = rand::random();
        use base64::Engine;
        base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(bytes)
    }

    fn is_valid_session(&self, session: &HashMap<String, String>) -> bool {
        !session.is_empty()
            && Self::reserved_session_fields()
                .iter()
                .all(|field| session.contains_key(*field))
    }

    fn session_payload(
        &self,
        data: &HashMap<String, String>,
        now: &str,
        session_ttl: usize,
    ) -> HashMap<String, String> {
        let mut payload: HashMap<String, String> = data
            .iter()
            .filter(|(field, _)| !Self::reserved_session_fields().contains(field.as_str()))
            .map(|(field, value)| (field.clone(), value.clone()))
            .collect();

        payload.insert("created_at".to_string(), now.to_string());
        payload.insert("last_accessed_at".to_string(), now.to_string());
        payload.insert("session_ttl".to_string(), session_ttl.to_string());
        payload
    }

    fn hash_pairs(payload: &HashMap<String, String>) -> Vec<(String, String)> {
        payload
            .iter()
            .map(|(field, value)| (field.clone(), value.clone()))
            .collect()
    }

    fn parse_ttl(session: &HashMap<String, String>) -> RedisResult<usize> {
        session
            .get("session_ttl")
            .ok_or_else(|| RedisError::from((ErrorKind::TypeError, "missing session_ttl")))?
            .parse::<usize>()
            .map_err(|_| RedisError::from((ErrorKind::TypeError, "invalid session_ttl")))
    }
}
