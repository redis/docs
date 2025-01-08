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

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows | ibZ5kn0GSdrbnfHRWC1lDdKozn6YllcGIrDhmLEnt2K1rjgjL2kGKvbtfq9QEkumgGwk2a9zTjr0u5zztGHriQ== |
| Linux AppImage | bM6lbyeAHFX/f0sBehu9a9ifHsDvX8o/2qn91sdtyiRcIU+f31+Ch7K4NI4v226rgj6LvkFDWDNq6VQ4pyLAPA== |
| Linux Debian| ilD86T/+8gEgrZg8MS8Niv/8g54FPeEn1nZrUI6DA7KTl3owqzqD0npb8fdAdL6YtSRbSBUK2fXPQ6GRXWZ/GA== |
| MacOS Intel | pSy3CvRfVIT3O7BXUPMUoONRaZCOA1965tF9T19gZ1NnUn9YkjWlNXdniQHZ4ALKbpC2q62ygt39xF6O52LxAw== |
| MacOS Apple silicon | uoz6I6MO4/j8UJo7eNje3dz4rx1KKj6mum/vXb2882fYPD/lK1cG0Q0OZu/lbxuk0xgzXfWv0MhMTIVVV+EADg== |
