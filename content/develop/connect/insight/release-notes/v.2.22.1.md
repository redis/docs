---
Title: RedisInsight v2.22.1, March 2023
linkTitle: v2.22.1 (Mar 2023)
date: 2023-03-30 00:00:00 +0000
description: RedisInsight v2.22.1
weight: 1
---
## 2.22.1 (March 2023)
This is the General Availability (GA) release of RedisInsight 2.22.

### Highlights
- Share your Redis expertise with your team and the wider community by building custom RedisInsight tutorials. Use our [instructions](https://github.com/RedisInsight/Tutorials) to describe your implementations of Redis for other users to follow and interact with in the context of a connected Redis database
- Take a quick tour of RedisInsight to discover how it can enhance your development experience when building with Redis or Redis Stack
- Select from a list of supported decompression formats to view your data in a human-readable format


### Details
**Features and improvements**
- [#1782](https://github.com/RedisInsight/RedisInsight/pull/1782), [#1813](https://github.com/RedisInsight/RedisInsight/pull/1813) Share your Redis expertise with your team and the wider community by building custom RedisInsight tutorials. The tutorials use markdown and are easy to write. They are an ideal way to describe practical implementations of Redis so users can follow and interact with commands in the context of an already connected Redis database. Check out these [instructions](https://github.com/RedisInsight/Tutorials) to start creating your own tutorials. Let the community discover your content by labeling your GitHub repository with [redis-tutorials](https://github.com/topics/redis-tutorials)
- [#1834](https://github.com/RedisInsight/RedisInsight/pull/1834) Take a quick tour of RedisInsight to discover how it can enhance your development experience. To start the tour, in the left-side navigation, open the Help Center (above the Settings icon), reset the onboarding and open the Browser page
- [#1742](https://github.com/RedisInsight/RedisInsight/pull/1742), [#1753](https://github.com/RedisInsight/RedisInsight/pull/1753), [#1755](https://github.com/RedisInsight/RedisInsight/pull/1755), [#1762](https://github.com/RedisInsight/RedisInsight/pull/1762) Configure one of the following data decompression formats when adding a database connection to view your data in a human-readable format: GZIP, LZ4, ZSTD, SNAPPY
- [#1787](https://github.com/RedisInsight/RedisInsight/pull/1787) Added UX improvements to the search by values of keys feature in Browser: Enable the search box after the index is selected

**Bugs**
- [#1808](https://github.com/RedisInsight/RedisInsight/pull/1808) Prevent errors when running Docker RedisInsight on Safari Version 16.2
- [#1835](https://github.com/RedisInsight/RedisInsight/pull/1835) Display total memory and total keys for replicas in Sentinel
