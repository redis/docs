---
acl_categories:
- '@json'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: path
  type: string
- name: value
  type: string
- arguments:
  - name: nx
    token: NX
    type: pure-token
  - name: xx
    token: XX
    type: pure-token
  name: condition
  optional: true
  type: oneof
- arguments:
  - arguments:
    - name: FP16
      token: FP16
      type: pure-token
    - name: BF16
      token: BF16
      type: pure-token
    - name: FP32
      token: FP32
      type: pure-token
    - name: FP64
      token: FP64
      type: pure-token
    name: fpha-type
    type: oneof
  name: fpha
  optional: true
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
complexity: O(M+N) when path is evaluated to a single value where M is the size of
  the original value (if it exists) and N is the size of the new value, O(M+N) when
  path is evaluated to multiple values where M is the size of the key and N is the
  size of the new value * the number of original values in the key
description: Sets or updates the JSON value at a path
group: json
hidden: false
linkTitle: JSON.SET
module: JSON
railroad_diagram: /images/railroad/json.set.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Sets or updates the JSON value at a path
syntax_fmt: JSON.SET key path value [NX | XX] [FPHA <FP16 | BF16 | FP32 | FP64>]
title: JSON.SET
---

Set or replace the value at each location resolved by `path`.

If the key does not exist, a new JSON document can be created only by setting the root path (`$` or `.`).

`JSON.SET` can also create new object members when the parent object exists.

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is a new key to create or an existing JSON key to modify.
</details>

<details open><summary><code>path</code></summary> 

A JSONPath expression that resolves to zero or more locations within the JSON document.

- The root of the document is specified as `$` or `.`.
- If `path` resolves to one or more existing locations, the value at each matched location is replaced with `value`.
- If the final token of `path` is a non-existing object member and the parent location exists and is an object, the member is created and set to `value`.
- If any intermediate path element does not exist, the path cannot be created, and the command returns nil.

Optional arguments `NX` and `XX` modify this behavior for both new keys and existing JSON keys.
</details>

<details open><summary><code>value</code></summary> 

A valid JSON value to set at the specified path.

The value can be a scalar (string, number, boolean, or null) or a compound value such as an object or array.
</details>

## Optional arguments

<details open><summary><code>NX</code></summary> 

Sets the value only if `path` has no matches.
</details>

<details open><summary><code>XX</code></summary> 

Sets the value only if `path` has one or more matches.
</details>

<details open><summary><code>FPHA <FP16 | BF16 | FP32 | FP64></code></summary>

Force floating point homogeneous arrays (FPHAs) to use a specified FP type. Added in Redis 8.8.

The available types offer a trade-off between precision and memory footprint. FP64 (64-bit) and FP32 (32-bit) provide higher precision for scientific and general computing workloads. BF16 and FP16 (both 16-bit) use half the memory of FP32 and require less memory, making them well suited for AI training and inference. A common strategy is to store and compute in BF16/FP16 for speed while accumulating results in FP32 to maintain accuracy.

Since JSON's numeric representation is textual, Redis cannot always infer the best FP type to use for FPHAs (for example, for vector embeddings). If your JSON was generated from an array of FP values with a given FP type, you should pass this type here.

If at least one of the specified values within the given FPHA doesn’t fit into the type specified (an overflow situation), the command will issue
a "`value out of range`" error.
</details>

## Examples

<details open>
<summary><b>Replace an existing value</b></summary>

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":2}'
OK
redis> JSON.SET doc $.a '3'
OK
redis> JSON.GET doc $
"[{\"a\":3}]"
{{< / highlight >}}
</details>

<details open>
<summary><b>Add a new value</b></summary>

{{< highlight bash >}}
redis> JSON.SET doc $ '{"a":2}'
OK
redis> JSON.SET doc $.b '8'
OK
redis> JSON.GET doc $
"[{\"a\":2,\"b\":8}]"
{{< / highlight >}}
</details>

<details open>
<summary><b>Add a new value with FPHA</b></summary>

{{< highlight bash >}}
redis> JSON.SET doc $ '[[1,2,3,4e3],[5,6.0,7,8]]' FPHA FP16
OK
redis> JSON.GET doc $
"[[[1.0,2.0,3.0,4000.0],[5.0,6.0,7.0,8.0]]]"
{{< / highlight >}}
</details>

<details open>
<summary><b>Update multiple matches</b></summary>

{{< highlight bash >}}
redis> JSON.SET doc $ '{"f1": {"a":1}, "f2":{"a":2}}'
OK
redis> JSON.SET doc $..a 3
OK
redis> JSON.GET doc
"{\"f1\":{\"a\":3},\"f2\":{\"a\":3}}"
{{< / highlight >}}
</details>

<details open>
<summary><b>path does not exist and cannot be created</b></summary>

{{< highlight bash >}}
redis> JSON.SET doc $ 1
OK
redis> JSON.SET doc $.x.y 2
(nil)
{{< / highlight >}}
</details>

<details open>
<summary><b>XX condition unmet</b></summary>

{{< highlight bash >}}
redis> JSON.SET nonexistentkey $ 5 XX
(nil)
redis> JSON.GET nonexistentkey
(nil)
{{< / highlight >}}
</details>

<details open>
<summary><b>key does not exist and path is not root</b></summary>

{{< highlight bash >}}
redis> JSON.SET nonexistentkey $.x 5
(error) ERR new objects must be created at the root
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="json-set-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}): if `key` exists but `path` does not exist and cannot be created, or if an `NX` or `XX` condition is unmet.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) expected ...` - if the value is invalid.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) Error occurred on position ... expected ...` - if the path is invalid.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) ERR new objects must be created at the root` - if `key` does not exist and `path` is not root (`$` or `.`).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) ERR wrong static path` - if a dynamic path expression has no matching locations.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) ERR index out of bounds` - if the path refers to an array index outside the array bounds.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) value out of range for ...` - if one or more values of a FP array are out of range for the given type.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}): if `key` exists but `path` does not exist and cannot be created, or if an `NX` or `XX` condition is unmet.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) expected ...` - if the value is invalid.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) Error occurred on position ... expected ...` - if the path is invalid.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) ERR new objects must be created at the root` - if `key` does not exist and `path` is not root (`$` or `.`).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) ERR wrong static path` - if a dynamic path expression has no matching locations.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) ERR index out of bounds` - if the path refers to an array index outside the array bounds.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): `(error) value out of range for ...` - if one or more values of a FP array are out of range for the given type.

{{< /multitabs >}}

## See also

[`JSON.GET`]({{< relref "commands/json.get/" >}}) | [`JSON.MGET`]({{< relref "commands/json.mget/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}})
