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
description: Configure how Redis JSON write commands handle missing paths
linkTitle: Configuration
title: Configuration parameters
weight: 8
---

Redis JSON has one configuration parameter, `json-auto-create-deep-paths`, added in Redis 8.12. It's a load-time parameter: you set it when Redis starts, and you can't change it with [`CONFIG SET`](/content/commands/config-set.md).

## Set configuration parameters

Set the parameter in one of these ways:

- Add it to your `redis.conf` file:

  ```
  json-auto-create-deep-paths yes
  ```

- Pass it on the command line when you start `redis-server`:

  ```
  redis-server --json-auto-create-deep-paths yes
  ```

Use [`CONFIG GET`](/content/commands/config-get.md) to read the current value:

```
redis> CONFIG GET json-auto-create-deep-paths
1) "json-auto-create-deep-paths"
2) "yes"
```

See also [Redis configuration](/content/operate/oss_and_stack/management/config.md).

## Redis JSON configuration parameters

| Parameter name | Run-time | Redis<br />Software | Redis<br />Cloud |
| :------- | :------- | :------- | :------- |
| [json-auto-create-deep-paths](#json-auto-create-deep-paths) | :white_large_square: |||

### json-auto-create-deep-paths

Added in v8.12.0.

Lets JSON write commands create missing objects along a path, instead of returning nil or an error. See [Auto-create missing paths](#auto-create-missing-paths).

Type: boolean (`yes` or `no`)

Default: `no`

> [!WARNING]
> Set the same value on a primary and all of its replicas. Redis replicates JSON write commands as they were sent, so a replica with a different value silently ends up with different data from its primary.
> Use the same value when you replay or restore an append-only file (AOF), too. Commands recorded with auto-creation enabled might fail to recreate their data when it's disabled.

## Auto-create missing paths

When `json-auto-create-deep-paths` is set to `yes`, a write command creates every missing object in its path and then writes at the end of the path. When it's set to `no`, the command writes only if everything except the last key in the path already exists.

For example, the following document has no `b` key. With auto-creation disabled, `JSON.SET doc $.a.b.c 5` returns `(nil)`. With it enabled, the command creates `b`:

```
redis> JSON.SET doc $ '{"a":{"keep":1}}'
OK
redis> JSON.SET doc $.a.b.c 5
OK
redis> JSON.GET doc $
"[{\"a\":{\"keep\":1,\"b\":{\"c\":5}}}]"
```

Auto-creation applies to [`JSON.SET`](/content/commands/json.set.md), [`JSON.MSET`](/content/commands/json.mset.md), [`JSON.MERGE`](/content/commands/json.merge.md), [`JSON.ARRAPPEND`](/content/commands/json.arrappend.md), [`JSON.ARRINSERT`](/content/commands/json.arrinsert.md), [`JSON.NUMINCRBY`](/content/commands/json.numincrby.md), and [`JSON.STRAPPEND`](/content/commands/json.strappend.md). It works with both JSONPath and legacy paths.

### Set and merge

`JSON.SET`, `JSON.MSET`, and `JSON.MERGE` write their value at the end of the created path. These commands also create a key that doesn't exist, building the document from the path:

```
redis> JSON.SET newdoc $.a.b.c 5
OK
redis> JSON.GET newdoc $
"[{\"a\":{\"b\":{\"c\":5}}}]"
redis> JSON.MSET newdoc2 $.a.b.c 5 newdoc2 $.d.e.f 6
OK
redis> JSON.GET newdoc2 $
"[{\"a\":{\"b\":{\"c\":5}},\"d\":{\"e\":{\"f\":6}}}]"
```

With `NX`, `JSON.SET` creates a missing path but doesn't overwrite an existing value. With `XX`, it never creates anything.

### Append, insert, and increment

`JSON.ARRAPPEND`, `JSON.ARRINSERT`, `JSON.NUMINCRBY`, and `JSON.STRAPPEND` create the missing path, give the new location a starting value, and then run as usual:

| Command | Starting value |
| :------ | :------------- |
| `JSON.ARRAPPEND` | `[]` |
| `JSON.ARRINSERT` | `[]` |
| `JSON.NUMINCRBY` | `0` |
| `JSON.STRAPPEND` | `""` |

The reply is the same as if the starting value had already been there:

```
redis> JSON.SET doc $ '{}'
OK
redis> JSON.ARRAPPEND doc $.a.tags '"red"' '"blue"'
1) (integer) 2
redis> JSON.NUMINCRBY doc $.stats.views 1
"[1]"
redis> JSON.STRAPPEND doc $.d.name '"hi"'
1) (integer) 2
redis> JSON.GET doc $
"[{\"a\":{\"tags\":[\"red\",\"blue\"]},\"stats\":{\"views\":1},\"d\":{\"name\":\"hi\"}}]"
```

These commands follow some extra rules:

- They don't create keys. On a key that doesn't exist, they return `ERR could not perform this operation on a key that doesn't exist`.
- `JSON.ARRINSERT` creates a path only when `index` is `0`, the only valid index in an empty array. With any other index, it creates nothing and returns an empty array.
- A starting value never replaces an existing value. If the path matches a value of the wrong type, the command replies as it does without auto-creation.
- The command checks its value before it creates anything. If `JSON.NUMINCRBY` gets a value that isn't a number, or `JSON.STRAPPEND` gets one that isn't a JSON string, the command returns an error and leaves the document unchanged.

[`JSON.NUMMULTBY`](/content/commands/json.nummultby.md) and [`JSON.NUMPOWBY`](/content/commands/json.numpowby.md) never create paths.

### Paths that match several locations

When a path matches several locations, such as `$['a','b'].c`, `$.*.n`, or `$..n`, the command creates the path where it's missing and updates it where it exists. Matches that aren't objects are skipped:

```
redis> JSON.SET doc $ '{"a":{},"b":{"c":1},"s":"str"}'
OK
redis> JSON.SET doc $.*.c 7
OK
redis> JSON.GET doc $
"[{\"a\":{\"c\":7},\"b\":{\"c\":7},\"s\":\"str\"}]"
```

### What isn't created

- **Array elements.** Only object keys are created. `JSON.SET doc '$.a.b[0]' 7` returns `ERR array index out of range`.
- **New keys from complex paths.** Creating a key from a path that contains an array index or recursive descent, such as `$.a[0].b` or `$..a`, still returns `ERR new objects must be created at the root`.
- **Paths through non-objects.** If a value that isn't an object is in the way, nothing is created there. For example, on `{"a":3}`, `JSON.SET doc $.a.b.c 5` returns `(nil)`.
- **Paths beyond the depth limit.** If the created path would exceed the [nesting depth limit](/content/develop/data-types/json/_index.md#limitation), the command returns `ERR recursion limit exceeded` and creates nothing. On an existing key, `JSON.MSET` returns nil instead.
