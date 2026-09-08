---
acl_categories:
- '@write'
- '@string'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- arguments:
  - display_text: seconds
    name: seconds
    token: EX
    type: integer
  - display_text: milliseconds
    name: milliseconds
    token: PX
    type: integer
  - display_text: unix-time-seconds
    name: unix-time-seconds
    token: EXAT
    type: unix-time
  - display_text: unix-time-milliseconds
    name: unix-time-milliseconds
    token: PXAT
    type: unix-time
  - display_text: persist
    name: persist
    token: PERSIST
    type: pure-token
  name: expiration
  optional: true
  type: oneof
arity: -2
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
description: Returns the string value of a key after setting its expiration time.
group: string
hidden: false
key_specs:
- RW: true
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
  notes: RW and UPDATE because it changes the TTL
  update: true
linkTitle: GETEX
railroad_diagram: /images/railroad/getex.svg
since: 6.2.0
summary: Returns the string value of a key after setting its expiration time.
syntax_fmt: "GETEX key [EX\_seconds | PX\_milliseconds | EXAT\_unix-time-seconds |\n\
  \  PXAT\_unix-time-milliseconds | PERSIST]"
title: GETEX
---
Get the value of `key` and optionally set its expiration.
`GETEX` is similar to [`GET`]({{< relref "/commands/get" >}}), but is a write command with additional options.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key to retrieve.

</details>

## Optional arguments

The following options modify the command's behavior. They are mutually exclusive.

<details open><summary><code>EX seconds</code></summary>

Set the specified expire time, in seconds.

</details>

<details open><summary><code>PX milliseconds</code></summary>

Set the specified expire time, in milliseconds.

</details>

<details open><summary><code>EXAT unix-time-seconds</code></summary>

Set the specified Unix time at which the key will expire, in seconds.

</details>

<details open><summary><code>PXAT unix-time-milliseconds</code></summary>

Set the specified Unix time at which the key will expire, in milliseconds.

</details>

<details open><summary><code>PERSIST</code></summary>

Remove the time to live associated with the key. See [`PERSIST`]({{< relref "/commands/persist" >}}).

</details>

## Examples

{{% redis-cli %}}
redis> SET mykey "Hello"
OK
redis> GETEX mykey
"Hello"
redis> TTL mykey
(integer) -1
redis> GETEX mykey EX 60
"Hello"
redis> TTL mykey
(integer) 60
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active\*</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active\*</nobr></span> | \*Not supported for HyperLogLog. |

## Return information

{{< multitabs id="getex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the value of `key`
[Nil reply](../../develop/reference/protocol-spec#bulk-strings): if `key` does not exist.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the value of `key`
[Null reply](../../develop/reference/protocol-spec#nulls): if `key` does not exist.

{{< /multitabs >}}
