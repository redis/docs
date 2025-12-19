---
arguments:
- name: key
  type: key
- name: start
  type: string
- name: end
  type: string
- name: count
  optional: true
  type: integer
arity: -4
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
complexity: O(log(K)+M) where K is the number of elements in the start prefix, and
  M is the number of elements returned. In practical terms, the command is just O(M)
description: Return elements in a lexicographical range
function: vrangeCommand
group: vector_set
hidden: false
linkTitle: VRANGE
railroad_diagram: /images/railroad/vrange.svg
since: 8.4.0
summary: Return elements in a lexicographical range
syntax_fmt: VRANGE key start end [count]
title: VRANGE
---
The `VRANGE` command provides a stateless iterator for the elements inside a vector set. It allows you to retrieve all the elements inside a vector set in small amounts for each call, without an explicit cursor, and with guarantees about what you will miss in case the vector set is changing (elements added and/or removed) during the iteration.

The command returns elements in lexicographical order, using byte-by-byte comparison (like `memcmp()`) to establish a total order among elements.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the vector set key from which to retrieve elements.

</details>

<details open><summary><code>start</code></summary>

The starting point of the lexicographical range. Can be:
- A string prefixed with `[` for inclusive range (e.g., `[Redis`)
- A string prefixed with `(` for exclusive range (e.g., `(a7`)
- The special symbol `-` to indicate the minimum element

</details>

<details open><summary><code>end</code></summary>

The ending point of the lexicographical range. Can be:
- A string prefixed with `[` for inclusive range
- A string prefixed with `(` for exclusive range
- The special symbol `+` to indicate the maximum element

</details>

## Optional arguments

<details open><summary><code>count</code></summary>

The maximum number of elements to return. If `count` is negative, the command returns all elements in the specified range (which may block the server for a long time with large sets).

</details>

## Examples

Retrieve the first 10 elements starting from the string "Redis" (inclusive):

```
VRANGE word_embeddings [Redis + 10
```

Iterate through all elements, 10 at a time:

```
VRANGE mykey - + 10
```

Continue iteration from the last element of the previous result (exclusive):

```
VRANGE mykey (a7 + 10
```

Return all elements in the set (use with caution):

```
VRANGE mykey - + -1
```

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of elements in lexicographical order within the specified range.
- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) (empty array) if the key doesn't exist.

-tab-sep-

One of the following:

- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of elements in lexicographical order within the specified range.
- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) (empty array) if the key doesn't exist.

{{< /multitabs >}}

## Behavior

- **Iteration guarantees**: Each range will produce exactly the elements that were present in the range at the moment the `VRANGE` command was executed.
- **Concurrent modifications**: Elements removed or added during iteration may or may not be returned, depending on when they were modified.
- **Empty key**: If the key doesn't exist, returns an empty array.
