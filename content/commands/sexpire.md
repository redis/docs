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
- display_text: seconds
  name: seconds
  type: integer
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
description: Set expiry for set member using relative time to expire (seconds)
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
linkTitle: SEXPIRE
railroad_diagram: /images/railroad/sexpire.svg
since: 8.12.0
summary: Set expiry for set member using relative time to expire (seconds)
syntax_fmt: "SEXPIRE key seconds [NX | XX | GT | LT] MEMBERS\_nummembers member\n\
  \  [member ...]"
title: SEXPIRE
---
Set an expiration (TTL or time to live), in seconds, on one or more members of a set. Redis removes each member from the set automatically when its TTL expires.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the set.

</details>

<details open><summary><code>seconds</code></summary>

The time to live, in seconds. Each specified member is removed after this many seconds.

</details>

<details open><summary><code>MEMBERS nummembers member [member ...]</code></summary>

The set members to set expiration for. `nummembers` is the number of members, followed by that many member names.

</details>

## Optional arguments

The following options modify the command's behavior. They are mutually exclusive.

<details open><summary><code>NX</code></summary>

For each specified member, set expiration only when the member has no expiration.

</details>

<details open><summary><code>XX</code></summary>

For each specified member, set expiration only when the member has an existing expiration.

</details>

<details open><summary><code>GT</code></summary>

For each specified member, set expiration only when the new expiration is greater than the current one. A member with no expiration is treated as having an infinite TTL for the purposes of `GT`.

</details>

<details open><summary><code>LT</code></summary>

For each specified member, set expiration only when the new expiration is less than the current one. A member with no expiration is treated as having an infinite TTL for the purposes of `LT`.

</details>

## Examples

```redis
redis> SEXPIRE no-key 20 NX MEMBERS 2 member1 member2
1) (integer) -2
2) (integer) -2
redis> SADD myset member1 member2
(integer) 2
redis> SEXPIRE myset 10 MEMBERS 3 member1 member2 member3
1) (integer) 1
2) (integer) 1
3) (integer) -2
redis> SEXPIRE myset 20 NX MEMBERS 1 member1
1) (integer) 0
redis> SEXPIRE myset 20 GT MEMBERS 1 member1
1) (integer) 1
redis> STTL myset MEMBERS 2 member1 member2
1) (integer) 20
2) (integer) 10
```

## Details

Only commands that remove a member clear its expiration, such as [`SREM`](/content/commands/srem.md). [`SADD`](/content/commands/sadd.md) leaves the TTL of an existing member untouched. You can also clear the TTL with [`SPERSIST`](/content/commands/spersist.md), which turns the member back into a persistent member.

Calling `SEXPIRE` or [`SPEXPIRE`](/content/commands/spexpire.md) with a zero TTL, or [`SEXPIREAT`](/content/commands/sexpireat.md) or [`SPEXPIREAT`](/content/commands/spexpireat.md) with a time in the past, removes the member from the set. If that leaves the set empty, Redis deletes the key.

### Refreshing expires

You can call `SEXPIRE` on a member that already has a TTL. In this case, the TTL is _updated_ to the new value.

### Expired members and other set commands

Other set commands treat a member whose TTL has expired as missing, even before Redis reclaims it. [`SCARD`](/content/commands/scard.md) is the exception: it can count expired members that haven't been removed yet.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="sexpire-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply](/content/develop/reference/protocol-spec#arrays). For each member:
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `-2` if no such member exists in the set, or the key does not exist.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `0` if the specified `NX`, `XX`, `GT`, or `LT` condition was not met.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `1` if the expiration time was set or updated.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `2` if the member was removed because the TTL is 0.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the key exists but is not a set.

-tab-sep-

One of the following:
* [Array reply](/content/develop/reference/protocol-spec.md#arrays). For each member:
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `-2` if no such member exists in the set, or the key does not exist.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `0` if the specified `NX`, `XX`, `GT`, or `LT` condition was not met.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `1` if the expiration time was set or updated.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `2` if the member was removed because the TTL is 0.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the key exists but is not a set.

{{< /multitabs >}}

## See also

[`SPEXPIRE`](/content/commands/spexpire.md) | [`SEXPIREAT`](/content/commands/sexpireat.md) | [`SPEXPIREAT`](/content/commands/spexpireat.md) | [`SADDEX`](/content/commands/saddex.md) | [`STTL`](/content/commands/sttl.md) | [`SPTTL`](/content/commands/spttl.md) | [`SEXPIRETIME`](/content/commands/sexpiretime.md) | [`SPEXPIRETIME`](/content/commands/spexpiretime.md) | [`SPERSIST`](/content/commands/spersist.md)

## Related topics

- [Set member expiration](/content/develop/data-types/sets.md#member-expiration)
