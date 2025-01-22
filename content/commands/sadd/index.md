---
acl_categories:
- '@write'
- '@set'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: member
  multiple: true
  name: member
  type: string
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
- write
- denyoom
- fast
complexity: O(1) for each element added, so O(N) to add N elements when the command
  is called with multiple arguments.
description: Adds one or more members to a set. Creates the key if it doesn't exist.
group: set
hidden: false
history:
- - 2.4.0
  - Accepts multiple `member` arguments.
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
  insert: true
linkTitle: SADD
since: 1.0.0
summary: Adds one or more members to a set. Creates the key if it doesn't exist.
syntax_fmt: SADD key member [member ...]
syntax_str: member [member ...]
title: SADD
---
Add the specified members to the set stored at `key`.
Specified members that are already a member of this set are ignored.
If `key` does not exist, a new set is created before adding the specified
members.

An error is returned when the value stored at `key` is not a set.

## Examples

{{< clients-example cmds_set sadd >}}
redis> SADD myset "Hello"
(integer) 1
redis> SADD myset "World"
(integer) 1
redis> SADD myset "World"
(integer) 0
redis> SMEMBERS myset
1) "Hello"
2) "World"
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
SADD myset "Hello"
SADD myset "World"
SADD myset "World"
SMEMBERS myset
{{% /redis-cli %}}
