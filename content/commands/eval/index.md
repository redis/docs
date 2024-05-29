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
- noscript
- stale
- skip_monitor
- no_mandatory_keys
- movablekeys
complexity: Depends on the script that is executed.
description: Executes a server-side Lua script.
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
  notes: We cannot tell how the keys will be used so we assume the worst, RW and UPDATE
  update: true
linkTitle: EVAL
since: 2.6.0
summary: Executes a server-side Lua script.
syntax_fmt: EVAL script numkeys [key [key ...]] [arg [arg ...]]
syntax_str: numkeys [key [key ...]] [arg [arg ...]]
title: EVAL
---
Invoke the execution of a server-side Lua script.

The first argument is the script's source code.
Scripts are written in [Lua](https://lua.org) and executed by the embedded [Lua 5.1]({{< baseurl >}}/develop/interact/programmability/lua-api) interpreter in Redis.

The second argument is the number of input key name arguments, followed by all the keys accessed by the script.
These names of input keys are available to the script as the [_KEYS_ global runtime variable]({{< baseurl >}}/develop/interact/programmability/lua-api#the-keys-global-variable)
Any additional input arguments **should not** represent names of keys.

**Important:**
to ensure the correct execution of scripts, both in standalone and clustered deployments, all names of keys that a script accesses must be explicitly provided as input key arguments.
The script **should only** access keys whose names are given as input arguments.
Scripts **should never** access keys with programmatically-generated names or based on the contents of data structures stored in the database.

**Note:**
in some cases, users will abuse Lua EVAL by embedding values in the script instead of providing them as argument, and thus generating a different script on each call to EVAL.
These are added to the Lua interpreter and cached to redis-server, consuming a large amount of memory over time.
Starting from Redis 7.4 RC1, scripts loaded with `EVAL` or [`EVAL_RO`]({{< relref "/commands/eval_ro" >}}) will be deleted from redis after a certain number (least recently used order).
The number of evicted scripts can be viewed through [`INFO`]({{< relref "/commands/info" >}})'s `evicted_scripts`.

Please refer to the [Redis Programmability]({{< relref "/develop/interact/programmability/" >}}) and [Introduction to Eval Scripts]({{< relref "/develop/interact/programmability/eval-intro" >}}) for more information about Lua scripts.

## Examples

The following example will run a script that returns the first argument that it gets.

```
> EVAL "return ARGV[1]" 0 hello
"hello"
```
