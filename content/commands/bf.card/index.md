---
acl_categories:
- '@bloom'
- '@read'
- '@fast'
arguments:
- name: key
  type: key
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
complexity: O(1)
description: Returns the cardinality of a Bloom filter
group: bf
hidden: false
linkTitle: BF.CARD
module: Bloom
since: 2.4.4
stack_path: docs/data-types/probabilistic
summary: Returns the cardinality of a Bloom filter
syntax_fmt: BF.CARD key
syntax_str: ''
title: BF.CARD
---
Returns the cardinality of a Bloom filter - number of items that were added to a Bloom filter and detected as unique (items that caused at least one bit to be set in at least one sub-filter)

(since RedisBloom 2.4.4)

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter.

</details>

## Return value
 
Returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - the number of items that were added to this Bloom filter and detected as unique (items that caused at least one bit to be set in at least one sub-filter), or 0 when `key` does not exist.
- [] on error (invalid arguments, wrong key type, etc.)

Note: when `key` exists - return the same value as `BF.INFO key ITEMS`.

## Examples

{{< highlight bash >}}
redis> BF.ADD bf1 item_foo
(integer) 1
redis> BF.CARD bf1
(integer) 1
redis> BF.CARD bf_new
(integer) 0
{{< / highlight >}}
