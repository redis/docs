---
acl_categories:
- '@json'
- '@read'
- '@slow'
arguments:
- name: key
  type: key
- name: path
  optional: true
  type: string
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
complexity: O(N) when path is evaluated to a single value, where N is the size of
  the value, O(N) when path is evaluated to multiple values, where N is the size of
  the key
deprecated_since: '2.6'
description: Returns the JSON value at path in Redis Serialization Protocol (RESP)
group: json
hidden: false
linkTitle: JSON.RESP
module: JSON
since: 1.0.0
stack_path: docs/data-types/json
summary: Returns the JSON value at path in Redis Serialization Protocol (RESP)
syntax_fmt: JSON.RESP key [path]
syntax_str: '[path]'
title: JSON.RESP
---
Return the JSON in `key` in [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}) form 

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to parse.
</details>

## Optional arguments

<details open><summary><code>path</code></summary> 

is JSONPath to specify. Default is root `$`. This command uses the following mapping from JSON to RESP:

*   JSON `null` maps to the bulk string reply.
*   JSON `false` and `true` values map to the simple string reply.
*   JSON number maps to the integer reply or bulk string reply, depending on type.
*   JSON string maps to the bulk string reply.
*   JSON array is represented as an array reply in which the first element is the simple string reply `[`, followed by the array's elements.
*   JSON object is represented as an array reply in which the first element is the simple string reply `{`. Each successive entry represents a key-value pair as a two-entry array reply of the bulk string reply.

For more information about replies, see [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).
</details>

## Return

JSON.RESP returns an array reply specified as the JSON's RESP form detailed in [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}).

## Examples

<details open>
<summary><b>Return an array of RESP details about a document</b></summary>

Create a JSON document.

{{< highlight bash >}}
redis> JSON.SET item:2 $ '{"name":"Wireless earbuds","description":"Wireless Bluetooth in-ear headphones","connection":{"wireless":true,"type":"Bluetooth"},"price":64.99,"stock":17,"colors":["black","white"], "max_level":[80, 100, 120]}'
OK
{{< / highlight >}}

Get all RESP details about the document.

{{< highlight bash >}}
redis> JSON.RESP item:2
 1) {
 2) "name"
 3) "Wireless earbuds"
 4) "description"
 5) "Wireless Bluetooth in-ear headphones"
 6) "connection"
 7) 1) {
    2) "wireless"
    3) true
    4) "type"
    5) "Bluetooth"
 8) "price"
 9) "64.989999999999995"
10) "stock"
11) (integer) 17
12) "colors"
13) 1) [
    2) "black"
    3) "white"
14) "max_level"
15) 1) [
    2) (integer) 80
    3) (integer) 100
    4) (integer) 120
{{< / highlight >}}
</details>

## See also

[`JSON.SET`]({{< baseurl >}}/commands/json.set/) | [`JSON.ARRLEN`]({{< baseurl >}}/commands/json.arrlen/) 

## Related topics

* [RedisJSON]({{< relref "/develop/data-types/json/" >}})
* [Index and search JSON documents]({{< relref "/develop/interact/search-and-query/indexing/" >}})
