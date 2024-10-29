---
Title: Shard actions requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: REST API requests to perform shard actions
headerRange: '[1-2]'
hideListLinks: true
linkTitle: actions
weight: $weight
---

## Migrate

| Method | Path | Description |
|--------|------|-------------|
| [POST]({{<relref "/operate/rs/references/rest-api/requests/shards/actions/migrate#post-multi-shards">}}) | `/v1/shards/actions/migrate` | Migrate multiple shards |
| [POST]({{<relref "/operate/rs/references/rest-api/requests/shards/actions/migrate#post-shard">}}) | `/v1/shards/{uid}/actions/migrate` | Migrate a specific shard |
