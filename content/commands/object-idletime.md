---
acl_categories:
- '@keyspace'
- '@read'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 3
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
complexity: O(1)
description: Returns the time since the last access to a Redis object.
group: generic
hidden: false
hints:
- nondeterministic_output
key_specs:
- RO: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: OBJECT IDLETIME
since: 2.2.3
summary: Returns the time since the last access to a Redis object.
syntax_fmt: OBJECT IDLETIME key
syntax_str: ''
title: OBJECT IDLETIME
---
This command returns the time in seconds since the last access to the value stored at `<key>`.

The command is only available when the `maxmemory-policy` configuration directive is not set to one of the LFU policies.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="object-idletime-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
[Integer reply](../../develop/reference/protocol-spec#integers): the idle time in seconds.
[Nil reply](../../develop/reference/protocol-spec#bulk-strings): if _key_ doesn't exist.

-tab-sep-

One of the following:
[Integer reply](../../develop/reference/protocol-spec#integers): the idle time in seconds.
[Null reply](../../develop/reference/protocol-spec#nulls): if _key_ doesn't exist.

{{< /multitabs >}}
