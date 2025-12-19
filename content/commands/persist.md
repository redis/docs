---
acl_categories:
- '@keyspace'
- '@write'
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
- write
- fast
complexity: O(1)
description: Removes the expiration time of a key.
group: generic
hidden: false
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
  update: true
linkTitle: PERSIST
railroad_diagram: /images/railroad/persist.svg
since: 2.2.0
summary: Removes the expiration time of a key.
syntax_fmt: PERSIST key
title: PERSIST
---
Remove the existing timeout on `key`, turning the key from _volatile_ (a key
with an expire set) to _persistent_ (a key that will never expire as no timeout
is associated).

## Examples

{{% redis-cli %}}
SET mykey "Hello"
EXPIRE mykey 10
TTL mykey
PERSIST mykey
TTL mykey
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="persist-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if _key_ does not exist or does not have an associated timeout.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the timeout has been removed.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if _key_ does not exist or does not have an associated timeout.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the timeout has been removed.

{{< /multitabs >}}
