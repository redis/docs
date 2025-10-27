---
acl_categories:
- '@read'
- '@string'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 2
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
- readonly
- fast
complexity: O(N) where N is the length of the string value.
description: Returns the XXH3 hash of a string value.
group: string
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: DIGEST
since: 8.4.0
summary: Returns the XXH3 hash of a string value.
syntax_fmt: DIGEST key
syntax_str: ''
title: DIGEST
---
Returns the XXH3 hash of a string value.

## Required arguments

<details open><summary><code>key</code></summary>

TODO: Add description for key (key)

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

TODO: Add RESP2 return information

-tab-sep-

TODO: Add RESP3 return information

{{< /multitabs >}}

