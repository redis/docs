---
acl_categories:
- '@bloom'
- '@read'
- '@fast'
arguments:
- name: key
  type: key
- arguments:
  - name: capacity
    token: CAPACITY
    type: pure-token
  - name: size
    token: SIZE
    type: pure-token
  - name: filters
    token: FILTERS
    type: pure-token
  - name: items
    token: ITEMS
    type: pure-token
  - name: expansion
    token: EXPANSION
    type: pure-token
  name: single_value
  optional: true
  type: oneof
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
description: Returns information about a Bloom Filter
group: bf
hidden: false
linkTitle: BF.INFO
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Returns information about a Bloom Filter
syntax_fmt: BF.INFO key [CAPACITY | SIZE | FILTERS | ITEMS | EXPANSION]
syntax_str: '[CAPACITY | SIZE | FILTERS | ITEMS | EXPANSION]'
title: BF.INFO
---
Returns information about a Bloom filter.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter.
</details>

## Optional arguments

<details open><summary><code>CAPACITY</code></summary>

Return the number of unique items that can be stored in this Bloom filter before scaling would be required (including already added items).
</details>

<details open><summary><code>SIZE</code></summary>

Return the memory size: number of bytes allocated for this Bloom filter.
</details>

<details open><summary><code>FILTERS</code></summary>

Return the number of sub-filters.
</details>

<details open><summary><code>ITEMS</code></summary>

Return the number of items that were added to this Bloom filter and detected as unique (items that caused at least one bit to be set in at least one sub-filter).
</details>

<details open><summary><code>EXPANSION</code></summary>

Return the expansion rate.
</details>

When no optional argument is specified: return all information fields.

## Return value

When no optional argument is specified, returns one of these replies:

- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with argument name ([Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}})) and value ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})) pairs
- [] on error (invalid arguments, key does not exist, wrong key type, and so on)

When an optional argument is specified, returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - argument value
- [] on error (invalid arguments, key does not exist, wrong key type, and so on)

## Examples

{{< highlight bash >}}
redis> BF.ADD bf1 observation1
(integer) 1
redis> BF.INFO bf1
 1) Capacity
 2) (integer) 100
 3) Size
 4) (integer) 240
 5) Number of filters
 6) (integer) 1
 7) Number of items inserted
 8) (integer) 1
 9) Expansion rate
10) (integer) 2
redis> BF.INFO bf1 CAPACITY
1) (integer) 100
{{< / highlight >}}
