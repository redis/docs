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
  multiple: true
  name: field
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
complexity: O(N) where N is the number of fields to be removed.
description: Deletes one or more fields and their values from a hash. Deletes the
  hash if no fields remain.
group: hash
hidden: false
history:
- - 2.4.0
  - Accepts multiple `field` arguments.
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
linkTitle: HDEL
railroad_diagram: /images/railroad/hdel.svg
since: 2.0.0
summary: Deletes one or more fields and their values from a hash. Deletes the hash
  if no fields remain.
syntax_fmt: HDEL key field [field ...]
syntax_str: field [field ...]
title: HDEL
---
Removes the specified fields from the hash stored at `key`.
Specified fields that do not exist within this hash are ignored.
Deletes the hash if no fields remain.
If `key` does not exist, it is treated as an empty hash and this command returns
`0`.

## Examples

{{< clients-example set="cmds_hash" step="hdel" >}}
HSET myhash field1 "foo"
(integer) 1
HDEL myhash field1
(integer) 1
HDEL myhash field2
(integer) 0
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
HSET myhash field1 "foo"
HDEL myhash field1
HDEL myhash field2
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="hdel-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of fields that were removed from the hash, excluding any specified but non-existing fields.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The number of fields that were removed from the hash, excluding any specified but non-existing fields.

{{< /multitabs >}}
