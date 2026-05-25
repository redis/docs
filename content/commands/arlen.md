---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
arity: 2
bannerText: Array is a new data type that is currently in preview and may be subject to change.
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
command_flags:
- READONLY
- FAST
complexity: O(1)
description: Returns the length of an array (max index + 1).
function: arlenCommand
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
  - RO
  - ACCESS
linkTitle: ARLEN
reply_schema:
  description: The length of the array (max index + 1), or 0 if key does not exist.
  type: integer
since: 8.8.0
summary: Returns the length of an array (max index + 1).
syntax_fmt: ARLEN key
title: ARLEN
---
Returns the length of an array (max index + 1).

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

## Examples

{{% redis-cli %}}
ARSET myarray 0 "a"
ARSET myarray 5 "b"
ARLEN myarray
ARCOUNT myarray
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): The length of the array (max index + 1), or 0 if key does not exist.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The length of the array (max index + 1), or 0 if key does not exist.

{{< /multitabs >}}
