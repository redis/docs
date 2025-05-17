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
since: 1.0.0
stack_path: docs/data-types/json
summary: Sets or updates the JSON value at a path
syntax_fmt: JSON.SET key path value [NX | XX]
syntax_str: path value [NX | XX]
title: JSON.SET
---
Set the JSON value at `path` in `key`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. For new Redis keys the `path` must be the root. For existing keys, when the entire `path` exists, the value that it contains is replaced with the `json` value. For existing keys, when the `path` exists, except for the last element, a new child is added with the `json` value. 

Adds a key (with its respective value) to a JSON Object (in a RedisJSON data type key) only if it is the last child in the `path`, or it is the parent of a new child being added in the `path`. Optional arguments `NX` and `XX` modify this behavior for both new RedisJSON data type keys as well as the JSON Object keys in them.
</details>

<details open><summary><code>value</code></summary> 

is value to set at the specified path
</details>

## Optional arguments

<details open><summary><code>NX</code></summary> 

sets the key only if it does not already exist.
</details>

<details open><summary><code>XX</code></summary> 

sets the key only if it already exists.
</details>

## Return value 

Returns one of these replies:
- A simple string reply: `OK` if executed correctly
- `nil`
  - if `key` exists but `path` does not exist and cannot be created
  - if an `NX` or `XX` condition is unmet
- error if `key` does not exist and `path` is not root  (`.` or `$`)

For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

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
<summary><b>Update multi-paths</b></summary>

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


## See also

[`JSON.GET`]({{< relref "commands/json.get/" >}}) | [`JSON.MGET`]({{< relref "commands/json.mget/" >}}) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})
