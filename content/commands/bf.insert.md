---
acl_categories:
- '@bloom'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: capacity
  optional: true
  token: CAPACITY
  type: integer
- name: error
  optional: true
  token: ERROR
  type: double
- name: expansion
  optional: true
  token: EXPANSION
  type: integer
- name: nocreate
  optional: true
  token: NOCREATE
  type: pure-token
- name: nonscaling
  optional: true
  token: NONSCALING
  type: pure-token
- name: items
  token: ITEMS
  type: pure-token
- multiple: true
  name: item
  type: string
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(k * n), where k is the number of hash functions and n is the number
  of items
description: Adds one or more items to a Bloom Filter. A filter will be created if
  it does not exist
group: bf
hidden: false
linkTitle: BF.INSERT
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Adds one or more items to a Bloom Filter. A filter will be created if it
  does not exist
syntax_fmt: "BF.INSERT key [CAPACITY\_capacity] [ERROR\_error]
  [EXPANSION\_expansion]\
  \ [NOCREATE] [NONSCALING] ITEMS item [item
  ...]"
syntax_str: "[CAPACITY\_capacity] [ERROR\_error] [EXPANSION\_expansion] [NOCREATE]\
  \ [NONSCALING] ITEMS item [item ...]"
title: BF.INSERT
---
Creates a new Bloom filter if the `key` does not exist using the specified error rate, capacity, and expansion, then adds all specified items to the Bloom Filter.

This command is similar to [`BF.MADD`]({{< relref "commands/bf.madd/" >}}), except that the error rate, capacity, and expansion can be specified. It is a sugarcoated combination of [`BF.RESERVE`]({{< relref "commands/bf.reserve/" >}}) and [`BF.MADD`]({{< relref "commands/bf.madd/" >}}).

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter to add items to.

If `key` does not exist, a new Bloom filter is created.
</details>

<details open><summary><code>ITEMS item...</code></summary>

One or more items to add.
</details>

## Optional arguments

<details open><summary><code>NOCREATE</code></summary>

Indicates that the filter should not be created if it does not already exist.
If the filter does not yet exist, an error is returned rather than creating it automatically.
This may be used where a strict separation between filter creation and filter addition is desired.
It is an error to specify `NOCREATE` together with either `CAPACITY` or `ERROR`.
</details>

<details open><summary><code>CAPACITY capacity</code></summary>

Specifies the desired `capacity` for the filter to be created.
This parameter is ignored if the filter already exists.
If the filter is automatically created and this parameter is absent, then the module-level `capacity` is used.
See [`BF.RESERVE`]({{< relref "commands/bf.reserve/" >}}) for more information about the impact of this value.
</details>

<details open><summary><code>ERROR error</code></summary>
    
Specifies the `error` ratio of the newly created filter if it does not yet exist.
If the filter is automatically created and `error` is not specified then the module-level error rate is used.
See [`BF.RESERVE`]({{< relref "commands/bf.reserve/" >}}) for more information about the format of this value.
</details>

<details open><summary><code>NONSCALING</code></summary>

Prevents the filter from creating additional sub-filters if initial capacity is reached.
Non-scaling filters require slightly less memory than their scaling counterparts. The filter returns an error when `capacity` is reached.
</details>

<details open><summary><code>EXPANSION expansion</code></summary>

When `capacity` is reached, an additional sub-filter is created.
The size of the new sub-filter is the size of the last sub-filter multiplied by `expansion`, specified as a positive integer.

If the number of elements to be stored in the filter is unknown, use an `expansion` of `2` or more to reduce the number of sub-filters.
Otherwise, use an `expansion` of `1` to reduce memory consumption. The default value is `2`.
</details>

## Examples

Add three items to a filter, then create the filter with default parameters if it does not already exist.

{{< highlight bash >}}
BF.INSERT filter ITEMS foo bar baz
{{< / highlight >}}

Add one item to a filter, then create the filter with a capacity of 10000 if it does not already exist.

{{< highlight bash >}}
BF.INSERT filter CAPACITY 10000 ITEMS hello
{{< / highlight >}}

Add two items to a filter, then return error if the filter does not already exist.

{{< highlight bash >}}
BF.INSERT filter NOCREATE ITEMS foo bar
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="bf-insert-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following: where each element is one of these options:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}), where each element is one of the following options:
  * [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) `1` for successfully adding an item, or `0` if there's a probability that the item was already added to the filter.
  * [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings">}}) when the item cannot be added because the filter is full.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors">}}) when the number of arguments or key type is wrong, and also when `NOCREATE` is specified and `key` does not exist.

-tab-sep-

One of the following: where each element is one of these options:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}), where each element is one of the following options:
  * [Boolean reply]({{< relref "/develop/reference/protocol-spec#booleans" >}}) `true` for successfully adding an item, or `false` if there's a probability that the item was already added to the filter.
  * [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings">}}) when the item cannot be added because the filter is full.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors">}}) when the number of arguments or key type is wrong, and also when `NOCREATE` is specified and `key` does not exist.

{{< /multitabs >}}