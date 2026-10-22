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
- arguments:
  - display_text: mnx
    name: mnx
    token: MNX
    type: pure-token
  - display_text: mxx
    name: mxx
    token: MXX
    type: pure-token
  name: condition
  optional: true
  type: oneof
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
  - display_text: keepttl
    name: keepttl
    token: KEEPTTL
    type: pure-token
  name: expiration
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
arity: -5
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
- fast
complexity: O(N) where N is the number of members being added.
description: Add one or more members to a given set key, and optionally set their
  expiration.
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
linkTitle: SADDEX
railroad_diagram: /images/railroad/saddex.svg
since: 8.12.0
summary: Add one or more members to a given set key, and optionally set their expiration.
syntax_fmt: "SADDEX key [MNX | MXX] [EX\_seconds | PX\_milliseconds |\n  EXAT\_unix-time-seconds\
  \ | PXAT\_unix-time-milliseconds | KEEPTTL]\n  MEMBERS\_nummembers member [member\
  \ ...]"
title: SADDEX
---
Add one or more members to a set, and optionally set their expiration time or time to live (TTL). If the key doesn't exist, Redis creates a new set.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the set.

</details>

<details open><summary><code>MEMBERS nummembers member [member ...]</code></summary>

The members to add. `nummembers` is the number of members, followed by that many member names.

</details>

## Optional arguments

The following options modify the command's behavior. `MNX` and `MXX` are mutually exclusive. The `EX`, `PX`, `EXAT`, `PXAT`, and `KEEPTTL` options are also mutually exclusive.

<details open><summary><code>MNX</code></summary>

Only add the members if none of them already exist in the set.

</details>

<details open><summary><code>MXX</code></summary>

Only update the members if all of them already exist in the set.

</details>

<details open><summary><code>EX seconds</code></summary>

Set the specified expiration time, in seconds.

</details>

<details open><summary><code>PX milliseconds</code></summary>

Set the specified expiration time, in milliseconds.

</details>

<details open><summary><code>EXAT unix-time-seconds</code></summary>

Set the specified Unix time, in seconds, at which the members expire.

</details>

<details open><summary><code>PXAT unix-time-milliseconds</code></summary>

Set the specified Unix time, in milliseconds, at which the members expire.

</details>

<details open><summary><code>KEEPTTL</code></summary>

Retain the TTL of members that already exist in the set. New members are added with no expiration.

</details>

## Examples

```redis
redis> SADDEX myset EX 300 MEMBERS 2 member1 member2
(integer) 1
redis> STTL myset MEMBERS 2 member1 member2
1) (integer) 300
2) (integer) 300
redis> SADDEX myset MNX EX 60 MEMBERS 2 member2 member3
(integer) 0
redis> SADDEX myset KEEPTTL MEMBERS 2 member1 member3
(integer) 1
redis> STTL myset MEMBERS 3 member1 member2 member3
1) (integer) 300
2) (integer) 300
3) (integer) -1
redis> SADDEX myset MEMBERS 1 member1
(integer) 1
redis> STTL myset MEMBERS 1 member1
1) (integer) -1
redis> SADDEX myset MXX PX 1 MEMBERS 2 member2 member4
(integer) 0
redis> SADDEX myset EX 10 KEEPTTL MEMBERS 1 member1
(error) ERR Only one of EX, PX, EXAT, PXAT or KEEPTTL arguments can be specified
```

## Details

`SADDEX` applies the expiration option to every member you list, both new and existing. Without an expiration option, it adds the members with no TTL and discards the TTL of any member that already has one. Use `KEEPTTL` to keep existing TTLs instead. [`SADD`](/content/commands/sadd.md) never changes a member's TTL.

The `MNX` and `MXX` conditions apply to the members as a group. If any member fails the condition, `SADDEX` changes nothing and returns `0`.

An expiration of 0, or a Unix time in the past, removes the listed members from the set instead of adding them. If that leaves the set empty, Redis deletes the key.

See [`SEXPIRE`](/content/commands/sexpire.md#details) for how member expiration interacts with other set commands.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="saddex-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Integer reply](/content/develop/reference/protocol-spec.md#integers): `0` if no member was added, updated, or removed. This includes the case where the `MNX` or `MXX` condition was not met.
* [Integer reply](/content/develop/reference/protocol-spec.md#integers): `1` if at least one member was added, updated, or removed.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the key exists but is not a set.

-tab-sep-

One of the following:
* [Integer reply](/content/develop/reference/protocol-spec.md#integers): `0` if no member was added, updated, or removed. This includes the case where the `MNX` or `MXX` condition was not met.
* [Integer reply](/content/develop/reference/protocol-spec.md#integers): `1` if at least one member was added, updated, or removed.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the key exists but is not a set.

{{< /multitabs >}}

## See also

[`SEXPIRE`](/content/commands/sexpire.md) | [`SPEXPIRE`](/content/commands/spexpire.md) | [`SEXPIREAT`](/content/commands/sexpireat.md) | [`SPEXPIREAT`](/content/commands/spexpireat.md) | [`STTL`](/content/commands/sttl.md) | [`SPTTL`](/content/commands/spttl.md) | [`SEXPIRETIME`](/content/commands/sexpiretime.md) | [`SPEXPIRETIME`](/content/commands/spexpiretime.md) | [`SPERSIST`](/content/commands/spersist.md)

## Related topics

- [Set member expiration](/content/develop/data-types/sets.md#member-expiration)
