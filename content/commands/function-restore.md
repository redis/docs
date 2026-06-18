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
railroad_diagram: /images/railroad/function-restore.svg
since: 7.0.0
summary: Restores all libraries from a payload.
syntax_fmt: FUNCTION RESTORE serialized-value [FLUSH | APPEND | REPLACE]
title: FUNCTION RESTORE
---
Restore libraries from serialized payload.

You can use the optional [policy argument](#optional-arguments) to provide a policy for handling existing libraries.


For more information see [Introduction to Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}).

## Required arguments

<details open><summary><code>serialized-value</code></summary>

The payload produced by [`FUNCTION DUMP`]({{< relref "/commands/function-dump" >}}).

</details>

## Optional arguments

<details open><summary><code>FLUSH | APPEND | REPLACE</code></summary>

Policies for handling existing libraries:

* `APPEND:` appends the restored libraries to the existing libraries and aborts on collision. 
  This is the default policy.
* `FLUSH:` deletes all existing libraries before restoring the payload.
* `REPLACE:` appends the restored libraries to the existing libraries, replacing any existing ones in case of name collisions. Note that this policy doesn't prevent function name collisions, only libraries.

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="function-restore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
