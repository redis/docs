---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build ranked leaderboards with Redis sorted sets and user metadata
linkTitle: Leaderboard
title: Redis leaderboard
weight: 3
---

This guide family shows how to build a leaderboard with Redis sorted sets and per-user metadata.

## Overview

Leaderboards are a natural fit for Redis because sorted sets keep members ordered by score while still allowing fast updates and range queries.

This pattern works well when you need to:

* Track scores for players, users, teams, or other ranked entities
* Fetch the top `n` entries quickly
* Show entries around a specific rank position
* Keep only the highest-ranked entries, such as the top 100
* Store richer user details separately from the ranking score

## Available implementations

* [redis-py]({{< relref "/develop/use-cases/leaderboard/redis-py" >}}) - Build a Python leaderboard with sorted sets, user metadata hashes, and a local interactive demo
* [node-redis]({{< relref "/develop/use-cases/leaderboard/nodejs" >}}) - Build a JavaScript leaderboard with sorted sets, user metadata hashes, and a local interactive demo
* [go-redis]({{< relref "/develop/use-cases/leaderboard/go" >}}) - Build a Go leaderboard with sorted sets, user metadata hashes, and a local interactive demo
* [Jedis]({{< relref "/develop/use-cases/leaderboard/java-jedis" >}}) - Build a Java leaderboard with sorted sets, user metadata hashes, and a local interactive demo
* [Lettuce]({{< relref "/develop/use-cases/leaderboard/java-lettuce" >}}) - Build async and reactive Java leaderboards with sorted sets, user metadata hashes, and a local interactive demo
* [.NET]({{< relref "/develop/use-cases/leaderboard/dotnet" >}}) - Build a C# leaderboard with sorted sets, user metadata hashes, and a local interactive demo
* [Rust]({{< relref "/develop/use-cases/leaderboard/rust" >}}) - Build sync and async Rust leaderboards with sorted sets, user metadata hashes, and a local interactive demo
