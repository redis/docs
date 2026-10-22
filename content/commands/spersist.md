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
- fast
complexity: O(N) where N is the number of specified members
description: Removes the expiration time for each specified member
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
linkTitle: SPERSIST
railroad_diagram: /images/railroad/spersist.svg
since: 8.12.0
summary: Removes the expiration time for each specified member
syntax_fmt: "SPERSIST key MEMBERS\_nummembers member [member ...]"
title: SPERSIST
---
Removes the existing expiration from one or more set members. This turns each member from _volatile_ (a member with an expiration) back into _persistent_ (a member with no TTL, which never expires).

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the set.

</details>

<details open><summary><code>MEMBERS nummembers member [member ...]</code></summary>

The set members to remove the expiration from. `nummembers` is the number of members, followed by that many member names.

</details>

## Examples

```redis
redis> SADD myset member1 member2
(integer) 2
redis> SEXPIRE myset 300 MEMBERS 2 member1 member2
1) (integer) 1
2) (integer) 1
redis> SPERSIST myset MEMBERS 1 member2
1) (integer) 1
redis> STTL myset MEMBERS 2 member1 member2
1) (integer) 300
2) (integer) -1
redis> SPERSIST myset MEMBERS 2 member2 member3
1) (integer) -1
2) (integer) -2
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="spersist-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

* [Array reply](/content/develop/reference/protocol-spec.md#arrays). For each member:
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `-2` if no such member exists in the set, or the key does not exist.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `-1` if the member exists but has no associated expiration.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `1` if the expiration was removed.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the key exists but is not a set.

-tab-sep-

* [Array reply](/content/develop/reference/protocol-spec.md#arrays). For each member:
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `-2` if no such member exists in the set, or the key does not exist.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `-1` if the member exists but has no associated expiration.
    - [Integer reply](/content/develop/reference/protocol-spec.md#integers): `1` if the expiration was removed.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the key exists but is not a set.

{{< /multitabs >}}

## See also

[`SEXPIRE`](/content/commands/sexpire.md) | [`SPEXPIRE`](/content/commands/spexpire.md) | [`SEXPIREAT`](/content/commands/sexpireat.md) | [`SPEXPIREAT`](/content/commands/spexpireat.md) | [`SADDEX`](/content/commands/saddex.md) | [`STTL`](/content/commands/sttl.md) | [`SPTTL`](/content/commands/spttl.md) | [`SEXPIRETIME`](/content/commands/sexpiretime.md) | [`SPEXPIRETIME`](/content/commands/spexpiretime.md)

## Related topics

- [Set member expiration](/content/develop/data-types/sets.md#member-expiration)
