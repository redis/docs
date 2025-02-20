---
acl_categories:
- '@slow'
- '@scripting'
arguments:
- display_text: script
  name: script
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
description: Executes a read-only server-side Lua script.
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
  notes: We cannot tell how the keys will be used so we assume the worst, RO and ACCESS
linkTitle: EVAL_RO
since: 7.0.0
summary: Executes a read-only server-side Lua script.
syntax_fmt: EVAL_RO script numkeys [key [key ...]] [arg [arg ...]]
syntax_str: numkeys [key [key ...]] [arg [arg ...]]
title: EVAL_RO
---
This is a read-only variant of the [`EVAL`]({{< relref "/commands/eval" >}}) command that cannot execute commands that modify data.

For more information about when to use this command vs [`EVAL`]({{< relref "/commands/eval" >}}), please refer to [Read-only scripts]({{< baseurl >}}develop/interact/programmability#read-only-scripts).

For more information about [`EVAL`]({{< relref "/commands/eval" >}}) scripts please refer to [Introduction to Eval Scripts]({{< relref "/develop/interact/programmability/eval-intro" >}}).

## Examples

```
> SET mykey "Hello"
OK

> EVAL_RO "return redis.call('GET', KEYS[1])" 1 mykey
"Hello"

> EVAL_RO "return redis.call('DEL', KEYS[1])" 1 mykey
(error) ERR Error running script (call to b0d697da25b13e49157b2c214a4033546aba2104): @user_script:1: @user_script: 1: Write commands are not allowed from read-only scripts.
```
