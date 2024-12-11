---
acl_categories:
- '@cms'
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
description: Returns information about a sketch
group: cms
hidden: false
linkTitle: CMS.INFO
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Returns information about a sketch
syntax_fmt: CMS.INFO key
syntax_str: ''
title: CMS.INFO
---
Returns width, depth and total count of the sketch.

### Parameters:

* **key**: The name of the sketch.

## Return

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with information of the filter.

## Examples

```
redis> CMS.INFO test
 1) width
 2) (integer) 2000
 3) depth
 4) (integer) 7
 5) count
 6) (integer) 0
```
