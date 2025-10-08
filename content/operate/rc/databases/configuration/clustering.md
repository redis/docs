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

- When data grows beyond the RAM resources of a single server.

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
obtain the hash slot in which a key should reside. Redis Cloud supports several [hashing policies](#manage-the-hashing-policy).

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

## Hashing policies and hash tags {#manage-the-hashing-policy}

The hashing policy determines how data is distributed across multiple Redis processes of a database. It uses a hashing function to map keys to hash slots in these processes, ensuring an even distribution of data for optimal performance and scalability.

The hashing function uses the entire key name to calculate the hash slot, unless the key name contains a **hash tag**, represented by a `{...}` pattern.

If the key contains a `{...}` pattern, only the substring between `{` and `}` is hashed in order to obtain the hash slot.

You can use the `{...}` pattern to direct related keys to the same hash slot, so that multi-key operations are supported on them. On the other hand, not using a hashtag in the key's name results in a (statistically) even distribution of keys across the keyspace's shards, which improves resource utilization. If your application does not perform multi-key operations, you don't need to construct key names with hashtags.

Redis Cloud offers 3 hashing policies, which differ in how hash tags are processed. These hashing policies are not always available.

For accounts created after March 31, 2025, Redis defaults to the [Redis hashing policy](#redis-hashing-policy) **when creating a new database**. For all other accounts, Redis defaults to the [standard hashing policy](#standard-hashing-policy). 

### Redis hashing policy

{{< note >}}
This policy is available for selected accounts and will be rolled out gradually to other accounts in the future.
{{< /note >}}

The Redis hashing policy is identical to the [hashing policy used by Redis Open Source]({{< relref "/operate/oss_and_stack/reference/cluster-spec#hash-tags" >}}). This policy is recommended for most users and you should select it if any of the following conditions apply:
- This is your first Redis Cloud account, and you are starting fresh.
- You are migrating data from Redis Open Source or other Redis-managed platforms.
- Your application does not use hashtags in database key names.
- Your application uses binary data as key names.

The Redis hashing policy allows for faster scaling where available.

### Standard hashing policy

The Standard hashing policy is mostly consistent with the Redis hashing policy, and will generate the same hash-slot calculation in the following cases:
1. Keys with a single hashtag: a key's hashtag is any substring between '{' and '}' in the key's name. That means that when a key's name includes the pattern '{...}', the hashtag is used as input for the hashing function. For example, the following key names have the same hashtag and are mapped to the same slot: foo{bar}, {bar}baz & foo{bar}baz.
1. Keys without a hashtag: when a key doesn't contain the '{...}' pattern, the entire key's name is used for hashing

In some cases, the Standard hashing policy behaves differently from the Redis hashing policy:
1. Using empty hashtags ("{}"): the Standard hashing policy does not ignore empty hashtags, so two keys that start with empty hashtags will be hashed to the same hashslot (while the Redis hashing policy would ignore them). 
    For example: given 2 keys {}foo and {}bar, hashing would be:
    - Standard hashing policy: to the same hash slot
    - Redis hashing policy: to different hash slots
2. Using multiple curly brackets: when a key’s name contains multiple curly brackets, the Standard hashing calculation might be different than the Redis hashing policy. 
    For example: given 2 keys {foo}bar} and {foo}qux}:
    - Standard hashing policy: substrings "foo}bar" and "foo}qux" will be used for the 1st and 2nd key respectively, hashed each key to a different hash-slot.
    - Redis hashing policy: the substring "foo" will be used for both keys, hashing them to the same slot.

{{< note >}}
To allow seamless transition between hashing policies, the following techniques are not recommended:
- Using empty hashtags to hash different keys to the same hashslot
- Using multiple curly brackets within a key’s name 
{{< /note >}}

### Custom hashing policy

{{< note >}}
The custom hashing policy is not available for accounts created after March 31, 2025.

For all other accounts, this policy is not recommended and will be deprecated in the future. Select this option only if you are already using a custom hashing policy with your existing Redis Cloud databases.
{{< /note >}}

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

{{< warning >}}
If the Custom hashing policy is available, you can change the hashing policy between Standard and Custom after you create your database. However, hashing policy changes delete existing data 
(using [`FLUSHDB`]({{< relref "/commands/flushdb" >}})) before they're applied. 

These changes include:

1. Changing the hashing policy, either from standard to custom or vice versa.
1. Changing the order of custom hashing policy rules.
1. Adding rules before existing ones in the custom hashing policy.
1. Deleting rules from the custom hashing policy.
1. Disabling clustering for the database.
{{< /warning >}}

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

## OSS Cluster API {#oss-cluster-api}

{{< embed-md "oss-cluster-api-intro.md"  >}}

The OSS Cluster API is only supported on Redis Cloud Pro databases. You can enable it in the Performance section of the configuration screen.

After you select OSS Cluster API, you can select **Use external endpoint** if you want to use the external endpoint for the database. Selecting **Use external endpoint** will block the private endpoint for this database.

The OSS Cluster API is supported only when a database uses the [standard hashing policy](#standard-hashing-policy)

Review [OSS Cluster API architecture]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api" >}}) to determine if you should enable this feature for your database.