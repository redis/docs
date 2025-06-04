---
acl_categories:
- '@write'
- '@string'
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
  type: string
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
complexity: O(1), not counting the time taken to copy the new string in place. Usually,
  this string is very small so the amortized complexity is O(1). Otherwise, complexity
  is O(M) with M being the length of the value argument.
description: Overwrites a part of a string value with another by an offset. Creates
  the key if it doesn't exist.
group: string
hidden: false
key_specs:
- RW: true
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
linkTitle: SETRANGE
since: 2.2.0
summary: Overwrites a part of a string value with another by an offset. Creates the
  key if it doesn't exist.
syntax_fmt: SETRANGE key offset value
syntax_str: offset value
title: SETRANGE
---
Overwrites part of the string stored at _key_, starting at the specified offset,
for the entire length of _value_.
If the offset is larger than the current length of the string at _key_, the
string is padded with zero-bytes to make _offset_ fit.
Non-existing keys are considered as empty strings, so this command will make
sure it holds a string large enough to be able to set _value_ at _offset_.

Note that the maximum offset that you can set is 2^29 -1 (536870911), as Redis
Strings are limited to 512 megabytes.
If you need to grow beyond this size, you can use multiple keys.

**Warning**: When setting the last possible byte and the string value stored at
_key_ does not yet hold a string value, or holds a small string value, Redis
needs to allocate all intermediate memory which can block the server for some
time.
On a 2010 MacBook Pro, setting byte number 536870911 (512MB allocation) takes
~300ms, setting byte number 134217728 (128MB allocation) takes ~80ms, setting
bit number 33554432 (32MB allocation) takes ~30ms and setting bit number 8388608
(8MB allocation) takes ~8ms.
Note that once this first allocation is done, subsequent calls to `SETRANGE` for
the same _key_ will not have the allocation overhead.

## Patterns

Thanks to `SETRANGE` and the analogous [`GETRANGE`]({{< relref "/commands/getrange" >}}) commands, you can use Redis
strings as a linear array with O(1) random access.
This is a very fast and efficient storage in many real world use cases.

## Examples

Basic usage:

{{% redis-cli %}}
SET key1 "Hello World"
SETRANGE key1 6 "Redis"
GET key1
{{% /redis-cli %}}


Example of zero padding:

{{% redis-cli %}}
SETRANGE key2 6 "Redis"
GET key2
{{% /redis-cli %}}

## Return information

{{< multitabs id="setrange-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the string after it was modified by the command.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the string after it was modified by the command.

{{< /multitabs >}}
