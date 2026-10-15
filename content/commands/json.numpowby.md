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
  type: double
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
complexity: O(1) when path is evaluated to a single value, O(N) when path is evaluated
  to multiple values, where N is the size of the key
description: Raises the numeric value at path to the power of a value
group: json
hidden: false
linkTitle: JSON.NUMPOWBY
module: JSON
railroad_diagram: /images/railroad/json.numpowby.svg
since: 2.0.0
stack_path: docs/data-types/json
summary: Raises the numeric value at path to the power of a value
syntax_fmt: JSON.NUMPOWBY key path value
title: JSON.NUMPOWBY
---
Raise the number value stored at `path` to the power of `value`

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key to modify.
</details>

<details open><summary><code>path</code></summary> 

is JSONPath to specify.
</details>

<details open><summary><code>value</code></summary> 

is number value to use as the exponent.
</details>

## Examples

{{< highlight bash >}}
redis> JSON.SET doc . '{"a":"b","b":[{"a":2}, {"a":5}, {"a":"c"}]}'
OK
redis> JSON.NUMPOWBY doc $.a 2
"[null]"
redis> JSON.NUMPOWBY doc $..a 2
"[null,4,25,null]"
{{< / highlight >}}

## Details

If both the stored value and `value` are integers, the result is an integer. It must fit in a 64-bit signed integer, or the command fails with a `numeric overflow` error.

A negative integer exponent with an integer stored value also fails with `numeric overflow`. To get a fractional result, write the exponent as a floating-point number: raising `2` to `-1.0` returns `0.5`.

If either number is a floating-point number, the command uses floating-point arithmetic. A result that isn't a finite real number, such as `0` raised to `-1.0` or `-8` raised to `0.5`, fails with a `result is not a number` error.

When the command fails, the stored value doesn't change.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="json-numpowby-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

With `$`-based path argument: [Bulk string reply](/content/develop/reference/protocol-spec.md#bulk-strings) containing a JSON array with one element per matching path: the new value, or `null` if the matching value is not a number. The array is empty if no path matches.

With `.`-based path argument: [Bulk string reply](/content/develop/reference/protocol-spec.md#bulk-strings) representing the stringified new value. If the path matches more than one number, the command updates all of them and returns the last new value. [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) if no matching value is a number.

With either path argument: [simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) if the key doesn't exist or the result is out of range.

-tab-sep-

The path syntax doesn't change the reply. [Array reply](/content/develop/reference/protocol-spec.md#arrays) with one element per matching path: an [integer reply](/content/develop/reference/protocol-spec.md#integers) or [double reply](/content/develop/reference/protocol-spec.md#doubles) containing the new value, or a [null reply](/content/develop/reference/protocol-spec.md#nulls) if the matching value is not a number. The array is empty if no path matches.

[Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) if the key doesn't exist or the result is out of range.

{{< /multitabs >}}

## See also

[`JSON.NUMINCRBY`](/content/commands/json.numincrby.md) | [`JSON.NUMMULTBY`](/content/commands/json.nummultby.md) 

## Related topics

* [RedisJSON](/content/develop/data-types/json/_index.md)
* [Index and search JSON documents](/content/develop/ai/search-and-query/indexing/_index.md)
