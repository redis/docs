---
acl_categories:
- '@array'
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: start
  type: string
- name: end
  type: string
- arguments:
  - arguments:
    - name: exact
      token: EXACT
      type: pure-token
    - name: string
      type: string
    name: exact
    type: block
  - arguments:
    - name: match
      token: MATCH
      type: pure-token
    - name: string
      type: string
    name: match
    type: block
  - arguments:
    - name: glob
      token: GLOB
      type: pure-token
    - name: pattern
      type: string
    name: glob
    type: block
  - arguments:
    - name: re
      token: RE
      type: pure-token
    - name: pattern
      type: string
    name: re
    type: block
  multiple: true
  name: predicate
  type: oneof
- arguments:
  - name: and
    token: AND
    type: pure-token
  - name: or
    token: OR
    type: pure-token
  - name: limit
    token: LIMIT
    type: integer
  - name: withvalues
    token: WITHVALUES
    type: pure-token
  - name: nocase
    token: NOCASE
    type: pure-token
  multiple: true
  name: options
  optional: true
  type: oneof
arity: -6
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
- readonly
complexity: O(P * C) where P is the number of visited positions in touched slices
  and C is the cost of evaluating the predicates on one existing element.
description: Searches array elements in a range using textual predicates.
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
  - ro
  - access
linkTitle: ARGREP
reply_schema:
  description: Array of matching indexes, or flat index-value pairs when WITHVALUES
    is used.
  items:
    oneOf:
    - description: Index of a matching element
      type: integer
    - description: Matching value when WITHVALUES is used
      type: string
  type: array
since: 8.8.0
summary: Searches array elements in a range using textual predicates.
syntax_fmt: "ARGREP key start end\n \
  \ <EXACT string | MATCH string | GLOB pattern | RE pattern [...]>\n \
  \ [AND | OR | LIMIT\_limit | WITHVALUES | NOCASE [...]]"
title: ARGREP
---
Searches array elements in a range using textual predicates and returns the indices of the matching elements. Empty slots in the range are skipped.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

<details open><summary><code>start</code></summary>

The zero-based integer index at which to begin searching. The special value `-` denotes the first index of the array. If `start` is greater than `end`, matches are returned in reverse index order.

</details>

<details open><summary><code>end</code></summary>

The zero-based integer index at which to stop searching (inclusive). The special value `+` denotes the last index of the array.

</details>

<details open><summary><code>predicate</code></summary>

One or more textual predicates to evaluate against each non-empty element in the range. Each predicate is one of:

- **`EXACT string`** — Matches elements whose value is exactly equal to `string`.
- **`MATCH string`** — Matches elements whose value contains `string` as a substring.
- **`GLOB pattern`** — Matches elements whose value matches the glob-style `pattern` (with `*`, `?`, and `[...]` wildcards), the same syntax used by [`KEYS`]({{< relref "/commands/keys" >}}) and [`SCAN`]({{< relref "/commands/scan" >}}) `MATCH`.
- **`RE pattern`** — Matches elements whose value matches the regular expression `pattern`.

When more than one predicate is supplied, use the `AND` or `OR` option to control how they are combined. The default is `OR`.

</details>

## Optional arguments

<details open><summary><code>options</code></summary>

Zero or more of the following modifiers:

- **`AND`** — Combine multiple predicates with logical AND. An element matches only if every predicate matches.
- **`OR`** — Combine multiple predicates with logical OR. An element matches if any predicate matches. This is the default.
- **`LIMIT limit`** — Stop after `limit` matches have been collected. `limit` must be a positive integer. When omitted, all matches in the range are returned.
- **`WITHVALUES`** — In addition to each matching index, return the matching value. The reply becomes a flat list of alternating index-value pairs.
- **`NOCASE`** — Perform case-insensitive comparisons for `EXACT`, `MATCH`, `GLOB`, and `RE`.

</details>

## Examples

{{% redis-cli %}}
ARMSET log 0 "boot: ok" 1 "warn: disk" 2 "ERROR: cpu" 3 "info: ready" 4 "error: net"
ARGREP log - + MATCH "error" NOCASE
ARGREP log - + MATCH "error" NOCASE WITHVALUES
ARGREP log 0 4 GLOB "warn:*" OR GLOB "error:*"
ARGREP log 0 4 RE "^[A-Za-z]+: (cpu|net)$" NOCASE WITHVALUES
ARGREP log 0 4 EXACT "info: ready"
ARGREP log - + MATCH "error" NOCASE LIMIT 1
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): Indices of the matching elements, in the same order in which the range is traversed (ascending when `start <= end`, descending when `start > end`). When `WITHVALUES` is given, a flat array of alternating index-value pairs: `[idx1, val1, idx2, val2, ...]`. An empty array is returned when the key does not exist or no element matches.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): Indices of the matching elements, in the same order in which the range is traversed (ascending when `start <= end`, descending when `start > end`). When `WITHVALUES` is given, a flat array of alternating index-value pairs: `[idx1, val1, idx2, val2, ...]`. An empty array is returned when the key does not exist or no element matches.

{{< /multitabs >}}

