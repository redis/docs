---
acl_categories:
- '@read'
- '@set'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: count
  name: count
  optional: true
  since: 2.6.0
  type: integer
arity: -2
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
command_flags:
- readonly
complexity: Without the count argument O(1), otherwise O(N) where N is the absolute
  value of the passed count.
description: Get one or multiple random members from a set
group: set
hidden: false
hints:
- nondeterministic_output
history:
- - 2.6.0
  - Added the optional `count` argument.
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: SRANDMEMBER
since: 1.0.0
summary: Get one or multiple random members from a set
syntax_fmt: SRANDMEMBER key [count]
syntax_str: '[count]'
title: SRANDMEMBER
---
When called with just the `key` argument, return a random element from the set value stored at `key`.

If the provided `count` argument is positive, return an array of **distinct elements**.
The array's length is either `count` or the set's cardinality ([`SCARD`]({{< relref "/commands/scard" >}})), whichever is lower.

If called with a negative `count`, the behavior changes and the command is allowed to return the **same element multiple times**.
In this case, the number of returned elements is the absolute value of the specified `count`.

## Examples

{{% redis-cli %}}
SADD myset one two three
SRANDMEMBER myset
SRANDMEMBER myset 2
SRANDMEMBER myset -5
{{% /redis-cli %}}


## Specification of the behavior when count is passed

When the `count` argument is a positive value this command behaves as follows:

* No repeated elements are returned.
* If `count` is bigger than the set's cardinality, the command will only return the whole set without additional elements.
* The order of elements in the reply is not truly random, so it is up to the client to shuffle them if needed.

When the `count` is a negative value, the behavior changes as follows:

* Repeating elements are possible.
* Exactly `count` elements, or an empty array if the set is empty (non-existing key), are always returned.
* The order of elements in the reply is truly random.

## Distribution of returned elements

Note: this section is relevant only for Redis 5 or below, as Redis 6 implements a fairer algorithm. 

The distribution of the returned elements is far from perfect when the number of elements in the set is small, this is due to the fact that we used an approximated random element function that does not really guarantees good distribution.

The algorithm used, that is implemented inside dict.c, samples the hash table buckets to find a non-empty one. Once a non empty bucket is found, since we use chaining in our hash table implementation, the number of elements inside the bucket is checked and a random element is selected.

This means that if you have two non-empty buckets in the entire hash table, and one has three elements while one has just one, the element that is alone in its bucket will be returned with much higher probability.
