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
is key name for an existing t-digest sketch.
</details>

## Return value

[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) of minimum observation value from a sketch. The result is always accurate. 'nan' if the sketch is empty.

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
