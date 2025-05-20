---
categories:
- docs
- operate
- stack
- oss
description: The self-documented `redis-full.conf` file that is shipped with every version.
linkTitle: Configuration example
title: Redis Open Source configuration file example
weight: 3
---

```
include redis.conf

loadmodule ./modules/redisbloom/redisbloom.so
loadmodule ./modules/redisearch/redisearch.so
loadmodule ./modules/redisjson/rejson.so
loadmodule ./modules/redistimeseries/redistimeseries.so

############################## QUERY ENGINE CONFIG ############################

# Keep numeric ranges in numeric tree parent nodes of leafs for `x` generations.
# numeric, valid range: [0, 2], default: 0
#
# search-_numeric-ranges-parents 0

# The number of iterations to run while performing background indexing
# before we call usleep(1) (sleep for 1 micro-second) and make sure that we
# allow redis to process other commands.
# numeric, valid range: [1, UINT32_MAX], default: 100
#
# search-bg-index-sleep-gap 100

# The default dialect used in search queries.
# numeric, valid range: [1, 4], default: 1
#
# search-default-dialect 1

# the fork gc will only start to clean when the number of not cleaned document
# will exceed this threshold.
# numeric, valid range: [1, LLONG_MAX], default: 100
#
# search-fork-gc-clean-threshold 100

# interval (in seconds) in which to retry running the forkgc after failure.
# numeric, valid range: [1, LLONG_MAX], default: 5
#
# search-fork-gc-retry-interval 5

# interval (in seconds) in which to run the fork gc (relevant only when fork
# gc is used).
# numeric, valid range: [1, LLONG_MAX], default: 30
#
# search-fork-gc-run-interval 30

# the amount of seconds for the fork GC to sleep before exiting.
# numeric, valid range: [0, LLONG_MAX], default: 0
#
# search-fork-gc-sleep-before-exit 0

# Scan this many documents at a time during every GC iteration.
# numeric, valid range: [1, LLONG_MAX], default: 100
#
# search-gc-scan-size 100

# Max number of cursors for a given index that can be opened inside of a shard.
# numeric, valid range: [0, LLONG_MAX], default: 128
#
# search-index-cursor-limit 128

# Maximum number of results from ft.aggregate command.
# numeric, valid range: [0, (1ULL << 31)], default: 1ULL << 31
#
# search-max-aggregate-results 2147483648

# Maximum prefix expansions to be used in a query.
# numeric, valid range: [1, LLONG_MAX], default: 200
#
# search-max-prefix-expansions 200

# Maximum runtime document table size (for this process).
# numeric, valid range: [1, 100000000], default: 1000000
#
# search-max-doctablesize 1000000

# max idle time allowed to be set for cursor, setting it high might cause
# high memory consumption.
# numeric, valid range: [1, LLONG_MAX], default: 300000
#
# search-cursor-max-idle 300000

# Maximum number of results from ft.search command.
# numeric, valid range: [0, 1ULL << 31], default: 1000000
#
# search-max-search-results 1000000

# Number of worker threads to use for background tasks when the server is
# in an operation event.
# numeric, valid range: [1, 16], default: 4
#
# search-min-operation-workers 4

# Minimum length of term to be considered for phonetic matching.
# numeric, valid range: [1, LLONG_MAX], default: 3
#
# search-min-phonetic-term-len 3

# the minimum prefix for expansions (`*`).
# numeric, valid range: [1, LLONG_MAX], default: 2
#
# search-min-prefix 2

# the minimum word length to stem.
# numeric, valid range: [2, UINT32_MAX], default: 4
#
# search-min-stem-len 4

# Delta used to increase positional offsets between array
# slots for multi text values.
# Can control the level of separation between phrases in different
# array slots (related to the SLOP parameter of ft.search command)"
# numeric, valid range: [1, UINT32_MAX], default: 100
#
# search-multi-text-slop 100

# Used for setting the buffer limit threshold for vector similarity tiered
# HNSW index, so that if we are using WORKERS for indexing, and the
# number of vectors waiting in the buffer to be indexed exceeds this limit,
# we insert new vectors directly into HNSW.
# numeric, valid range: [0, LLONG_MAX], default: 1024
#
# search-tiered-hnsw-buffer-limit 1024

# Query timeout.
# numeric, valid range: [1, LLONG_MAX], default: 500
#
# search-timeout 500

# minimum number of iterators in a union from which the iterator will
# will switch to heap-based implementation.
# numeric, valid range: [1, LLONG_MAX], default: 20
# switch to heap based implementation.
#
# search-union-iterator-heap 20

# The maximum memory resize for vector similarity indexes (in bytes).
# numeric, valid range: [0, UINT32_MAX], default: 0
#
# search-vss-max-resize 0

# Number of worker threads to use for query processing and background tasks.
# numeric, valid range: [0, 16], default: 0
# This configuration also affects the number of connections per shard.
#
# search-workers 0

# The number of high priority tasks to be executed at any given time by the
# worker thread pool, before executing low priority tasks. After this number
# of high priority tasks are being executed, the worker thread pool will
# execute high and low priority tasks alternately.
# numeric, valid range: [0, LLONG_MAX], default: 1
#
# search-workers-priority-bias-threshold 1

# Load extension scoring/expansion module. Immutable.
# string, default: ""
#
# search-ext-load ""

# Path to Chinese dictionary configuration file (for Chinese tokenization). Immutable.
# string, default: ""
#
# search-friso-ini ""

# Action to perform when search timeout is exceeded (choose RETURN or FAIL).
# enum, valid values: ["return", "fail"], default: "fail"
#
# search-on-timeout fail

# Determine whether some index resources are free on a second thread.
# bool, default: yes
#
# search-_free-resource-on-thread yes

# Enable legacy compression of double to float.
# bool, default: no
#
# search-_numeric-compress no

# Disable print of time for ft.profile. For testing only.
# bool, default: yes
#
# search-_print-profile-clock yes

# Intersection iterator orders the children iterators by their relative estimated
# number of results in ascending order, so that if we see first iterators with
# a lower count of results we will skip a larger number of results, which
# translates into faster iteration. If this flag is set, we use this
# optimization in a way where union iterators are being factorize by the number
# of their own children, so that we sort by the number of children times the
# overall estimated number of results instead.
# bool, default: no
#
# search-_prioritize-intersect-union-children no

# Set to run without memory pools.
# bool, default: no
#
# search-no-mem-pools no

# Disable garbage collection (for this process).
# bool, default: no
#
# search-no-gc no

# Enable commands filter which optimize indexing on partial hash updates.
# bool, default: no
#
# search-partial-indexed-docs no

# Disable compression for DocID inverted index. Boost CPU performance.
# bool, default: no
#
# search-raw-docid-encoding no

# Number of search threads in the coordinator thread pool.
# numeric, valid range: [1, LLONG_MAX], default: 20
#
# search-threads 20

# Timeout for topology validation (in milliseconds). After this timeout,
# any pending requests will be processed, even if the topology is not fully connected.
# numeric, valid range: [0, LLONG_MAX], default: 30000
#
# search-topology-validation-timeout 30000


############################## TIME SERIES CONFIG #############################

# The maximal number of per-shard threads for cross-key queries when using cluster mode
# (TS.MRANGE, TS.MREVRANGE, TS.MGET, and TS.QUERYINDEX).
# Note: increasing this value may either increase or decrease the performance.
# integer, valid range: [1..16], default: 3
# This is a load-time configuration parameter.
#
# ts-num-threads 3


# Default compaction rules for newly created key with TS.ADD, TS.INCRBY, and TS.DECRBY.
# Has no effect on keys created with TS.CREATE.
# This default value is applied to each new time series upon its creation.
# string, see documentation for rules format, default: no compaction rules
#
# ts-compaction-policy ""

# Default chunk encoding for automatically-created compacted time series.
# This default value is applied to each new compacted time series automatically
# created when ts-compaction-policy is specified.
# valid values: COMPRESSED, UNCOMPRESSED, default: COMPRESSED
#
# ts-encoding COMPRESSED


# Default retention period, in milliseconds. 0 means no expiration.
# This default value is applied to each new time series upon its creation.
# If ts-compaction-policy is specified - it is overridden for created
# compactions as specified in ts-compaction-policy.
# integer, valid range: [0 .. LLONG_MAX], default: 0
#
# ts-retention-policy 0

# Default policy for handling insertion (TS.ADD and TS.MADD) of multiple
# samples with identical timestamps.
# This default value is applied to each new time series upon its creation.
# string, valid values: BLOCK, FIRST, LAST, MIN, MAX, SUM, default: BLOCK
#
# ts-duplicate-policy BLOCK

# Default initial allocation size, in bytes, for the data part of each new chunk
# This default value is applied to each new time series upon its creation.
# integer, valid range: [48 .. 1048576]; must be a multiple of 8, default: 4096
#
# ts-chunk-size-bytes 4096

# Default values for newly created time series.
# Many sensors report data periodically. Often, the difference between the measured
# value and the previous measured value is negligible and related to random noise
# or to measurement accuracy limitations. In such situations it may be preferable
# not to add the new measurement to the time series.
# A new sample is considered a duplicate and is ignored if the following conditions are met:
# - The time series is not a compaction;
# - The time series' DUPLICATE_POLICY IS LAST;
# - The sample is added in-order (timestamp >= max_timestamp);
# - The difference of the current timestamp from the previous timestamp
#   (timestamp - max_timestamp) is less than or equal to ts-ignore-max-time-diff
# - The absolute value difference of the current value from the value at the previous maximum timestamp
#   (abs(value - value_at_max_timestamp) is less than or equal to ts-ignore-max-val-diff.
# where max_timestamp is the timestamp of the sample with the largest timestamp in the time series,
# and value_at_max_timestamp is the value at max_timestamp.
# ts-ignore-max-time-diff: integer, valid range: [0 .. LLONG_MAX], default: 0
# ts-ignore-max-val-diff: double, Valid range: [0 .. DBL_MAX], default: 0
#
# ts-ignore-max-time-diff 0
# ts-ignore-max-val-diff 0


########################### BLOOM FILTERS CONFIG ##############################

# Defaults values for new Bloom filters created with BF.ADD, BF.MADD, BF.INSERT, and BF.RESERVE
# These defaults are applied to each new Bloom filter upon its creation.

# Error ratio
# The desired probability for false positives.
# For a false positive rate of 0.1% (1 in 1000) - the value should be 0.001.
# double, Valid range: (0 .. 1), value greater than 0.25 is treated as 0.25, default: 0.01
#
# bf-error-rate 0.01

# Initial capacity
# The number of entries intended to be added to the filter.
# integer, valid range: [1 .. 1GB], default: 100
#
# bf-initial-size 100

# Expansion factor
# When capacity is reached, an additional sub-filter is created.
# The size of the new sub-filter is the size of the last sub-filter multiplied
# by expansion.
# integer, [0 .. 32768]. 0 is equivalent to NONSCALING. default: 2
#
# bf-expansion-factor 2


########################### CUCKOO FILTERS CONFIG #############################

# Defaults values for new Cuckoo filters created with
# CF.ADD, CF.ADDNX, CF.INSERT, CF.INSERTNX, and CF.RESERVE
# These defaults are applied to each new Cuckoo filter upon its creation.

# Initial capacity
# A filter will likely not fill up to 100% of its capacity.
# Make sure to reserve extra capacity if you want to avoid expansions.
# value is rounded to the next 2^n integer.
# integer, valid range: [2*cf-bucket-size .. 1GB], default: 1024
#
# cf-initial-size 1024

# Number of items in each bucket
# The minimal false positive rate is 2/255 ~ 0.78% when bucket size of 1 is used.
# Larger buckets increase the error rate linearly, but improve the fill rate.
# integer, valid range: [1 .. 255], default: 2
#
# cf-bucket-size 2

# Maximum iterations
# Number of attempts to swap items between buckets before declaring filter
# as full and creating an additional filter.
# A lower value improves performance. A higher value improves fill rate.
# integer, Valid range: [1 .. 65535], default: 20
#
# cf-max-iterations 20

# Expansion factor
# When a new filter is created, its size is the size of the current filter
# multiplied by this factor.
# integer, Valid range: [0 .. 32768], 0 is equivalent to NONSCALING, default: 1
#
# cf-expansion-factor 1

# Maximum expansions
# integer, Valid range: [1 .. 65536], default: 32
#
# cf-max-expansions 32


################################## SECURITY ###################################
#
# The following is a list of command categories and their meanings:
#
# * search - Query engine related.
# * json - Data type: JSON related.
# * timeseries -  Data type: time series related.
# * bloom - Data type:  Bloom filter related.
# * cuckoo - Data type: cuckoo filter related.
# * topk -  Data type: top-k related.
# * cms - Data type: count-min sketch related.
# * tdigest -  Data type: t-digest related.
```