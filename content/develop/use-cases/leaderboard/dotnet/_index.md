---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis leaderboard in C# with StackExchange.Redis and sorted sets
linkTitle: .NET leaderboard
title: Redis leaderboard with .NET
weight: 6
---

This guide shows you how to implement a Redis-backed leaderboard in C# with the [`StackExchange.Redis`]({{< relref "/develop/clients/dotnet" >}}) client library. It uses a sorted set to store rank order, Redis hashes to store per-user metadata, and a small local web server so you can explore the leaderboard interactively in your browser.

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

Add the StackExchange.Redis NuGet package to your project:

```bash
dotnet add package StackExchange.Redis
```

Or add it directly to your `.csproj` file:

```xml
<PackageReference Include="StackExchange.Redis" Version="2.7.33" />
```

## The .NET class

The `RedisLeaderboard` class wraps common leaderboard operations
([source](RedisLeaderboard.cs)):

```csharp
using StackExchange.Redis;

var redis = ConnectionMultiplexer.Connect("localhost:6379");
var db = redis.GetDatabase();

var board = new RedisLeaderboard(
    db: db,
    key: "leaderboard:demo",
    maxEntries: 100
);

var entry = board.UpsertUser(
    userId: "player-1",
    score: 1200,
    metadata: new Dictionary<string, string>
    {
        ["name"] = "Ada",
        ["description"] = "Solves production incidents before breakfast."
    }
);

var topPlayers = board.GetTop(5);
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

The `UpsertUser()` method writes the score, updates metadata, and then trims the board if it exceeds the configured limit:

```csharp
public LeaderboardEntry UpsertUser(
    string userId,
    double score,
    IReadOnlyDictionary<string, string>? metadata = null)
{
    var payload = CoerceMetadata(metadata);
    var batch = _db.CreateBatch();
    var scoreTask = batch.SortedSetAddAsync(_key, userId, score);
    Task metadataTask = Task.CompletedTask;
    if (payload.Count > 0)
    {
        metadataTask = batch.HashSetAsync(
            MetadataKey(userId),
            payload.Select(pair => new HashEntry(pair.Key, pair.Value)).ToArray());
    }
    batch.Execute();
    Task.WaitAll(scoreTask, metadataTask);

    var trimmedUserIds = TrimToMaxEntries();
    var entry = GetUserEntry(userId);
    return entry with { TrimmedUserIds = trimmedUserIds };
}
```

To fetch users around a rank, the implementation converts the requested rank and count into a reverse range window:

```csharp
public IReadOnlyList<LeaderboardEntry> GetAroundRank(int rank, int count)
{
    var normalizedRank = NormalizePositiveInt(rank, nameof(rank));
    var normalizedCount = NormalizePositiveInt(count, nameof(count));
    var totalEntries = (int)GetSize();

    if (totalEntries <= normalizedCount)
    {
        return ListAll();
    }

    var halfWindow = normalizedCount / 2;
    var start = Math.Max(0, normalizedRank - 1 - halfWindow);
    var maxStart = totalEntries - normalizedCount;
    if (start > maxStart)
    {
        start = maxStart;
    }
    var end = start + normalizedCount - 1;

    var entries = _db.SortedSetRangeByRankWithScores(
        _key,
        start,
        end,
        Order.Descending);
    return HydrateEntries(entries, start + 1);
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
([source](Program.cs)):

```bash
dotnet run
```

The demo provides an interactive web interface where you can:

* Add or update a player score and metadata
* Increase a player's score incrementally
* View the top `n` players on the leaderboard
* View the `n` players around a chosen rank
* Change the maximum number of entries the leaderboard keeps
* Reset the demo dataset to a known starting state

The demo assumes Redis is running on `localhost:6379` but you can specify a different host and port using the `--redis-host HOST` and `--redis-port PORT` command-line arguments. Visit `http://localhost:8080` in your browser to try it out.

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
