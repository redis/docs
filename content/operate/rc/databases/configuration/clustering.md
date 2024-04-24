---
Title: Clustering Redis Databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: Redis Cloud uses clustering to manage very large databases (25 GB and
  larger).  Here, you'll learn how to manage clustering and how to use hashing policies
  to control how data is managed.
linkTitle: Clustering
weight: $weight
aliases:
    - /operate/rc/concepts/clustering
---
For very large databases, Redis Cloud distributes database data to different cloud instances.  For example:

- When data grows beyond the the RAM resources of a single server.

    Multiple shards should be used when data grows to 25 GB (50 GB for Auto Tiering) to create multiple shards.

- The operations performed against the database are CPU intensive enough to degrade performance.

    Clustering distributes operational load, whether to instances on the same server or across multiple servers.

This distribution is called _clustering_ because it manages the way data is distributed throughout the cluster of nodes that support the database.

## How data is distributed

A Redis Cloud cluster is a set of managed Redis processes and cloud instances,
with each process managing a subset of the database keyspace.
Clustering uses multiple cores and resources of multiple instances to overcome scaling challenges.

In a Redis Cloud cluster, the keyspace is partitioned into hash
slots. At any given time a hash slot resides on and is managed by a single
Redis server. 

An instance that belongs to a cluster can manage multiple hash
slots. This division of the key space, known as _sharding_, is achieved by
hashing the key names, or parts of these (key hash tags), in order to
obtain the hash slot in which a key should reside.

Even when using multiple Redis processes, the use of a Redis
Enterprise Cloud cluster is nearly transparent to the application that
uses it. The cluster is accessible via a single endpoint that
automatically routes all operations to the relevant shards, without the
complexity of a cluster-aware Redis client. This allows applications to
benefit from using the cluster without performing any code changes, even
if they were not designed to use it beforehand.

When creating or editing a Redis database on Redis Cloud, the
system automatically calculates the number of shards needed based on
the database memory limit and required throughput.

<!--  DOC-439: Stubbing out for initial pass
{{< note >}}
For Redis Cloud Essentials, clustering is only available in the
"Pay-As-You-Go" subscription.
{{< image filename="/images/rc/clustering-subscription.png" >}}
{{< /note >}}
-->

## Multi-key operations {#multikey-operations}

Operations on multiple keys in a sharded Redis Cloud cluster
are supported, with the following limitations:

1. **Multi-key commands:** Redis offers several commands that accept
    multiple keys as arguments. In a sharded setup, you can run multi-key commands
    only if all the affected keys reside in the same slot (thus on the same shard).
    This restriction applies to all mulit-key commands, including BITOP, BLPOP, BRPOP, BRPOPLPUSH, MSETNX,
    RPOPLPUSH, SDIFF, SDIFFSTORE, SINTER, SINTERSTORE, SMOVE, SORT,
    SUNION, XREAD, XREADGROUP, ZINTER, ZINTERSTORE, ZUNION, ZUNIONSTORE, ZDIFF, ZDIFFSTORE
1. **Geo commands:** In GEORADIUS/GEORADIUSBYMEMBER/GEOSEARCHSTORE commands, the
    STORE and STOREDIST options can only be used when all affected keys
    reside in the same slot.
1. **Transactions:** All operations within a WATCH/MULTI/EXEC block
    should be performed on keys that are in the same slot.
1. **Lua scripts:** All keys that are used by the script must reside in
    the same slot and need to be provided as arguments to the
    EVAL/EVALSHA commands (as per the Redis specification).
1. **Renaming/Copy keys:** The use of the RENAME/RENAMENX/COPY commands is
    allowed only when both the key's original name and its new name are
    mapped to the same hash slot.
1. **Variadic commands**: The use of (MGET, MSET, HMGET, HMSET, etc..)
    and pipelining are supported with Redis Cloud cluster
    like if it were a non-cluster DB.

## Manage the hashing policy

Redis defaults to the [standard hashing policy]({{< relref "/operate/rs/databases/durability-ha/clustering#standard-hashing-policy" >}}). 
The clustering configuration of a Redis Cloud instance can be changed. 
However, hashing policy changes delete existing data 
(FLUSHDB) before they're applied. 

These changes include:

1. Changing the hashing policy, either from standard to custom or vice versa.
1. Changing the order of custom hashing policy rules.
1. Adding rules before existing ones in the custom hashing policy.
1. Deleting rules from the custom hashing policy.
1. Disabling clustering for the database.

### Standard hashing policy

When using the standard hashing policy, a Redis Cloud cluster
behaves like a standard Redis cluster, and hashing is
performed as follows:

1. Keys with a hashtag: a key's hashtag is any substring between '{'
    and '}' in the key's name. That means that when a key's name
    includes the pattern '{...}', the hashtag is used as input for the
    hashing function. For example, the following key names have the same
    hashtag and are mapped to the same slot: foo{bar},
    {bar}baz & foo{bar}baz.
1. Keys without a hashtag: when a key doesn't contain the '{...}'
    pattern, the entire key's name is used for hashing.

You can use the '{...}' pattern to direct related keys to the same hash
slot, so that multi-key operations are supported on them. On the other
hand, not using a hashtag in the key's name results in a
(statistically) even distribution of keys across the keyspace's shards, 
which improves resource utilization. 
If your application does not perform multi-key operations, you don't
need to construct key names with hashtags.

### Custom hashing policy

A Redis Cloud  cluster can be configured to use a custom hashing
policy. A custom hashing policy is required when different keys need to
be kept together on the same shard to allow multi-key operations. Redis
Cloud's custom hashing policy is provided via a set of Perl
Compatible Regular Expressions (PCRE) rules that describe the dataset's
key name patterns.

To configure a custom hashing policy, enter regular expression (RegEx)
rules that identify the substring in the key's name - hashtag - on
which hashing will be done. The hashing tag is denoted in the RegEx by
the use of the \`tag\` named subpattern. Different keys that have the
same hashtag will be stored and managed in the same slot.

Once you enable the custom hashing policy, the Redis Cloud's
default RegEx rules that implement the standard hashing policy are:

| RegEx Rule | Description |
|-----------|-----------------|
| .\*{(?\<tag\>.\*)}.\* | Hashing is done on the substring between the curly braces. |
| (?\<tag\>.\*) | The entire key's name is used for hashing. |

You can modify existing rules, add new ones, delete rules, or change
their order to suit your application's requirements.

### Custom hashing policy notes and limitations

1. You can define up to 32 RegEx rules, each up to 256 characters.
1. RegEx rules are evaluated by their order.
1. The first rule matched is used; strive to place common key name
    patterns at the beginning of the rule list.
1. Key names that do not match any of the RegEx rules trigger an
    error.
1. The '.\*(?\<tag\>)' RegEx rule forces keys into a single slot as the
    hash key is always empty. When used, this should be the last
    catch-all rule.
1. The following flag is enabled in our regular expression parser:
   - **PCRE_ANCHORED:** the pattern is constrained to match only at
        the start of the string which is being searched.

## Memory limit

The memory limit represents the maximum amount of memory for the database, which includes data values, keys, module data, and overhead for specific features.  High availability features, such as replication and Active-Active,  increase memory consumption.  

Here are some general guidelines:

- Memory limit represents an upper limit.  You cannot store more data than the memory limit.  Depending on your other selections, available memory for data may be less than expected.

- [Replication]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) doubles memory consumption; that is, 512MB of data requires at least 1GB of memory limit when replication is enabled. This affects both Redis Cloud Pro and Redis Cloud Essentials. For example, if you subscribe to a 1 GB Essentials plan, Redis will allocate 512 MB for your dataset and the other 512 MB for replication.

- [Active-Active]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}}) also doubles memory consumption and the effect is cumulative with replication's impact. Since Active-Active requires replication to be turned on, the memory limit impact can be as large as four times (4x) the original data size.

- [Advanced capabilities]({{< relref "/operate/rc/databases/configuration/advanced-capabilities" >}}) also consume memory. For search databases, consider index size when you size your database.

Memory limits in Redis Cloud are subject to the same considerations as Redis Enterprise Software; to learn more, see [Database memory limits]({{< relref "/operate/rs/databases/memory-performance/memory-limit.md" >}}).

## Throughput

Throughput is the amount of operations a database can handle over a certain period of time. For Redis Cloud databases, throughput is defined in operations per second (ops/sec).

For a Redis Cloud Pro subscription, you define throughput for a database when you create it. For a Redis Cloud Essentials subscription, your maximum throughput depends on your plan.

We assume a typical workload that includes a different mix of commands and an average key and value size of 1KB. Therefore, your actual throughput may be higher or lower than the throughput you set when you create your database. The following properties can affect your database's throughput:
- **Command complexity**: O(N) and O(log(N)) commands will take more time than O(1) commands, and will affect throughput accordingly.
- **Key and value sizing**: If your database's keys and values are very large, your actual throughput may be lower than expected. If the keys and values are smaller than the typical workload, the actual throughput might be higher than expected.
- **Replication**: Using [multi-zone replication]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) affects throughput as each write operation is executed asynchronously in each zone.
- **Security**: Some security options, such as [transport layer security]({{< relref "/operate/rc/security/database-security/tls-ssl" >}}), may affect throughput.
- **Number of client connections**: The number of client connections affects throughput. Increasing or decreasing the number of client connections can result in higher or lower throughput.

## Cluster API

{{< embed-md "oss-cluster-api-intro.md"  >}}

The Cluster API is only supported on Redis Cloud Pro databases. You can enable it in the Scalability section of the configuration screen.

Review [Redis Cluster API architecture]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api" >}}) to determine if you should enable this feature for your database.