---
Title: HyperLogLog in Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Information about using hyperloglog with an Active-Active database.
linkTitle: HyperLogLog
weight: $weight
url: '/operate/rs/7.8/databases/active-active/develop/data-types/hyperloglog/'
---
**HyperLogLog** is an algorithm that addresses the [count-distinct problem](https://en.wikipedia.org/wiki/Count-distinct_problem).
To do this it approximates the numbers of items in a [set](https://en.wikipedia.org/wiki/Multiset).
Determining the _exact_ cardinality of a set requires memory according to the cardinality of the set.
Because it estimates the cardinality by probability, the HyperLogLog algorithm can run with more reasonable memory requirements.

## HyperLogLog in Redis

Redis Community Edition implements [HyperLogLog](https://redislabs.com/redis-best-practices/counting/hyperloglog/) (HLL) as a native data structure.
It supports adding elements ([PFADD]({{< relref "/commands/pfadd" >}}) to an HLL, counting elements ([PFCOUNT]({{< relref "/commands/pfcount" >}}) of HLLs, and merging of ([PFMERGE]({{< relref "/commands/pfmerge" >}}) HLLs.

Here is an example of a simple write case:

| Time | Replica 1         | Replica 2         |
| ---- | ----------------- | ----------------- |
| t1   | PFADD hll x       |                   |
| t2   | --- sync ---      |                   |
| t3   |                   | PFADD hll y       |
| t4   | --- sync ---      |                   |
| t5   | PFCOUNT hll --> 2 | PFCOUNT hll --> 2 |

Here is an example of a concurrent add case:

| Time | Replica 1         | Replica 2         |
| ---- | ----------------- | ----------------- |
| t1   | PFADD hll x       | PFADD hll y       |
| t2   | PFCOUNT hll --> 1 | PFCOUNT hll --> 1 |
| t3   | --- sync ---      |                   |
| t4   | PFCOUNT hll --> 2 | PFCOUNT hll --> 2 |

## The DEL-wins approach

Other collections in the Redis-CRDT implementation use the observed remove method to resolve conflicts.
The CRDT-HLL uses the DEL-wins method.
If a DEL request is received at the same time as any other request (ADD/MERGE/EXPIRE) on the HLL-key
the replicas consistently converge to delete key.
In the observed remove method used by other collections (sets, lists, sorted-sets and hashes),
only the replica that received the DEL request removes the elements, but elements added concurrently in other replicas exist in the consistently converged collection.
We chose to use the DEL-wins method for the CRDT-HLL to maintain the original time and space complexity of the HLL in Redis Community Edition.

Here is an example of a DEL-wins case:

| HLL  |                 |                 | \|  | Set  |                     |                     |
| ---- | --------------- | --------------- | --- | ---- | ------------------- | ------------------- |
|      |                 |                 | \|  |      |                     |                     |
| Time | Replica 1       | Replica 2       | \|  | Time | Replica 1           | Replica 2           |
|      |                 |                 | \|  |      |                     |                     |
| t1   | PFADD h e1      |                 | \|  | t1   | SADD s e1           |                     |
| t2   | --- sync ---    |                 | \|  | t2   | --- sync ---        |                     |
| t3   | PFCOUNT h --> 1 | PFCOUNT h --> 1 | \|  | t3   | SCARD s --> 1       | SCARD s --> 1       |
| t4   | PFADD h e2      | Del h           | \|  | t4   | SADD s e2           | Del S               |
| t5   | PFCOUNT h --> 2 | PFCOUNT h --> 0 | \|  | t5   | SCARD s --> 2       | SCARD s --> 0       |
| t6   | --- sync ---    |                 | \|  | t6   | --- sync ---        |                     |
| t7   | PFCOUNT h --> 0 | PFCOUNT h --> 0 | \|  | t7   | SCARD s --> 1       | SCARD s --> 1       |
| t8   | Exists h --> 0  | Exists h --> 0  | \|  | t8   | Exists s --> 1      | Exists s --> 1      |
|      |                 |                 | \|  | t9   | SMEMBERS s --> {e2} | SMEMBERS s --> {e2} |

## HLL in Active-Active databases versus HLL in Redis Community Edition

In Active-Active databases, we implemented HLL within the CRDT on the basis of the Redis implementation with a few exceptions:

- Redis keeps the HLL data structure as an encoded string object
    such that you can potentially run any string request can on a key that contains an HLL. In CRDT, only get and set are supported for HLL.
- In CRDT, if you do SET on a key that contains a value encoded as an HLL, then the value will remain an HLL. If the value is not encoded as HLL, then it will be a register.
