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
- noscript
- stale
- skip_monitor
- no_mandatory_keys
- movablekeys
complexity: Depends on the script that is executed.
description: Executes a server-side Lua script by SHA1 digest.
group: scripting
hidden: false
key_specs:
- RW: true
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
  update: true
linkTitle: EVALSHA
since: 2.6.0
summary: Executes a server-side Lua script by SHA1 digest.
syntax_fmt: EVALSHA sha1 numkeys [key [key ...]] [arg [arg ...]]
syntax_str: numkeys [key [key ...]] [arg [arg ...]]
title: EVALSHA
---
Evaluate a script from the server's cache by its SHA1 digest.

The server caches scripts by using the [`SCRIPT LOAD`]({{< relref "/commands/script-load" >}}) command.
The command is otherwise identical to [`EVAL`]({{< relref "/commands/eval" >}}).

Please refer to the [Redis Programmability]({{< relref "/develop/interact/programmability/" >}}) and [Introduction to Eval Scripts]({{< relref "/develop/interact/programmability/eval-intro" >}}) for more information about Lua scripts.

## Return information

{{< multitabs id="evalsha-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

The return value depends on the script that was executed.

-tab-sep-

The return value depends on the script that was executed.

{{< /multitabs >}}
