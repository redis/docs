---
aliases:
- /stack/json/path
- /stack/json/path/
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
description: Access specific elements within a JSON document
linkTitle: Path
title: Path
weight: 3
---

Paths let you access specific elements within a JSON document. Since no standard for JSON path syntax exists, Redis JSON implements its own. JSON's syntax is based on common best practices and intentionally resembles [JSONPath](http://goessner.net/articles/JsonPath/).

JSON supports two query syntaxes: [JSONPath syntax](#jsonpath-syntax) and the [legacy path syntax](#legacy-path-syntax) from the first version of JSON.

JSON knows which syntax to use depending on the first character of the path query. If the query starts with the character `$`, it uses JSONPath syntax. Otherwise, it defaults to the legacy path syntax.

The returned value is a JSON string with a top-level array of JSON serialized strings. 
And if multi-paths are used, the return value is a JSON string with a top-level object with values that are arrays of serialized JSON values.

## JSONPath support

RedisJSON v2.0 introduced [JSONPath](http://goessner.net/articles/JsonPath/) support. It follows the syntax described by Goessner in his [article](http://goessner.net/articles/JsonPath/).

A JSONPath query can resolve to several locations in a JSON document. In this case, the JSON commands apply the operation to every possible location. This is a major improvement over [legacy path](#legacy-path-syntax) queries, which only operate on the first path.

Notice that the structure of the command response often differs when using JSONPath. See the [Commands]({{< relref "/commands/" >}}?group=json) page for more details.

The new syntax supports bracket notation, which allows the use of special characters like colon ":" or whitespace in key names.

If you want to include double quotes in a query from the CLI, enclose the JSONPath within single quotes. For example:

```bash
JSON.GET store '$.inventory["mountain_bikes"]'
```


## JSONPath syntax

The following JSONPath syntax table was adapted from Goessner's [path syntax comparison](https://goessner.net/articles/JsonPath/index.html#e2).

| Syntax&nbsp;element | Description |
|----------------|-------------|
| $ | The root (outermost JSON element), starts the path. |
| . or [] | Selects a child element. |
| .. | Recursively descends through the JSON document. |
| * | Wildcard, returns all elements. |
| [] | Subscript operator, accesses an array element. |
| [,] | Union, selects multiple elements. |
| [start\:end\:step] | Array slice where *start*, *end*, and *step* are index values. You can omit values from the slice (for example, `[3:]`, `[:8:2]`) to use the default values: *start* defaults to the first index, *end* defaults to the last index, and *step* defaults to `1`. Use `[*]` or `[:]` to select all elements. |
| ?() | Filters a JSON object or array. Supports comparison operators <nobr>(`==`, `!=`, `<`, `<=`, `>`, `>=`, `=~`)</nobr>, logical operators <nobr>(`&&`, `\|\|`, `!`)</nobr>, arithmetic operators <nobr>(`+`, `-`, `*`, `/`, `%`)</nobr>, membership operators <nobr>(`in`, `nin`)</nobr>, set-relation operators <nobr>(`subsetof`, `anyof`, `noneof`)</nobr>, the <nobr>(`size`/`sizeof`, `empty`)</nobr> operators, and parenthesis <nobr>(`(`, `)`)</nobr>. |
| () | Script expression. |
| @ | The current element, used in filter or script expressions. |
| ~ | Returns the names of an object's members as a list of strings. |

Beginning with Redis 8.10, the JSON data type supports a richer JSONPath syntax, with additional operators and functions:

- Projection expressions at the top level of a JSONPath query
- `==` and `!=` can now compare any literal, including array and object literals
- Filter negation operator: `!`
- `size`/`sizeof` and `empty` operators on string, array, object, and nodelist
- `in` and `nin` operators: membership test on an array and nodelist
- Operators on numbers: binary `-`, `+`, `*`, `/`, `%`, and unary `-` and `+`
- Operator on object: `~`
- `length()` function on array, object, and string
- Functions on number: `abs()`, `ceiling()`, `floor()`
- Functions on string: `match()`, `search()`
- Strings concatenation with `concat()`
- Functions on array: `first()`, `last()`, `index()`, `append()`
- Aggregation functions on array: `min()`, `max()`, `avg()`, `sum()`, `stddev()`
- Function on object: `keys()`
- Function on nodelist: `count()`
- Function on nodelist with exactly one node: `value()`
- Relations functions on array and nodelist: `subsetof()`, `anyof()`, `noneof()`

{{< warning >}}
Beginning with Redis 8.10, two changes to path parsing may affect existing queries:

- To access a field whose name contains a tilde (`~`), use bracket notation, for example `$["a~b"]`. A tilde is no longer valid in a field name using dot notation.
- The words `in`, `nin`, `subsetof`, `anyof`, `noneof`, `size`, `sizeof`, and `empty` are now reserved as operators. To access a field with one of these names, use `$.size` or `$["size"]`.
{{< /warning >}}

## Evaluation semantics

The following rules apply to the operators and functions described below:

- **The "Nothing" result.** Any operand that cannot be evaluated — a non-numeric arithmetic operand, division or modulo by zero, an out-of-range index, a wrong argument count, a type mismatch, or an arithmetic overflow to a non-finite value — evaluates to *Nothing*. Inside a filter, a *Nothing* result makes the surrounding condition false, so the element is skipped. As a projection, it produces an empty reply (`[]`). Evaluation never returns an error and never fails the query for these cases.
- **Number coercion.** The `==`, `!=`, `in`, `nin`, and set-relation operators treat integer and floating-point numbers with the same value as equal (for example, `1` equals `1.0`). The ordering operators (`<`, `<=`, `>`, `>=`) cannot compare against an array or object literal, so such a comparison never matches.
- **Node lists match on "any".** When an operand selects more than one node (for example, `@.*`), a comparison or operator holds if *any* selected node satisfies it.
- **Arithmetic operators must be surrounded by spaces.** `@.a + 1` is addition, but `@.a+1` is a reference to a field literally named `a+1`, because the field-name character set includes characters such as `+`, `-`, `/`, `%`, `$`, `^`, `:`, and `_`.
- **Functions are arity-checked.** Calling a function with the wrong number of arguments produces *Nothing* rather than silently using a subset of the arguments.

## Filter expression operators

The following operators can be used within a filter expression (`?()`).

### Negation `!`

The `!` operator negates a filter condition. It binds more tightly than the logical `&&` and `||` operators, so use parentheses to negate a compound condition. A double negation (`!!`) is equivalent to an existence test.

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

The `==` and `!=` operators can compare any JSON literal, including array and object literals, on either side of the operator. Comparison is by structural (deep) equality. A comparison between values of different types is always false.

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

The binary operators `+`, `-`, `*`, `/`, and `%` and the unary operators `-` and `+` operate on numbers. Precedence, from highest to lowest, is: unary `-`/`+`, then `*`/`/`/`%`, then `+`/`-`. Use parentheses to override precedence. Division always produces a floating-point result. Division or modulo by zero produces *Nothing*, so no element matches.

Remember that arithmetic operators must be surrounded by spaces (see [Evaluation semantics](#evaluation-semantics)).

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

`value in array` matches when `value` is a member of `array`; `value nin array` is its strict negation. The right-hand side can be an array literal or a path to an array. Membership uses the same structural comparison and number coercion as `==`. If the right-hand side is not an array, `in` is false (so `nin` is true).

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

- `subsetof` matches when every element of the left array is a member of the right array. An empty array is a subset of any array.
- `anyof` matches when the two arrays have a non-empty intersection. An empty array never matches.
- `noneof` matches when the two arrays have an empty intersection. An empty array always matches.

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

`left sizeof n` matches when the size of `left` equals the integer `n`, where size is the number of characters in a string, the number of elements in an array, or the number of members in an object. A non-integer `n` is truncated toward zero; a non-numeric `n` never matches. `size` is an alias for `sizeof`.

`left empty true` matches an empty string, array, or object; `left empty false` matches a non-empty one.

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

The terminal `~` operator returns the member names of an object as a flat list of strings. Applied to the root (`$~`), it returns the top-level keys. Applied to a multiple-match receiver, it flattens the keys of every matched object. A non-object receiver contributes no keys.

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

Because `~` is terminal, expressions such as `$.obj~.x`, `$.obj~~`, and `$.obj.keys()~` are parse errors. For a composable alternative that can be chained with other functions, use the [`keys()`](#keys) function.

## Functions

Functions can appear inside filter expressions and, when they return a value, as top-level [projection expressions](#projection-expressions). A function can be written in prefix form, `length($.arr)`, or in postfix (method) form, `$.arr.length()`. A path segment immediately followed by `(` is a method call, so `$.arr.length()` is a function call while `$.arr.length` is a reference to a field named `length`.

### `length()`

Returns the number of characters in a string, elements in an array, or members in an object. Any other type produces *Nothing*.

```
> JSON.SET doc $ '{"a":[[1,2,3],[1],"abcd","x"]}'
OK
> JSON.GET doc '$.a[?length(@) > 2]'
"[[1,2,3],\"abcd\"]"
```

### `count()`

Returns the number of nodes selected by a query. An absent path counts as `0`; a single node counts as `1`.

```
> JSON.SET doc $ '[{"a":1,"b":2,"c":3},{"a":1}]'
OK
> JSON.GET doc '$[?count(@.*) == 3]'
"[{\"a\":1,\"b\":2,\"c\":3}]"
```

### `value()`

Returns the value of a query that selects exactly one node. A query that selects zero or more than one node produces *Nothing*.

```
> JSON.SET doc $ '[{"a":1},{"a":2}]'
OK
> JSON.GET doc '$[?value(@.a) == 1]'
"[{\"a\":1}]"
```

### `keys()`

Returns the member names of an object as a list of strings, like the `~` operator. Unlike `~`, `keys()` is composable and can be chained with other functions.

```
> JSON.SET doc $ '{"obj":{"x":1,"y":2}}'
OK
> JSON.GET doc '$.obj.keys()'
"[\"x\",\"y\"]"
> JSON.GET doc '$.obj.keys().count()'
"[2]"
```

### `match()` and `search()`

Both test a string against a regular expression pattern ([RFC 9485](https://datatracker.ietf.org/doc/rfc9485/) I-Regexp). `match()` requires the whole string to match (anchored), while `search()` matches any substring (the same behavior as the `=~` operator). An invalid pattern produces no match.

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

Concatenates its string arguments into a single string. It requires at least one argument, and any non-string argument produces *Nothing*.

```
> JSON.SET doc $ '{"a":[{"x":"a","y":"b"},{"x":"a","y":"c"}]}'
OK
> JSON.GET doc '$.a[?concat(@.x, @.y) == "ab"]'
"[{\"x\":\"a\",\"y\":\"b\"}]"
```

### `abs()`, `ceiling()`, and `floor()`

Operate on a number: `abs()` returns the absolute value, `ceiling()` rounds up to the nearest integer, and `floor()` rounds down. An integer argument stays an integer and a floating-point argument stays a float. A result that overflows the signed 64-bit integer range produces *Nothing*.

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

`first(array)` and `last(array)` return the first and last element of an array. `index(array, n)` returns the element at index `n`; a negative `n` counts from the end, a fractional `n` is truncated toward zero, and an out-of-range index produces *Nothing*.

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

These aggregation functions operate on an array of numbers. `stddev()` returns the *population* standard deviation (dividing by N). The functions are strict: an array that contains any non-numeric element, or an empty array, produces *Nothing* — elements are never silently skipped.

```
> JSON.SET doc $ '{"a":[{"n":[3,1,2]},{"n":[5,6]}]}'
OK
> JSON.GET doc '$.a[?sum(@.n) == 6]'
"[{\"n\":[3,1,2]}]"
> JSON.GET doc '$.a[?avg(@.n) == 2]'
"[{\"n\":[3,1,2]}]"
```

### `append()`

`append(value, ...)` returns the matched array with the given value or values added after its elements. It is a read-only query-time projection and does not modify the stored document — to mutate an array in place, use the [`JSON.ARRAPPEND`]({{< relref "commands/json.arrappend/" >}}) command instead. A multiple-value argument is added as a single element (it is not spread), and a *Nothing* argument makes the whole result *Nothing*.

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

The top level of a JSONPath query can be an expression that *computes* a value — arithmetic, a function call, a get-keys operator, and so on — rather than only selecting nodes from the document. A query that is a plain path (for example, `$.a.b`, `$..x`, or even a fully parenthesized path such as `($.a)`) still selects nodes; anything else (for example, `$.a + 1`, `-$.a`, `$.arr.length()`, `length($.arr)`, `$.obj~`, or `$.obj.keys()`) is a projection.

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

When [`JSON.GET`]({{< relref "commands/json.get/" >}}) is given more than one path, projections and plain paths can be mixed, and each path becomes a key in the returned object:

```
> JSON.GET doc '$.a + 1' '$.b'
"{\"$.a + 1\":[3],\"$.b\":[4]}"
```

[`JSON.MGET`]({{< relref "commands/json.mget/" >}}) evaluates the projection independently for each key. A missing key, or a per-key evaluation error, yields a null reply for that key rather than failing the whole request.

## Multi-language JSONPath examples

The following multi-language JSONPath examples use this JSON document, which stores details about items in a store's inventory:

{{< trimmable head="12" tail="8" >}}
```json
{
    "inventory": {
        "mountain_bikes": [
            {
                "id": "bike:1",
                "model": "Phoebe",
                "description": "This is a mid-travel trail slayer that is a fantastic daily driver or one bike quiver. The Shimano Claris 8-speed groupset gives plenty of gear range to tackle hills and there\u2019s room for mudguards and a rack too.  This is the bike for the rider who wants trail manners with low fuss ownership.",
                "price": 1920,
                "specs": {"material": "carbon", "weight": 13.1},
                "colors": ["black", "silver"],
            },
            {
                "id": "bike:2",
                "model": "Quaoar",
                "description": "Redesigned for the 2020 model year, this bike impressed our testers and is the best all-around trail bike we've ever tested. The Shimano gear system effectively does away with an external cassette, so is super low maintenance in terms of wear and tear. All in all it's an impressive package for the price, making it very competitive.",
                "price": 2072,
                "specs": {"material": "aluminium", "weight": 7.9},
                "colors": ["black", "white"],
            },
            {
                "id": "bike:3",
                "model": "Weywot",
                "description": "This bike gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. A set of powerful Shimano hydraulic disc brakes provide ample stopping ability. If you're after a budget option, this is one of the best bikes you could get.",
                "price": 3264,
                "specs": {"material": "alloy", "weight": 13.8},
            },
        ],
        "commuter_bikes": [
            {
                "id": "bike:4",
                "model": "Salacia",
                "description": "This bike is a great option for anyone who just wants a bike to get about on With a slick-shifting Claris gears from Shimano\u2019s, this is a bike which doesn\u2019t break the bank and delivers craved performance.  It\u2019s for the rider who wants both efficiency and capability.",
                "price": 1475,
                "specs": {"material": "aluminium", "weight": 16.6},
                "colors": ["black", "silver"],
            },
            {
                "id": "bike:5",
                "model": "Mimas",
                "description": "A real joy to ride, this bike got very high scores in last years Bike of the year report. The carefully crafted 50-34 tooth chainset and 11-32 tooth cassette give an easy-on-the-legs bottom gear for climbing, and the high-quality Vittoria Zaffiro tires give balance and grip.It includes a low-step frame , our memory foam seat, bump-resistant shocks and conveniently placed thumb throttle. Put it all together and you get a bike that helps redefine what can be done for this price.",
                "price": 3941,
                "specs": {"material": "alloy", "weight": 11.6},
            },
        ],
    }
}
```
{{< /trimmable >}}

First, create the JSON document in your database:

{{< clients-example set="json_tutorial" step="set_bikes" description="Setup: Create a complex JSON document with nested objects and arrays to use in JSONPath examples" max_lines="10" >}}
> JSON.SET bikes:inventory $ '{ "inventory": { "mountain_bikes": [ { "id": "bike:1", "model": "Phoebe", "description": "This is a mid-travel trail slayer that is a fantastic daily driver or one bike quiver. The Shimano Claris 8-speed groupset gives plenty of gear range to tackle hills and there\'s room for mudguards and a rack too. This is the bike for the rider who wants trail manners with low fuss ownership.", "price": 1920, "specs": {"material": "carbon", "weight": 13.1}, "colors": ["black", "silver"] }, { "id": "bike:2", "model": "Quaoar", "description": "Redesigned for the 2020 model year, this bike impressed our testers and is the best all-around trail bike we\'ve ever tested. The Shimano gear system effectively does away with an external cassette, so is super low maintenance in terms of wear and tear. All in all it\'s an impressive package for the price, making it very competitive.", "price": 2072, "specs": {"material": "aluminium", "weight": 7.9}, "colors": ["black", "white"] }, { "id": "bike:3", "model": "Weywot", "description": "This bike gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. A set of powerful Shimano hydraulic disc brakes provide ample stopping ability. If you\'re after a budget option, this is one of the best bikes you could get.", "price": 3264, "specs": {"material": "alloy", "weight": 13.8} } ], "commuter_bikes": [ { "id": "bike:4", "model": "Salacia", "description": "This bike is a great option for anyone who just wants a bike to get about on With a slick-shifting Claris gears from Shimano\'s, this is a bike which doesn\'t break the bank and delivers craved performance. It\'s for the rider who wants both efficiency and capability.", "price": 1475, "specs": {"material": "aluminium", "weight": 16.6}, "colors": ["black", "silver"] }, { "id": "bike:5", "model": "Mimas", "description": "A real joy to ride, this bike got very high scores in last years Bike of the year report. The carefully crafted 50-34 tooth chainset and 11-32 tooth cassette give an easy-on-the-legs bottom gear for climbing, and the high-quality Vittoria Zaffiro tires give balance and grip.It includes a low-step frame , our memory foam seat, bump-resistant shocks and conveniently placed thumb throttle. Put it all together and you get a bike that helps redefine what can be done for this price.", "price": 3941, "specs": {"material": "alloy", "weight": 11.6} } ] }}'
{{< /clients-example >}}

### Access examples

The following examples use the [`JSON.GET`]({{< relref "commands/json.get/" >}}) command to retrieve data from various paths in the JSON document.

You can use the wildcard operator `*` to return a list of all items in the inventory:

{{< clients-example set="json_tutorial" step="get_bikes" description="Wildcard queries: Use the * operator to retrieve all items in a collection when you need to access all elements at a specific level" buildsUpon="set_bikes" >}}
> JSON.GET bikes:inventory $.inventory.*
"[[{\"id\":\"bike:1\",\"model\":\"Phoebe\",\"description\":\"This is a mid-travel trail slayer...
{{< /clients-example >}}

For some queries, multiple paths can produce the same results. For example, the following paths return the names of all mountain bikes:

{{< clients-example set="json_tutorial" step="get_mtnbikes" description="Array element access: Use bracket notation and array subscripts to access specific array elements or all elements with [*] when you need to retrieve values from arrays" difficulty="intermediate" buildsUpon="get_bikes" >}}
> JSON.GET bikes:inventory $.inventory.mountain_bikes[*].model
"[\"Phoebe\",\"Quaoar\",\"Weywot\"]"
> JSON.GET bikes:inventory '$.inventory["mountain_bikes"][*].model'
"[\"Phoebe\",\"Quaoar\",\"Weywot\"]"
> JSON.GET bikes:inventory '$..mountain_bikes[*].model'
"[\"Phoebe\",\"Quaoar\",\"Weywot\"]"
{{< /clients-example >}}

The recursive descent operator `..` can retrieve a field from multiple sections of a JSON document. The following example returns the names of all inventory items:

{{< clients-example set="json_tutorial" step="get_models" description="Recursive descent: Use the .. operator to search for a field at any depth in the JSON document when you need to find values across multiple nesting levels" difficulty="intermediate" buildsUpon="get_mtnbikes" >}}
> JSON.GET bikes:inventory $..model
"[\"Phoebe\",\"Quaoar\",\"Weywot\",\"Salacia\",\"Mimas\"]"
{{< /clients-example >}}

You can use an array slice to select a range of elements from an array. This example returns the names of the first 2 mountain bikes:

{{< clients-example set="json_tutorial" step="get2mtnbikes" description="Array slicing: Use [start:end] syntax to select a range of array elements when you need to retrieve a subset of items from an array" difficulty="intermediate" buildsUpon="get_mtnbikes" >}}
> JSON.GET bikes:inventory $..mountain_bikes[0:2].model
"[\"Phoebe\",\"Quaoar\"]"
{{< /clients-example >}}

Filter expressions `?()` let you select JSON elements based on certain conditions. You can use comparison operators (`==`, `!=`, `<`, `<=`, `>`, `>=`, and starting with version v2.4.2, also `=~`), logical operators (`&&`, `||`), and parenthesis (`(`, `)`) within these expressions. A filter expression can be applied on an array or on an object, iterating over all the **elements** in the array or all the **values** in the object, retrieving only the ones that match the filter condition. 

Paths within the filter condition use the dot notation with either `@` to denote the current array element or the current object value, or `$` to denote the top-level element. For example, use `@.key_name` to refer to a nested value and `$.top_level_key_name` to refer to a top-level value.

From version v2.4.2 onward, you can use the comparison operator `=~` to match a path of a string value on the left side against a regular expression pattern on the right side. For more information, see the [supported regular expression syntax docs](https://docs.rs/regex/latest/regex/#syntax).

Non-string values do not match. A match can only occur when the left side is a path of a string value and the right side is either a hard-coded string, or a path of a string value. See [examples](#json-filter-examples) below.

The regex match is partial, meaning a regex pattern like `"foo"` matches a string such as `"barefoots"`.
To make the match exact, use the regex pattern `"^foo$"`.

Other JSONPath engines may use regex patterns between slashes (for example, `/foo/`),
and their match is exact. They can perform partial matches using a regex pattern such
as `/.*foo.*/`.

### Filter examples

In the following example, the filter only returns mountain bikes with a price less than 3000 and
a weight less than 10:

{{< clients-example set="json_tutorial" step="filter1" description="Filter expressions: Use ?() with comparison and logical operators to select elements matching specific conditions when you need to query based on multiple criteria" difficulty="advanced" buildsUpon="get_models" >}}
> JSON.GET bikes:inventory '$..mountain_bikes[?(@.price < 3000 && @.specs.weight < 10)]'
"[{\"id\":\"bike:2\",\"model\":\"Quaoar\",\"description\":\"Redesigned for the 2020 model year...
{{< /clients-example >}}

This example filters the inventory for the model names of bikes made from alloy:

{{< clients-example set="json_tutorial" step="filter2" description="Equality filters: Use == operator in filter expressions to select elements with specific field values when you need to find items matching exact criteria" difficulty="advanced" buildsUpon="filter1" >}}
> JSON.GET bikes:inventory '$..[?(@.specs.material == "alloy")].model'
"[\"Weywot\",\"Mimas\"]"
{{< /clients-example >}}

This example, valid from version v2.4.2 onwards, filters only bikes whose material begins with
"al-" using regex match. Note that this match is case-insensitive because of the prefix `(?i)` in
the regular expression pattern `"(?i)al"`:

{{< clients-example set="json_tutorial" step="filter3" description="Regex filters: Use =~ operator with regular expressions in filter expressions to match patterns in string values when you need flexible pattern-based filtering" difficulty="advanced" buildsUpon="filter2" >}}
JSON.GET bikes:inventory '$..[?(@.specs.material =~ "(?i)al")].model'
"[\"Quaoar\",\"Weywot\",\"Salacia\",\"Mimas\"]"
{{< /clients-example >}}

You can also specify a regex pattern using a property from the JSON object itself.
For example, we can add a string property named `regex_pat` to each mountain bike,
with the value `"(?i)al"` to match the material, as in the previous example. We
can then match `regex_pat` against the bike's material: 

{{< clients-example set="json_tutorial" step="filter4" description="Dynamic regex filters: Use regex patterns stored in JSON properties to filter elements when you need to apply patterns defined within the document itself" difficulty="advanced" buildsUpon="filter3" >}}
> JSON.SET bikes:inventory $.inventory.mountain_bikes[0].regex_pat '"(?i)al"'
OK
> JSON.SET bikes:inventory $.inventory.mountain_bikes[1].regex_pat '"(?i)al"'
OK
> JSON.SET bikes:inventory $.inventory.mountain_bikes[2].regex_pat '"(?i)al"'
OK
> JSON.GET bikes:inventory '$.inventory.mountain_bikes[?(@.specs.material =~ @.regex_pat)].model'
"[\"Quaoar\",\"Weywot\"]"
{{< /clients-example >}}

See [Filter expression operators](#filter-expression-operators) for more information.

### Update examples

You can also use JSONPath queries when you want to update specific sections of a JSON document.

For example, you can pass a JSONPath to the [`JSON.SET`]({{< relref "commands/json.set/" >}}) command to update a specific field. This example changes the price of the first item in the headphones list:

{{< clients-example set="json_tutorial" step="update_bikes" description="Bulk updates: Use JSONPath with JSON.NUMINCRBY to update multiple numeric values across the document when you need to apply arithmetic operations to multiple fields" difficulty="intermediate" buildsUpon="get_bikes" >}}
> JSON.GET bikes:inventory $..price
"[1920,2072,3264,1475,3941]"
> JSON.NUMINCRBY bikes:inventory $..price -100
"[1820,1972,3164,1375,3841]"
> JSON.NUMINCRBY bikes:inventory $..price 100
"[1920,2072,3264,1475,3941]"
{{< /clients-example >}}

You can use filter expressions to update only JSON elements that match certain conditions. The following example sets the price of any bike to 1500 if its price is already less than 2000:

{{< clients-example set="json_tutorial" step="update_filters1" description="Conditional updates: Use filter expressions with JSON.SET to update only elements matching specific conditions when you need selective modifications" difficulty="advanced" buildsUpon="filter1" >}}
> JSON.SET bikes:inventory '$.inventory.*[?(@.price<2000)].price' 1500
OK
> JSON.GET bikes:inventory $..price
"[1500,2072,3264,1500,3941]"
{{< /clients-example >}}

JSONPath queries also work with other JSON commands that accept a path as an argument. For example, you can add a new color option for a set of headphones with [`JSON.ARRAPPEND`]({{< relref "commands/json.arrappend/" >}}):

{{< clients-example set="json_tutorial" step="update_filters2" description="Array updates with filters: Use JSON.ARRAPPEND with filter expressions to add elements to arrays matching conditions when you need to modify collections selectively" difficulty="advanced" buildsUpon="update_filters1" >}}
> JSON.ARRAPPEND bikes:inventory '$.inventory.*[?(@.price<2000)].colors' '"pink"'
1) (integer) 3
2) (integer) 3
127.0.0.1:6379> JSON.GET bikes:inventory $..[*].colors
"[[\"black\",\"silver\",\"pink\"],[\"black\",\"white\"],[\"black\",\"silver\",\"pink\"]]"
{{< /clients-example >}}

## Legacy path syntax

RedisJSON v1 had the following path implementation. JSON v2 still supports this legacy path in addition to JSONPath.

Paths always begin at the root of a Redis JSON value. The root is denoted by a period character (`.`). For paths that reference the root's children, it is optional to prefix the path with the root.

Redis JSON supports both dot notation and bracket notation for object key access. The following paths refer to _headphones_, which is a child of _inventory_ under the root:

*   `.inventory.headphones`
*   `inventory["headphones"]`
*   `['inventory']["headphones"]`

To access an array element, enclose its index within a pair of square brackets. The index is 0-based, with 0 being the first element of the array, 1 being the next element, and so on. You can use negative offsets to access elements starting from the end of the array. For example, -1 is the last element in the array, -2 is the second to last element, and so on.

### JSON key names and path compatibility

By definition, a JSON key can be any valid JSON string. Paths, on the other hand, are traditionally based on JavaScript's (and Java's) variable naming conventions.

Although JSON can store objects that contain arbitrary key names, you can only use a legacy path to access these keys if they conform to these naming syntax rules:

1.  Names must begin with a letter, a dollar sign (`$`), or an underscore (`_`) character
2.  Names can contain letters, digits, dollar signs, and underscores
3.  Names are case-sensitive

## Time complexity of path evaluation

The time complexity of searching (navigating to) an element in the path is calculated from:

1. Child level - every level along the path adds an additional search
2. Key search - O(N)<sup>&#8224;</sup>, where N is the number of keys in the parent object
3. Array search - O(1)

This means that the overall time complexity of searching a path is _O(N*M)_, where N is the depth and M is the number of parent object keys.

<sup>&#8224;</sup> While this is acceptable for objects where N is small, access can be optimized for larger objects.
