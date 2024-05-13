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
since: 8.0.0
summary: Returns the TTL in seconds of a hash field.
syntax_fmt: HTTL key numfields field [field ...]
syntax_str: numfields field [field ...]
title: HTTL
---
Returns the remaining TTL (time to live) of a hash key's fields that have a set expiration.
This introspection capability allows a Redis client to check how many seconds a
given hash key field will continue to be part of the hash key.

The return value in case of an error is one of:

* The command returns `-2` if the hash key field does not exist.
* The command returns `-1` if the hash key field exists but has no associated expiration.

See also the [`HPTTL`]({{< relref "/commands/hpttl" >}}) command that returns the same information with millisecond resolution.

## Example

```
TODO: to be provided.
```

## RESP2/RESP3 replies

One of the following:
* [Null reply]({{< relref "/develop/reference/protocol-spec" >}}#nulls) if the provided key does not exists.
* [Array reply]({{< relref "/develop/reference/protocol-spec" >}}#arrays). For each field:
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-2` if no such field exists in the provided hash key.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): `-1` if the field exists but has no associated expiration set.
    - [Integer reply]({{< relref "/develop/reference/protocol-spec" >}}#integers): the TTL in seconds.