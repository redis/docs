---
Title: RedisInsight v2.40.0, December 2023
linkTitle: v2.40.0 (December 2023)
date: 2023-12-27 00:00:00 +0000
description: RedisInsight v2.40
weight: 1
---
## 2.40 (December 2023)
This is the General Availability (GA) release of RedisInsight 2.40.

### Highlights
- To simplify in-app provisioning of a free [Redis Cloud](https://redis.com/comparisons/oss-vs-enterprise/?utm_source=redisinsight&utm_medium=rel_notes&utm_campaign=2_40) database to use with RedisInsight interactive tutorials, the recommended cloud vendor and region are now preselected 
- Optimizations when uploading large text files with the list of Redis commands, available under bulk actions in Browser

### Details

**Features and improvements**
- [#2879](https://github.com/RedisInsight/RedisInsight/pull/2879) UX improvements to simplify in-app provisioning of a free [Redis Cloud](https://redis.com/comparisons/oss-vs-enterprise/?utm_source=redisinsight&utm_medium=rel_notes&utm_campaign=2_40) database. Create a new database with a preselected cloud vendor and region by using the recommended sign-up settings. You can manage your database by signing in to the [Redis Cloud console](https://cloud.redis.io/#/databases?utm_source=redisinsight&utm_medium=rel_notes&utm_campaign=2_40)
- [#2851](https://github.com/RedisInsight/RedisInsight/pull/2851) See plan, cloud vendor, and region details after successfully provisioning your free [Redis Cloud](https://redis.com/comparisons/oss-vs-enterprise/?utm_source=redisinsight&utm_medium=rel_notes&utm_campaign=2_40) database
- [#2882](https://github.com/RedisInsight/RedisInsight/pull/2882) Optimizations when uploading large text files with the list of Redis commands, available under bulk actions in Browser
- [#2808](https://github.com/RedisInsight/RedisInsight/pull/2808) Enhanced security measurement to no longer display existing passwords for Redis Sentinel in plain text
- [#2875](https://github.com/RedisInsight/RedisInsight/pull/2875) Increased performance when resizing the key list and key details in the Tree view, ensuring a smoother user experience
- [#2866](https://github.com/RedisInsight/RedisInsight/pull/2866) Support for hyphens in [node host names](https://github.com/RedisInsight/RedisInsight/issues/2865)

**Bugs**
- [#2868](https://github.com/RedisInsight/RedisInsight/pull/2868) Prevent [unintentional data overwrites](https://github.com/RedisInsight/RedisInsight/issues/2791) by disabling both manual and automatic refreshing of key values while editing in the Browser
