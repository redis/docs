---
acl_categories:
- '@cuckoo'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: capacity
  optional: true
  token: CAPACITY
  type: integer
- name: nocreate
  optional: true
  token: NOCREATE
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
- oss
- kubernetes
- clients
complexity: O(n * (k + i)), where n is the number of items, k is the number of sub-filters
  and i is maxIterations
description: Adds one or more items to a Cuckoo Filter. A filter will be created if
  it does not exist
group: cf
hidden: false
linkTitle: CF.INSERT
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Adds one or more items to a Cuckoo Filter. A filter will be created if it
  does not exist
syntax_fmt: "CF.INSERT key [CAPACITY\_capacity] [NOCREATE] ITEMS item [item ...]"
syntax_str: "[CAPACITY\_capacity] [NOCREATE] ITEMS item [item ...]"
title: CF.INSERT
---
Adds one or more items to a cuckoo filter, allowing the filter to be created with a custom capacity if it does not exist yet.

This command is similar to [`CF.ADD`]({{< relref "commands/cf.add/" >}}), except that more than one item can be added and capacity can be specified.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter to add items to.

If `key` does not exist - a new cuckoo filter is created.
</details>

<details open><summary><code>ITEMS item...</code></summary>

One or more items to add.
</details>

## Optional arguments

<details open><summary><code>CAPACITY capacity</code></summary>
    
Specifies the desired capacity of the new filter, if this filter does not exist yet.
    
If the filter already exists, then this parameter is ignored.
    
If the filter does not exist yet and this parameter is *not* specified, then the filter is created with the module-level default capacity which is 1024.

See [`CF.RESERVE`]({{< relref "commands/cf.reserve/" >}}) for more information on cuckoo filter capacities.
</details>
    
<details open><summary><code>NOCREATE</code></summary>
  
If specified, prevents automatic filter creation if the filter does not exist (Instead, an error is returned).
    
This option is mutually exclusive with `CAPACITY`.
</details>

## Examples

{{< highlight bash >}}
redis> CF.INSERT cf CAPACITY 1000 ITEMS item1 item2 
1) (integer) 1
2) (integer) 1
{{< / highlight >}}

{{< highlight bash >}}
redis> CF.INSERT cf1 CAPACITY 1000 NOCREATE ITEMS item1 item2 
(error) ERR not found
{{< / highlight >}}

{{< highlight bash >}}
redis> CF.RESERVE cf2 2 BUCKETSIZE 1 EXPANSION 0
OK
redis> CF.INSERT cf2 ITEMS 1 1 1 1
1) (integer) 1
2) (integer) 1
3) (integer) -1
4) (integer) -1
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cf-insert-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}), where each element is an [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) of `1` for successfully adding an item, or `-1` when the item cannot be added because the filter is full.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors">}}) when the number of arguments or key type is incorrect, and also when `NOCREATE` is specified and `key` does not exist.

-tab-sep-

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}), where each element is a [boolean reply]({{< relref "/develop/reference/protocol-spec#booleans" >}}) of `1` for successfully adding an item, or `-1` when the item cannot be added because the filter is full.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors">}}) when the number of arguments or key type is incorrect, and also when `NOCREATE` is specified and `key` does not exist.

{{< /multitabs >}}
