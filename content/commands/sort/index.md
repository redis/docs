---
acl_categories:
- '@write'
- '@set'
- '@sortedset'
- '@list'
- '@slow'
- '@dangerous'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: pattern
  key_spec_index: 1
  name: by-pattern
  optional: true
  token: BY
  type: pattern
- arguments:
  - display_text: offset
    name: offset
    type: integer
  - display_text: count
    name: count
    type: integer
  name: limit
  optional: true
  token: LIMIT
  type: block
- display_text: pattern
  key_spec_index: 1
  multiple: true
  multiple_token: true
  name: get-pattern
  optional: true
  token: GET
  type: pattern
- arguments:
  - display_text: asc
    name: asc
    token: ASC
    type: pure-token
  - display_text: desc
    name: desc
    token: DESC
    type: pure-token
  name: order
  optional: true
  type: oneof
- display_text: sorting
  name: sorting
  optional: true
  token: ALPHA
  type: pure-token
- display_text: destination
  key_spec_index: 2
  name: destination
  optional: true
  token: STORE
  type: key
arity: -2
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
- write
- denyoom
- movablekeys
complexity: O(N+M*log(M)) where N is the number of elements in the list or set to
  sort, and M the number of returned elements. When the elements are not sorted, complexity
  is O(N).
description: Sorts the elements in a list, a set, or a sorted set, optionally storing
  the result.
group: generic
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
- RO: true
  access: true
  begin_search:
    spec: {}
    type: unknown
  find_keys:
    spec: {}
    type: unknown
  notes: For the optional BY/GET keyword. It is marked 'unknown' because the key names
    derive from the content of the key we sort
- OW: true
  begin_search:
    spec: {}
    type: unknown
  find_keys:
    spec: {}
    type: unknown
  notes: For the optional STORE keyword. It is marked 'unknown' because the keyword
    can appear anywhere in the argument array
  update: true
linkTitle: SORT
since: 1.0.0
summary: Sorts the elements in a list, a set, or a sorted set, optionally storing
  the result.
syntax_fmt: "SORT key [BY\_pattern] [LIMIT\_offset count] [GET\_pattern [GET pattern\n\
  \  ...]] [ASC | DESC] [ALPHA] [STORE\_destination]"
syntax_str: "[BY\_pattern] [LIMIT\_offset count] [GET\_pattern [GET pattern ...]]\
  \ [ASC | DESC] [ALPHA] [STORE\_destination]"
title: SORT
---
Returns or stores the elements contained in the [list][tdtl], [set][tdts] or
[sorted set][tdtss] at `key`.

There is also the [`SORT_RO`]({{< relref "/commands/sort_ro" >}}) read-only variant of this command.

By default, sorting is numeric and elements are compared by their value
interpreted as double precision floating point number.
This is `SORT` in its simplest form:

[tdtl]: /develop/data-types#lists
[tdts]: /develop/data-types#set
[tdtss]: /develop/data-types#sorted-sets

```
SORT mylist
```

Assuming `mylist` is a list of numbers, this command will return the same list
with the elements sorted from small to large.
In order to sort the numbers from large to small, use the `DESC` modifier:

```
SORT mylist DESC
```

When `mylist` contains string values and you want to sort them
lexicographically, use the `ALPHA` modifier:

```
SORT mylist ALPHA
```

Redis is UTF-8 aware, assuming you correctly set the `LC_COLLATE` environment
variable.

The number of returned elements can be limited using the `LIMIT` modifier.
This modifier takes the `offset` argument, specifying the number of elements to
skip and the `count` argument, specifying the number of elements to return from
starting at `offset`.
The following example will return 10 elements of the sorted version of `mylist`,
starting at element 0 (`offset` is zero-based):

```
SORT mylist LIMIT 0 10
```

Almost all modifiers can be used together.
The following example will return the first 5 elements, lexicographically sorted
in descending order:

```
SORT mylist LIMIT 0 5 ALPHA DESC
```

## Sorting by external keys

Sometimes you want to sort elements using external keys as weights to compare
instead of comparing the actual elements in the list, set or sorted set.
Let's say the list `mylist` contains the elements `1`, `2` and `3` representing
unique IDs of objects stored in `object_1`, `object_2` and `object_3`.
When these objects have associated weights stored in `weight_1`, `weight_2` and
`weight_3`, `SORT` can be instructed to use these weights to sort `mylist` with
the following statement:

```
SORT mylist BY weight_*
```

The `BY` option takes a pattern (equal to `weight_*` in this example) that is
used to generate the keys that are used for sorting.
These key names are obtained substituting the first occurrence of `*` with the
actual value of the element in the list (`1`, `2` and `3` in this example).

## Skip sorting the elements

The `BY` option can also take a non-existent key, which causes `SORT` to skip
the sorting operation.
This is useful if you want to retrieve external keys (see the `GET` option
below) without the overhead of sorting.

```
SORT mylist BY nosort
```

## Retrieving external keys

Our previous example returns just the sorted IDs.
In some cases, it is more useful to get the actual objects instead of their IDs
(`object_1`, `object_2` and `object_3`).
Retrieving external keys based on the elements in a list, set or sorted set can
be done with the following command:

```
SORT mylist BY weight_* GET object_*
```

The `GET` option can be used multiple times in order to get more keys for every
element of the original list, set or sorted set.

It is also possible to `GET` the element itself using the special pattern `#`:

```
SORT mylist BY weight_* GET object_* GET #
```

## Restrictions for using external keys

Before 7.4 RC1, when enabling `Redis cluster-mode` there is no way to guarantee the existence of the external keys on the node which the command is processed on. In this case, any use of [`GET`]({{< relref "/commands/get" >}}) or `BY` which reference external key pattern will cause the command to fail with an error.

Starting from 7.4 RC1, pattern with hash tag can be mapped to a slot, and so in `Redis cluster-mode`, the use of `BY` or [`GET`]({{< relref "/commands/get" >}}) is allowed when pattern contains hash tag and implies a specific slot which the key is also in, which means any key matching this pattern must be in the same slot as the key, and therefore in the same node. For example, in cluster mode, `{mylist}weight_*` is acceptable as a pattern when sorting `mylist`, while pattern `{abc}weight_*` will be denied, causing the command to fail with an error.

To use pattern with hash tag, see [Hash tags]({{< baseurl >}}/operate/oss_and_stack/reference/cluster-spec#hash-tags) for more information.

Starting from Redis 7.0, any use of [`GET`]({{< relref "/commands/get" >}}) or `BY` which reference external key pattern will only be allowed in case the current user running the command has full key read permissions.
Full key read permissions can be set for the user by, for example, specifying `'%R~*'` or `'~*` with the relevant command access rules.
You can check the [`ACL SETUSER`]({{< relref "/commands/acl-setuser" >}}) command manual for more information on setting ACL access rules.
If full key read permissions aren't set, the command will fail with an error.

## Storing the result of a SORT operation

By default, `SORT` returns the sorted elements to the client.
With the `STORE` option, the result will be stored as a list at the specified
key instead of being returned to the client.

```
SORT mylist BY weight_* STORE resultkey
```

An interesting pattern using `SORT ... STORE` consists in associating an
[`EXPIRE`]({{< relref "/commands/expire" >}}) timeout to the resulting key so that in applications where the result
of a `SORT` operation can be cached for some time.
Other clients will use the cached list instead of calling `SORT` for every
request.
When the key will timeout, an updated version of the cache can be created by
calling `SORT ... STORE` again.

Note that for correctly implementing this pattern it is important to avoid
multiple clients rebuilding the cache at the same time.
Some kind of locking is needed here (for instance using [`SETNX`]({{< relref "/commands/setnx" >}})).

## Using hashes in `BY` and `GET`

It is possible to use `BY` and `GET` options against hash fields with the
following syntax:

```
SORT mylist BY weight_*->fieldname GET object_*->fieldname
```

The string `->` is used to separate the key name from the hash field name.
The key is substituted as documented above, and the hash stored at the resulting
key is accessed to retrieve the specified hash field.
