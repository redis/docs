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
- display_text: unix-time-seconds
  name: unix-time-seconds
  type: unix-time
- arguments:
  - display_text: nx
    name: nx
    token: NX
    type: pure-token
  - display_text: xx
    name: xx
    token: XX
    type: pure-token
  - display_text: gt
    name: gt
    token: GT
    type: pure-token
  - display_text: lt
    name: lt
    token: LT
    type: pure-token
  name: condition
  optional: true
  since: 7.0.0
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
- fast
complexity: O(1)
description: Sets the expiration time of a key to a Unix timestamp.
group: generic
hidden: false
history:
- - 7.0.0
  - 'Added options: `NX`, `XX`, `GT` and `LT`.'
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
linkTitle: EXPIREAT
railroad_diagram: /images/railroad/expireat.svg
since: 1.2.0
summary: Sets the expiration time of a key to a Unix timestamp.
syntax_fmt: EXPIREAT key unix-time-seconds [NX | XX | GT | LT]
title: EXPIREAT
---
`EXPIREAT` has the same effect and semantic as [`EXPIRE`]({{< relref "/commands/expire" >}}), but instead of
specifying the number of seconds representing the TTL (time to live), it takes
an absolute [Unix timestamp][hewowu] (seconds since January 1, 1970). A
timestamp in the past will delete the key immediately.

[hewowu]: http://en.wikipedia.org/wiki/Unix_time

Please for the specific semantics of the command refer to the documentation of
[`EXPIRE`]({{< relref "/commands/expire" >}}).

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key.

</details>

<details open><summary><code>unix-time-seconds</code></summary>

The absolute expiration time as a Unix timestamp in seconds. A timestamp in the past deletes the key immediately.

</details>

## Optional arguments

These options are mutually exclusive.

<details open><summary><code>NX</code></summary>

Set the expiry only when the key has no expiry.

</details>

<details open><summary><code>XX</code></summary>

Set the expiry only when the key already has an expiry.

</details>

<details open><summary><code>GT</code></summary>

Set the expiry only when the new expiry is greater than the current one. A non-volatile key is treated as an infinite TTL for the purpose of `GT`.

</details>

<details open><summary><code>LT</code></summary>

Set the expiry only when the new expiry is less than the current one. A non-volatile key is treated as an infinite TTL for the purpose of `LT`.

</details>

## Examples

{{% redis-cli %}}
redis> SET mykey "Hello"
OK
redis> EXISTS mykey
(integer) 1
redis> EXPIREAT mykey 1293840000
(integer) 1
redis> EXISTS mykey
(integer) 0
{{% /redis-cli %}}

## Details

### Background

`EXPIREAT` was introduced in order to convert relative timeouts to absolute
timeouts for the AOF persistence mode.
Of course, it can be used directly to specify that a given key should expire at
a given time in the future.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="expireat-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the timeout was not set; for example, the key doesn't exist, or the operation was skipped because of the provided arguments.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the timeout was set.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the timeout was not set; for example, the key doesn't exist, or the operation was skipped because of the provided arguments.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the timeout was set.

{{< /multitabs >}}
