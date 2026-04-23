---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: count
  type: integer
- name: rev
  optional: true
  token: REV
  type: pure-token
arity: -3
bannerText: Array is a new data type that is currently in preview and may be subject to change.
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
- READONLY
complexity: O(N) where N is the count
description: Returns the most recently inserted elements.
function: arlastitemsCommand
group: array
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
  - RO
  - ACCESS
linkTitle: ARLASTITEMS
reply_schema:
  items:
    oneOf:
    - type: string
    - type: 'null'
  type: array
since: 8.8.0
summary: Returns the most recently inserted elements.
syntax_fmt: ARLASTITEMS key count [REV]
title: ARLASTITEMS
---
Returns the most recently inserted elements.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

<details open><summary><code>count</code></summary>

The maximum number of most recently inserted elements to return. If the array contains fewer elements than `count`, all elements are returned.

</details>

## Optional arguments

<details open><summary><code>REV</code></summary>

When present, returns elements in reverse chronological order (most recent first) instead of the default oldest-first order.

</details>

## Examples

{{% redis-cli %}}
ARINSERT log "first"
ARINSERT log "second"
ARINSERT log "third"
ARLASTITEMS log 2
ARLASTITEMS log 2 REV
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays)

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays)

{{< /multitabs >}}
