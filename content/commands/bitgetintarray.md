---
acl_categories:
- '@read'
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
- oss
command_flags:
- readonly
complexity: O(C + M) where C is the number of bitmap containers and M is the number of returned integers.
description: Returns all set-bit offsets in a native bitmap as an ascending array of integers.
group: bitmap
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
linkTitle: BITGETINTARRAY
since: 8.12.0
summary: Returns all set-bit offsets in a native bitmap as an ascending array of integers.
syntax_fmt: BITGETINTARRAY key
title: BITGETINTARRAY
---

Returns every offset whose bit is set to `1` in a native Roaring bitmap, in
ascending order. A missing key or a bitmap with no set bits returns an empty
array.

The command accepts the native `bitmap` type only. A string-backed bitmap or any
other existing type returns `WRONGTYPE`. It does not convert strings, change
the bitmap, or change its expiration, and works on existing native bitmaps
regardless of the current `bitmap-default-roaring` setting.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the native bitmap.

</details>

## Examples

```redis
redis> CONFIG SET bitmap-default-roaring yes
OK
redis> SETBIT members 10 1
(integer) 0
redis> SETBIT members 20 1
(integer) 0
redis> SETBIT members 30 1
(integer) 0
redis> BITGETINTARRAY members
1) (integer) 10
2) (integer) 20
3) (integer) 30
```

## Performance considerations

The complete array is returned in one response, without the 100,000,000-element
span limit imposed by `BITRANGEINTARRAY`. The result must still fit the server
platform's reply-length representation (`LONG_MAX` elements); a larger result
returns an error directing the caller to `BITRANGEINTARRAY`. Configured client
output-buffer limits also apply and can disconnect a client whose reply grows
too large.

For large bitmaps, use [`BITRANGEINTARRAY`]({{< relref
"/commands/bitrangeintarray" >}}) to request a bounded page. Response size and
serialization cost grow with the number of set bits.

Offsets retain the native bitmap's full supported range, including values
above `4294967295` when the bitmap was created with a sufficiently large
`proto-max-bulk-len`. Clients must preserve the precision of returned integers.

## Return information

For both RESP2 and RESP3, an [array reply]({{< relref
"/develop/reference/protocol-spec#arrays" >}}) of integer set-bit offsets in
ascending order, or an empty array for a missing or empty bitmap.

## Related topics

- [Roaring-compressed bitmaps]({{< relref "/develop/data-types/strings/bitmaps#roaring-compressed-bitmaps" >}})
- [`BITRANGEINTARRAY`]({{< relref "/commands/bitrangeintarray" >}})
