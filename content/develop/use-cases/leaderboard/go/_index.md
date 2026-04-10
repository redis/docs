---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis leaderboard in Go with go-redis and sorted sets
linkTitle: Go leaderboard
title: Redis leaderboard with Go
weight: 3
---

This guide shows you how to implement a Redis-backed leaderboard in Go with [`go-redis`]({{< relref "/develop/clients/go" >}}). It uses a sorted set to store rank order, Redis hashes to store per-user metadata, and an exported local demo server so you can explore the leaderboard interactively in your browser.

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

Install the `go-redis` package:

```bash
go get github.com/redis/go-redis/v9
```

## The Go package

The `RedisLeaderboard` type wraps common leaderboard operations
([source](leaderboard.go)):

```go
package main

import (
    "context"
    "fmt"
    "log"

    leaderboard "leaderboard"

    "github.com/redis/go-redis/v9"
)

func main() {
    ctx := context.Background()

    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    board := leaderboard.NewRedisLeaderboard(leaderboard.Config{
        Client:     rdb,
        Key:        "leaderboard:demo",
        MaxEntries: 100,
    })

    _, err := board.UpsertUser(ctx, "player-1", 1200, map[string]string{
        "name":        "Ada",
        "description": "Solves production incidents before breakfast.",
    })
    if err != nil {
        log.Fatal(err)
    }

    if _, err := board.IncrementScore(ctx, "player-1", 25, nil); err != nil {
        log.Fatal(err)
    }

    topPlayers, err := board.GetTop(ctx, 5)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(topPlayers)
}
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

```go
func (lb *RedisLeaderboard) UpsertUser(
    ctx context.Context,
    userID string,
    score float64,
    metadata map[string]string,
) (*Entry, error) {
    metadataKey := lb.metadataKey(userID)

    pipe := lb.client.TxPipeline()
    pipe.ZAdd(ctx, lb.key, redis.Z{
        Score:  score,
        Member: userID,
    })
    if len(metadata) > 0 {
        payload := make(map[string]any, len(metadata))
        for field, value := range metadata {
            payload[field] = value
        }
        pipe.HSet(ctx, metadataKey, payload)
    }
    if _, err := pipe.Exec(ctx); err != nil {
        return nil, err
    }

    trimmedUserIDs, err := lb.trimToMaxEntries(ctx)
    if err != nil {
        return nil, err
    }

    entry, err := lb.GetUserEntry(ctx, userID)
    if err != nil {
        return nil, err
    }
    if entry != nil {
        entry.TrimmedUserIDs = trimmedUserIDs
    }
    return entry, nil
}
```

To fetch users around a rank, the implementation converts the requested rank and count into a reverse range window:

```go
func (lb *RedisLeaderboard) GetAroundRank(
    ctx context.Context,
    rank int,
    count int,
) ([]Entry, error) {
    normalizedRank, err := normalizePositiveInt(rank, "rank")
    if err != nil {
        return nil, err
    }
    normalizedCount, err := normalizePositiveInt(count, "count")
    if err != nil {
        return nil, err
    }

    totalEntries, err := lb.GetSize(ctx)
    if err != nil {
        return nil, err
    }

    if totalEntries <= int64(normalizedCount) {
        return lb.ListAll(ctx)
    }

    halfWindow := normalizedCount / 2
    start := max(0, normalizedRank-1-halfWindow)
    maxStart := int(totalEntries) - normalizedCount
    if start > maxStart {
        start = maxStart
    }
    end := start + normalizedCount - 1

    entries, err := lb.client.ZRangeArgsWithScores(ctx, redis.ZRangeArgs{
        Key:   lb.key,
        Start: start,
        Stop:  end,
        Rev:   true,
    }).Result()
    if err != nil {
        return nil, err
    }

    return lb.hydrateEntries(ctx, entries, start+1)
}
```

Go's `context.Context` is passed to every call, allowing you to set deadlines, propagate cancellation, and control request lifetimes explicitly.

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
([source](demo_server.go)):

To run the demo, create a small `main.go` file in a separate directory that imports this package and calls `RunDemoServer()`:

```go
package main

import leaderboard "leaderboard"

func main() { leaderboard.RunDemoServer() }
```

Then build and run:

```bash
# Install dependencies
go get github.com/redis/go-redis/v9

# Build and run the demo server
go build -o demo ./...
./demo
```

The demo server uses the Go standard library for HTTP handling and exposes a small interactive page where you can:

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
