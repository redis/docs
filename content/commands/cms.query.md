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

## Return

Count of one or more items

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) with a min-count of each of the items in the sketch.

## Examples

```
redis> CMS.QUERY test foo bar
1) (integer) 10
2) (integer) 42
```