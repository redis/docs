---
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
weight: 120
---

Bitmaps are not an actual data type, but a set of bit-oriented operations
defined on the String type which is treated like a bit vector.
Since strings are binary safe blobs and their maximum length is 512 MB,
they are suitable to set up to 2^32 different bits.

You can perform bitwise operations on one or more strings.
Some examples of bitmap use cases include:

* Efficient set representations for cases where the members of a set correspond to the integers 0-N.
* Object permissions, where each bit represents a particular permission, similar to the way that file systems store permissions.

## Basic commands

* [`SETBIT`]({{< relref "/commands/setbit" >}}) sets a bit at the provided offset to 0 or 1.
* [`GETBIT`]({{< relref "/commands/getbit" >}}) returns the value of a bit at a given offset.

See the [complete list of bitmap commands]({{< relref "/commands/" >}}?group=bitmap).


## Example

Suppose you have 1000 cyclists racing through the country-side, with sensors on their bikes labeled 0-999.
You want to quickly determine whether a given sensor has pinged a tracking server within the hour to check in on a rider. 

You can represent this scenario using a bitmap whose key references the current hour.

* Rider 123 pings the server on January 1, 2024 within the 00:00 hour. You can then confirm that rider 123 pinged the server. You can also check to see if rider 456 has pinged the server for that same hour.

{{< clients-example bitmap_tutorial ping >}}
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

{{< clients-example bitmap_tutorial bitcount >}}
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

{{< clients-example set="bitmap_tutorial" step="bitop_setup" >}}
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

{{< clients-example set="bitmap_tutorial" step="bitop_and" >}}
> BITOP AND R A B C
(integer) 1
> GET R
"\b"
# ASCII "\b" (backspace) = hex 0x08 = 0b00001000
{{< /clients-example >}}

#### `OR`
Set a bit in the destination key to 1 if it is set in at least one of the source keys.

{{< image filename="/images/dev/bitmap/BitopOr.svg" alt="Bitop OR" >}}

{{< clients-example set="bitmap_tutorial" step="bitop_or" >}}
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

{{< clients-example set="bitmap_tutorial" step="bitop_xor" >}}
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

{{< clients-example set="bitmap_tutorial" step="bitop_not" >}}
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

{{< clients-example set="bitmap_tutorial" step="bitop_diff" >}}
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

{{< clients-example set="bitmap_tutorial" step="bitop_diff1" >}}
> BITOP DIFF1 R A B C
(integer) 1
> GET R
"%"
# ASCII "%" (percent) = hex 0x25 = 0b00100101
{{< /clients-example >}}

#### `ANDOR`

Set a bit in the destination key to 1 if it is set in the first source key and also in at least one of the other source keys.

{{< image filename="/images/dev/bitmap/BitopAndOr.svg" alt="Bitop ANDOR" >}}

{{< clients-example set="bitmap_tutorial" step="bitop_andor" >}}
> BITOP ANDOR R A B C
(integer) 1
> GET R
"X"
# ASCII "X" = hex 0x58 = 0b01011000
{{< /clients-example >}}

#### `ONE`

Set a bit in the destination key to 1 if it is set in exactly one of the source keys.

{{< image filename="/images/dev/bitmap/BitopOne.svg" alt="Bitop ONE" >}}

{{< clients-example set="bitmap_tutorial" step="bitop_one" >}}
> BITOP ONE R A B C
(integer) 1
> GET R
"\xa5"
# Hex value: 0xa5 = 0b10100101
{{< /clients-example >}}

## Split bitmaps into multiple keys

Bitmaps are trivial to split into multiple keys, for example for
the sake of sharding the data set and because in general it is better to
avoid working with huge keys. To split a bitmap across different keys
instead of setting all the bits into a key, a trivial strategy is just
to store M bits per key and obtain the key name with `bit-number/M` and
the Nth bit to address inside the key with `bit-number MOD M`.

## Performance

[`SETBIT`]({{< relref "/commands/setbit" >}}) and [`GETBIT`]({{< relref "/commands/getbit" >}}) are O(1).
[`BITOP`]({{< relref "/commands/bitop" >}}) is O(n), where _n_ is the length of the longest string in the comparison.

## Learn more

* [Redis Bitmaps Explained](https://www.youtube.com/watch?v=oj8LdJQjhJo) teaches you how to use bitmaps for map exploration in an online game. 
* [Redis University's RU101](https://university.redis.com/courses/ru101/) covers Redis bitmaps in detail.
