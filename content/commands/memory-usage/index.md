---
acl_categories:
- '@read'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: count
  name: count
  optional: true
  token: SAMPLES
  type: integer
arity: -3
command_flags:
- readonly
complexity: O(N) where N is the number of samples.
description: Estimates the memory usage of a key.
group: server
hidden: false
key_specs:
- RO: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: MEMORY USAGE
since: 4.0.0
summary: Estimates the memory usage of a key.
syntax_fmt: "MEMORY USAGE key [SAMPLES\_count]"
syntax_str: "[SAMPLES\_count]"
title: MEMORY USAGE
---
The `MEMORY USAGE` command reports the number of bytes that a key and its value
require to be stored in RAM.

The reported usage is the total of memory allocations for data and
administrative overheads that a key its value require.

For nested data types, the optional `SAMPLES` option can be provided, where
`count` is the number of sampled nested values. The samples are averaged to estimate the total size.
By default, this option is set to `5`. To sample the all of the nested values, use `SAMPLES 0`.

## Examples

With Redis v7.2.0 64-bit and **jemalloc**, the empty string measures as follows:

```
> SET "" ""
OK
> MEMORY USAGE ""
(integer) 56
```

These bytes are pure overhead at the moment as no actual data is stored, and are
used for maintaining the internal data structures of the server (include internal allocator fragmentation). Longer keys and
values show asymptotically linear usage.

```
> SET foo bar
OK
> MEMORY USAGE foo
(integer) 56
> SET foo2 mybar
OK
> MEMORY USAGE foo2
(integer) 64
> SET foo3 0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
OK
> MEMORY USAGE foo3
(integer) 160
```
