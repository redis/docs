---
acl_categories:
- '@write'
- '@stream'
- '@fast'
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: pid
  type: string
- name: iid
  type: string
- name: stream-id
  type: string
arity: 5
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
complexity: O(1)
description: An internal command for setting IDMP metadata on an existing stream message.
group: stream
hidden: false
key_specs:
- begin_search:
    index:
      pos: 1
  find_keys:
    range:
      lastkey: 0
      limit: 0
      step: 1
  flags:
  - RW
  - UPDATE
linkTitle: XIDMPRECORD
railroad_diagram: /images/railroad/xidmprecord.svg
reply_schema:
  const: OK
since: 8.8.0
summary: An internal command for setting IDMP metadata on an existing stream message.
syntax_fmt: XIDMPRECORD key pid iid stream-id
title: XIDMPRECORD
---

`XIDMPRECORD` is an internal command for setting IDMP metadata on an existing stream message, which would be replayed during AOF loading.
Users should not call this command directly.

## Required arguments

<details open><summary><code>key</code></summary>

is the name of a stream key.

</details>

<details open><summary><code>pid</code></summary>

is a producer ID.

</details>

<details open><summary><code>iid</code></summary>

is an IDMP (idempotency) ID.

</details>

<details open><summary><code>stream-id</code></summary>

is the ID of an existing stream message.

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- A [simple string reply]({{< relref "/develop/reference/protocol-spec/#simple-strings" >}}) - `OK` when the provided pid/iid pair already maps to the same stream ID (that is, the command is idempotent).
- A [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors">}}) in one of the following cases:
    - the key does not exist
    - the key does not refer to a stream
    - the stream ID refers to an non-existent or deleted entry
    - pid and/or iid are empty
    - the pid/iid pair already maps to a different stream ID

-tab-sep-

One of the following:

- A [simple string reply]({{< relref "/develop/reference/protocol-spec/#simple-strings" >}}) - `OK` when the provided pid/iid pair already maps to the same stream ID (that is, the command is idempotent).
- A [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors">}}) in one of the following cases:
    - the key does not exist
    - the key does not refer to a stream
    - the stream ID refers to an non-existent or deleted entry
    - pid and/or iid are empty
    - the pid/iid pair already maps to a different stream ID

{{< /multitabs >}}
