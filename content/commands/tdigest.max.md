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
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns the maximum observation value from a t-digest sketch
syntax_fmt: TDIGEST.MAX key
syntax_str: ''
title: TDIGEST.MAX
---
Returns the maximum observation value from a t-digest sketch.

## Required arguments

<details open><summary><code>key</code></summary>
is key name for an existing t-digest sketch.
</details>

## Return value

[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) of maximum observation value from a sketch. The result is always accurate. 'nan' if the sketch is empty.

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
