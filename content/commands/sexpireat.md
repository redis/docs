---
acl_categories:
- '@write'
- '@set'
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
  type: oneof
- arguments:
  - display_text: nummembers
    name: nummembers
    type: integer
  - display_text: member
    multiple: true
    name: member
    type: string
  name: members
  token: MEMBERS
  type: block
arity: -6
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
complexity: O(N) where N is the number of specified members
description: Set expiry for set member using an absolute Unix timestamp (seconds)
group: set
hidden: false
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
linkTitle: SEXPIREAT
railroad_diagram: /images/railroad/sexpireat.svg
since: 8.12.0
summary: Set expiry for set member using an absolute Unix timestamp (seconds)
syntax_fmt: "SEXPIREAT key unix-time-seconds [NX | XX | GT | LT]\n  MEMBERS\_nummembers\
  \ member [member ...]"
title: SEXPIREAT
---
This command works like [`SEXPIRE`](/content/commands/sexpire.md), but instead of a TTL in seconds, it takes the absolute [Unix time](https://en.wikipedia.org/wiki/Unix_time) at which the members expire, in seconds since the Unix epoch.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the set.

</details>

<details open><summary><code>unix-time-seconds</code></summary>

The expiration time, as a Unix timestamp in seconds. A time in the past removes the members immediately.

</details>

<details open><summary><code>MEMBERS nummembers member [member ...]</code></summary>

The set members to specify expiration for. `nummembers` is the number of members, followed by that many member names.

</details>

## Optional arguments

The following options modify the command's behavior. They are mutually exclusive.

<details open><summary><code>NX</code></summary>

For each specified member, apply the expiration only when the member has no expiration.

</details>

<details open><summary><code>XX</code></summary>

For each specified member, apply the expiration only when the member has an existing expiration.

</details>

<details open><summary><code>GT</code></summary>

For each specified member, apply the expiration only when the new expiration is greater than the current one. A member with no expiration is treated as having an infinite TTL for the purposes of `GT`.

</details>

<details open><summary><code>LT</code></summary>

For each specified member, apply the expiration only when the new expiration is less than the current one. A member with no expiration is treated as having an infinite TTL for the purposes of `LT`.

</details>

## Examples

```redis
redis> SADD myset member1 member2
(integer) 2
redis> SEXPIREAT myset 4102444800 MEMBERS 1 member1
1) (integer) 1
redis> SEXPIRETIME myset MEMBERS 2 member1 member2
1) (integer) 4102444800
2) (integer) -1
redis> SEXPIREAT myset 1 MEMBERS 1 member2
1) (integer) 2
redis> SMEMBERS myset
1) "member1"
```

## Details

See [`SEXPIRE`](/content/commands/sexpire.md#details) for how member expiration interacts with other set commands. Use [`SEXPIRETIME`](/content/commands/sexpiretime.md) to read back the expiration time of a member.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="sexpireat-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply](/content/develop/reference/protocol-spec.md#arrays). For each member:
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `-2` if no such member exists in the set, or the key does not exist.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `0` if the specified `NX`, `XX`, `GT`, or `LT` condition was not met.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `1` if the expiration time was set or updated.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `2` if the member was removed because the specified time is in the past.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the key exists but is not a set.

-tab-sep-

One of the following:
* [Array reply](/content/develop/reference/protocol-spec.md#arrays). For each member:
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `-2` if no such member exists in the set, or the key does not exist.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `0` if the specified `NX`, `XX`, `GT`, or `LT` condition was not met.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `1` if the expiration time was set or updated.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `2` if the member was removed because the specified time is in the past.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the key exists but is not a set.

{{< /multitabs >}}

## See also

[`SEXPIRE`](/content/commands/sexpire.md) | [`SPEXPIRE`](/content/commands/spexpire.md) | [`SPEXPIREAT`](/content/commands/spexpireat.md) | [`SADDEX`](/content/commands/saddex.md) | [`STTL`](/content/commands/sttl.md) | [`SPTTL`](/content/commands/spttl.md) | [`SEXPIRETIME`](/content/commands/sexpiretime.md) | [`SPEXPIRETIME`](/content/commands/spexpiretime.md) | [`SPERSIST`](/content/commands/spersist.md)

## Related topics

- [Set member expiration](/content/develop/data-types/sets.md#member-expiration)
