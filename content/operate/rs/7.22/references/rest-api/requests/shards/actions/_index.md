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
url: '/operate/rs/7.22/references/rest-api/requests/shards/actions/'
---

## Migrate

| Method | Path | Description |
|--------|------|-------------|
| [POST]({{<relref "/operate/rs/7.22/references/rest-api/requests/shards/actions/migrate#post-multi-shards">}}) | `/v1/shards/actions/migrate` | Migrate multiple shards |
| [POST]({{<relref "/operate/rs/7.22/references/rest-api/requests/shards/actions/migrate#post-shard">}}) | `/v1/shards/{uid}/actions/migrate` | Migrate a specific shard |
