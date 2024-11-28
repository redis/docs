---
Title: Redis Insight v2.62.0, November 2024
linkTitle: v2.62.0 (November 2024)
date: 2024-11-27 00:00:00 +0000
description: Redis Insight v2.62
weight: 1

---
## 2.62 (November 2024)
This is the General Availability (GA) release of Redis Insight 2.62.

### Highlights 
- Support for multiple key name delimiters in Tree View, allowing more flexible browsing for databases with diverse key structures.
- Remain authenticated to [Redis Copilot](https://redis.io/docs/latest/develop/tools/insight/?utm_source=redisinsight&utm_medium=main&utm_campaign=tutorials#:~:text=for%20more%20information.-,Redis%20Copilot,-Redis%20Copilot%20is), even after reopening Redis Insight, for seamless and uninterrupted access with daily use.

### Details

**Features and improvements**
- [#4090](https://github.com/RedisInsight/RedisInsight/pull/4090) Added support for multiple key name delimiters in Tree View, enabling more flexible browsing of databases with varied key name patterns.
- [#3957](https://github.com/RedisInsight/RedisInsight/pull/3957) Remain authenticated to [Redis Copilot](https://redis.io/docs/latest/develop/tools/insight/?utm_source=redisinsight&utm_medium=main&utm_campaign=tutorials#:~:text=for%20more%20information.-,Redis%20Copilot,-Redis%20Copilot%20is), even after reopening Redis Insight, for seamless and uninterrupted access with daily use.
- [#3988](https://github.com/RedisInsight/RedisInsight/pull/3988), [#4059](https://github.com/RedisInsight/RedisInsight/pull/4059) Enhanced both the Java and PHP serialized formatters: the Java formatter now supports date and time data, while the PHP formatter includes UTF-8 encoding for better handling of special characters and multi-language data.
- [#4081](https://github.com/RedisInsight/RedisInsight/pull/4081) Introduced a unique theme key name with a proxy path prefix to prevent conflicts when multiple instances run on the same origin.
- [#2970](https://github.com/RedisInsight/RedisInsight/pull/4107) Upgraded to Electron 33.2.0 for enhanced security and compatibility with modern web standards.

**Bugs**
- [#4089](https://github.com/RedisInsight/RedisInsight/pull/4089) Resolved an issue where large integers in JSON keys were being rounded, ensuring data integrity.
