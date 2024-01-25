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
- fast
complexity: O(N) where N is the number of members to be removed.
description: Removes one or more members from a set. Deletes the set if the last member
  was removed.
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
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: SREM
since: 1.0.0
summary: Removes one or more members from a set. Deletes the set if the last member
  was removed.
syntax_fmt: SREM key member [member ...]
syntax_str: member [member ...]
title: SREM
---
Remove the specified members from the set stored at `key`.
Specified members that are not a member of this set are ignored.
If `key` does not exist, it is treated as an empty set and this command returns
`0`.

An error is returned when the value stored at `key` is not a set.

## Examples

{{% redis-cli %}}
SADD myset "one"
SADD myset "two"
SADD myset "three"
SREM myset "one"
SREM myset "four"
SMEMBERS myset
{{% /redis-cli %}}

