---
acl_categories:
- '@write'
- '@bitmap'
- '@slow'
arguments:
- arguments:
  - display_text: and
    name: and
    token: AND
    type: pure-token
  - display_text: or
    name: or
    token: OR
    type: pure-token
  - display_text: xor
    name: xor
    token: XOR
    type: pure-token
  - display_text: not
    name: not
    token: NOT
    type: pure-token
  name: operation
  type: oneof
- display_text: destkey
  key_spec_index: 0
  name: destkey
  type: key
- display_text: key
  key_spec_index: 1
  multiple: true
  name: key
  type: key
arity: -4
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
complexity: O(N)
description: Performs bitwise operations on multiple strings, and stores the result.
group: bitmap
hidden: false
key_specs:
- OW: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
- RO: true
  access: true
  begin_search:
    spec:
      index: 3
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 0
    type: range
linkTitle: BITOP
railroad_diagram: /images/railroad/bitop.svg
since: 2.6.0
summary: Performs bitwise operations on multiple strings, and stores the result.
syntax_fmt: BITOP <AND | OR | XOR | NOT | DIFF | DIFF1 | ANDOR | ONE> destkey key [key ...]
syntax_str: destkey key [key ...]
title: BITOP
---
Perform a bitwise operation between multiple keys (containing string values) and
store the result in the destination key.

The `BITOP` command supports eight bitwise operations: `AND`, `OR`, `XOR`,
`NOT`, `DIFF`, `DIFF1`, `ANDOR`, and `ONE`. The valid forms to call the command are:


* `BITOP AND destkey srckey1 srckey2 srckey3 ... srckeyN`

    A bit in `destkey` is set only if it is set in all source bitmaps.
* `BITOP OR  destkey srckey1 srckey2 srckey3 ... srckeyN`

    A bit in `destkey` is set only if it is set in at least one source bitmap.
* `BITOP XOR destkey srckey1 srckey2 srckey3 ... srckeyN`

    Mostly used with two source bitmaps, a bit in `destkey` is set only if its value differs between the two source bitmaps.
* `BITOP NOT destkey srckey`

    `NOT` is a unary operator and only supports a single source bitmap; set the bit to the inverse of its value in the source bitmap.
* `BITOP DIFF destkey X [Y1 Y2 ...]` <sup>[1](#list-note-1)</sup>

    A bit in `destkey` is set if it is set in `X`, but not in any of `Y1, Y2, ...` .
* `BITOP DIFF1 destkey X [Y1 Y2 ...]` <sup>[1](#list-note-1)</sup>

    A bit in `destkey` is set if it is set in one or more of `Y1, Y2, ...`, but not in `X`.
* `BITOP ANDOR destkey X [Y1 Y2 ...]` <sup>[1](#list-note-1)</sup>

    A bit in `destkey` is set if it is set in `X` and also in one or more of `Y1, Y2, ...`.
* `BITOP ONE destkey X1 [X2 X3 ...]` <sup>[1](#list-note-1)</sup>

    A bit in `destkey` is set if it is set in exactly one of `X1, X2, ...`.

The result of each operation is always stored at `destkey`.

1. <a name="list-note-1"></a> Added in Redis 8.2.

## Handling of strings with different lengths

When an operation is performed between strings having different lengths, all the
strings shorter than the longest string in the set are treated as if they were
zero-padded up to the length of the longest string.

The same holds true for non-existent keys, that are considered as a stream of
zero bytes up to the length of the longest string.

## Examples

1. Basic usage example using the `AND` operator:

{{% redis-cli %}}
BITFIELD key1 SET i8 #0 255
BITFIELD key2 SET i8 #0 85
BITOP AND dest key1 key2
BITFIELD dest GET i8 #0
{{% /redis-cli %}}

2. Suppose you want to expose people to a book-related ad. The target audience is people who love to read books and are interested in fantasy, adventure, or science fiction. Assume you have the following bitmaps:

* `LRB` - people who love to read books.
* `B:F` - people interested in fantasy.
* `B:A` - people interested in adventure.
* `B:SF` - people interested in science fiction.

To create a bitmap representing the target audience, use the following command:

```
BITOP ANDOR TA LRB B:F B:A B:SF
```

## Pattern: real time metrics using bitmaps

`BITOP` is a good complement to the pattern documented in the [`BITCOUNT`]({{< relref "/commands/bitcount" >}}) command
documentation.
Different bitmaps can be combined in order to obtain a target bitmap where
the population counting operation is performed.

See the article called "[Fast easy realtime metrics using Redis
bitmaps][hbgc212fermurb]" for an interesting use cases.

[hbgc212fermurb]: http://blog.getspool.com/2011/11/29/fast-easy-realtime-metrics-using-redis-bitmaps

## Performance considerations

`BITOP` is a potentially slow command as it runs in O(N) time.
Care should be taken when running it against long input strings.

For real-time metrics and statistics involving large inputs a good approach is
to use a replica (with replica-read-only option enabled) where the bit-wise
operations are performed to avoid blocking the master instance.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bitop-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the size of the string stored in the destination key is equal to the size of the longest input string.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the size of the string stored in the destination key is equal to the size of the longest input string.

{{< /multitabs >}}
