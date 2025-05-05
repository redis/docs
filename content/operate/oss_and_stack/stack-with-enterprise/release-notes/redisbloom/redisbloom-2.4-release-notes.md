---
Title: RedisBloom 2.4 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Added t-digest - a probabilistic data structure for estimating quantiles
  based on a data stream or a large dataset of floating-point values.
linkTitle: v2.4 (November 2022)
min-version-db: 6.0.16
min-version-rs: 6.2.8
weight: 96
---
## Requirements

RedisBloom v2.4.15 requires:

- Minimum Redis compatibility version (database): 6.0.16
- Minimum Redis Enterprise Software version (cluster): 6.2.8

## v2.4.15 (April 2025)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

Improvements:
- [#865](https://github.com/redisbloom/redisbloom/pull/865) Added support for Azure Linux 3 (MOD-9171)

## v2.4.14 (February 2025)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:
  - [#828](https://github.com/redisbloom/redisbloom/pull/828) `CMS.INCRBY` does not notify `WATCH`ers or client-side caching (MOD-8193)
  - [#827](https://github.com/redisbloom/redisbloom/pull/827) Top-K - suboptimal results after RDB load due to missing initialization (MOD-8194)

## v2.4.13 (January 2025)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `SECURITY`: There are security fixes in the release.

Details:

- **Security and privacy:**
  - [#845](https://github.com/redisbloom/redisbloom/pull/845) (CVE-2024-53993) CMS: potential out-of-bounds write (MOD-6970)

- Bug fixes:
  - [#845](https://github.com/redisbloom/redisbloom/pull/845) `CMS.MERGE` crashes or hangs on negative number of keys (MOD-6964)

- Improvements:
  - [#831](https://github.com/redisbloom/redisbloom/pull/831) Added support for Ubuntu 22 and macOS 13 and 14

## v2.4.9 (March 2024)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#753](https://github.com/RedisBloom/RedisBloom/issues/753) Potential crash on `CMS.MERGE` when using invalid arguments

## v2.4.8 (January 2024)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#727](https://github.com/RedisBloom/RedisBloom/pull/727) Additional fixes for potential crash on `CF.LOADCHUNK` (MOD-6344)

## v2.4.7 (January 2024)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#735](https://github.com/RedisBloom/RedisBloom/pull/735) Potential crash on `CF.RESERVE` (MOD-6343)
  - [#727](https://github.com/RedisBloom/RedisBloom/pull/727) Potential crash on `CF.LOADCHUNK` (MOD-6344)

## v2.4.6 (December 2023)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Bug fixes:

  - [#707](https://github.com/RedisBloom/RedisBloom/pull/707) Top-K: `TOPK.ADD` and `TOPK.QUERY` crash when an item name is an empty string (RED-114676)

- Improvements:

  - [#706](https://github.com/RedisBloom/RedisBloom/pull/706) Added support for CBL-Mariner 2 (MOD-6200)

## v2.4.5 (April 2023)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

  - Internal changes for supporting future Redis Enterprise releases

## v2.4.4 (February 2023)

This is a maintenance release for RedisBloom 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#609](https://github.com/RedisBloom/RedisBloom/issues/609) [CF.INFO]({{< relref "commands/cf.info" >}}) - incorrect information for large filters

- Improvements:

  - [#389](https://github.com/RedisBloom/RedisBloom/issues/389) Introduce [BF.CARD]({{< relref "commands/bf.card" >}}) to retrieve the cardinality of a Bloom filter or 0 when such key does not exist

## v2.4 GA (v2.4.3) (November 2022)

This is the General Availability release of RedisBloom 2.4.

### Highlights

RedisBloom 2.4 introduces a new sketch data structure: **t-digest**.

### What's new in 2.4

[t-digest](https://www.sciencedirect.com/science/article/pii/S2665963820300403) is a probabilistic data structure for estimating quantiles based on a data stream or a large dataset of floating-point values. It can be used to answer the following questions:

- What fraction of the values in the data stream are smaller than a given value?
- How many values in the data stream are smaller than a given value?
- Which value is smaller than _p_ percent of the values in the data stream? (what is the _p_-percentile value)?
- What is the mean value between the _p1_-percentile value and the _p2_-percentile value?
- What is the value of the _n_-th smallest / largest value in the data stream? (what is the value with [reverse] rank _n_)?

As for any other probabilistic data structures, t-digest requires sublinear space and has controllable space-accuracy tradeoffs.

Using t-digest is simple and straightforward:

* **Creating a sketch and adding observations**

  `TDIGEST.CREATE key [COMPRESSION compression]` initializes a new t-digest sketch (and errors if the key already exists). The `COMPRESSION` argument is used to specify the tradeoff between accuracy and memory consumption. The default is 100. Higher values mean more accuracy.

  `TDIGEST.ADD key value...` adds new observations (floating-point values) to the sketch. You can repeat calling [TDIGEST.ADD]({{< relref "commands/tdigest.add" >}}) whenever new observations are available.

* **Estimating fractions or ranks by values**

  Use `TDIGEST.CDF key value...` to retrieve, for each input **value**, an estimation of the **fraction** of (observations **smaller** than the given value + half the observations equal to the given value).

  `TDIGEST.RANK key value...` is similar to [TDIGEST.CDF]({{< relref "commands/tdigest.cdf" >}}), but used for estimating the number of observations instead of the fraction of observations. More accurately it returns, for each input **value**, an estimation of the **number** of (observations **smaller** than a given value + half the observations equal to the given value).

  And lastly, `TDIGEST.REVRANK key value...` is similar to [TDIGEST.RANK]({{< relref "commands/tdigest.rank" >}}), but returns, for each input **value**, an estimation of the **number** of (observations **larger** than a given value + half the observations equal to the given value).

* **Estimating values by fractions or ranks**

  `TDIGEST.QUANTILE key fraction...` returns, for each input **fraction**, an estimation of the **value** (floating point) that is **smaller** than the given fraction of observations.

  `TDIGEST.BYRANK key rank...` returns, for each input **rank**, an estimation of the **value** (floating point) with that rank.

  `TDIGEST.BYREVRANK key rank...` returns, for each input **reverse rank**, an estimation of the **value** (floating point) with that reverse rank.

* **Estimating trimmed mean**

  Use `TDIGEST.TRIMMED_MEAN key lowFraction highFraction` to retrieve an estimation of the mean value between the specified fractions.

  This is especially useful for calculating the average value ignoring outliers. For example, calculating the average value between the 20th percentile and the 80th percentile.

* **Merging sketches**

  Sometimes it is useful to merge sketches. For example, suppose we measure latencies for 3 servers, and we want to calculate the 90%, 95%, and 99% latencies for all the servers combined.

  `TDIGEST.MERGE destKey numKeys sourceKey... [COMPRESSION compression] [OVERRIDE]` merges multiple sketches into a single sketch.

  If `destKey` does not exist, a new sketch is created.

  If `destKey` is an existing sketch, its values are merged with the values of the source keys. To override the destination key contents, use `OVERRIDE`.

* **Retrieving sketch information**

  Use `TDIGEST.MIN` key and `TDIGEST.MAX key` to retrieve the minimal and maximal values in the sketch, respectively.

  Both return NaN (Not a Number) when the sketch is empty.

  Both commands return accurate results and are equivalent to `TDIGEST.BYRANK key 0` and `TDIGEST.BYREVRANK key 0` respectively.

  Use `TDIGEST.INFO key` to retrieve some additional information about the sketch.

* **Resetting a sketch**

  `TDIGEST.RESET key` empties the sketch and reinitializes it.
