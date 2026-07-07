---
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
description: Extended JSONPath operators, functions, and projection expressions added in Redis Open Source 8.10
linkTitle: Path extensions
title: JSONPath extensions
weight: 4
---

Beginning with Redis Open Source 8.10, the JSON data type extends its
[JSONPath syntax]({{< relref "develop/data-types/json/path#jsonpath-syntax" >}}) with
additional filter operators, functions, and top-level *projection expressions*. These
extensions close long-standing expressivity gaps in the original
[Goessner](http://goessner.net/articles/JsonPath/)-based dialect and move it closer to the
[JSONPath RFC 9535](https://datatracker.ietf.org/doc/rfc9535/) standard (regular
expressions follow [RFC 9485](https://datatracker.ietf.org/doc/rfc9485/) I-Regexp).

For the core path syntax (root, wildcard, recursive descent, slices, comparison and logical
filter operators, and the `=~` regex operator), see the
[Path]({{< relref "develop/data-types/json/path" >}}) page. This page documents only the
capabilities added in Redis Open Source 8.10.

## Evaluation semantics

The following rules apply throughout this page:

- **The "Nothing" result.** Any operand that cannot be evaluated — a non-numeric arithmetic
  operand, division or modulo by zero, an out-of-range index, a wrong argument count, a type
  mismatch, or an arithmetic overflow to a non-finite value — evaluates to *Nothing*. Inside
  a filter, a *Nothing* result makes the surrounding condition false, so the element is
  skipped. As a projection, it produces an empty reply (`[]`). Evaluation never returns an
  error and never fails the query for these cases.
- **Number coercion.** The `==`, `!=`, `in`, `nin`, and set-relation operators treat integer
  and floating-point numbers with the same value as equal (for example, `1` equals `1.0`).
  The ordering operators (`<`, `<=`, `>`, `>=`) cannot compare against an array or object
  literal, so such a comparison never matches.
- **Node lists match on "any".** When an operand selects more than one node (for example,
  `@.*`), a comparison or operator holds if *any* selected node satisfies it.
- **Arithmetic operators must be surrounded by spaces.** `@.a + 1` is addition, but `@.a+1`
  is a reference to a field literally named `a+1`, because the field-name character set
  includes characters such as `+`, `-`, `/`, `%`, `$`, `^`, `:`, and `_`.
- **Functions are arity-checked.** Calling a function with the wrong number of arguments
  produces *Nothing* rather than silently using a subset of the arguments.

{{< note >}}
**Breaking changes in Redis Open Source 8.10**

1. The `~` character is no longer part of the field-name character set. A field whose name
   contains a tilde must be accessed with bracket notation, for example `$["a~b"]`. The dot
   form `$.a~b` is now a parse error.
2. The words `in`, `nin`, `subsetof`, `anyof`, `noneof`, `size`, `sizeof`, and `empty` are
   now reserved as operators and no longer parse as a bare first path segment. To access a
   field with one of these names, use `$.size` or `$["size"]`.
{{< /note >}}

## Filter expression operators

The following operators can be used within a [filter expression]({{< relref "develop/data-types/json/path#filter-examples" >}}) (`?()`).

### Negation `!`

The `!` operator negates a filter condition. It binds more tightly than the logical `&&` and
`||` operators, so use parentheses to negate a compound condition. A double negation (`!!`)
is equivalent to an existence test.

```
> JSON.SET doc $ '[{"a":1,"b":1},{"b":2},{"a":1},{"c":3}]'
OK
> JSON.GET doc '$[?!@.a]'
"[{\"b\":2},{\"c\":3}]"
> JSON.GET doc '$[?!(@.a==1)]'
"[{\"b\":2},{\"c\":3}]"
> JSON.GET doc '$[?!@.a && @.b]'
"[{\"b\":2}]"
```

### Comparing array and object literals

The `==` and `!=` operators can compare any JSON literal, including array and object
literals, on either side of the operator. Comparison is by structural (deep) equality.
A comparison between values of different types is always false.

```
> JSON.SET doc $ '{"arrs":[[1],[2],[1,2],[1,[2]]],"objs":[{"x":1},{"x":2},{"y":1}]}'
OK
> JSON.GET doc '$.arrs[?(@ == [1])]'
"[[1]]"
> JSON.GET doc '$.arrs[?(@ == [1,[2]])]'
"[[1,[2]]]"
> JSON.GET doc '$.objs[?(@ == {"x":1})]'
"[{\"x\":1}]"
```

### Arithmetic operators

The binary operators `+`, `-`, `*`, `/`, and `%` and the unary operators `-` and `+` operate
on numbers. Precedence, from highest to lowest, is: unary `-`/`+`, then `*`/`/`/`%`, then
`+`/`-`. Use parentheses to override precedence. Division always produces a floating-point
result. Division or modulo by zero produces *Nothing*, so no element matches.

Remember that arithmetic operators must be surrounded by spaces (see
[Evaluation semantics](#evaluation-semantics)).

```
> JSON.SET doc $ '[{"a":2,"b":3},{"a":5,"b":2}]'
OK
> JSON.GET doc '$[?@.a + 1 == 3]'
"[{\"a\":2,\"b\":3}]"
> JSON.GET doc '$[?@.a + @.b * 2 == 8]'
"[{\"a\":2,\"b\":3}]"
> JSON.GET doc '$[?(@.a + @.b) * 2 == 10]'
"[{\"a\":2,\"b\":3}]"
```

### Membership: `in` and `nin`

`value in array` matches when `value` is a member of `array`; `value nin array` is its strict
negation. The right-hand side can be an array literal or a path to an array. Membership uses
the same structural comparison and number coercion as `==`. If the right-hand side is not an
array, `in` is false (so `nin` is true).

```
> JSON.SET doc $ '{"a":[1,2,3,4],"allow":[2,3]}'
OK
> JSON.GET doc '$.a[?@ in [2,4]]'
"[2,4]"
> JSON.GET doc '$.a[?@ nin [2,4]]'
"[1,3]"
> JSON.GET doc '$.a[?@ in $.allow]'
"[2,3]"
```

### Set relations: `subsetof`, `anyof`, and `noneof`

These operators compare two arrays (each side can be an array literal or a path to an array):

- `subsetof` matches when every element of the left array is a member of the right array. An
  empty array is a subset of any array.
- `anyof` matches when the two arrays have a non-empty intersection. An empty array never
  matches.
- `noneof` matches when the two arrays have an empty intersection. An empty array always
  matches.

```
> JSON.SET doc $ '{"a":[[1,2],[1,5],[]]}'
OK
> JSON.GET doc '$.a[?@ subsetof [1,2,3]]'
"[[1,2],[]]"
> JSON.SET doc $ '{"a":[[1,9],[8,9],[]]}'
OK
> JSON.GET doc '$.a[?@ anyof [1,2,3]]'
"[[1,9]]"
> JSON.SET doc $ '{"a":[[4,5],[1,9],[]]}'
OK
> JSON.GET doc '$.a[?@ noneof [1,2,3]]'
"[[4,5],[]]"
```

### `size` (`sizeof`) and `empty`

`left sizeof n` matches when the size of `left` equals the integer `n`, where size is the
number of characters in a string, the number of elements in an array, or the number of
members in an object. A non-integer `n` is truncated toward zero; a non-numeric `n` never
matches. `size` is an alias for `sizeof`.

`left empty true` matches an empty string, array, or object; `left empty false` matches a
non-empty one.

```
> JSON.SET doc $ '{"a":[[4,5],[1],[7,8,9]]}'
OK
> JSON.GET doc '$.a[?@ sizeof 2]'
"[[4,5]]"
> JSON.SET doc $ '{"a":[[],[1],"",[2,3],{},{"k":1}]}'
OK
> JSON.GET doc '$.a[?@ empty true]'
"[[],\"\",{}]"
> JSON.GET doc '$.a[?@ empty false]'
"[[1],[2,3],{\"k\":1}]"
```

### Get-keys operator `~`

The terminal `~` operator returns the member names of an object as a flat list of strings.
Applied to the root (`$~`), it returns the top-level keys. Applied to a multiple-match
receiver, it flattens the keys of every matched object. A non-object receiver contributes no
keys.

```
> JSON.SET doc $ '{"obj":{"x":1,"y":2},"books":[{"t":"a"},{"t":"b"}]}'
OK
> JSON.GET doc '$.obj~'
"[\"x\",\"y\"]"
> JSON.GET doc '$~'
"[\"obj\",\"books\"]"
> JSON.GET doc '$.books~'
"[]"
```

Because `~` is terminal, expressions such as `$.obj~.x`, `$.obj~~`, and `$.obj.keys()~` are
parse errors. For a composable alternative that can be chained with other functions, use the
[`keys()`](#keys) function.

## Functions

Functions can appear inside filter expressions and, when they return a value, as top-level
[projection expressions](#projection-expressions). A function can be written in prefix form,
`length($.arr)`, or in postfix (method) form, `$.arr.length()`. A path segment immediately
followed by `(` is a method call, so `$.arr.length()` is a function call while `$.arr.length`
is a reference to a field named `length`.

### `length()`

Returns the number of characters in a string, elements in an array, or members in an object.
Any other type produces *Nothing*.

```
> JSON.SET doc $ '{"a":[[1,2,3],[1],"abcd","x"]}'
OK
> JSON.GET doc '$.a[?length(@) > 2]'
"[[1,2,3],\"abcd\"]"
```

### `count()`

Returns the number of nodes selected by a query. An absent path counts as `0`; a single node
counts as `1`.

```
> JSON.SET doc $ '[{"a":1,"b":2,"c":3},{"a":1}]'
OK
> JSON.GET doc '$[?count(@.*) == 3]'
"[{\"a\":1,\"b\":2,\"c\":3}]"
```

### `value()`

Returns the value of a query that selects exactly one node. A query that selects zero or more
than one node produces *Nothing*.

```
> JSON.SET doc $ '[{"a":1},{"a":2}]'
OK
> JSON.GET doc '$[?value(@.a) == 1]'
"[{\"a\":1}]"
```

### `keys()`

Returns the member names of an object as a list of strings, like the [`~`](#get-keys-operator)
operator. Unlike `~`, `keys()` is composable and can be chained with other functions.

```
> JSON.SET doc $ '{"obj":{"x":1,"y":2}}'
OK
> JSON.GET doc '$.obj.keys()'
"[\"x\",\"y\"]"
> JSON.GET doc '$.obj.keys().count()'
"[2]"
```

### `match()` and `search()`

Both test a string against a regular expression pattern
([RFC 9485](https://datatracker.ietf.org/doc/rfc9485/) I-Regexp). `match()` requires the whole
string to match (anchored), while `search()` matches any substring (the same behavior as the
`=~` operator). An invalid pattern produces no match.

```
> JSON.SET doc $ '{"a":["abc","xabc","a","b"]}'
OK
> JSON.GET doc '$.a[?match(@, "a.*")]'
"[\"abc\",\"a\"]"
> JSON.SET doc $ '{"a":["abc","xyz","b"]}'
OK
> JSON.GET doc '$.a[?search(@, "b")]'
"[\"abc\",\"b\"]"
```

### `concat()`

Concatenates its string arguments into a single string. It requires at least one argument, and
any non-string argument produces *Nothing*.

```
> JSON.SET doc $ '{"a":[{"x":"a","y":"b"},{"x":"a","y":"c"}]}'
OK
> JSON.GET doc '$.a[?concat(@.x, @.y) == "ab"]'
"[{\"x\":\"a\",\"y\":\"b\"}]"
```

### `abs()`, `ceiling()`, and `floor()`

Operate on a number: `abs()` returns the absolute value, `ceiling()` rounds up to the nearest
integer, and `floor()` rounds down. An integer argument stays an integer and a floating-point
argument stays a float. A result that overflows the signed 64-bit integer range produces
*Nothing*.

```
> JSON.SET doc $ '{"a":[2.1,3.9,1.0]}'
OK
> JSON.GET doc '$.a[?ceiling(@) == 3]'
"[2.1]"
> JSON.SET doc $ '{"a":[2.1,2.9,3.5]}'
OK
> JSON.GET doc '$.a[?floor(@) == 2]'
"[2.1,2.9]"
> JSON.SET doc $ '{"a":[{"n":-5},{"n":5},{"n":-3}]}'
OK
> JSON.GET doc '$.a[?abs(@.n) == 5]'
"[{\"n\":-5},{\"n\":5}]"
```

### `first()`, `last()`, and `index()`

`first(array)` and `last(array)` return the first and last element of an array. `index(array, n)`
returns the element at index `n`; a negative `n` counts from the end, a fractional `n` is
truncated toward zero, and an out-of-range index produces *Nothing*.

```
> JSON.SET doc $ '{"a":[{"n":[1,2]},{"n":[9,8]}]}'
OK
> JSON.GET doc '$.a[?first(@.n) == 1]'
"[{\"n\":[1,2]}]"
> JSON.GET doc '$.a[?last(@.n) == 8]'
"[{\"n\":[9,8]}]"
> JSON.GET doc '$.a[?index(@.n, -1) == 2]'
"[{\"n\":[1,2]}]"
```

### `min()`, `max()`, `avg()`, `sum()`, and `stddev()`

These aggregation functions operate on an array of numbers. `stddev()` returns the
*population* standard deviation (dividing by N). The functions are strict: an array that
contains any non-numeric element, or an empty array, produces *Nothing* — elements are never
silently skipped.

```
> JSON.SET doc $ '{"a":[{"n":[3,1,2]},{"n":[5,6]}]}'
OK
> JSON.GET doc '$.a[?sum(@.n) == 6]'
"[{\"n\":[3,1,2]}]"
> JSON.GET doc '$.a[?avg(@.n) == 2]'
"[{\"n\":[3,1,2]}]"
```

### `append()`

`append(value, ...)` returns the matched array with the given value or values added after its
elements. It is a read-only query-time projection and does not modify the stored document — to
mutate an array in place, use the
[`JSON.ARRAPPEND`]({{< relref "commands/json.arrappend/" >}}) command instead. A multiple-value
argument is added as a single element (it is not spread), and a *Nothing* argument makes the
whole result *Nothing*.

```
> JSON.SET doc $ '{"arr":[1,2,3]}'
OK
> JSON.GET doc '$.arr.append(9)'
"[1,2,3,9]"
> JSON.SET doc $ '{"books":[{"t":"a","price":30},{"t":"b","price":5}]}'
OK
> JSON.GET doc '$.books[?(@.price >= 10)].append({"t":"X"})'
"[{\"t\":\"a\",\"price\":30},{\"t\":\"X\"}]"
```

## Projection expressions

Beginning with Redis Open Source 8.10, the top level of a JSONPath query can be an expression
that *computes* a value — arithmetic, a function call, a get-keys operator, and so on — rather
than only selecting nodes from the document. A query that is a plain path (for example,
`$.a.b`, `$..x`, or even a fully parenthesized path such as `($.a)`) still selects nodes;
anything else (for example, `$.a + 1`, `-$.a`, `$.arr.length()`, `length($.arr)`, `$.obj~`, or
`$.obj.keys()`) is a projection.

Projections are evaluated only by the value-returning read commands
[`JSON.GET`]({{< relref "commands/json.get/" >}}),
[`JSON.MGET`]({{< relref "commands/json.mget/" >}}), and
[`JSON.RESP`]({{< relref "commands/json.resp/" >}}). Every other command that takes a path —
including [`JSON.SET`]({{< relref "commands/json.set/" >}}),
[`JSON.DEL`]({{< relref "commands/json.del/" >}}),
[`JSON.NUMINCRBY`]({{< relref "commands/json.numincrby/" >}}),
[`JSON.ARRAPPEND`]({{< relref "commands/json.arrappend/" >}}),
[`JSON.TYPE`]({{< relref "commands/json.type/" >}}), and
[`JSON.OBJKEYS`]({{< relref "commands/json.objkeys/" >}}) — rejects a projection with an error
and does not modify the document.

A projection that evaluates to *Nothing* produces an empty reply (`[]`).

```
> JSON.SET doc $ '{"a":2,"b":4,"arr":[1,2,3]}'
OK
> JSON.GET doc '$.a + 1'
"[3]"
> JSON.GET doc '$.a * $.b'
"[8]"
> JSON.GET doc '($.a + $.b) / 2'
"[3.0]"
> JSON.GET doc '$.arr.length()'
"[3]"
> JSON.GET doc '$.a / 0'
"[]"
```

When [`JSON.GET`]({{< relref "commands/json.get/" >}}) is given more than one path, projections
and plain paths can be mixed, and each path becomes a key in the returned object:

```
> JSON.GET doc '$.a + 1' '$.b'
"{\"$.a + 1\":[3],\"$.b\":[4]}"
```

[`JSON.MGET`]({{< relref "commands/json.mget/" >}}) evaluates the projection independently for
each key. A missing key, or a per-key evaluation error, yields a null reply for that key
rather than failing the whole request.
