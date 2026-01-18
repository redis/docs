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
- oss
- kubernetes
- clients
complexity: O(1)
description: Returns the maximum observation value from a t-digest sketch
group: tdigest
hidden: false
linkTitle: TDIGEST.MAX
module: Bloom
railroad_diagram: /images/railroad/tdigest.max.svg
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns the maximum observation value from a t-digest sketch
syntax_fmt: TDIGEST.MAX key
title: TDIGEST.MAX
---
Returns the maximum observation value from a t-digest sketch.

## Required arguments

<details open><summary><code>key</code></summary>

is the key name for an existing t-digest sketch.
</details>

## Examples

{{< highlight bash >}}
redis> TDIGEST.CREATE t
OK
redis> TDIGEST.MAX t
"nan"
redis> TDIGEST.ADD t 3 4 1 2 5
OK
redis>TDIGEST.MAX t
"5"
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="tdigest-max-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) as floating-point representing the maximum observation value from the given sketch. The result is always accurate. `nan` is returned if the sketch is empty.
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) in these cases: incorrect number of arguments or incorrect key type.

-tab-sep-

One of the following:

* [Double reply]({{< relref "/develop/reference/protocol-spec#doubles" >}}) representing the maximum observation value from the given sketch. The result is always accurate. `nan` is returned if the sketch is empty.
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) in these cases: incorrect number of arguments or incorrect key type.

{{< /multitabs >}}