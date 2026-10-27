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
- display_text: value
  name: value
  type: integer
- display_text: start
  name: start
  type: integer
- display_text: end
  name: end
  type: integer
- arguments:
  - display_text: byte
    name: byte
    token: BYTE
    type: pure-token
  - display_text: bit
    name: bit
    token: BIT
    type: pure-token
  display_text: unit
  name: unit
  optional: true
  type: oneof
- display_text: count
  name: count
  optional: true
  token: LIMIT
  type: integer
arity: -5
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
complexity: O(N + M) where N is the number of bytes in the range for a string, or
  the number of bitmap containers in the range (and of runs of set bits in it, when
  looking for clear bits), and M is the number of returned integers. With LIMIT, the
  scan stops after count matches, or after completing their last byte in BYTE units.
description: Returns the offsets of the set or clear bits in a range of a bitmap.
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
  description: 'Offsets of the bits set to the given value (0 or 1) in the range,
    in ascending order. The range is interpreted as in BITCOUNT: negative indexes
    count from the end, and the unit defaults to BYTE. Unlike BITPOS, the range never
    extends past the end of the bitmap, so no clear bits are returned beyond it. With
    LIMIT, the lowest count offsets in the range are returned. In BYTE units the reply
    also completes the byte holding the last of them, so it can hold up to 7 more
    offsets and the next page can start at the following byte. Missing keys and empty
    ranges return an empty array.'
  items:
    minimum: 0
    type: integer
  type: array
  uniqueItems: true
since: 8.12.0
summary: Returns the offsets of the set or clear bits in a range of a bitmap.
syntax_fmt: "BITRANGEINTARRAY key value start end [BYTE | BIT] [LIMIT\_count]"
title: BITRANGEINTARRAY
---

Returns the offsets of bits equal to `value` (`0` or `1`) within a bitmap range,
in ascending order. The command reads both strings and native bitmaps regardless
of `bitmap-default-roaring`, without changing the stored value.

Offsets use the same numbering as [`GETBIT`](/content/commands/getbit.md):
bit `0` is the most significant bit of the first byte. Returned offsets are
always bit offsets, including when the range uses `BYTE` units.

## Required arguments

<details open><summary><code>key</code></summary>

The key that holds a string or native bitmap.

</details>

<details open><summary><code>value</code></summary>

The bit value to find: `1` returns set-bit offsets; `0` returns clear-bit offsets.
This argument is required and has no default.

</details>

<details open><summary><code>start</code></summary>

The first byte or bit offset in the range, inclusive. The default unit is `BYTE`.
Negative indexes count from the end of the value, as in
[`BITCOUNT`](/content/commands/bitcount.md).

</details>

<details open><summary><code>end</code></summary>

The last byte or bit offset in the range, inclusive. Negative indexes count from
the end: `-1` selects the final byte, or the final bit with `BIT`.
Use `0 -1` to cover the whole value.

</details>

## Optional arguments

<details open><summary><code>BYTE | BIT</code></summary>

The unit for `start` and `end`. `BYTE` is the default. The range selects positions
in the stored value, not ranks in the returned array.

</details>

<details open><summary><code>LIMIT count</code></summary>

Return the lowest matching offsets in the range. With `BIT`, the reply contains
at most `count` offsets. With `BYTE`, the command also returns the remaining
matching offsets in the byte containing the `count`th match. The reply can
therefore contain up to `count + 7` offsets.

`LIMIT 0` returns an empty array. A negative count is an error. Without `LIMIT`,
the command returns every matching offset in the range.

The unit and `LIMIT` options can appear in either order after the required
arguments. If an option is repeated, its last value applies.

</details>

## Examples

{{% redis-cli %}}
redis> CONFIG SET bitmap-default-roaring yes
OK
redis> SETBIT members 1 1
(integer) 0
redis> SETBIT members 7 1
(integer) 0
redis> SETBIT members 9 1
(integer) 0
redis> SETBIT members 30 1
(integer) 0
redis> BITRANGEINTARRAY members 1 0 -1
1) (integer) 1
2) (integer) 7
3) (integer) 9
4) (integer) 30
redis> BITRANGEINTARRAY members 1 1 -1
1) (integer) 9
2) (integer) 30
redis> BITRANGEINTARRAY members 1 5 10 BIT
1) (integer) 7
2) (integer) 9
redis> BITRANGEINTARRAY members 1 -1 -1
1) (integer) 30
redis> BITRANGEINTARRAY members 0 -1 -1 BIT
1) (integer) 31
redis> BITRANGEINTARRAY members 0 28 100 BIT
1) (integer) 28
2) (integer) 29
3) (integer) 31
redis> BITRANGEINTARRAY members 1 0 -1 BIT LIMIT 2
1) (integer) 1
2) (integer) 7
redis> BITRANGEINTARRAY members 1 8 -1 BIT LIMIT 2
1) (integer) 9
2) (integer) 30
redis> BITRANGEINTARRAY members 1 0 -1 LIMIT 1
1) (integer) 1
2) (integer) 7
redis> BITRANGEINTARRAY members 1 1 -1 LIMIT 1
1) (integer) 9
redis> BITRANGEINTARRAY members 1 0 -1 LIMIT 0
(empty array)
redis> CONFIG SET bitmap-default-roaring no
OK
redis> SET rawbits a
OK
redis> BITRANGEINTARRAY rawbits 1 0 -1
1) (integer) 1
2) (integer) 2
3) (integer) 7
redis> BITRANGEINTARRAY rawbits 0 0 -1
1) (integer) 0
2) (integer) 3
3) (integer) 4
4) (integer) 5
5) (integer) 6
redis> GET rawbits
"a"
redis> TYPE rawbits
string
{{% /redis-cli %}}

## Details

### Ranges and clear bits

`start` and `end` follow `BITCOUNT` range semantics. They accept signed 64-bit
integers, and negative indexes count from the logical end of the value in the
selected unit. Bounds are clamped to the value. A reversed range or a start past
the end returns an empty array.

The range never extends beyond the value's logical length, including when
searching for `0`. An all-ones value therefore returns an empty array for
`value = 0`. This differs from `BITPOS key 0`, which can report the first bit
past the end. Missing keys and empty values have no matching bits.

Without `LIMIT`, the number of results for `value = 1` equals `BITCOUNT` over
the same range. For `value = 0`, it equals the number of bits in the normalized
range minus that count.

### Key behavior

Arguments are validated before looking up the key. With valid arguments, a
missing key returns an empty array. Strings and native bitmaps work under either
`bitmap-default-roaring` setting; other types return `WRONGTYPE`.

Strings are read directly without conversion. Reads leave the stored bytes,
type, and expiration unchanged.

### Pagination and performance

Use `LIMIT` to page through matching offsets. Keep the same `value` and `end`
for each page, and choose the next `start` from the last returned bit offset:

| Unit | Maximum page size | Next `start` |
|:-----|:------------------|:-------------|
| `BIT` | `count` | Last offset + 1 |
| `BYTE` | `count + 7` | floor(last offset / 8) + 1 |

Use a positive count. A page with fewer than `count` results means the range is
exhausted. A full page might require one final request that returns an empty
array. Separate calls do not share a snapshot: writes between requests can
change the remaining matches. The continuation rules avoid repeating or skipping
offsets for an unchanged value.

Native bitmaps seek to the start offset and enumerate matching bits. Strings
scan the requested range in place. `LIMIT` stops the scan once the page is
complete; a range with few matches can still require scanning the whole range.
No temporary bitmap or second result array is allocated.

Response size and serialization cost grow with the number of returned offsets.
There is no fixed result-count cap. Configured client output-buffer limits still
apply; exceeding a limit disconnects the client and stops enumeration.

Returned offsets retain the bitmap's supported range, including values above
`4294967295` for native bitmaps created with a sufficiently large
`proto-max-bulk-len`. Clients must preserve the precision of returned integers.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bitrangeintarray-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): Offsets of the bits set to the given value (0 or 1) in the range, in ascending order. The range is interpreted as in BITCOUNT: negative indexes count from the end, and the unit defaults to BYTE. Unlike BITPOS, the range never extends past the end of the bitmap, so no clear bits are returned beyond it. With LIMIT, the lowest count offsets in the range are returned. In BYTE units the reply also completes the byte holding the last of them, so it can hold up to 7 more offsets and the next page can start at the following byte. Missing keys and empty ranges return an empty array.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): Offsets of the bits set to the given value (0 or 1) in the range, in ascending order. The range is interpreted as in BITCOUNT: negative indexes count from the end, and the unit defaults to BYTE. Unlike BITPOS, the range never extends past the end of the bitmap, so no clear bits are returned beyond it. With LIMIT, the lowest count offsets in the range are returned. In BYTE units the reply also completes the byte holding the last of them, so it can hold up to 7 more offsets and the next page can start at the following byte. Missing keys and empty ranges return an empty array.

{{< /multitabs >}}

## Related topics

- [Roaring-compressed bitmaps](/content/develop/data-types/strings/bitmaps.md#roaring-compressed-bitmaps)
