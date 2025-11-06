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
- arguments:
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
    name: unit
    optional: true
    since: 7.0.0
    type: oneof
  name: range
  optional: true
  type: block
arity: -2
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
description: Counts the number of set bits (population counting) in a string.
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
linkTitle: BITCOUNT
railroad_diagram: /images/railroad/bitcount.svg
since: 2.6.0
summary: Counts the number of set bits (population counting) in a string.
syntax_fmt: BITCOUNT key [start end [BYTE | BIT]]
syntax_str: '[start end [BYTE | BIT]]'
title: BITCOUNT
---
Count the number of set bits (population counting) in a string.

By default all the bytes contained in the string are examined.
It is possible to specify the counting operation only in an interval passing the
additional arguments _start_ and _end_.

Like for the [`GETRANGE`]({{< relref "/commands/getrange" >}}) command start and end can contain negative values in
order to index bytes starting from the end of the string, where -1 is the last
byte, -2 is the penultimate, and so forth.

Non-existent keys are treated as empty strings, so the command will return zero.

By default, the additional arguments _start_ and _end_ specify a byte index.
We can use an additional argument `BIT` to specify a bit index.
So 0 is the first bit, 1 is the second bit, and so forth.
For negative values, -1 is the last bit, -2 is the penultimate, and so forth.

## Examples

{{% redis-cli %}}
SET mykey "foobar"
BITCOUNT mykey
BITCOUNT mykey 0 0
BITCOUNT mykey 1 1
BITCOUNT mykey 1 1 BYTE
BITCOUNT mykey 5 30 BIT
{{% /redis-cli %}}


## Pattern: real-time metrics using bitmaps

Bitmaps are a very space-efficient representation of certain kinds of
information.
One example is a Web application that needs the history of user visits, so that
for instance it is possible to determine what users are good targets of beta
features.

Using the [`SETBIT`]({{< relref "/commands/setbit" >}}) command this is trivial to accomplish, identifying every day
with a small progressive integer.
For instance day 0 is the first day the application was put online, day 1 the
next day, and so forth.

Every time a user performs a page view, the application can register that in
the current day the user visited the web site using the [`SETBIT`]({{< relref "/commands/setbit" >}}) command setting
the bit corresponding to the current day.

Later it will be trivial to know the number of single days the user visited the
web site simply calling the `BITCOUNT` command against the bitmap.

A similar pattern where user IDs are used instead of days is described
in the article called "[Fast easy realtime metrics using Redis
bitmaps][hbgc212fermurb]".

[hbgc212fermurb]: http://blog.getspool.com/2011/11/29/fast-easy-realtime-metrics-using-redis-bitmaps

## Performance considerations

In the above example of counting days, even after 10 years the application is
online we still have just `365*10` bits of data per user, that is just 456 bytes
per user.
With this amount of data `BITCOUNT` is still as fast as any other O(1) Redis
command like [`GET`]({{< relref "/commands/get" >}}) or [`INCR`]({{< relref "/commands/incr" >}}).

When the bitmap is big, there are two alternatives:

* Taking a separated key that is incremented every time the bitmap is modified.
  This can be very efficient and atomic using a small Redis Lua script.
* Running the bitmap incrementally using the `BITCOUNT` _start_ and _end_
  optional parameters, accumulating the results client-side, and optionally
  caching the result into a key.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bitcount-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of bits set to 1.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of bits set to 1.

{{< /multitabs >}}
