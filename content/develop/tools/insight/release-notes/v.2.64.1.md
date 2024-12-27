---
Title: Redis Insight v2.64.1, December 2024
linkTitle: v2.64.1 (December 2024)
date: 2024-12-27 00:00:00 +0000
description: Redis Insight v2.64.1
weight: 1

---
## 2.64.1 (December 2024)
This is a maintenance release for Redis Insight 2.64.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

### Details

- [#4236](https://github.com/RedisInsight/RedisInsight/pull/4236) Reverted the change to use the dollar sign ($) instead of the period character (.) to denote the root of a JSON data structure. The period character (.) continues to be used as the root identifier, resolving potential issues with shards in conflict-free replicated databases.

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows |  |
| Linux AppImage |  |
| Linux Debian|  |
| MacOS Intel |  |
| MacOS Apple silicon |  |
