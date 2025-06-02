---
acl_categories:
- '@write'
- '@hash'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: field
  name: field
  type: string
- display_text: increment
  name: increment
  type: double
arity: 4
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
complexity: O(1)
description: Increments the floating point value of a field by a number. Uses 0 as
  initial value if the field doesn't exist.
group: hash
hidden: false
key_specs:
- RW: true
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
  update: true
linkTitle: HINCRBYFLOAT
since: 2.6.0
summary: Increments the floating point value of a field by a number. Uses 0 as initial
  value if the field doesn't exist.
syntax_fmt: HINCRBYFLOAT key field increment
syntax_str: field increment
title: HINCRBYFLOAT
---
Increment the specified `field` of a hash stored at `key`, and representing a
floating point number, by the specified `increment`. If the increment value
is negative, the result is to have the hash field value **decremented** instead of incremented.
If the field does not exist, it is set to `0` before performing the operation.
An error is returned if one of the following conditions occur:

* The key contains a value of the wrong type (not a hash).
* The current field content or the specified increment are not parsable as a
  double precision floating point number.

The exact behavior of this command is identical to the one of the [`INCRBYFLOAT`]({{< relref "/commands/incrbyfloat" >}})
command, please refer to the documentation of [`INCRBYFLOAT`]({{< relref "/commands/incrbyfloat" >}}) for further
information.

## Examples

{{% redis-cli %}}
HSET mykey field 10.50
HINCRBYFLOAT mykey field 0.1
HINCRBYFLOAT mykey field -5
HSET mykey field 5.0e3
HINCRBYFLOAT mykey field 2.0e2
{{% /redis-cli %}}


## Implementation details

The command is always propagated in the replication link and the Append Only
File as a [`HSET`]({{< relref "/commands/hset" >}}) operation, so that differences in the underlying floating point
math implementation will not be sources of inconsistency.
