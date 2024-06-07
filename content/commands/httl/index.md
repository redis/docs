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
description: Returns the TTL in seconds of a hash field.
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
linkTitle: HTTL
since: 7.4.0
summary: Returns the TTL of each specified field in seconds
syntax_fmt: HTTL key numfields field [field ...]
syntax_str: numfields field [field ...]
title: HTTL
---
Returns the remaining TTL (time to live) of a hash key's field(s) that have a set expiration.
This introspection capability allows you to check how many seconds a
given hash field will continue to be part of the hash key.

See also the [`HPTTL`]({{< relref "/commands/hpttl" >}}) command that returns the same information with millisecond resolution.

## Example

```
redis> HTTL no-key 10 3 field1 field2 field3
(nil)
redis> HSET mykey field1 "hello" field2 "world"
(integer) 2
redis> HEXPIRE mykey 300 2 field1 field3
1) (integer) 1
2) (integer) -2
redis> HTTL mykey 3 field1 field2 field3
1) (integer) 283
2) (integer) -1
3) (integer) -2
```

## RESP2/RESP3 replies

One of the following:
* Empty [Array reply]({{< relref "/develop/reference/protocol-spec" >}}#arrays) if the provided key does not exist.
* [Array reply]({{< relref "/develop/reference/protocol-spec" >}}#arrays). For each field:
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-2` if no such field exists in the provided hash key.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): the TTL in seconds.