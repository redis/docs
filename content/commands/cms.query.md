---
acl_categories:
- '@cms'
- '@read'
arguments:
- name: key
  type: key
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
complexity: O(n) where n is the number of items
description: Returns the count for one or more items in a sketch
group: cms
hidden: false
linkTitle: CMS.QUERY
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Returns the count for one or more items in a sketch
syntax_fmt: CMS.QUERY key item [item ...]
syntax_str: item [item ...]
title: CMS.QUERY
---
Returns the count for one or more items in a sketch.

### Parameters:

* **key**: The name of the sketch.
* **item**: One or more items for which to return the count.

## Examples

```
redis> CMS.QUERY test foo bar
1) (integer) 10
2) (integer) 42
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cms-merge-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}})  representing the min-counts of each of the provided items in the sketch.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, missing key, or wrong key type.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the min-counts of each of the provided items in the sketch.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, missing key, or wrong key type.

{{< /multitabs >}}