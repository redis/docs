---
acl_categories:
- '@write'
- '@slow'
- '@scripting'
arguments:
- display_text: serialized-value
  name: serialized-value
  type: string
- arguments:
  - display_text: flush
    name: flush
    token: FLUSH
    type: pure-token
  - display_text: append
    name: append
    token: APPEND
    type: pure-token
  - display_text: replace
    name: replace
    token: REPLACE
    type: pure-token
  name: policy
  optional: true
  type: oneof
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
- denyoom
- noscript
complexity: O(N) where N is the number of functions on the payload
description: Restores all libraries from a payload.
group: scripting
hidden: false
hints:
- request_policy:all_shards
- response_policy:all_succeeded
linkTitle: FUNCTION RESTORE
since: 7.0.0
summary: Restores all libraries from a payload.
syntax_fmt: FUNCTION RESTORE serialized-value [FLUSH | APPEND | REPLACE]
syntax_str: '[FLUSH | APPEND | REPLACE]'
title: FUNCTION RESTORE
---
Restore libraries from the serialized payload.

You can use the optional _policy_ argument to provide a policy for handling existing libraries.
The following policies are allowed:

* **APPEND:** appends the restored libraries to the existing libraries and aborts on collision. 
  This is the default policy.
* **FLUSH:** deletes all existing libraries before restoring the payload.
* **REPLACE:** appends the restored libraries to the existing libraries, replacing any existing ones in case of name collisions. Note that this policy doesn't prevent function name collisions, only libraries.

For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/interact/programmability/functions-intro" >}}).

## Return information

{{< multitabs id="function-restore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
