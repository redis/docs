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
- display_text: offset
  name: offset
  type: integer
- display_text: value
  name: value
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
- write
- denyoom
complexity: O(1)
description: Sets or clears the bit at offset of the string value. Creates the key
  if it doesn't exist.
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
linkTitle: SETBIT
railroad_diagram: /images/railroad/setbit.svg
since: 2.2.0
summary: Sets or clears the bit at offset of the string value. Creates the key if
  it doesn't exist.
syntax_fmt: SETBIT key offset value
title: SETBIT
---
Sets or clears the bit at _offset_ in the string value stored at _key_.

The bit is either set or cleared depending on _value_, which can be either 0 or
1.

When _key_ does not exist, a new string value is created.
The string is grown to make sure it can hold a bit at _offset_.
The _offset_ argument is required to be greater than or equal to 0, and smaller
than 2^32 (this limits bitmaps to 512MB).
When the string at _key_ is grown, added bits are set to 0.

**Warning**: When setting the last possible bit (_offset_ equal to 2^32 -1) and
the string value stored at _key_ does not yet hold a string value, or holds a
small string value, Redis needs to allocate all intermediate memory which can
block the server for some time.
On a 2010 MacBook Pro, setting bit number 2^32 -1 (512MB allocation) takes
~300ms, setting bit number 2^30 -1 (128MB allocation) takes ~80ms, setting bit
number 2^28 -1 (32MB allocation) takes ~30ms and setting bit number 2^26 -1 (8MB
allocation) takes ~8ms.
Note that once this first allocation is done, subsequent calls to `SETBIT` for
the same _key_ will not have the allocation overhead.

## Examples

{{% redis-cli %}}
SETBIT mykey 7 1
SETBIT mykey 7 0
GET mykey
{{% /redis-cli %}}

## Pattern: accessing the entire bitmap

There are cases when you need to set all the bits of single bitmap at once, for
example when initializing it to a default non-zero value. It is possible to do
this with multiple calls to the `SETBIT` command, one for each bit that needs to
be set. However, so as an optimization you can use a single [`SET`]({{< relref "/commands/set" >}}) command to set
the entire bitmap.

Bitmaps are not an actual data type, but a set of bit-oriented operations
defined on the String type (for more information refer to the
[Bitmaps section of the Data Types Introduction page][ti]). This means that
bitmaps can be used with string commands, and most importantly with [`SET`]({{< relref "/commands/set" >}}) and
[`GET`]({{< relref "/commands/get" >}}).

Because Redis' strings are binary-safe, a bitmap is trivially encoded as a bytes
stream. The first byte of the string corresponds to offsets 0..7 of
the bitmap, the second byte to the 8..15 range, and so forth.

For example, after setting a few bits, getting the string value of the bitmap
would look like this:

```
> SETBIT bitmapsarestrings 2 1
> SETBIT bitmapsarestrings 3 1
> SETBIT bitmapsarestrings 5 1
> SETBIT bitmapsarestrings 10 1
> SETBIT bitmapsarestrings 11 1
> SETBIT bitmapsarestrings 14 1
> GET bitmapsarestrings
"42"
```

By getting the string representation of a bitmap, the client can then parse the
response's bytes by extracting the bit values using native bit operations in its
native programming language. Symmetrically, it is also possible to set an entire
bitmap by performing the bits-to-bytes encoding in the client and calling [`SET`]({{< relref "/commands/set" >}})
with the resultant string.

[ti]: /develop/data-types-intro#bitmaps

## Pattern: setting multiple bits

`SETBIT` excels at setting single bits, and can be called several times when
multiple bits need to be set. To optimize this operation you can replace
multiple `SETBIT` calls with a single call to the variadic [`BITFIELD`]({{< relref "/commands/bitfield" >}}) command
and the use of fields of type `u1`.

For example, the example above could be replaced by:

```
> BITFIELD bitsinabitmap SET u1 2 1 SET u1 3 1 SET u1 5 1 SET u1 10 1 SET u1 11 1 SET u1 14 1
```

## Advanced Pattern: accessing bitmap ranges

It is also possible to use the [`GETRANGE`]({{< relref "/commands/getrange" >}}) and [`SETRANGE`]({{< relref "/commands/setrange" >}}) string commands to
efficiently access a range of bit offsets in a bitmap. Below is a sample
implementation in idiomatic Redis Lua scripting that can be run with the [`EVAL`]({{< relref "/commands/eval" >}})
command:

```
--[[
Sets a bitmap range

Bitmaps are stored as Strings in Redis. A range spans one or more bytes,
so we can call [`SETRANGE`]({{< relref "/commands/setrange" >}}) when entire bytes need to be set instead of flipping
individual bits. Also, to avoid multiple internal memory allocations in
Redis, we traverse in reverse.
Expected input:
  KEYS[1] - bitfield key
  ARGV[1] - start offset (0-based, inclusive)
  ARGV[2] - end offset (same, should be bigger than start, no error checking)
  ARGV[3] - value (should be 0 or 1, no error checking)
]]--

-- A helper function to stringify a binary string to semi-binary format
local function tobits(str)
  local r = ''
  for i = 1, string.len(str) do
    local c = string.byte(str, i)
    local b = ' '
    for j = 0, 7 do
      b = tostring(bit.band(c, 1)) .. b
      c = bit.rshift(c, 1)
    end
    r = r .. b
  end
  return r
end

-- Main
local k = KEYS[1]
local s, e, v = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])

-- First treat the dangling bits in the last byte
local ms, me = s % 8, (e + 1) % 8
if me > 0 then
  local t = math.max(e - me + 1, s)
  for i = e, t, -1 do
    redis.call('SETBIT', k, i, v)
  end
  e = t
end

-- Then the danglings in the first byte
if ms > 0 then
  local t = math.min(s - ms + 7, e)
  for i = s, t, 1 do
    redis.call('SETBIT', k, i, v)
  end
  s = t + 1
end

-- Set a range accordingly, if at all
local rs, re = s / 8, (e + 1) / 8
local rl = re - rs
if rl > 0 then
  local b = '\255'
  if 0 == v then
    b = '\0'
  end
  redis.call('SETRANGE', k, rs, string.rep(b, rl))
end
```

**Note:** the implementation for getting a range of bit offsets from a bitmap is
left as an exercise to the reader.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="setbit-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the original bit value stored at _offset_.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the original bit value stored at _offset_.

{{< /multitabs >}}
