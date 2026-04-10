---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis leaderboard in JavaScript with node-redis and sorted sets
linkTitle: node-redis leaderboard
title: Redis leaderboard with node-redis
weight: 2
---

This guide shows you how to implement a Redis-backed leaderboard in JavaScript with [`node-redis`]({{< relref "/develop/clients/nodejs" >}}). It uses a sorted set to store rank order, Redis hashes to store per-user metadata, and a small local web server so you can explore the leaderboard interactively in your browser.

## Overview

Leaderboards are a classic Redis pattern. A sorted set stores each member together with a numeric score, and Redis maintains the ranking order automatically.

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

Install the `redis` package from npm:

```bash
npm install redis
```

## The JavaScript leaderboard

The `RedisLeaderboard` class wraps common leaderboard operations
([source](leaderboard.js)):

```javascript
const { createClient } = require("redis");
const { RedisLeaderboard } = require("./leaderboard");

const client = createClient({ url: "redis://localhost:6379" });
await client.connect();

const board = new RedisLeaderboard({
  redisClient: client,
  key: "leaderboard:demo",
  maxEntries: 100,
});

await board.upsertUser("player-1", 1200, {
  name: "Ada",
  description: "Solves production incidents before breakfast.",
});

await board.incrementScore("player-1", 25);
const topPlayers = await board.getTop(5);
const playersNearRank = await board.getAroundRank(10, 5);
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

The `upsertUser()` method writes the score, updates metadata, and then trims the board if it exceeds the configured limit:

```javascript
async upsertUser(userId, score, metadata = null) {
  const metadataKey = this._metadataKey(userId);
  const payload = this._coerceMetadata(metadata);

  const multi = this.redis.multi();
  multi.zAdd(this.key, [{ score: Number(score), value: userId }]);
  if (Object.keys(payload).length > 0) {
    multi.hSet(metadataKey, payload);
  }
  await multi.exec();

  const trimmedUserIds = await this._trimToMaxEntries();
  const entry = await this.getUserEntry(userId);
  return entry
    ? { ...entry, trimmedUserIds }
    : { userId, score: Number(score), metadata: payload, trimmedUserIds };
}
```

To fetch users around a rank, the implementation converts the requested rank and count into a reverse range window:

```javascript
async getAroundRank(rank, count) {
  const normalizedRank = this._normalizePositiveInt(rank, "rank");
  const normalizedCount = this._normalizePositiveInt(count, "count");
  const totalEntries = await this.getSize();

  if (totalEntries <= normalizedCount) {
    return this.listAll();
  }

  const halfWindow = Math.floor(normalizedCount / 2);
  let start = Math.max(0, normalizedRank - 1 - halfWindow);
  start = Math.min(start, totalEntries - normalizedCount);
  const end = start + normalizedCount - 1;

  const entries = await this._zRangeWithScoresRev(start, end);
  return this._hydrateEntries(entries, start + 1);
}
```

Because `node-redis` is asynchronous, every leaderboard operation returns a Promise. Use `await` or `.then()` to work with the results.

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
([source](demoServer.js)):

```bash
# Install dependencies
npm install redis

# Run the demo server
node demoServer.js
```

The demo server uses only built-in Node.js modules for HTTP handling:

* `http` for the web server
* `url` for query parsing and form decoding

It exposes a small interactive page where you can:

* Add or update a player score and metadata
* Increase a player's score incrementally
* View the top `n` players on the leaderboard
* View the `n` players around a chosen rank
* Change the maximum number of entries the leaderboard keeps
* Reset the demo dataset to a known starting state

After starting the server, visit `http://localhost:8080`.

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
