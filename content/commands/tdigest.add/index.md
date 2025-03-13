---
acl_categories:
- '@tdigest'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- arguments:
  - name: value
    type: double
  multiple: true
  name: values
  type: block
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
complexity: O(N) , where N is the number of samples to add
description: Adds one or more observations to a t-digest sketch
group: tdigest
hidden: false
linkTitle: TDIGEST.ADD
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Adds one or more observations to a t-digest sketch
syntax_fmt: TDIGEST.ADD key value [value ...]
syntax_str: value [value ...]
title: TDIGEST.ADD
---
Adds one or more observations to a t-digest sketch.

## Required arguments

<details open><summary><code>key</code></summary> 
is key name for an existing t-digest sketch.
</details>

<details open><summary><code>value</code></summary> 
is value of an observation (floating-point).
</details>

## Return value

[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly, or [] otherwise.

## Examples

{{< highlight bash >}}
redis> TDIGEST.ADD t 1 2 3
OK
{{< / highlight >}}

{{< highlight bash >}}
redis> TDIGEST.ADD t string
(error) ERR T-Digest: error parsing val parameter
{{< / highlight >}}
