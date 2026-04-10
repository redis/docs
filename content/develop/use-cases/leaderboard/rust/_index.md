---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement sync and async Redis leaderboards in Rust with redis-rs and sorted sets
linkTitle: Rust leaderboard
title: Redis leaderboard with Rust
weight: 9
---

This guide shows you how to implement Redis-backed leaderboards in Rust with the [`redis-rs`]({{< relref "/develop/clients/rust" >}}) client library. It includes both synchronous and asynchronous APIs, uses a sorted set to store rank order, stores per-user metadata in Redis hashes, and includes a small local web server so you can explore the leaderboard interactively in your browser.

## Overview

Leaderboards are a natural fit for Redis. A sorted set stores each member together with a numeric score, and Redis maintains the ranking order automatically.

That gives you:

* Fast score updates for existing users
* Simple top `n` leaderboard queries
* Efficient queries for entries around a specific rank position
* Straightforward trimming to a fixed leaderboard size
* A clean separation between rank data and richer user metadata

In this example, the leaderboard score data is stored in a sorted set called `leaderboard:demo`, and each user's metadata is stored in a hash such as `leaderboard:demo:user:player-17`.

## How it works

The flow looks like this:

1. Store each user ID in a sorted set with their score
2. Store per-user metadata in a separate Redis hash keyed by user ID
3. Fetch the highest-ranked users with a reverse range query
4. Fetch users around a given rank by calculating a rank window
5. Trim the leaderboard after updates so only the top configured entries remain

Separating rank data from metadata keeps leaderboard operations efficient while still letting the application render richer profile details.

## Installation

Add the `redis` crate to your `Cargo.toml`:

```toml
[dependencies]
redis = { version = "0.24", features = ["script", "tokio-comp"] }
tokio = { version = "1", features = ["full"] }
```

## Using the Rust module

The module provides both a synchronous `RedisLeaderboard` and an asynchronous `AsyncRedisLeaderboard`
([source](leaderboard.rs)).

### Synchronous usage

```rust
use redis::Client;

let client = Client::open("redis://localhost:6379/")?;
let mut con = client.get_connection()?;

let board = RedisLeaderboard::new("leaderboard:demo", 100);

board.upsert_user(
    &mut con,
    "player-1",
    1200.0,
    Some(metadata_map(&[
        ("name", "Ada"),
        ("description", "Solves production incidents before breakfast."),
    ])),
)?;

let top_players = board.get_top(&mut con, 5)?;
```

### Asynchronous usage

```rust
use redis::Client;

let client = Client::open("redis://localhost:6379/")?;
let mut con = client.get_multiplexed_async_connection().await?;

let board = AsyncRedisLeaderboard::new("leaderboard:demo", 100);

board.upsert_user(
    &mut con,
    "player-1",
    1200.0,
    Some(metadata_map(&[
        ("name", "Ada"),
        ("description", "Solves production incidents before breakfast."),
    ])),
).await?;

let top_players = board.get_top(&mut con, 5).await?;
```

### Data model

The implementation uses two Redis structures:

```text
leaderboard:demo
  player-1 => 1225
  player-2 => 1180
  player-3 => 1105

leaderboard:demo:user:player-1
  name = Ada
  description = Solves production incidents before breakfast.
```

The score data lives in the sorted set, while the user details live in hashes keyed by the same user ID.

The implementation uses:

* [`ZADD`]({{< relref "/commands/zadd" >}}) to add or update leaderboard scores
* [`ZRANGE`]({{< relref "/commands/zrange" >}}) with the `REV` option to fetch the highest-ranked members
* [`ZREVRANK`]({{< relref "/commands/zrevrank" >}}) to find a user's rank from the top
* [`ZREMRANGEBYRANK`]({{< relref "/commands/zremrangebyrank" >}}) to trim the lowest-ranked overflow entries
* [`HSET`]({{< relref "/commands/hset" >}}) and [`HGETALL`]({{< relref "/commands/hgetall" >}}) to store and load user metadata
* [`DEL`]({{< relref "/commands/del" >}}) to remove metadata for trimmed or deleted users

## Leaderboard implementation

The synchronous `upsert_user()` method writes the score, updates metadata, and then trims the board if it exceeds the configured limit:

```rust
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
    let entry = self.get_user_entry(con, user_id)?;
    Ok(entry.unwrap_or_else(|| LeaderboardEntry::new(0, user_id, score, payload, trimmed_user_ids)))
}
```

To fetch users around a rank, the implementation converts the requested rank and count into a reverse range window:

```rust
pub fn get_around_rank(
    &self,
    con: &mut dyn redis::ConnectionLike,
    rank: usize,
    count: usize,
) -> RedisResult<Vec<LeaderboardEntry>> {
    let total_entries = self.get_size(con)? as usize;
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

    let entries: Vec<(String, f64)> = redis::cmd("ZRANGE")
        .arg(&self.key)
        .arg(start)
        .arg(end)
        .arg("REV")
        .arg("WITHSCORES")
        .query(con)?;

    self.hydrate_entries(con, entries, start + 1)
}
```

## Metadata design

The leaderboard stores only user IDs and scores in the sorted set. Richer details stay in a separate per-user hash. That means the same user ID can be ranked efficiently while still exposing extra fields such as:

* Display name
* Short description
* Team or country
* Avatar URL
* Other lightweight profile fields

This is a useful pattern when the ranking view and the profile view need different data shapes.

## Running the demo

A local demo server is included to show the leaderboard in action
([source](demo_server.rs)):

```bash
cargo run --bin demo_server
```

The demo uses the async leaderboard implementation for the HTTP handlers and provides an interactive web interface where you can:

* Add or update a player score and metadata
* Increase a player's score incrementally
* View the top `n` players on the leaderboard
* View the `n` players around a chosen rank
* Change the maximum number of entries the leaderboard keeps
* Reset the demo dataset to a known starting state

The demo assumes Redis is running on `localhost:6379` but you can specify a different host using the `REDIS_URL` environment variable. Visit `http://localhost:8080` in your browser to try it out.

## Production usage

This guide uses a deliberately small local demo so you can focus on the Redis leaderboard pattern. In production, you will usually want to add more validation, tighter concurrency control, and application-specific lifecycle rules.

### Decide how ties should behave

Redis sorted sets order primarily by score. When two members have the same score, Redis uses the member value as a secondary ordering rule. If your application needs a different tie-breaker, you may want to encode it in the score or store additional state.

### Consider how you expire or archive old data

Some leaderboards are permanent, while others reset daily, weekly, or seasonally. Depending on your use case, you may want to:

* Namespace keys by season or event
* Snapshot historical results elsewhere
* Rebuild the current leaderboard from upstream data

### Keep metadata lightweight

Per-user hashes work best for small, frequently accessed profile details. Large profile documents or rarely used attributes are often better kept in another store, with Redis holding only the fields needed to render the leaderboard quickly.
