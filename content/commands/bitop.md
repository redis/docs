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
since: 2.6.0
summary: Performs bitwise operations on multiple strings, and stores the result.
syntax_fmt: BITOP <AND | OR | XOR | NOT> destkey key [key ...]
syntax_str: destkey key [key ...]
title: BITOP
---
Perform a bitwise operation between multiple keys (containing string values) and
store the result in the destination key.

The `BITOP` command supports four bitwise operations: **AND**, **OR**, **XOR**
and **NOT**, thus the valid forms to call the command are:


* `BITOP AND destkey srckey1 srckey2 srckey3 ... srckeyN`
* `BITOP OR  destkey srckey1 srckey2 srckey3 ... srckeyN`
* `BITOP XOR destkey srckey1 srckey2 srckey3 ... srckeyN`
* `BITOP NOT destkey srckey`

As you can see **NOT** is special as it only takes an input key, because it
performs inversion of bits so it only makes sense as a unary operator.

The result of the operation is always stored at `destkey`.

## Handling of strings with different lengths

When an operation is performed between strings having different lengths, all the
strings shorter than the longest string in the set are treated as if they were
zero-padded up to the length of the longest string.

The same holds true for non-existent keys, that are considered as a stream of
zero bytes up to the length of the longest string.

## Examples

{{% redis-cli %}}
SET key1 "foobar"
SET key2 "abcdef"
BITOP AND dest key1 key2
GET dest
{{% /redis-cli %}}


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

## Return information

{{< multitabs id="bitop-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the size of the string stored in the destination key is equal to the size of the longest input string.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the size of the string stored in the destination key is equal to the size of the longest input string.

{{< /multitabs >}}
