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
- display_text: bit
  name: bit
  type: integer
- arguments:
  - display_text: start
    name: start
    type: integer
  - arguments:
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
      name: unit
      optional: true
      since: 7.0.0
      type: oneof
    name: end-unit-block
    optional: true
    type: block
  name: range
  optional: true
  type: block
arity: -3
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
complexity: O(N)
description: Finds the first set (1) or clear (0) bit in a string.
group: bitmap
hidden: false
history:
- - 7.0.0
  - Added the `BYTE|BIT` option.
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
linkTitle: BITPOS
since: 2.8.7
summary: Finds the first set (1) or clear (0) bit in a string.
syntax_fmt: BITPOS key bit [start [end [BYTE | BIT]]]
syntax_str: bit [start [end [BYTE | BIT]]]
title: BITPOS
---
Return the position of the first bit set to 1 or 0 in a string.

The position is returned, thinking of the string as an array of bits from left to
right, where the first byte's most significant bit is at position 0, the second
byte's most significant bit is at position 8, and so forth.

The same bit position convention is followed by [`GETBIT`]({{< relref "/commands/getbit" >}}) and [`SETBIT`]({{< relref "/commands/setbit" >}}).

By default, all the bytes contained in the string are examined.
It is possible to look for bits only in a specified interval passing the additional arguments _start_ and _end_ (it is possible to just pass _start_, the operation will assume that the end is the last byte of the string. However there are semantic differences as explained later).
By default, the range is interpreted as a range of bytes and not a range of bits, so `start=0` and `end=2` means to look at the first three bytes.

You can use the optional `BIT` modifier to specify that the range should be interpreted as a range of bits.
So `start=0` and `end=2` means to look at the first three bits.

Note that bit positions are returned always as absolute values starting from bit zero even when _start_ and _end_ are used to specify a range.

Like for the [`GETRANGE`]({{< relref "/commands/getrange" >}}) command start and end can contain negative values in
order to index bytes starting from the end of the string, where -1 is the last
byte, -2 is the penultimate, and so forth. When `BIT` is specified, -1 is the last
bit, -2 is the penultimate, and so forth.

Non-existent keys are treated as empty strings.

## Examples

```redis
redis> SET mykey "\xff\xf0\x00"
OK
redis> BITPOS mykey 0
(integer) 12
redis> SET mykey "\x00\xff\xf0"
OK
redis> BITPOS mykey 1 0
(integer) 8
redis> BITPOS mykey 1 2
(integer) 16
redis> BITPOS mykey 1 2 -1 BYTE
(integer) 16
redis> BITPOS mykey 1 7 15 BIT
(integer) 8
redis> set mykey "\x00\x00\x00"
OK
redis> BITPOS mykey 1
(integer) -1
redis> BITPOS mykey 1 7 -3 BIT
(integer) -1
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bitpos-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): the position of the first bit set to 1 or 0 according to the request
* [Integer reply](../../develop/reference/protocol-spec#integers): `-1`. In case the `bit` argument is 1 and the string is empty or composed of just zero bytes
If we look for set bits (the bit argument is 1) and the string is empty or composed of just zero bytes, -1 is returned.
If we look for clear bits (the bit argument is 0) and the string only contains bits set to 1, the function returns the first bit not part of the string on the right. So if the string is three bytes set to the value `0xff` the command `BITPOS key 0` will return 24, since up to bit 23 all the bits are 1.
The function considers the right of the string as padded with zeros if you look for clear bits and specify no range or the _start_ argument **only**.
However, this behavior changes if you are looking for clear bits and specify a range with both _start_ and _end_.
If a clear bit isn't found in the specified range, the function returns -1 as the user specified a clear range and there are no 0 bits in that range.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): the position of the first bit set to 1 or 0 according to the request
* [Integer reply](../../develop/reference/protocol-spec#integers): `-1`. In case the `bit` argument is 1 and the string is empty or composed of just zero bytes
If we look for set bits (the bit argument is 1) and the string is empty or composed of just zero bytes, -1 is returned.
If we look for clear bits (the bit argument is 0) and the string only contains bits set to 1, the function returns the first bit not part of the string on the right. So if the string is three bytes set to the value `0xff` the command `BITPOS key 0` will return 24, since up to bit 23 all the bits are 1.
The function considers the right of the string as padded with zeros if you look for clear bits and specify no range or the _start_ argument **only**.
However, this behavior changes if you are looking for clear bits and specify a range with both _start_ and _end_.
If a clear bit isn't found in the specified range, the function returns -1 as the user specified a clear range and there are no 0 bits in that range.

{{< /multitabs >}}
