---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Learn how to implement common use cases with Redis
hideListLinks: true
linkTitle: Use cases
title: Redis use cases
weight: 50
---

This section provides practical examples and reference implementations for common Redis use cases.

## Available use cases

* [Rate limiting]({{< relref "/develop/use-cases/rate-limiter" >}}) - Implement token bucket rate limiting with Redis
* [Session storage]({{< relref "/develop/use-cases/session-store" >}}) - Store web sessions in Redis with TTL-based expiration
* [Time series dashboard]({{< relref "/develop/use-cases/time-series-dashboard" >}}) - Build a rolling sensor graph demo with Redis time series data
* [Leaderboards]({{< relref "/develop/use-cases/leaderboard" >}}) - Build a ranked leaderboard with sorted sets and user metadata
* [Cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}) - Cache database reads in Redis with TTL-bounded staleness
* [Job queue]({{< relref "/develop/use-cases/job-queue" >}}) - Run a reliable background job queue with at-least-once delivery and visibility-timeout reclaim
* [Prefetch cache]({{< relref "/develop/use-cases/prefetch-cache" >}}) - Pre-load reference data into Redis so every read is a cache hit, kept current by a CDC sync worker
* [Pub/sub messaging]({{< relref "/develop/use-cases/pub-sub" >}}) - Broadcast real-time events to many consumers with channel and pattern subscriptions
* [Streaming]({{< relref "/develop/use-cases/streaming" >}}) - Process ordered event streams with consumer groups, replay, and configurable retention
* [Recommendation engine]({{< relref "/develop/use-cases/recommendation-engine" >}}) - Serve personalized recommendations under tight latency budgets by combining vector similarity with structured filters in a single Redis call
* [Feature store]({{< relref "/develop/use-cases/feature-store" >}}) - Serve pre-computed ML features on the request path with mixed batch-and-streaming freshness using per-field TTL
* [Semantic cache]({{< relref "/develop/use-cases/semantic-cache" >}}) - Reuse LLM responses for semantically similar queries to cut token costs and skip multi-second model calls on near-duplicate prompts
