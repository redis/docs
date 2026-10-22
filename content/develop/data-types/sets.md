---
aliases:
- /data-types/sets/
- /manual/data-types/sets/
- /develop/data-types/set/
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: 'Introduction to Redis sets

  '
linkTitle: Sets
title: Redis sets
weight: 90
---

{{< command-group group="set" title="Set command summary" show_link=true >}}

A Redis set is an unordered collection of unique strings (members).
You can use Redis sets to efficiently:

* Track unique items (e.g., track all unique IP addresses accessing a given blog post).
* Represent relations (e.g., the set of all users with a given role).
* Perform common set operations such as intersection, unions, and differences.

## Examples

* Store the sets of bikes racing in France and the USA. Note that
if you add a member that already exists, it will be ignored.
{{< clients-example set="sets_tutorial" step="sadd" description="Foundational: Add members to a set using SADD when you need to store unique items (duplicates are silently ignored)" difficulty="beginner" prereq="true" >}}
> SADD bikes:racing:france bike:1
(integer) 1
> SADD bikes:racing:france bike:1
(integer) 0
> SADD bikes:racing:france bike:2 bike:3
(integer) 2
> SADD bikes:racing:usa bike:1 bike:4
(integer) 2
{{< /clients-example >}}

* Check whether bike:1 or bike:2 are racing in the US.
{{< clients-example set="sets_tutorial" step="sismember" description="Foundational: Test set membership using SISMEMBER when you need O(1) lookups (much faster than checking a list)" difficulty="beginner" buildsUpon="sadd" needs_prereq="true" >}}
> SISMEMBER bikes:racing:usa bike:1
(integer) 1
> SISMEMBER bikes:racing:usa bike:2
(integer) 0
{{< /clients-example >}}

* Which bikes are competing in both races?
{{< clients-example set="sets_tutorial" step="sinter" description="Set intersection: Find common members across multiple sets using SINTER when you need to identify shared items (e.g., users in multiple groups)" difficulty="intermediate" buildsUpon="sadd" needs_prereq="true" >}}
> SINTER bikes:racing:france bikes:racing:usa
1) "bike:1"
{{< /clients-example >}}

* How many bikes are racing in France?
{{< clients-example set="sets_tutorial" step="scard" description="Foundational: Get the cardinality of a set using SCARD when you need to count unique items efficiently" difficulty="beginner" buildsUpon="sadd" needs_prereq="true" >}}
> SCARD bikes:racing:france
(integer) 3
{{< /clients-example >}}

## Tutorial

The [`SADD`](/content/commands/sadd.md) command adds new elements to a set. It's also possible
to do a number of other operations against sets like testing if a given element
already exists, performing the intersection, union or difference between
multiple sets, and so forth.

{{< clients-example set="sets_tutorial" step="sadd_smembers" description="Foundational: Retrieve all members from a set using SMEMBERS when you need the complete set (note: order is not guaranteed)" difficulty="beginner" buildsUpon="sadd" >}}
> DEL bikes:racing:france
(integer) 1
> SADD bikes:racing:france bike:1 bike:2 bike:3
(integer) 3
> SMEMBERS bikes:racing:france
1) "bike:3"
2) "bike:1"
3) "bike:2"
{{< /clients-example >}}

Here I've added three elements to my set and told Redis to return all the
elements. There is no order guarantee with a set. Redis is free to return the
elements in any order at every call.

Redis has commands to test for set membership. These commands can be used on single as well as multiple items:

{{< clients-example set="sets_tutorial" step="smismember" description="Batch membership checks: Test multiple items at once using SMISMEMBER when you need to reduce round trips to the server" difficulty="intermediate" buildsUpon="sismember" >}}
# Recreate the France racing set so this example runs on its own.
> DEL bikes:racing:france
(integer) 1
> SADD bikes:racing:france bike:1 bike:2 bike:3
(integer) 3
> SISMEMBER bikes:racing:france bike:1
(integer) 1
> SMISMEMBER bikes:racing:france bike:2 bike:3 bike:4
1) (integer) 1
2) (integer) 1
3) (integer) 0
{{< /clients-example >}}

We can also find the difference between two sets. For instance, we may want
to know which bikes are racing in France but not in the USA:

{{< clients-example set="sets_tutorial" step="sdiff" description="Set difference: Find members in one set but not in others using SDIFF when you need to exclude items (warning: argument order matters)" difficulty="intermediate" buildsUpon="sadd" needs_prereq="true" >}}
> DEL bikes:racing:usa
(integer) 1
> SADD bikes:racing:usa bike:1 bike:4
(integer) 2
> SDIFF bikes:racing:france bikes:racing:usa
1) "bike:3"
2) "bike:2"
{{< /clients-example >}}

There are other non trivial operations that are still easy to implement
using the right Redis commands. For instance we may want a list of all the
bikes racing in France, the USA, and some other races. We can do this using
the [`SINTER`](/content/commands/sinter.md) command, which performs the intersection between different
sets. In addition to intersection you can also perform
unions, difference, and more. For example 
if we add a third race we can see some of these commands in action:

{{< clients-example set="sets_tutorial" step="multisets" description="Advanced pattern: Combine SINTER, SUNION, and SDIFF to analyze complex relationships when you need to precompute set algebra across multiple datasets" difficulty="advanced" buildsUpon="sinter, sdiff" >}}
> DEL bikes:racing:france bikes:racing:usa bikes:racing:italy
(integer) 2
> SADD bikes:racing:france bike:1 bike:2 bike:3
(integer) 3
> SADD bikes:racing:usa bike:1 bike:4
(integer) 2
> SADD bikes:racing:italy bike:1 bike:2 bike:3 bike:4
(integer) 4
> SINTER bikes:racing:france bikes:racing:usa bikes:racing:italy
1) "bike:1"
> SUNION bikes:racing:france bikes:racing:usa bikes:racing:italy
1) "bike:2"
2) "bike:1"
3) "bike:4"
4) "bike:3"
> SDIFF bikes:racing:france bikes:racing:usa bikes:racing:italy
(empty array)
> SDIFF bikes:racing:france bikes:racing:usa
1) "bike:3"
2) "bike:2"
> SDIFF bikes:racing:usa bikes:racing:france
1) "bike:4"
{{< /clients-example >}}

You'll note that the [`SDIFF`](/content/commands/sdiff.md) command returns an empty array when the
difference between all sets is empty. You'll also note that the order of sets
passed to [`SDIFF`](/content/commands/sdiff.md) matters, since the difference is not commutative.

When you want to remove items from a set, you can use the [`SREM`](/content/commands/srem.md) command to
remove one or more items from a set, or you can use the [`SPOP`](/content/commands/spop.md) command to
remove a random item from a set. You can also _return_ a random item from a
set without removing it using the [`SRANDMEMBER`](/content/commands/srandmember.md) command:

{{< clients-example set="sets_tutorial" step="srem" description="Removal strategies: Use SREM for targeted removal, SPOP for random removal, or SRANDMEMBER to inspect without modifying when you need flexible deletion patterns" difficulty="intermediate" buildsUpon="sadd" >}}
> DEL bikes:racing:france
(integer) 1
> SADD bikes:racing:france bike:1 bike:2 bike:3 bike:4 bike:5
(integer) 5
> SREM bikes:racing:france bike:1
(integer) 1
> SPOP bikes:racing:france
"bike:3"
> SMEMBERS bikes:racing:france
1) "bike:2"
2) "bike:4"
3) "bike:5"
> SRANDMEMBER bikes:racing:france
"bike:2"
{{< /clients-example >}}

## Member expiration

Redis 8.12 introduced the ability to set an expiration time or a time to live (TTL) on individual set members.
Redis removes each member from the set automatically when its TTL expires.
This capability is comparable to [key expiration](/content/develop/using-commands/keyspace.md#key-expiration) and to [hash field expiration](/content/develop/data-types/hashes.md#field-expiration), and it uses a similar set of commands.

Use the following commands to set either an exact expiration time or a TTL for specific members:

* [`SEXPIRE`](/content/commands/sexpire.md): set the remaining TTL in seconds.
* [`SPEXPIRE`](/content/commands/spexpire.md): set the remaining TTL in milliseconds.
* [`SEXPIREAT`](/content/commands/sexpireat.md): set the expiration time to a timestamp[^1] specified in seconds.
* [`SPEXPIREAT`](/content/commands/spexpireat.md): set the expiration time to a timestamp specified in milliseconds.
* [`SADDEX`](/content/commands/saddex.md): add members to a set and optionally set their expiration time or TTL in the same command.

[^1]: All timestamps are specified in seconds or milliseconds since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time).

Use the following commands to retrieve either the exact time when specific members will expire or their remaining TTL:

* [`SEXPIRETIME`](/content/commands/sexpiretime.md): get the expiration time as a timestamp in seconds.
* [`SPEXPIRETIME`](/content/commands/spexpiretime.md): get the expiration time as a timestamp in milliseconds.
* [`STTL`](/content/commands/sttl.md): get the remaining TTL in seconds.
* [`SPTTL`](/content/commands/spttl.md): get the remaining TTL in milliseconds.

Use the following command to remove the expiration of specific members:

* [`SPERSIST`](/content/commands/spersist.md): remove the expiration.

Other set commands treat a member whose TTL has expired as missing, even before Redis reclaims it.
[`SCARD`](/content/commands/scard.md) is the exception: it can count expired members that haven't been removed yet.
[`SINTERSTORE`](/content/commands/sinterstore.md), [`SUNIONSTORE`](/content/commands/sunionstore.md), and [`SDIFFSTORE`](/content/commands/sdiffstore.md) copy member expirations to the destination set.
Sorted set commands that accept sets as input, such as [`ZUNION`](/content/commands/zunion.md), return an error if an input set has member expirations.

### Common member expiration use cases

1. **Active session tracking**: Store active session IDs in a set. Set each member's TTL so that it expires after a period of inactivity, and refresh the TTL on each request. The set then contains only the live sessions.

1. **Deduplication windows**: Add each event ID with `SADDEX` and the `MNX` option, using a TTL equal to the window length. A reply of `0` means the ID was already seen within the window.

1. **Short-lived tags**: Tag an item, such as "new" or "on sale", by adding it to a set with a TTL. The tag disappears on its own when the TTL expires.

### Member expiration examples

The following examples use a set of reserved bikes, where each reservation expires after a period of time.
Because the members expire, each example recreates the `bikes:reserved` set first so that it runs on its own.

Add two members with a TTL of 15 minutes, add a third member with no expiration, and then retrieve the remaining TTL of each member:

```redis
> DEL bikes:reserved
(integer) 0
> SADDEX bikes:reserved EX 900 MEMBERS 2 bike:1 bike:2
(integer) 1
> SADD bikes:reserved bike:3
(integer) 1
> STTL bikes:reserved MEMBERS 3 bike:1 bike:2 bike:3
1) (integer) 900
2) (integer) 900
3) (integer) -1
```

Set a member's TTL in milliseconds, retrieve the remaining TTL in milliseconds, and then remove the expiration:

```redis
> DEL bikes:reserved
(integer) 1
> SADD bikes:reserved bike:1 bike:2
(integer) 2
> SPEXPIRE bikes:reserved 60000 MEMBERS 1 bike:1
1) (integer) 1
> SPTTL bikes:reserved MEMBERS 2 bike:1 bike:2
1) (integer) 59994
2) (integer) -1
> SPERSIST bikes:reserved MEMBERS 1 bike:1
1) (integer) 1
> SPTTL bikes:reserved MEMBERS 1 bike:1
1) (integer) -1
```

Set a member's expiration to a specific timestamp and then retrieve that expiration time (both as a Unix time in seconds):

```redis
> DEL bikes:reserved
(integer) 1
> SADD bikes:reserved bike:1 bike:2
(integer) 2
# Set the expiration to a Unix time in the future
# (4102444800 is an example; use a timestamp appropriate for your use case).
> SEXPIREAT bikes:reserved 4102444800 MEMBERS 1 bike:1
1) (integer) 1
> SEXPIRETIME bikes:reserved MEMBERS 2 bike:1 bike:2
1) (integer) 4102444800
2) (integer) -1
```

## Limits

The max size of a Redis set is 2^32 - 1 (4,294,967,295) members.

## Performance

Most set operations, including adding, removing, and checking whether an item is a set member, are O(1).
This means that they're highly efficient.
However, for large sets with hundreds of thousands of members or more, you should exercise caution when running the [`SMEMBERS`](/content/commands/smembers.md) command.
This command is O(n) and returns the entire set in a single response. 
As an alternative, consider the [`SSCAN`](/content/commands/sscan.md), which lets you retrieve all members of a set iteratively.

## Alternatives

Sets membership checks on large datasets (or on streaming data) can use a lot of memory.
If you're concerned about memory usage and don't need perfect precision, consider a [Bloom filter or Cuckoo filter](/content/develop/data-types/probabilistic/bloom-filter.md) as an alternative to a set.

Redis sets are frequently used as a kind of index.
If you need to index and query your data, consider the [JSON](/content/develop/data-types/json/_index.md) data type and the [Redis Search](/content/develop/ai/search-and-query/_index.md) features.

## Learn more

* [Redis Sets Explained](https://www.youtube.com/watch?v=PKdCppSNTGQ) and [Redis Sets Elaborated](https://www.youtube.com/watch?v=aRw5ME_5kMY) are two short but thorough video explainers covering Redis sets.
* [Redis University's RU101](https://university.redis.com/courses/ru101/) explores Redis sets in detail.
