---
aliases:
- /data-types/bitmaps/
- /manual/data-types/bitmaps/
- /develop/data-types/bitmaps/
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
description: Introduction to Redis bitmaps
linkTitle: Bitmaps
title: Redis bitmaps
weight: 20
---

{{< command-group group="bitmap" title="Bitmap/bitfield command summary" show_link=true >}}

Starting with Redis 8.12, Redis can store bitmaps in two
representations:

* By default, a bitmap is a set of bit-oriented operations defined on a
  string, which is treated like a bit vector.
* When enabled, Redis can instead store a bitmap as a distinct, native
  `bitmap` type with the `bitmap-roaring` compressed encoding.

Both representations support the existing bit-oriented commands. Native
bitmaps also support retrieving set-bit offsets as integer arrays. With the default
512 MB `proto-max-bulk-len`, they can address up to 2^32 different bits.
Native bitmaps are not strings, so generic string commands don't operate on
them. See [Roaring-compressed bitmaps](#roaring-compressed-bitmaps) before
enabling the native representation.

You can perform bitwise operations on one or more bitmaps.
Some examples of bitmap use cases include:

* Efficient set representations for cases where the members of a set correspond to the integers 0-N.
* Object permissions, where each bit represents a particular permission, similar to the way that file systems store permissions.

## Example

Suppose you have 1000 cyclists racing through the country-side, with sensors on their bikes labeled 0-999.
You want to quickly determine whether a given sensor has pinged a tracking server within the hour to check in on a rider. 

You can represent this scenario using a bitmap whose key references the current hour.

* Rider 123 pings the server on January 1, 2024 within the 00:00 hour. You can then confirm that rider 123 pinged the server. You can also check to see if rider 456 has pinged the server for that same hour.

{{< clients-example set="bitmap_tutorial" step="ping" description="Foundational: Set and get individual bits using SETBIT and GETBIT to track binary states" runnable="false" try_it="false" >}}
> SETBIT pings:2024-01-01-00:00 123 1
(integer) 0
> GETBIT pings:2024-01-01-00:00 123
1
> GETBIT pings:2024-01-01-00:00 456
0
{{< /clients-example >}}


## Bit Operations

Bit operations are divided into two groups: constant-time single bit
operations, like setting a bit to 1 or 0, or getting its value, and
operations on groups of bits, for example counting the number of set
bits in a given range of bits (e.g., population counting).

One of the biggest advantages of bitmaps is that they often provide
extreme space savings when storing information. For example in a system
where different users are represented by incremental user IDs, it is possible
to remember a single bit information (for example, knowing whether
a user wants to receive a newsletter) of 4 billion users using just 512 MB of memory.

The [`SETBIT`](/content/commands/setbit.md) command takes as its first argument the bit number, and as its second
argument the value to set the bit to, which is 1 or 0. The command
automatically enlarges the string if the addressed bit is outside the
current string length.

[`GETBIT`](/content/commands/getbit.md) just returns the value of the bit at the specified index.
Out of range bits (addressing a bit that is outside the length of the string
stored into the target key) are always considered to be zero.

There are three commands operating on group of bits:

1. [`BITOP`](/content/commands/bitop.md) performs bit-wise operations between different strings. The provided operators are `AND`, `OR`, `XOR`, `NOT`, `DIFF`, `DIFF1`, `ANDOR`, and `ONE`.
2. [`BITCOUNT`](/content/commands/bitcount.md) performs population counting, reporting the number of bits set to 1.
3. [`BITPOS`](/content/commands/bitpos.md) finds the first bit having the specified value of 0 or 1.

Both [`BITPOS`](/content/commands/bitpos.md) and [`BITCOUNT`](/content/commands/bitcount.md) are able to operate with byte ranges of the
string, instead of running for the whole length of the string. We can trivially see the number of bits that have been set in a bitmap.

{{< clients-example set="bitmap_tutorial" step="bitcount" description="Bit counting: Use BITCOUNT to count the number of set bits in a bitmap when you need to get population counts" buildsUpon="ping" runnable="false" try_it="false" >}}
> BITCOUNT pings:2024-01-01-00:00
(integer) 1
{{< /clients-example >}}

For example imagine you want to know the longest streak of daily visits of
your web site users. You start counting days starting from zero, that is the
day you made your web site public, and set a bit with [`SETBIT`](/content/commands/setbit.md) every time
the user visits the web site. As a bit index you simply take the current unix
time, subtract the initial offset, and divide by the number of seconds in a day
(normally, 3600\*24).

This way for each user you have a small string containing the visit
information for each day. With [`BITCOUNT`](/content/commands/bitcount.md) it is possible to easily get
the number of days a given user visited the web site, while with
a few [`BITPOS`](/content/commands/bitpos.md) calls, or simply fetching and analyzing the bitmap client-side,
it is possible to easily compute the longest streak.

### Bitwise operations

The [`BITOP`](/content/commands/bitop.md) command performs bitwise
operations over two or more source keys, storing the result in a destination key.

The examples below show the available operations using three keys: `A` (with bit pattern
`11011000`), `B` (`00011001`), and `C` (`01101100`).

![Bitop setup](/images/dev/bitmap/BitopSetup.svg)

Numbering the bits from left to right, starting at zero, the following `SETBIT` commands 
will create these bitmaps:

{{< clients-example set="bitmap_tutorial" step="bitop_setup" description="Setup for bitwise operations: Create multiple bitmaps using SETBIT to prepare for demonstrating bitwise operations" difficulty="intermediate" buildsUpon="ping" runnable="false" try_it="false" >}}
> SETBIT A 0 1
(integer) 0
> SETBIT A 1 1
(integer) 0
> SETBIT A 3 1
(integer) 0
> SETBIT A 4 1
(integer) 0
> GET A
"\xd8"
# Hex value: 0xd8 = 0b11011000

> SETBIT B 3 1
(integer) 0
> SETBIT B 4 1
(integer) 0
> SETBIT B 7 1
(integer) 0
> GET B
"\x19"
# Hex value: 0x19 = 0b00011001

> SETBIT C 1 1
(integer) 0
> SETBIT C 2 1
(integer) 0
> SETBIT C 4 1
(integer) 0
> SETBIT C 5 1
(integer) 0
> GET C
"l"
# ASCII "l" = hex 0x6c = 0b01101100
{{< /clients-example >}}

#### `AND`

Set a bit in the destination key to 1 only if it is set in all the source keys.

![Bitop AND](/images/dev/bitmap/BitopAnd.svg)

{{< clients-example set="bitmap_tutorial" step="bitop_and" description="AND operation: Use BITOP AND to find bits set in all source bitmaps when you need to find common bits across multiple sets" difficulty="intermediate" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP AND R A B C
(integer) 1
> GET R
"\b"
# ASCII "\b" (backspace) = hex 0x08 = 0b00001000
{{< /clients-example >}}

#### `OR`
Set a bit in the destination key to 1 if it is set in at least one of the source keys.

![Bitop OR](/images/dev/bitmap/BitopOr.svg)

{{< clients-example set="bitmap_tutorial" step="bitop_or" description="OR operation: Use BITOP OR to find bits set in at least one source bitmap when you need to combine multiple sets" difficulty="intermediate" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP OR R A B C
(integer) 1
> GET R
"\xfd"
# Hex value: 0xfd = 0b11111101
{{< /clients-example >}}

#### `XOR`

For two source keys, set a bit in the destination key to 1 if the value of the bit is 
different in the two keys. For three or more source keys, the result of XORing the first two 
keys is then XORed with the next key, and so forth.

![Bitop XOR](/images/dev/bitmap/BitopXor.svg)

{{< clients-example set="bitmap_tutorial" step="bitop_xor" description="XOR operation: Use BITOP XOR to find bits that differ between bitmaps when you need to identify differences" difficulty="intermediate" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP XOR R A B
(integer) 1
> GET R
"\xc1"
# Hex value: 0xc1 = 0b11000001
{{< /clients-example >}}

#### `NOT`

Set a bit in the destination key to 1 if it is not set in the source key (this
is the only unary operator).

![Bitop NOT](/images/dev/bitmap/BitopNot.svg)

{{< clients-example set="bitmap_tutorial" step="bitop_not" description="NOT operation: Use BITOP NOT to invert all bits in a bitmap when you need to negate a set" difficulty="intermediate" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP NOT R A
(integer) 1
> GET R
"'"
# ASCII "'" (single quote) = hex 0x27 = 0b00100111
{{< /clients-example >}}

#### `DIFF`

Set a bit in the destination key to 1 if it is set in the first source key, but not in any 
of the other source keys.

![Bitop DIFF](/images/dev/bitmap/BitopDiff.svg)

{{< clients-example set="bitmap_tutorial" step="bitop_diff" description="DIFF operation: Use BITOP DIFF to find bits set in the first bitmap but not in others when you need set difference" difficulty="advanced" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP DIFF R A B C
(integer) 1
> GET R
"\x80"
# Hex value: 0x80 = 0b10000000
{{< /clients-example >}}

#### `DIFF1`

Set a bit in the destination key to 1 if it is not set in the first source key, 
but set in at least one of the other source keys.

![Bitop DIFF1](/images/dev/bitmap/BitopDiff1.svg)

{{< clients-example set="bitmap_tutorial" step="bitop_diff1" description="DIFF1 operation: Use BITOP DIFF1 to find bits not in the first bitmap but in at least one other when you need inverse difference" difficulty="advanced" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP DIFF1 R A B C
(integer) 1
> GET R
"%"
# ASCII "%" (percent) = hex 0x25 = 0b00100101
{{< /clients-example >}}

#### `ANDOR`

Set a bit in the destination key to 1 if it is set in the first source key and also in at least one of the other source keys.

![Bitop ANDOR](/images/dev/bitmap/BitopAndOr.svg)

{{< clients-example set="bitmap_tutorial" step="bitop_andor" description="ANDOR operation: Use BITOP ANDOR to find bits in the first bitmap and at least one other when you need intersection with union" difficulty="advanced" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP ANDOR R A B C
(integer) 1
> GET R
"X"
# ASCII "X" = hex 0x58 = 0b01011000
{{< /clients-example >}}

#### `ONE`

Set a bit in the destination key to 1 if it is set in exactly one of the source keys.

![Bitop ONE](/images/dev/bitmap/BitopOne.svg)

{{< clients-example set="bitmap_tutorial" step="bitop_one" description="ONE operation: Use BITOP ONE to find bits set in exactly one bitmap when you need exclusive membership" difficulty="advanced" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP ONE R A B C
(integer) 1
> GET R
"\xa5"
# Hex value: 0xa5 = 0b10100101
{{< /clients-example >}}

## Roaring-compressed bitmaps

A string-backed bitmap allocates bytes through the highest addressed bit. This
is efficient for dense bitmaps, but a small number of set bits spread across a
large range can leave most of the string filled with zeros.

A native Roaring bitmap stores set-bit positions in compressed containers while
preserving the same logical byte length and bitmap command behavior. This can
reduce memory use for sparse bitmaps, such as membership or event indexes over
a large integer ID space. Long runs of set bits can also compress well. Small
bitmaps and irregular dense bitmaps can use as much or more memory than strings
because compressed containers have their own metadata. Compare
[`MEMORY USAGE`](/content/commands/memory-usage.md) and command latency
with representative data before enabling Roaring bitmaps for a workload.

### Enable Roaring bitmap creation

The `bitmap-default-roaring` configuration parameter is `no` by default. Set it
to `yes` in your Redis configuration file, or enable it at runtime with
[`CONFIG SET`](/content/commands/config-set.md):

{{< clients-example set="bitmap_tutorial" step="roaring" description="Compressed storage: Enable native Roaring creation for sparse bitmaps when you don't need to access their raw bytes with string commands" difficulty="intermediate" buildsUpon="ping" runnable="false" try_it="false" >}}
> CONFIG SET bitmap-default-roaring yes
OK
> SETBIT events:2026-07 1000000 1
(integer) 0
> TYPE events:2026-07
bitmap
> OBJECT ENCODING events:2026-07
"bitmap-roaring"
> BITCOUNT events:2026-07
(integer) 1
> GET events:2026-07
(error) WRONGTYPE Operation against a key holding the wrong kind of value
{{< /clients-example >}}

Changing the configuration does not immediately convert existing keys:

* With `bitmap-default-roaring no`, [`SETBIT`](/content/commands/setbit.md)
  and write forms of [`BITFIELD`](/content/commands/bitfield.md) create
  string-backed bitmaps. Existing native bitmaps remain native and continue to
  accept bitmap commands.
* With `bitmap-default-roaring yes`, those commands create missing keys as
  native bitmaps. A write to an existing string converts the complete string
  to a native bitmap before applying the write. The conversion preserves its
  bits, logical length, expiration, and key metadata.
* Read-only bitmap commands don't change a string's stored representation.
  [`SET`](/content/commands/set.md) also continues to create a string, regardless
  of this setting.
* [`BITOP`](/content/commands/bitop.md) stores a non-empty result as a
  native destination when the setting is `yes`. When the setting is `no`, its
  destination is native if at least one source is native; an operation with
  only string sources produces a string destination.

There is no command that converts a native bitmap back to a string while
preserving its contents. `SET` can replace a native bitmap with a new string
value, as it can replace any other Redis type.

### Command and type compatibility

[`SETBIT`](/content/commands/setbit.md),
[`GETBIT`](/content/commands/getbit.md),
[`BITCOUNT`](/content/commands/bitcount.md),
[`BITPOS`](/content/commands/bitpos.md),
[`BITOP`](/content/commands/bitop.md),
[`BITFIELD`](/content/commands/bitfield.md), and
[`BITFIELD_RO`](/content/commands/bitfield_ro.md) work with both
representations and keep their existing reply and range semantics. Setting a
zero bit beyond the current logical end extends either representation, and
bits between the old and new ends read as zero. The read-only commands in this
list accept strings and native bitmaps regardless of `bitmap-default-roaring`.

[`BITRANGEINTARRAY`](/content/commands/bitrangeintarray.md) also reads both
representations with either setting. It reads strings directly without conversion
and leaves their bytes, type, and expiration unchanged.

The representations are intentionally visible to clients:

* [`TYPE`](/content/commands/type.md) returns `string` for a string-backed
  bitmap and `bitmap` for a native one.
* [`OBJECT ENCODING`](/content/commands/object-encoding.md) returns
  `bitmap-roaring` for a native bitmap.
* Generic string commands such as [`GET`](/content/commands/get.md),
  [`STRLEN`](/content/commands/strlen.md),
  [`GETRANGE`](/content/commands/getrange.md), and
  [`APPEND`](/content/commands/append.md) return a wrong-type error for a
  native bitmap. Applications that read or modify bitmap bytes with string
  commands should keep using the default string representation.

Both representations limit accepted bit offsets according to
`proto-max-bulk-len`. An existing bitmap can have a longer logical length if it
was created or loaded while that limit was higher. [`BITOP`](/content/commands/bitop.md) operates on the complete logical length of such a
source. In particular, `BITOP NOT` can allocate a dense result of that length,
so account for its memory cost before lowering the limit.

### Retrieve matching bit offsets

[`BITRANGEINTARRAY`](/content/commands/bitrangeintarray.md) returns set-bit offsets
in ascending order, or clear-bit offsets with `ZEROS`:
`BITRANGEINTARRAY key start end [BYTE|BIT] [LIMIT count] [ZEROS]`.
The key, start, and end are required. Ranges follow `BITCOUNT`: byte offsets by
default, bit offsets with `BIT`, and negative indexes count from the end.
Returned offsets are always bit offsets.

```redis
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
redis> BITRANGEINTARRAY members 0 -1
1) (integer) 1
2) (integer) 7
3) (integer) 9
4) (integer) 30
redis> BITRANGEINTARRAY members 28 31 BIT ZEROS
1) (integer) 28
2) (integer) 29
3) (integer) 31
redis> BITRANGEINTARRAY members 0 -1 BIT LIMIT 2
1) (integer) 1
2) (integer) 7
redis> BITRANGEINTARRAY members 8 -1 BIT LIMIT 2
1) (integer) 9
2) (integer) 30
redis> BITRANGEINTARRAY members 0 -1 BYTE LIMIT 1
1) (integer) 1
2) (integer) 7
redis> BITRANGEINTARRAY members 1 -1 BYTE LIMIT 1
1) (integer) 9
```

Both set-bit and clear-bit enumeration stay within the value's logical length.
Missing keys, empty values, and empty ranges return empty arrays.
Strings and native bitmaps work with either
`bitmap-default-roaring` setting; other types return `WRONGTYPE`.

Keep the same end, unit, and `ZEROS` setting across pages.
For pagination, `BIT LIMIT count` returns at most `count` offsets. Resume at
the last returned offset + 1. `BYTE LIMIT count` finishes the byte containing
the `count`th match, so it can return up to seven extra offsets. Resume at
floor(last offset / 8) + 1. `LIMIT 0` returns an empty array; negative counts
are errors. Stop when a page contains fewer than `count` results. A full page
can be followed by a final empty page.

Separate calls do not share a snapshot, so writes can change remaining matches.
Strings are scanned in place over the requested range, without conversion.
`LIMIT` stops the scan when the page is complete. Response size grows with the
number of offsets; client output-buffer limits still apply.

See the [command reference](/content/commands/bitrangeintarray.md) for range
and pagination details, and [Integer-array command benchmarks](/content/develop/data-types/strings/bitmap-intarray-benchmarks.md)
for benchmark methodology and historical comparisons against redis-roaring.

### Persistence and replication

RDB snapshots, [`DUMP`](/content/commands/dump.md) and
[`RESTORE`](/content/commands/restore.md), AOF rewrites, and replication
preserve the native bitmap type. When a write creates or converts a native
bitmap because `bitmap-default-roaring` is `yes`, Redis propagates the
representation transition explicitly so replicas produce the same type even if
their local setting differs.

For `SETBIT` and writing `BITFIELD` operations, Redis records the representation
transition as [`BITCONVERT`](/content/commands/bitconvert.md) before the bitmap
command. For `BITOP`, Redis uses [`BITROAROP`](/content/commands/bitroarop.md) to
preserve a native result selected by `bitmap-default-roaring`.
These commands are reserved for internal replication and AOF loading. Ordinary
clients cannot invoke them or discover them through `COMMAND` introspection; direct calls
return `ERR unknown command`. Applications should use the public bitmap
commands and `bitmap-default-roaring` to create and modify native bitmaps.

> [!WARNING]
> Before enabling Roaring bitmap creation on a primary, upgrade all replicas and
> any Redis server that will load its RDB, DUMP payloads, or AOF. Older versions
> don't understand the native bitmap persistence format.

## Split bitmaps into multiple keys

Bitmaps are trivial to split into multiple keys, for example for
the sake of sharding the data set and because in general it is better to
avoid working with huge keys. To split a bitmap across different keys
instead of setting all the bits into a key, a trivial strategy is just
to store M bits per key and obtain the key name with `bit-number/M` and
the Nth bit to address inside the key with `bit-number MOD M`.

## Performance

[`SETBIT`](/content/commands/setbit.md) and [`GETBIT`](/content/commands/getbit.md) are O(1).
[`BITOP`](/content/commands/bitop.md) is O(n), where _n_ is the logical
length of the longest source bitmap.
For Roaring bitmaps, actual CPU and memory costs also depend on the distribution
of set bits and the resulting compressed containers. In particular, `BITOP NOT`
can turn a sparse bitmap into a dense result. Benchmark representative data and
operations when choosing a representation.

## Learn more

* [Redis Bitmaps Explained](https://www.youtube.com/watch?v=oj8LdJQjhJo) teaches you how to use bitmaps for map exploration in an online game. 
* [Redis University's RU101](https://university.redis.com/courses/ru101/) covers Redis bitmaps in detail.
