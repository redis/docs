---
acl_categories:
- '@tdigest'
- '@read'
- '@fast'
arguments:
- name: key
  type: key
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(1)
description: Returns the minimum observation value from a t-digest sketch
group: tdigest
hidden: false
linkTitle: TDIGEST.MIN
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns the minimum observation value from a t-digest sketch
syntax_fmt: TDIGEST.MIN key
syntax_str: ''
title: TDIGEST.MIN
---
Returns the minimum observation value from a t-digest sketch.

## Required arguments

<details open><summary><code>key</code></summary>

is the key name for an existing t-digest sketch.
</details>

## Examples

{{< highlight bash >}}
redis> TDIGEST.CREATE t
OK
redis> TDIGEST.MIN t
"nan"
redis> TDIGEST.ADD t 3 4 1 2 5
OK
redis> TDIGEST.MIN t
"1"
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="tdigest-min-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) as floating-point representing the minimum observation value from the given sketch. The result is always accurate. `nan` is returned if the sketch is empty.
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) in these cases: incorrect number of arguments or incorrect key type.

-tab-sep-

One of the following:

* [Double reply]({{< relref "/develop/reference/protocol-spec#doubles" >}}) representing the minimum observation value from the given sketch. The result is always accurate. `nan` is returned if the sketch is empty.
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) in these cases: incorrect number of arguments or incorrect key type.

{{< /multitabs >}}