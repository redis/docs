---
arguments:
- name: key
  type: key
complexity: O(1)
description: 'Resets a t-digest sketch: empty the sketch and re-initializes it.'
group: tdigest
hidden: false
linkTitle: TDIGEST.RESET
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: 'Resets a t-digest sketch: empty the sketch and re-initializes it.'
syntax_fmt: TDIGEST.RESET key
syntax_str: ''
title: TDIGEST.RESET
---
Resets a t-digest sketch: empty the sketch and re-initializes it.

## Required arguments
<details open><summary><code>key</code></summary>
is key name for an existing t-digest sketch.
</details>

## Return value

[Simple string reply](/docs/reference/protocol-spec#simple-strings) - `OK` if executed correctly, or [] otherwise.

## Examples

{{< highlight bash >}}
redis> TDIGEST.RESET t
OK
{{< / highlight >}}
