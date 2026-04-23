---
acl_categories:
- '@array'
arguments:
- key_spec_index: 0
  name: key
  type: key
arity: 2
bannerText: Array is a new data type that is currently in preview and may be subject to change.
categories:
- docs
- develop
- oss
- rs
- rc
- kubernetes
- clients
command_flags:
- readonly
- fast
complexity: O(1)
description: Returns the number of non-empty elements in an array.
group: array
hidden: false
key_specs:
- begin_search:
    index:
      pos: 1
  find_keys:
    range:
      lastkey: 0
      limit: 0
      step: 1
  flags:
  - ro
  - access
linkTitle: ARCOUNT
since: 8.8.0
summary: Returns the number of non-empty elements in an array.
syntax_fmt: ARCOUNT key
title: ARCOUNT
---
Returns the number of non-empty elements in an array.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

## Examples

{{% redis-cli %}}
ARSET myarray 0 "a"
ARSET myarray 5 "b"
ARCOUNT myarray
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): The number of non-empty elements, or 0 if key does not exist.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The number of non-empty elements, or 0 if key does not exist.

{{< /multitabs >}}
