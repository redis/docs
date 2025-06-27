---
Title: Redis Insight v2.60.0, October 2024
linkTitle: v2.60.0 (October 2024)
date: 2024-10-30 00:00:00 +0000
description: Redis Insight v2.60
weight: 1

---
## 2.60 (October 2024)
This is the General Availability (GA) release of Redis Insight 2.60.

### Highlights
- Advanced and schema-aware command auto-complete for [Redis Query Engine](https://redis.io/docs/latest/develop/ai/search-and-query/?utm_source=redisinsight&utm_medium=main&utm_campaign=release_notes) is now available in Workbench, enabling faster and more accurate query building with smart suggestions for indexes, schemas, and expressions.
- Support for adding multiple elements to the head or tail of lists, for both new or existing keys.
- Multiple UI enhancements for clarity and ease of use when editing Redis Data Integration (RDI) jobs.

### Details

**Features and improvements**
- [#3553](https://github.com/RedisInsight/RedisInsight/pull/3553), [#3647](https://github.com/RedisInsight/RedisInsight/pull/3647), [#3669](https://github.com/RedisInsight/RedisInsight/pull/3669) Advanced, schema-aware auto-complete for [Redis Query Engine](https://redis.io/docs/latest/develop/ai/search-and-query/?utm_source=redisinsight&utm_medium=main&utm_campaign=release_notes) in Workbench. Enjoy faster query building with context-sensitive suggestions that recognize indexes, schemas, and fields based on your current query. Start typing any [Redis Query Engine](https://redis.io/docs/latest/commands/?group=search) command in Workbench to try this feature. 
- [#3891](https://github.com/RedisInsight/RedisInsight/pull/3891) Allows to easily push multiple elements to the head or tail of list data types, whether creating new or updating existing lists.
- [#3891](https://github.com/RedisInsight/RedisInsight/pull/3891) UX/UI enhancements to provide more details about Redis Data Integration (RDI) job transformation and output results in the dry-run section.
- [#3981](https://github.com/RedisInsight/RedisInsight/pull/3981) Removes confirmation prompts for template insertions in Redis Data Integration jobs, simplifying a workflow.
- [#3827](https://github.com/RedisInsight/RedisInsight/pull/3827) Provides easy-to-understand metrics of network input/output by automatically converting units in Browser Overview.
- [#3982](https://github.com/RedisInsight/RedisInsight/pull/3982), [#3975](https://github.com/RedisInsight/RedisInsight/pull/3975), [#3941](https://github.com/RedisInsight/RedisInsight/pull/3941) Various vulnerabilities have been fixed.
