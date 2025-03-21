---
acl_categories:
- '@cms'
- '@write'
- '@fast'
arguments:
- name: key
  type: key
- name: width
  type: integer
- name: depth
  type: integer
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
description: Initializes a Count-Min Sketch to dimensions specified by user
group: cms
hidden: false
linkTitle: CMS.INITBYDIM
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Initializes a Count-Min Sketch to dimensions specified by user
syntax_fmt: CMS.INITBYDIM key width depth
syntax_str: width depth
title: CMS.INITBYDIM
---
Initializes a Count-Min Sketch to dimensions specified by user.

### Parameters:

* **key**: The name of the sketch.
* **width**: Number of counters in each array. Reduces the error size.
* **depth**: Number of counter-arrays. Reduces the probability for an
    error of a certain size (percentage of total count).

## Return

[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly, or [] otherwise.

## Examples

```
redis> CMS.INITBYDIM test 2000 5
OK
```