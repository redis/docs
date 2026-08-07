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

Starting with Redis Open Source 8.12, Redis can store bitmaps in two
representations:

* By default, a bitmap is a set of bit-oriented operations defined on a
  string, which is treated like a bit vector.
* When enabled, Redis can instead store a bitmap as a distinct, native
  `bitmap` type with the `bitmap-roaring` compressed encoding.

Both representations support the same bitmap commands. With the default
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

The [`SETBIT`]({{< relref "/commands/setbit" >}}) command takes as its first argument the bit number, and as its second
argument the value to set the bit to, which is 1 or 0. The command
automatically enlarges the string if the addressed bit is outside the
current string length.

[`GETBIT`]({{< relref "/commands/getbit" >}}) just returns the value of the bit at the specified index.
Out of range bits (addressing a bit that is outside the length of the string
stored into the target key) are always considered to be zero.

There are three commands operating on group of bits:

1. [`BITOP`]({{< relref "/commands/bitop" >}}) performs bit-wise operations between different strings. The provided operators are `AND`, `OR`, `XOR`, `NOT`, `DIFF`, `DIFF1`, `ANDOR`, and `ONE`.
2. [`BITCOUNT`]({{< relref "/commands/bitcount" >}}) performs population counting, reporting the number of bits set to 1.
3. [`BITPOS`]({{< relref "/commands/bitpos" >}}) finds the first bit having the specified value of 0 or 1.

Both [`BITPOS`]({{< relref "/commands/bitpos" >}}) and [`BITCOUNT`]({{< relref "/commands/bitcount" >}}) are able to operate with byte ranges of the
string, instead of running for the whole length of the string. We can trivially see the number of bits that have been set in a bitmap.

{{< clients-example set="bitmap_tutorial" step="bitcount" description="Bit counting: Use BITCOUNT to count the number of set bits in a bitmap when you need to get population counts" buildsUpon="ping" runnable="false" try_it="false" >}}
> BITCOUNT pings:2024-01-01-00:00
(integer) 1
{{< /clients-example >}}

For example imagine you want to know the longest streak of daily visits of
your web site users. You start counting days starting from zero, that is the
day you made your web site public, and set a bit with [`SETBIT`]({{< relref "/commands/setbit" >}}) every time
the user visits the web site. As a bit index you simply take the current unix
time, subtract the initial offset, and divide by the number of seconds in a day
(normally, 3600\*24).

This way for each user you have a small string containing the visit
information for each day. With [`BITCOUNT`]({{< relref "/commands/bitcount" >}}) it is possible to easily get
the number of days a given user visited the web site, while with
a few [`BITPOS`]({{< relref "/commands/bitpos" >}}) calls, or simply fetching and analyzing the bitmap client-side,
it is possible to easily compute the longest streak.

### Bitwise operations

The [`BITOP`]({{< relref "/commands/bitop" >}}) command performs bitwise
operations over two or more source keys, storing the result in a destination key.

The examples below show the available operations using three keys: `A` (with bit pattern
`11011000`), `B` (`00011001`), and `C` (`01101100`).

{{< image filename="/images/dev/bitmap/BitopSetup.svg" alt="Bitop setup" >}}

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

{{< image filename="/images/dev/bitmap/BitopAnd.svg" alt="Bitop AND" >}}

{{< clients-example set="bitmap_tutorial" step="bitop_and" description="AND operation: Use BITOP AND to find bits set in all source bitmaps when you need to find common bits across multiple sets" difficulty="intermediate" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP AND R A B C
(integer) 1
> GET R
"\b"
# ASCII "\b" (backspace) = hex 0x08 = 0b00001000
{{< /clients-example >}}

#### `OR`
Set a bit in the destination key to 1 if it is set in at least one of the source keys.

{{< image filename="/images/dev/bitmap/BitopOr.svg" alt="Bitop OR" >}}

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

{{< image filename="/images/dev/bitmap/BitopXor.svg" alt="Bitop XOR" >}}

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

{{< image filename="/images/dev/bitmap/BitopNot.svg" alt="Bitop NOT" >}}

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

{{< image filename="/images/dev/bitmap/BitopDiff.svg" alt="Bitop DIFF" >}}

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

{{< image filename="/images/dev/bitmap/BitopDiff1.svg" alt="Bitop DIFF1" >}}

{{< clients-example set="bitmap_tutorial" step="bitop_diff1" description="DIFF1 operation: Use BITOP DIFF1 to find bits not in the first bitmap but in at least one other when you need inverse difference" difficulty="advanced" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP DIFF1 R A B C
(integer) 1
> GET R
"%"
# ASCII "%" (percent) = hex 0x25 = 0b00100101
{{< /clients-example >}}

#### `ANDOR`

Set a bit in the destination key to 1 if it is set in the first source key and also in at least one of the other source keys.

{{< image filename="/images/dev/bitmap/BitopAndOr.svg" alt="Bitop ANDOR" >}}

{{< clients-example set="bitmap_tutorial" step="bitop_andor" description="ANDOR operation: Use BITOP ANDOR to find bits in the first bitmap and at least one other when you need intersection with union" difficulty="advanced" buildsUpon="bitop_setup" runnable="false" try_it="false" >}}
> BITOP ANDOR R A B C
(integer) 1
> GET R
"X"
# ASCII "X" = hex 0x58 = 0b01011000
{{< /clients-example >}}

#### `ONE`

Set a bit in the destination key to 1 if it is set in exactly one of the source keys.

{{< image filename="/images/dev/bitmap/BitopOne.svg" alt="Bitop ONE" >}}

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
[`MEMORY USAGE`]({{< relref "/commands/memory-usage" >}}) and command latency
with representative data before enabling Roaring bitmaps for a workload.

### Enable Roaring bitmap creation

The `bitmap-default-roaring` configuration parameter is `no` by default. Set it
to `yes` in your Redis configuration file, or enable it at runtime with
[`CONFIG SET`]({{< relref "/commands/config-set" >}}):

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

* With `bitmap-default-roaring no`, [`SETBIT`]({{< relref "/commands/setbit" >}})
  and write forms of [`BITFIELD`]({{< relref "/commands/bitfield" >}}) create
  string-backed bitmaps. Existing native bitmaps remain native and continue to
  accept bitmap commands.
* With `bitmap-default-roaring yes`, those commands create missing keys as
  native bitmaps. A write to an existing string converts the complete string
  to a native bitmap before applying the write. The conversion preserves its
  bits, logical length, expiration, and key metadata.
* Read-only bitmap commands don't convert a string. [`SET`]({{< relref
  "/commands/set" >}}) also continues to create a string, regardless of this
  setting.
* [`BITOP`]({{< relref "/commands/bitop" >}}) stores a non-empty result as a
  native destination when the setting is `yes`. When the setting is `no`, its
  destination is native if at least one source is native; an operation with
  only string sources produces a string destination.

There is no command that converts a native bitmap back to a string while
preserving its contents. `SET` can replace a native bitmap with a new string
value, as it can replace any other Redis type.

### Command and type compatibility

[`SETBIT`]({{< relref "/commands/setbit" >}}),
[`GETBIT`]({{< relref "/commands/getbit" >}}),
[`BITCOUNT`]({{< relref "/commands/bitcount" >}}),
[`BITPOS`]({{< relref "/commands/bitpos" >}}),
[`BITOP`]({{< relref "/commands/bitop" >}}),
[`BITFIELD`]({{< relref "/commands/bitfield" >}}), and
[`BITFIELD_RO`]({{< relref "/commands/bitfield_ro" >}}) work with both
representations and keep their existing reply and range semantics. Setting a
zero bit beyond the current logical end extends either representation, and
bits between the old and new ends read as zero.

The representations are intentionally visible to clients:

* [`TYPE`]({{< relref "/commands/type" >}}) returns `string` for a string-backed
  bitmap and `bitmap` for a native one.
* [`OBJECT ENCODING`]({{< relref "/commands/object-encoding" >}}) returns
  `bitmap-roaring` for a native bitmap.
* Generic string commands such as [`GET`]({{< relref "/commands/get" >}}),
  [`STRLEN`]({{< relref "/commands/strlen" >}}),
  [`GETRANGE`]({{< relref "/commands/getrange" >}}), and
  [`APPEND`]({{< relref "/commands/append" >}}) return a wrong-type error for a
  native bitmap. Applications that read or modify bitmap bytes with string
  commands should keep using the default string representation.

Both representations limit accepted bit offsets according to
`proto-max-bulk-len`. An existing bitmap can have a longer logical length if it
was created or loaded while that limit was higher. [`BITOP`]({{< relref
"/commands/bitop" >}}) operates on the complete logical length of such a
source. In particular, `BITOP NOT` can allocate a dense result of that length,
so account for its memory cost before lowering the limit.

### Persistence and replication

RDB snapshots, [`DUMP`]({{< relref "/commands/dump" >}}) and
[`RESTORE`]({{< relref "/commands/restore" >}}), AOF rewrites, and replication
preserve the native bitmap type. When a write creates or converts a native
bitmap because `bitmap-default-roaring` is `yes`, Redis propagates an explicit
serialized value so replicas produce the same type even if their local setting
differs. As a result, the first write that converts a large string can add more
data to the replication stream or incremental AOF than the write command alone.

{{< warning >}}
Before enabling Roaring bitmap creation on a primary, upgrade all replicas and
any Redis server that will load its RDB, DUMP payloads, or AOF. Older versions
don't understand the native bitmap persistence format.
{{< /warning >}}

## Split bitmaps into multiple keys

Bitmaps are trivial to split into multiple keys, for example for
the sake of sharding the data set and because in general it is better to
avoid working with huge keys. To split a bitmap across different keys
instead of setting all the bits into a key, a trivial strategy is just
to store M bits per key and obtain the key name with `bit-number/M` and
the Nth bit to address inside the key with `bit-number MOD M`.

## Performance

[`SETBIT`]({{< relref "/commands/setbit" >}}) and [`GETBIT`]({{< relref "/commands/getbit" >}}) are O(1).
[`BITOP`]({{< relref "/commands/bitop" >}}) is O(n), where _n_ is the logical
length of the longest source bitmap.
For Roaring bitmaps, actual CPU and memory costs also depend on the distribution
of set bits and the resulting compressed containers. In particular, `BITOP NOT`
can turn a sparse bitmap into a dense result. Benchmark representative data and
operations when choosing a representation.

## Learn more

* [Redis Bitmaps Explained](https://www.youtube.com/watch?v=oj8LdJQjhJo) teaches you how to use bitmaps for map exploration in an online game. 
* [Redis University's RU101](https://university.redis.com/courses/ru101/) covers Redis bitmaps in detail.
