---
acl_categories:
- '@slow'
- '@scripting'
arguments:
- display_text: sha1
  name: sha1
  type: string
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  optional: true
  type: key
- display_text: arg
  multiple: true
  name: arg
  optional: true
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
- readonly
- noscript
- stale
- skip_monitor
- no_mandatory_keys
- movablekeys
complexity: Depends on the script that is executed.
description: Executes a read-only server-side Lua script by SHA1 digest.
group: scripting
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: EVALSHA_RO
railroad_diagram: /images/railroad/evalsha_ro.svg
since: 7.0.0
summary: Executes a read-only server-side Lua script by SHA1 digest.
syntax_fmt: EVALSHA_RO sha1 numkeys [key [key ...]] [arg [arg ...]]
syntax_str: numkeys [key [key ...]] [arg [arg ...]]
title: EVALSHA_RO
---
This is a read-only variant of the [`EVALSHA`]({{< relref "/commands/evalsha" >}}) command that cannot execute commands that modify data.

For more information about when to use this command vs [`EVALSHA`]({{< relref "/commands/evalsha" >}}), please refer to [Read-only scripts]({{< relref "develop/programmability#read-only-scripts" >}}).

For more information about [`EVALSHA`]({{< relref "/commands/evalsha" >}}) scripts please refer to [Introduction to Eval Scripts]({{< relref "/develop/programmability/eval-intro" >}}).

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="evalsha-ro-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

The return value depends on the script that was executed.

-tab-sep-

The return value depends on the script that was executed.

{{< /multitabs >}}
