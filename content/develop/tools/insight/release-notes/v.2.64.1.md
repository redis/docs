---
Title: Redis Insight v2.64.1, December 2024
linkTitle: v2.64.1 (December 2024)
date: 2024-12-27 00:00:00 +0000
description: Redis Insight v2.64.1
weight: 1

---
## 2.64.1 (December 2024)
This is a maintenance release for Redis Insight 2.64.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Details

- [#4236](https://github.com/RedisInsight/RedisInsight/pull/4236) Reverts the change to use JSONPath ($) by default rather than (.). These changes could cause issues with shards in Redis Enterprise Active-Active databases.

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows |  |
| Linux AppImage |  |
| Linux Debian|  |
| MacOS Intel |  |
| MacOS Apple silicon |  |
