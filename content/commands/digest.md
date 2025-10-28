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
summary: Returns the XXH3 hash of a string value as a hexadecimal string.
syntax_fmt: DIGEST key
syntax_str: ''
title: DIGEST
---

Get the XXH3 hash digest for the value stored in the specified key as a hexadecimal string. Keys must be of type string.

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- [Null bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) if the key does not exist.
- [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key exists but holds a value which is not a string.
- [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) the XXH3 digest of the value stored in the key as a hexadecimal string.

-tab-sep-

One of the following:

- [Null bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) if the key does not exist.
- [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key exists but holds a value which is not a string.
- [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) the XXH3 digest of the value stored in the key as a hexadecimal string.

{{< /multitabs >}}
