---
acl_categories:
- '@write'
- '@bitmap'
- '@slow'
arguments:
- arguments:
  - display_text: and
    name: and
    token: AND
    type: pure-token
  - display_text: or
    name: or
    token: OR
    type: pure-token
  - display_text: xor
    name: xor
    token: XOR
    type: pure-token
  - display_text: not
    name: not
    token: NOT
    type: pure-token
  - display_text: diff
    name: diff
    token: DIFF
    type: pure-token
  - display_text: diff1
    name: diff1
    token: DIFF1
    type: pure-token
  - display_text: andor
    name: andor
    token: ANDOR
    type: pure-token
  - display_text: one
    name: one
    token: ONE
    type: pure-token
  name: operation
  type: oneof
- display_text: destkey
  key_spec_index: 0
  name: destkey
  type: key
- display_text: key
  key_spec_index: 1
  multiple: true
  name: key
  type: key
arity: -4
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
complexity: O(N)
description: Performs a bitwise operation and stores a native bitmap result for replication
  and AOF replay.
doc_flags:
- syscmd
group: bitmap
hidden: false
key_specs:
- OW: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
- RO: true
  access: true
  begin_search:
    spec:
      index: 3
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 0
    type: range
linkTitle: BITROAROP
railroad_diagram: /images/railroad/bitroarop.svg
reply_schema:
  description: the logical size in bytes of the native bitmap result, equal to the
    longest input
  minimum: 0
  type: integer
since: 8.12.0
summary: Performs a bitwise operation and stores a native bitmap result for replication
  and AOF replay.
syntax_fmt: "BITROAROP <AND | OR | XOR | NOT | DIFF | DIFF1 | ANDOR | ONE>\n  destkey\
  \ key [key ...]"
title: BITROAROP
---

`BITROAROP` is an internal command that preserves native bitmap results during
replication and append-only file (AOF) replay. Applications cannot call it
directly.

## Required arguments

<details open><summary><code>AND | OR | XOR | NOT | DIFF | DIFF1 | ANDOR | ONE</code></summary>

The bitwise operation, with the same meaning as in
[`BITOP`](/content/commands/bitop.md).

</details>

<details open><summary><code>destkey</code></summary>

The destination key. The result overwrites its existing value and removes its
expiration.

</details>

<details open><summary><code>key [key ...]</code></summary>

The source bitmap keys. Sources can be strings, native bitmaps, or missing keys.
`NOT` requires exactly one source; `DIFF`, `DIFF1`, and `ANDOR` require at least
two. Other operations require at least one source.

</details>

## Details

Redis uses this command to replay a native bitmap result independently of the
receiving node's `bitmap-default-roaring` setting. Ordinary clients receive an
unknown-command error and do not see it in `COMMAND INFO` or `COMMAND DOCS`.

The operation follows `BITOP` semantics, including zero-padding shorter inputs.
A result with a nonzero logical byte length is stored as a native bitmap, even
when all its bits are zero. If all inputs are missing or have zero logical
length, Redis deletes the destination key.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bitroarop-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the logical size
in bytes of the result, equal to the longest input. This is not the number of
set bits or the compressed memory usage.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the logical size
in bytes of the result, equal to the longest input. This is not the number of
set bits or the compressed memory usage.

{{< /multitabs >}}

## See also

[`BITOP`](/content/commands/bitop.md) | [`BITCONVERT`](/content/commands/bitconvert.md)

## Related topics

- [Roaring-compressed bitmaps](/content/develop/data-types/strings/bitmaps.md#roaring-compressed-bitmaps)
