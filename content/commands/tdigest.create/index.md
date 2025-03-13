---
acl_categories:
- '@tdigest'
- '@write'
arguments:
- name: key
  type: key
- name: compression
  optional: true
  token: COMPRESSION
  type: integer
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
description: Allocates memory and initializes a new t-digest sketch
group: tdigest
hidden: false
linkTitle: TDIGEST.CREATE
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Allocates memory and initializes a new t-digest sketch
syntax_fmt: "TDIGEST.CREATE key [COMPRESSION\_compression]"
syntax_str: "[COMPRESSION\_compression]"
title: TDIGEST.CREATE
---
Allocates memory and initializes a new t-digest sketch.

## Required arguments

<details open><summary><code>key</code></summary> 
is key name for this new t-digest sketch.
</details>

## Optional arguments

<details open><summary><code>COMPRESSION compression</code></summary> 

is a controllable tradeoff between accuracy and memory consumption. 100 is a common value for normal uses. 1000 is more accurate. If no value is passed by default the compression will be 100. For more information on scaling of accuracy versus the compression parameter see [_The t-digest: Efficient estimates of distributions_](https://www.sciencedirect.com/science/article/pii/S2665963820300403).

</details>
  
## Return value

[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly, or [] otherwise.

## Examples

{{< highlight bash >}}
redis> TDIGEST.CREATE t COMPRESSION 100
OK
{{< / highlight >}}
