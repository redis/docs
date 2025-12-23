---
acl_categories:
- '@keyspace'
- '@read'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 2
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
complexity: O(1)
description: Returns the expiration time of a key as a Unix milliseconds timestamp.
group: generic
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
linkTitle: PEXPIRETIME
railroad_diagram: /images/railroad/pexpiretime.svg
since: 7.0.0
summary: Returns the expiration time of a key as a Unix milliseconds timestamp.
syntax_fmt: PEXPIRETIME key
title: PEXPIRETIME
---
`PEXPIRETIME` has the same semantic as [`EXPIRETIME`]({{< relref "/commands/expiretime" >}}), but returns the absolute Unix expiration timestamp in milliseconds instead of seconds.

## Examples

{{% redis-cli %}}
SET mykey "Hello"
PEXPIREAT mykey 33177117420000
PEXPIRETIME mykey
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="pexpiretime-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): Expiration Unix timestamp in milliseconds.
* [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if the key exists but has no associated expiration time.
* [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if the key does not exist.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): Expiration Unix timestamp in milliseconds.
* [Integer reply](../../develop/reference/protocol-spec#integers): `-1` if the key exists but has no associated expiration time.
* [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if the key does not exist.

{{< /multitabs >}}
