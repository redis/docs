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
description: Adds one or more items to a Cuckoo Filter if the items did not exist
  previously. A filter will be created if it does not exist
group: cf
hidden: false
linkTitle: CF.INSERTNX
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Adds one or more items to a Cuckoo Filter if the items did not exist previously.
  A filter will be created if it does not exist
syntax_fmt: "CF.INSERTNX key [CAPACITY\_capacity] [NOCREATE] ITEMS item [item ...]"
syntax_str: "[CAPACITY\_capacity] [NOCREATE] ITEMS item [item ...]"
title: CF.INSERTNX
---
Adds one or more items to a cuckoo filter if they did not exist previously, allowing the filter to be created with a custom capacity if it does not exist yet.

This command is similar to [`CF.ADDNX`]({{< relref "commands/cf.addnx/" >}}), except that more than one item can be added and capacity can be specified.

<note><b>Notes:</b>

- This command is slower than [`CF.INSERT`]({{< relref "commands/cf.insert/" >}}) because it first checks whether each item exists.
- Since [`CF.EXISTS`]({{< relref "commands/cf.exists/" >}}) can result in false positive, `CF.INSERTNX` may not add an item because it is supposedly already exist, which may be wrong.
    
</note>

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

### Complexity

O(n + i), where n is the number of `sub-filters` and i is `maxIterations`.
Adding items requires up to 2 memory accesses per `sub-filter`.
But as the filter fills up, both locations for an item might be full. The filter attempts to `Cuckoo` swap items up to `maxIterations` times.

## Examples

{{< highlight bash >}}
redis> CF.INSERTNX cf CAPACITY 1000 ITEMS item1 item2 
1) (integer) 1
2) (integer) 1
{{< / highlight >}}

{{< highlight bash >}}
redis> CF.INSERTNX cf CAPACITY 1000 ITEMS item1 item2 item3
1) (integer) 0
2) (integer) 0
3) (integer) 1
{{< / highlight >}}

{{< highlight bash >}}
redis> CF.INSERTNX cf_new CAPACITY 1000 NOCREATE ITEMS item1 item2 
(error) ERR not found
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cf-insert-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}), where each element is an [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) of `0` means that the item's fingerprint already exists in the filter, `1` for successfully adding an item, or `-1` when the item cannot be added because the filter is full.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors">}}) when the number of arguments or key type is incorrect, and also when `NOCREATE` is specified and `key` does not exist.

-tab-sep-

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}), where each element is a [boolean reply]({{< relref "/develop/reference/protocol-spec#booleans" >}}) of `1` for successfully adding an item, or `-1` when the item cannot be added because the filter is full.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors">}}) when the number of arguments or key type is incorrect, and also when `NOCREATE` is specified and `key` does not exist.

{{< /multitabs >}}
