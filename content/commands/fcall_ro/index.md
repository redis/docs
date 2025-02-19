---
acl_categories:
- '@slow'
- '@scripting'
arguments:
- display_text: function
  name: function
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
complexity: Depends on the function that is executed.
description: Invokes a read-only function.
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
linkTitle: FCALL_RO
since: 7.0.0
summary: Invokes a read-only function.
syntax_fmt: FCALL_RO function numkeys [key [key ...]] [arg [arg ...]]
syntax_str: numkeys [key [key ...]] [arg [arg ...]]
title: FCALL_RO
---
This is a read-only variant of the [`FCALL`]({{< relref "/commands/fcall" >}}) command that cannot execute commands that modify data.

For more information about when to use this command vs [`FCALL`]({{< relref "/commands/fcall" >}}), please refer to [Read-only scripts]({{< baseurl >}}develop/interact/programmability/#read-only_scripts).

For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/interact/programmability/functions-intro" >}}).
