---
acl_categories:
- '@read'
- '@hash'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: numfields
  name: numfields
  type: integer
- display_text: field
  multiple: true
  name: field
  type: string
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
- readonly
- fast
complexity: O(N) where N is the number of arguments to the command
description: Returns the expiration time of a hash field as a Unix timestamp, in msec.
group: hash
hidden: false
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
linkTitle: HPEXPIRETIME
since: 7.4.0
summary: Returns the expiration time of each specified field as a Unix timestamp in milliseconds
syntax_fmt: HPEXPIRETIME key FIELDS numfields field [field ...]
syntax_str: FIELDS numfields field [field ...]
title: HPEXPIRETIME
---
`HPEXPIRETIME` has the same semantics as [`HEXPIRETIME`]({{< relref "/commands/hexpiretime" >}}), but returns the absolute Unix expiration timestamp in milliseconds since Unix epoch instead of seconds.

## Examples

```
redis> HSET mykey field1 "hello" field2 "world"
(integer) 2
redis> HEXPIRE mykey 300 FIELDS 2 field1 field2
1) (integer) 1
2) (integer) 1
redis> HPEXPIRETIME mykey FIELDS 2 field1 field2
1) (integer) 1715705913659
2) (integer) 1715705913659
```

## RESP2/RESP3 replies

One of the following:
* Empty [Array reply]({{< relref "/develop/reference/protocol-spec" >}}#arrays) if the provided key does not exist.
* [Array reply]({{< relref "/develop/reference/protocol-spec" >}}#arrays). For each field:
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-2` if no such field exists in the provided hash key.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): the expiration (Unix timestamp) in milliseconds.
