---
acl_categories:
- '@tdigest'
- '@write'
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
description: Resets a t-digest sketch (empties the sketch and re-initializes it).
group: tdigest
hidden: false
linkTitle: TDIGEST.RESET
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Resets a t-digest sketch (empties the sketch and re-initializes it).
syntax_fmt: TDIGEST.RESET key
syntax_str: ''
title: TDIGEST.RESET
---
Resets a t-digest sketch: empties the sketch and re-initializes it.

## Required arguments

<details open><summary><code>key</code></summary>

is the key name for an existing t-digest sketch.
</details>


## Example

{{< highlight bash >}}
redis> TDIGEST.RESET t
OK
{{< / highlight >}}

## Return information

{{< multitabs id=“tdigest-reset-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: key does not exist or is of the wrong type, or incorrect number of arguments.

-tab-sep-

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: key does not exist or is of the wrong type, or incorrect number of arguments.

{{< /multitabs >}}