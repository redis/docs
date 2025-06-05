---
acl_categories:
- '@write'
- '@string'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: value
  name: value
  type: string
arity: 3
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
- fast
complexity: O(1). The amortized time complexity is O(1) assuming the appended value
  is small and the already present value is of any size, since the dynamic string
  library used by Redis will double the free space available on every reallocation.
description: Appends a string to the value of a key. Creates the key if it doesn't
  exist.
group: string
hidden: false
key_specs:
- RW: true
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
  insert: true
linkTitle: APPEND
since: 2.0.0
summary: Appends a string to the value of a key. Creates the key if it doesn't exist.
syntax_fmt: APPEND key value
syntax_str: value
title: APPEND
---
If `key` already exists and is a string, this command appends the `value` at the
end of the string.
If `key` does not exist it is created and set as an empty string, so `APPEND`
will be similar to [`SET`]({{< relref "/commands/set" >}}) in this special case.

## Examples

{{% redis-cli %}}
EXISTS mykey
APPEND mykey "Hello"
APPEND mykey " World"
GET mykey
{{% /redis-cli %}}


## Pattern: Time series

The `APPEND` command can be used to create a very compact representation of a
list of fixed-size samples, usually referred as _time series_.
Every time a new sample arrives we can store it using the command

```
APPEND timeseries "fixed-size sample"
```

Accessing individual elements in the time series is not hard:

* [`STRLEN`]({{< relref "/commands/strlen" >}}) can be used in order to obtain the number of samples.
* [`GETRANGE`]({{< relref "/commands/getrange" >}}) allows for random access of elements.
  If our time series have associated time information we can easily implement
  a binary search to get range combining [`GETRANGE`]({{< relref "/commands/getrange" >}}) with the Lua scripting
  engine available in Redis 2.6.
* [`SETRANGE`]({{< relref "/commands/setrange" >}}) can be used to overwrite an existing time series.

The limitation of this pattern is that we are forced into an append-only mode
of operation, there is no way to cut the time series to a given size easily
because Redis currently lacks a command able to trim string objects.
However the space efficiency of time series stored in this way is remarkable.

Hint: it is possible to switch to a different key based on the current Unix
time, in this way it is possible to have just a relatively small amount of
samples per key, to avoid dealing with very big keys, and to make this pattern
more friendly to be distributed across many Redis instances.

An example sampling the temperature of a sensor using fixed-size strings (using
a binary format is better in real implementations).

{{% redis-cli %}}
APPEND ts "0043"
APPEND ts "0035"
GETRANGE ts 0 3
GETRANGE ts 4 7
{{% /redis-cli %}}

## Return information

{{< multitabs id="append-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the string after the append operation.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the length of the string after the append operation.

{{< /multitabs >}}
