---
acl_categories:
- '@write'
- '@list'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: element
  multiple: true
  name: element
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
description: Prepends one or more elements to a list only when the list exists.
group: list
hidden: false
history:
- - 4.0.0
  - Accepts multiple `element` arguments.
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
linkTitle: LPUSHX
since: 2.2.0
summary: Prepends one or more elements to a list only when the list exists.
syntax_fmt: LPUSHX key element [element ...]
syntax_str: element [element ...]
title: LPUSHX
---
Inserts specified values at the head of the list stored at `key`, only if `key`
already exists and holds a list.
In contrary to [`LPUSH`]({{< relref "/commands/lpush" >}}), no operation will be performed when `key` does not yet
exist.

## Examples

{{% redis-cli %}}
LPUSH mylist "World"
LPUSHX mylist "Hello"
LPUSHX myotherlist "Hello"
LRANGE mylist 0 -1
LRANGE myotherlist 0 -1
{{% /redis-cli %}}

