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
- display_text: start
  name: start
  type: integer
- display_text: end
  name: end
  type: integer
arity: 4
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
complexity: O(C + M) where C is the number of bitmap containers and M is the number
  of returned integers.
description: Returns an inclusive range of set-bit offsets by their zero-based ranks
  in a native bitmap.
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
linkTitle: BITRANGEINTARRAY
railroad_diagram: /images/railroad/bitrangeintarray.svg
reply_schema:
  description: Set-bit offsets at the inclusive ranks in ascending order. An end of
    -1 includes all remaining set bits. Missing or empty bitmaps, reversed bounded
    ranges, and starts beyond the last rank return an empty array.
  items:
    minimum: 0
    type: integer
  type: array
  uniqueItems: true
since: 8.12.0
summary: Returns an inclusive range of set-bit offsets by their zero-based ranks in
  a native bitmap.
syntax_fmt: BITRANGEINTARRAY key start end
title: BITRANGEINTARRAY
---

Returns a range of set-bit offsets from a native Roaring bitmap in ascending
order, selected by their inclusive, zero-based element ranks.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the native bitmap.

</details>

<details open><summary><code>start</code></summary>

The first element rank to return, inclusive. Must be an integer from `0` through
`4294967295`.

</details>

<details open><summary><code>end</code></summary>

The last element rank to return, inclusive. Use `-1` to return every element
from `start` through the end of the bitmap. Otherwise, use an integer from `0`
through `4294967295`.

</details>

## Examples

{{% redis-cli %}}
redis> CONFIG SET bitmap-default-roaring yes
OK
redis> SETBIT members 10 1
(integer) 0
redis> SETBIT members 20 1
(integer) 0
redis> SETBIT members 30 1
(integer) 0
redis> BITRANGEINTARRAY members 0 -1
1) (integer) 10
2) (integer) 20
3) (integer) 30
redis> BITRANGEINTARRAY members 1 -1
1) (integer) 20
2) (integer) 30
redis> BITRANGEINTARRAY members 1 2
1) (integer) 20
2) (integer) 30
redis> BITRANGEINTARRAY members 2 100
1) (integer) 30
redis> BITRANGEINTARRAY members 3 4
(empty array)
redis> BITRANGEINTARRAY members 2 1
(empty array)
{{% /redis-cli %}}

## Details

### Ranks and range limits

`start` and `end` are inclusive, zero-based **element ranks** in the ordered
array of set-bit offsets. For set-bit offsets `{10, 20, 30}`, ranks `1` through
`2` return `{20, 30}`. The arguments are not bit or byte offsets. `start` must
fit the unsigned 32-bit range. `end` must fit the same range or be `-1`.

With a nonnegative `end` and a non-reversed range, the requested span
`end - start + 1` must be at most `100000000`, even if the key is missing or
contains fewer set bits. Larger spans return
`ERR range too large: maximum 100000000 elements`. This limit matches
redis-roaring's bounded-range behavior.

With `end` set to `-1`, the command returns all remaining elements without the
100,000,000-element span limit. `BITRANGEINTARRAY key 0 -1` returns the complete
array, including elements at ranks above `4294967295` when the bitmap has that
many set bits. The starting rank is still limited to `4294967295`.

A missing or empty bitmap, a reversed bounded range (`start > end` with
nonnegative `end`), or a start rank beyond the last element returns an empty
array. A nonnegative end rank beyond the last element is truncated to the
available elements.

### Key behavior

The command validates `start`, then `end`, before looking up the key. An invalid
rank returns an argument error even for a key of another type. With valid ranks,
a reversed bounded range returns an empty array, and an oversized bounded span
returns the range error, before checking the key type. For other ranges, the
command accepts the native `bitmap` type only; a string-backed bitmap or any
other existing type returns `WRONGTYPE`. It does not convert strings, change the
bitmap, or change its expiration, and works on existing native bitmaps
regardless of the current `bitmap-default-roaring` setting.

### Pagination and performance

Use successive rank ranges such as `0 99`, `100 199`, and `200 299` to page
through a bitmap. Separate calls do not share a snapshot: inserting or removing
set bits between pages can shift ranks and cause skipped or repeated offsets.

The command seeks to the first rank and iterates forward. Seeking a distant
rank can still traverse bitmap containers, so later pages can cost more than
the first page even when they return the same number of integers.
Configured client output-buffer limits still apply and can disconnect a client
whose reply grows too large.

An unbounded response must fit the server platform's reply-length
representation (`LONG_MAX` elements). If the number of remaining elements is
too large, the command returns an error directing you to use a bounded range.
Response size and serialization cost grow with the number of returned elements.

The rank argument restrictions do not limit stored offsets. Returned offsets
retain the native bitmap's full supported range, including values above
`4294967295` when the bitmap was created with a sufficiently large
`proto-max-bulk-len`. Clients must preserve the precision of returned integers.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bitrangeintarray-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays) of [integers](../../develop/reference/protocol-spec#integers): Set-bit offsets at the inclusive ranks in ascending order. An end of -1 includes all remaining set bits. Missing or empty bitmaps, reversed bounded ranges, and starts beyond the last rank return an empty array.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays) of [integers](../../develop/reference/protocol-spec#integers): Set-bit offsets at the inclusive ranks in ascending order. An end of -1 includes all remaining set bits. Missing or empty bitmaps, reversed bounded ranges, and starts beyond the last rank return an empty array.

{{< /multitabs >}}

## Related topics

- [Roaring-compressed bitmaps](/content/develop/data-types/strings/bitmaps.md#roaring-compressed-bitmaps)
