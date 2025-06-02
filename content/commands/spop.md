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
- display_text: count
  name: count
  optional: true
  since: 3.2.0
  type: integer
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
- write
- fast
complexity: Without the count argument O(1), otherwise O(N) where N is the value of
  the passed count.
description: Returns one or more random members from a set after removing them. Deletes
  the set if the last member was popped.
group: set
hidden: false
hints:
- nondeterministic_output
history:
- - 3.2.0
  - Added the `count` argument.
key_specs:
- RW: true
  access: true
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
linkTitle: SPOP
since: 1.0.0
summary: Returns one or more random members from a set after removing them. Deletes
  the set if the last member was popped.
syntax_fmt: SPOP key [count]
syntax_str: '[count]'
title: SPOP
---
Removes and returns one or more random members from the set value store at `key`.

This operation is similar to [`SRANDMEMBER`]({{< relref "/commands/srandmember" >}}), that returns one or more random elements from a set but does not remove it.

By default, the command pops a single member from the set. When provided with
the optional `count` argument, the reply will consist of up to `count` members,
depending on the set's cardinality.

## Examples

{{% redis-cli %}}
SADD myset "one"
SADD myset "two"
SADD myset "three"
SPOP myset
SMEMBERS myset
SADD myset "four"
SADD myset "five"
SPOP myset 3
SMEMBERS myset
{{% /redis-cli %}}

## Distribution of returned elements

Note that this command is not suitable when you need a guaranteed uniform distribution of the returned elements. For more information about the algorithms used for `SPOP`, look up both the Knuth sampling and Floyd sampling algorithms.
