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
railroad_diagram: /images/railroad/setrange.svg
since: 2.2.0
summary: Overwrites a part of a string value with another by an offset. Creates the
  key if it doesn't exist.
syntax_fmt: SETRANGE key offset value
title: SETRANGE
---
Overwrites part of the string stored at `key`, starting at the specified offset,
for the entire length of `value`.
If the offset is larger than the current length of the string at `key`, the
string is padded with zero-bytes to make `offset` fit.
Non-existing keys are considered as empty strings, so this command will make
sure it holds a string large enough to be able to set `value` at `offset`.

Note that the maximum offset that you can set is 2^29 -1 (536870911), as Redis
strings are limited to 512 megabytes.
If you need to grow beyond this size, you can use multiple keys.

**Warning**: When setting the last possible byte and the string value stored at
`key ` does not yet hold a string value, or holds a small string value, Redis
needs to allocate all intermediate memory which can block the server for some
time.

Note that once the first allocation is done, subsequent calls to `SETRANGE` for
the same `key` will not have the allocation overhead.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key.

</details>

<details open><summary><code>offset</code></summary>

The zero-based offset at which to start overwriting. The string is zero-padded if the offset is beyond the current length.

</details>

<details open><summary><code>value</code></summary>

The string to write at the offset.

</details>

## Examples

Basic usage:

{{% redis-cli %}}
redis> SET key1 "Hello World"
OK
redis> SETRANGE key1 6 "Redis"
(integer) 11
redis> GET key1
"Hello Redis"
{{% /redis-cli %}}

Example of zero padding:

{{% redis-cli %}}
redis> SETRANGE key2 6 "Redis"
(integer) 11
redis> GET key2
"\x00\x00\x00\x00\x00\x00Redis"
{{% /redis-cli %}}

## Details

### Patterns

Thanks to `SETRANGE` and the analogous [`GETRANGE`]({{< relref "/commands/getrange" >}}) commands, you can use Redis
strings as a linear array with O(1) random access.
This is a very fast and efficient storage in many real world use cases.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="setrange-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the string after it was modified by the command.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the string after it was modified by the command.

{{< /multitabs >}}
