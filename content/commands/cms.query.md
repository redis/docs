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
- oss
- kubernetes
- clients
compatibility:
  software:
    general: supported
  cloud:
    pro: supported
    essentials: supported
complexity: O(n) where n is the number of items
description: Returns the count for one or more items in a sketch
group: cms
hidden: false
linkTitle: CMS.QUERY
module: Bloom
railroad_diagram: /images/railroad/cms.query.svg
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Returns the count for one or more items in a sketch
syntax_fmt: CMS.QUERY key item [item ...]
title: CMS.QUERY
---
Returns the count for one or more items in a sketch.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the sketch.

</details>

<details open><summary><code>item [item ...]</code></summary>

One or more items for which to return the count.

</details>

## Examples

```
redis> CMS.QUERY test foo bar
1) (integer) 10
2) (integer) 42
```

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="cms-merge-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array](/content/develop/reference/protocol-spec.md#arrays) of [integer replies](/content/develop/reference/protocol-spec.md#integers)  representing the min-counts of each of the provided items in the sketch.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: invalid arguments, missing key, or wrong key type.

-tab-sep-

One of the following:

* [Array](/content/develop/reference/protocol-spec.md#arrays) of [integer replies](/content/develop/reference/protocol-spec.md#integers) representing the min-counts of each of the provided items in the sketch.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: invalid arguments, missing key, or wrong key type.

{{< /multitabs >}}