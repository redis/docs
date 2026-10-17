---
acl_categories:
- '@write'
- '@bitmap'
- '@slow'
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
- write
- denyoom
- noscript
- internal
complexity: O(N) where N is the length of the string value.
description: Converts a string bitmap to the native bitmap representation.
doc_flags:
- syscmd
group: bitmap
hidden: false
key_specs:
- RW: true
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
  update: true
linkTitle: BITCONVERT
railroad_diagram: /images/railroad/bitconvert.svg
reply_schema:
  const: OK
since: 8.12.0
summary: Converts a string bitmap to the native bitmap representation.
syntax_fmt: BITCONVERT key
title: BITCONVERT
---

`BITCONVERT` is an internal command that preserves string-to-native bitmap
conversions during replication and append-only file (AOF) replay. Applications
cannot call it directly.

## Required arguments

<details open><summary><code>key</code></summary>

The key to convert to a native bitmap.

</details>

## Details

Redis uses this command to replay a representation change independently of the
receiving node's `bitmap-default-roaring` setting. Ordinary clients receive an
unknown-command error and do not see it in `COMMAND INFO` or `COMMAND DOCS`.

Converting a string preserves its bits, logical byte length, and expiration.
A missing key becomes an empty native bitmap. An existing native bitmap is
unchanged. Other value types return `WRONGTYPE`; strings beyond the supported
native bitmap length return an error.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bitconvert-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}

## See also

[`SETBIT`](/content/commands/setbit.md) | [`BITROAROP`](/content/commands/bitroarop.md)

## Related topics

- [Roaring-compressed bitmaps](/content/develop/data-types/strings/bitmaps.md#roaring-compressed-bitmaps)
