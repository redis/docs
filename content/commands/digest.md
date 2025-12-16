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
description: Returns the hash digest of a string value.
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
railroad_diagram: /images/railroad/digest.svg
since: 8.4.0
summary: Returns the hash digest of a string value as a hexadecimal string.
syntax_fmt: DIGEST key
title: DIGEST
---

Get the hash digest for the value stored in the specified key as a hexadecimal string. Keys must be of type string.

## Hash Digest

A hash digest is a fixed-size numerical representation of a string value, computed using the XXH3 hash algorithm. Redis uses this hash digest for efficient comparison operations without needing to compare the full string content. You can use these hash digests with the [SET]({{< relref "/commands/set" >}}) command's `IFDEQ` and `IFDNE` options, and also the [DELEX]({{< relref "/commands/delex" >}}) command's `IFDEQ` and `IFDNE` options.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Example

```bash
> SET key1 "Hello world"
OK
> DIGEST key1
"b6acb9d84a38ff74"
```

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- [Null bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) if the key does not exist.
- [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key exists but holds a value which is not a string.
- [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) the hash digest of the value stored in the key as a hexadecimal string.

-tab-sep-

One of the following:

- [Null bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) if the key does not exist.
- [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key exists but holds a value which is not a string.
- [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) the hash digest of the value stored in the key as a hexadecimal string.

{{< /multitabs >}}
