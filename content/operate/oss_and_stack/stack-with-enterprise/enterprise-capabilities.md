---
Title: Redis Enterprise and Redis Open Source feature compatibility
alwaysopen: false
categories:
- docs
- operate
- stack
description: Describes the Redis Enterprise features supported by each Redis Open Source
  feature.
linkTitle: Enterprise feature compatibility
weight: 8
---

This article describes compatibility between Redis Enterprise features and Redis Open Source features. Version numbers indicate the minimum module version required for feature support.

## Supported Redis Open Source features

The following table shows which Redis Open Source features are supported by Redis Enterprise Software and Redis Cloud.

| Feature | Redis Enterprise<br/>Software | Redis Enterprise<br/>Cloud |
|:-------|:-------------------------|:-----------------------|
| [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}) | &#x2705; Supported | &#x2705; Supported |
| [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}})   | &#x2705; Supported | &#x2705; Supported |
| [Time series]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}}) | &#x2705; Supported | &#x2705; Supported |
| [Probabilistic]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}) | &#x2705; Supported | &#x2705; Supported |
| [Gears]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1" >}}) | &#x2705; Supported | &#x274c; Not supported |
| [Triggers and functions]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/triggers-and-functions/" >}}) | &#x26A0;&#xFE0F; Deprecated | &#x26A0;&#xFE0F; Deprecated |
| [Graph]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/graph" >}}) | &#x26A0;&#xFE0F; Deprecated | &#x26A0;&#xFE0F; Deprecated |


## Feature compatibility

The following tables show Redis Enterprise feature support for each Redis Open Source feature. 

Version numbers indicate when the feature was first supported.  If you're using an earlier version than what's shown in the table, the feature is not supported.

For details about individual features, see the corresponding documentation.

| Feature name/capability   | [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}) | [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}})    | 
|---------------------------|:--------------:|:------------:|
| Active-Active (CRDB)[^5]  | Yes (v2.0)     | Yes (v2.2)   |
| Backup/Restore            | Yes (v1.4)     | Yes (v1.0)   |
| Clustering                | Yes (v1.6)[^3] | Yes (v1.0)   |
| Custom hashing policy     | Yes (v2.0)     | Yes (v1.0)   |
| Eviction expiration       | Yes (v2.0)     | Yes (v1.0)   |
| Failover/migration        | Yes (v1.4)     | Yes (v1.0)   |
| Internode encryption      | Yes (v2.0.11)  | Yes (v1.0.8) |
| Module data types         | Yes            | Yes          |
| Persistence (AOF)         | Yes (v1.4)     | Yes (v1.0)   |
| Persistence (snapshot)    | Yes (v1.6)     | Yes (v1.0)   |
| Auto Tiering [^4]         | Yes (v2.0)     | Yes (v1.0)   |
| Replica Of                | Yes (v1.6)[^2] | Yes (v1.0)   |
| Reshard/rebalance         | Yes (v2.0)     | Yes (v1.0)   |

[^1]: Graphs are compatible with clustering; however, individual graphs contained in a key reside in a single shard, which can affect pricing.  To learn more, [contact support](https://redis.com/company/support/).

[^2]: RediSearch version 1.6 supported Replica Of only between databases with the same number of shards.  This limitation was fixed in v2.0. 

[^3]: You cannot use search and query with the [OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}). This limitation was fixed in Redis Enterprise Software version 8.0.

[^4]: You currently cannot combine Auto Tiering with Redis Open Source features in Redis Cloud. 

[^5]: With the exception of JSON, you currently cannot combine Active-Active with Redis Open Source features in Redis Cloud.

[^6]: Although time series are compatible with Auto Tiering, the entire series either lives in RAM or on flash.

| Feature name/capability | [Time series]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}}) | [Probabilistic]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}) | [Gears]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1" >}}) |
|--------------------------|:--------------:|:------------:|:----------:|
| Active-Active (CRDB)[^5] | No             | No           | Yes (v1.0) |
| Backup/Restore           | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) |
| Clustering               | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) |
| Custom hashing policy    | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) |
| Eviction expiration      | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) |
| Failover/migration       | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) |
| Internode encryption     | Yes (v1.4.9)   | Yes (v2.2.6) | Yes (v1.2) |
| Module data types        | Yes            | Yes          | Yes        |
| Persistence (AOF)        | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) |
| Persistence (snapshot)   | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) |
| Auto Tiering [^4]        | Yes (v1.6)[^6] | Yes (vTBD)   | Yes (vTBD) |
| Replica Of               | Yes (v1.2)     | Yes (v2.0)   | No         |
| Reshard/rebalance        | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) |


## Feature descriptions

The following table briefly describes each feature shown in the earlier tables.

| Feature name/capability | Description |
|-------------------------|-------------|
| Active-Active (CRDB)    | Compatible with Active-Active (CRDB) databases  |
| Backup/Restore          | Supports import and export features |
| Clustering              | Compatible with sharded databases and shard migration |
| Custom hashing policy   | Compatible with databases using custom hashing policies |
| Eviction expiration     | Allows data to be evicted when the database reaches memory limits |
| Failover/migration      | Compatible with primary/replica failover and the migration of shards between nodes within the cluster |
| Internode encryption    | Compatible with encryption on the data plane |
| Persistence (AOF)       | Compatible with databases using AoF persistence |
| Persistence (snapshot)  | Compatible with databases using snapshot persistence | 
| Auto Tiering    | Compatible with Auto Tiering |
| Replica Of              | Compatible with Active-Passive replication | 
| Reshard/rebalance       | Compatible with database scaling for clustered databases, which redistributes data between the new shards. |

<!-- 
    Individual footnotes are rendered below the following heading.  
    Thus, any additional sections need to be placed above this comment.
-->
## Footnotes
