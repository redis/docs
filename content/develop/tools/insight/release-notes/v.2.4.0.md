---
Title: RedisInsight v2.4.0, June 2022
linkTitle: v2.4.0 (June 2022)
date: 2022-06-27 00:00:00 +0000
description: RedisInsight v2.4.0
weight: 9
---

## 2.4.0 (June 2022)
This is the General Availability (GA) release of RedisInsight 2.4.0

### Headlines:
- Pub/Sub: Added support for [Redis pub/sub](https://redis.io/docs/manual/pubsub/) enabling subscription to channels and posting messages to channels.
- Consumer groups: Added support for [streams consumer groups](https://redis.io/docs/manual/data-types/streams/#consumer-groups) enabling provision of different subsets of messages from the same stream to many clients for inspection and processing.
- Database search: Search the list of databases added to RedisInsight to quickly find the required database.


### Details
**Features and improvements:**
- [#760](https://github.com/RedisInsight/RedisInsight/pull/760), [#737](https://github.com/RedisInsight/RedisInsight/pull/737), [#773](https://github.com/RedisInsight/RedisInsight/pull/773) Added support for [Redis pub/sub](https://redis.io/docs/manual/pubsub/) enabling subscription to channels and posting messages to channels. Currently does not support sharded channels.
- [#717](https://github.com/RedisInsight/RedisInsight/pull/717), [#683](https://github.com/RedisInsight/RedisInsight/pull/683), [#684](https://github.com/RedisInsight/RedisInsight/pull/684), [#688](https://github.com/RedisInsight/RedisInsight/pull/688), [#720](https://github.com/RedisInsight/RedisInsight/pull/720), Added support for [streams consumer groups](https://redis.io/docs/manual/data-types/streams/#consumer-groups) to manage different groups and consumers for the same stream, explicit acknowledgment of processed items, ability to inspect the pending items, claiming of unprocessed messages, and coherent history visibility for each single client.
- [#754](https://github.com/RedisInsight/RedisInsight/pull/754) New **All Relationship** toggle for RedisGraph visualizations in **Workbench**. Enable it to see all relationships between your nodes.
- [#788](https://github.com/RedisInsight/RedisInsight/pull/788) Quickly search the list of databases added to RedisInsight per database alias, host:port, or the last connection to find the database needed.
- [#788](https://github.com/RedisInsight/RedisInsight/pull/788) Overview displays the number of keys per the logical database connected if this number is not equal to the total number in the database.

**Bugs Fixed:**
- [#774](https://github.com/RedisInsight/RedisInsight/pull/774) Fixed cases when not all parameters are received in Overview.
- [#810](https://github.com/RedisInsight/RedisInsight/pull/810) Display several streams values with the same timestamp.
