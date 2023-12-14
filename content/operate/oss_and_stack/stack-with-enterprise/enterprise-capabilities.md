---
Title: Redis Enterprise and Redis Stack feature compatibility
alwaysopen: false
categories:
- docs
- operate
- stack
description: Describes the Redis Enterprise features supported by each Redis Stack
  feature.
linkTitle: Enterprise feature compatibility
weight: 8
---

This article describes compatibility between Redis Enterprise features and Redis Stack features. Version numbers indicate the minimum module version required for feature support.

## Supported Redis Stack features

The following table shows which Redis Stack features are supported by Redis Enterprise Software and Redis Cloud.

| Feature | Redis Enterprise<br/>Software | Redis Enterprise<br/>Cloud |
|:-------|:-------------------------|:-----------------------|
| [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}) | &#x2705; Supported | &#x2705; Supported |
| [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}})   | &#x2705; Supported | &#x2705; Supported |
| [Graph]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/graph" >}}) | &#x26A0;&#xFE0F; Deprecated | &#x26A0;&#xFE0F; Deprecated |
| [Time series]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}}) | &#x2705; Supported | &#x2705; Supported |
| [Probabilistic]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}) | &#x2705; Supported | &#x2705; Supported |
| [Triggers and functions]({{< relref "/operate/oss_and_stack/stack-with-enterprise/triggers-functions" >}})<br />(preview) | &#x2705; Supported | &#x2705; Supported |
| [Gears]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1" >}}) | &#x2705; Supported | &#x274c; Not supported |

## Feature compatibility

The following tables show Redis Enterprise feature support for each Redis Stack feature. 

Version numbers indicate when the feature was first supported.  If you're using an earlier version than what's shown in the table, the feature is not supported.

For details about individual features, see the corresponding documentation.

| Feature name/capability   | [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}) | [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}})    |  [Graph]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/graph" >}})   | 
|---------------------------|:--------------:|:------------:|:------------:|
| Active-Active (CRDB)[^4]  | Yes (v2.0)     | Yes (v2.2)   | No           |
| Backup/Restore            | Yes (v1.4)     | Yes (v1.0)   | Yes (v1.0)   |
| Clustering                | Yes (v1.6)[^3] | Yes (v1.0)   | Yes (v2.2.3)[^1] |
| Custom hashing policy     | Yes (v2.0)     | Yes (v1.0)   | Yes (v1.0)   |
| Eviction expiration       | Yes (v2.0)     | Yes (v1.0)   | Yes (v2.8.10) |
| Failover/migration        | Yes (v1.4)     | Yes (v1.0)   | Yes (v1.0)   |
| Internode encryption      | Yes (v2.0.11)  | Yes (v1.0.8) | Yes (v2.4)   |
| Module data types         | Yes            | Yes          | Yes          |
| Persistence (AOF)         | Yes (v1.4)     | Yes (v1.0)   | Yes (v2.0)   |
| Persistence (snapshot)    | Yes (v1.6)     | Yes (v1.0)   | Yes (v1.0)   |
| Auto Tiering [^4]  | Yes (v2.0)     | Yes (v1.0)   | No           |
| Replica Of                | Yes (v1.6)[^2] | Yes (v1.0)   | Yes (v2.2)   |
| Reshard/rebalance         | Yes (v2.0)     | Yes (v1.0)   | No           |

[^1]: Graphs are compatible with clustering; however, individual graphs contained in a key reside in a single shard, which can affect pricing.  To learn more, [contact support](https://redis.com/company/support/).

[^2]: RediSearch version 1.6 supported Replica Of only between databases with the same number of shards.  This limitation was fixed in v2.0. 

[^3]: You cannot use search and query with the [OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}).

[^4]: You currently cannot combine Auto Tiering and Active-Active with Redis Stack features in Redis Cloud.

[^5]: Although time series are compatible with Auto Tiering, the entire series either lives in RAM or on flash.

| Feature name/capability | [Time series]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}}) | [Probabilistic]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}) | [Gears]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1" >}}) | [Triggers and functions]({{< relref "/operate/oss_and_stack/stack-with-enterprise/triggers-functions" >}})<br />(preview) |
|--------------------------|:--------------:|:------------:|:----------:|:----------:|  
| Active-Active (CRDB)[^4] | No             | No           | Yes (v1.0) | No |
| Backup/Restore           | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) | Yes |
| Clustering               | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) | Yes |
| Custom hashing policy    | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) | Yes |
| Eviction expiration      | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) | Yes |
| Failover/migration       | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) | Yes |
| Internode encryption     | Yes (v1.4.9)   | Yes (v2.2.6) | Yes (v1.2) | yes |
| Module data types        | Yes            | Yes          | Yes        | Yes |
| Persistence (AOF)        | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) | Yes |
| Persistence (snapshot)   | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) | Yes |
| Auto Tiering [^4] | Yes (v1.6)[^5] | Yes (vTBD)   | Yes (vTBD) | No |
| Replica Of               | Yes (v1.2)     | Yes (v2.0)   | No         | Yes |
| Reshard/rebalance        | Yes (v1.2)     | Yes (v2.0)   | Yes (v1.0) | Yes |


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
