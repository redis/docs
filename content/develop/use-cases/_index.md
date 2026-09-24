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

* [Rate limiting](/content/develop/use-cases/rate-limiter/_index.md) - Implement token bucket rate limiting with Redis
* [Session storage](/content/develop/use-cases/session-store/_index.md) - Store web sessions in Redis with TTL-based expiration
* [Time series dashboard](/content/develop/use-cases/time-series-dashboard/_index.md) - Build a rolling sensor graph demo with Redis time series data
* [Leaderboards](/content/develop/use-cases/leaderboard/_index.md) - Build a ranked leaderboard with sorted sets and user metadata
* [Cache-aside](/content/develop/use-cases/cache-aside/_index.md) - Cache database reads in Redis with TTL-bounded staleness
* [Job queue](/content/develop/use-cases/job-queue/_index.md) - Run a reliable background job queue with at-least-once delivery and visibility-timeout reclaim
* [Prefetch cache](/content/develop/use-cases/prefetch-cache/_index.md) - Pre-load reference data into Redis so every read is a cache hit, kept current by a CDC sync worker
* [Pub/sub messaging](/content/develop/use-cases/pub-sub/_index.md) - Broadcast real-time events to many consumers with channel and pattern subscriptions
* [Streaming](/content/develop/use-cases/streaming/_index.md) - Process ordered event streams with consumer groups, replay, and configurable retention
* [Recommendation engine](/content/develop/use-cases/recommendation-engine/_index.md) - Serve personalized recommendations under tight latency budgets by combining vector similarity with structured filters in a single Redis call
* [Feature store](/content/develop/use-cases/feature-store/_index.md) - Serve pre-computed ML features on the request path with mixed batch-and-streaming freshness using per-field TTL
* [Semantic cache](/content/develop/use-cases/semantic-cache/_index.md) - Reuse LLM responses for semantically similar queries to cut token costs and skip multi-second model calls on near-duplicate prompts
* [Memory layer](/content/develop/use-cases/memory-layer/_index.md) - Give AI agents persistent memory that spans sessions and tasks — working memory per thread, long-term semantic recall, and a time-ordered event log on one Redis instance
