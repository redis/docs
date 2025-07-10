---
Title: Redis Insight v2.70.1, July 2025
linkTitle: v2.70.1 (July 2025)
date: 2025-07-10 00:00:00 +0000
description: Redis Insight v2.70.1
weight: 1

---
## 2.70.1 (July 2025)
This is a maintenance release for Redis Insight 2.70.

Update urgency: LOW No need to upgrade unless there are new features you want to use.

**Bug fixes**
- [#4635](https://github.com/redis/RedisInsight/pull/4635) Redis Data Integration metrics are now shown even when the pipeline status is not running.
- [#4644](https://github.com/redis/RedisInsight/pull/4644) Resolved [layout issues](https://github.com/redis/RedisInsight/issues/4637) in the bulk import summary view.
- [#4569](https://github.com/redis/RedisInsight/pull/4569) Fixed an [issue](https://github.com/redis/RedisInsight/issues/3416) with a setting to manually enforce standalone mode for clustered database connections instead of automatic clustered mode.
- Various security enhancements, including vulnerability fixes and dependency updates.

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows | yg+7OLp+KdWgPXwVXWsk26zODO3PoMMhFzNdDQy8FSy1R+lHZAqA42JBA9JNFHUtalZy1k/I3tyZ71TUeSsn+w== |
| Linux AppImage | hx5XhNIyhna6nYW7wXFjj2XdaDvaq+Fro7qr+iae6cYuY7IO5sH2+oOVVva07yAno02zwxslmNuDkiRWcc5rGw== |
| Linux Debian| pSwGCXGpxihwymQJOWcbA2Bq97tnSPtnXoIBQ0uut0bwc1SfisHML526a/2ypbyr53TzD0Ut73B+DvWHeRTSbA== |
| Linux RPM | gxbPo/8+1TkGf8E92BSRHn1I2DtG1PD5Go70WJ0ahRNYoT0FuXBBaERQk3ymwbB7fEcM1CVkwCpUum+iBECUQA== |
| MacOS Intel | RXPsIECk8jInadX+FGvoM5H49E5mHu1jo6Pq+24AN97ymCIaXIVRIduTHw3sdCYTWJqgLkvjoHKT/IqlR3oayg== |
| MacOS Apple silicon | EWjwyeGQq8sCeF7syv5LCkWVwXfNbgWYxvkrbAxd8QZmNYrAdl0866k2QGBxIQ3UtJsyePiLhVTJR2qAk6oYzw== |
