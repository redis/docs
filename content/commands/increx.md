---
acl_categories:
- '@fast'
- '@string'
- '@write'
arguments:
- key_spec_index: 0
  name: key
  type: key
- arguments:
  - name: float
    token: BYFLOAT
    type: double
  - name: integer
    token: BYINT
    type: integer
  name: increment
  optional: true
  type: oneof
- arguments:
  - name: fail
    token: FAIL
    type: pure-token
  - name: sat
    token: SAT
    type: pure-token
  - name: reject
    token: REJECT
    type: pure-token
  name: overflow-block
  optional: true
  summary: Out-of-bounds policy; defaults to FAIL. Missing LBOUND/UBOUND default to
    the type limits (LLONG_MIN/LLONG_MAX for BYINT, -LDBL_MAX/LDBL_MAX for BYFLOAT).
  token: OVERFLOW
  type: oneof
- name: lowerbound
  optional: true
  summary: Integer when used with BYINT, floating-point when used with BYFLOAT.
  token: LBOUND
  type: string
- name: upperbound
  optional: true
  summary: Integer when used with BYINT, floating-point when used with BYFLOAT.
  token: UBOUND
  type: string
- arguments:
  - name: seconds
    token: EX
    type: integer
  - name: milliseconds
    token: PX
    type: integer
  - name: unix-time-seconds
    token: EXAT
    type: unix-time
  - name: unix-time-milliseconds
    token: PXAT
    type: unix-time
  - name: persist
    token: PERSIST
    type: pure-token
  name: expiration
  optional: true
  type: oneof
- name: enx
  optional: true
  summary: Only set the expiration if the key currently has no TTL. Requires one of
    EX/PX/EXAT/PXAT; cannot be combined with PERSIST.
  token: ENX
  type: pure-token
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
- fast
complexity: O(1)
description: Increments the numeric value of a key by a number and sets its expiration
  time. Uses 0 as initial value if the key doesn't exist.
group: string
hidden: false
key_specs:
- begin_search:
    index:
      pos: 1
  find_keys:
    range:
      lastkey: 0
      limit: 0
      step: 1
  flags:
  - rw
  - access
  - update
linkTitle: INCREX
railroad_diagram: /images/railroad/increx.svg
reply_schema:
  items:
  - description: the value of the key after the increment
    type: number
  - description: the actual increment
    type: number
  maxItems: 2
  minItems: 2
  type: array
since: 8.8.0
summary: Increments the numeric value of a key by a number and sets its expiration
  time. Uses 0 as initial value if the key doesn't exist.
syntax_fmt: "INCREX key [BYFLOAT\_float | BYINT\_integer]\n\
  \ [LBOUND\_lowerbound] [UBOUND\_upperbound] [OVERFLOW\_<FAIL | SAT | REJECT>]\n\
  \ [EX\_seconds | PX\_milliseconds| EXAT\_unix-time-seconds | PXAT\_unix-time-milliseconds | PERSIST]\n\
  \ [ENX]"
title: INCREX
---
Increments or decrements the numeric value stored at `key` by the specified amount, with optional upper/lower bounds and expiration control, in a single atomic operation.
If the key does not exist, it is set to `0` before performing the operation.
An error is returned if the key contains a value of the wrong type or a string that cannot be interpreted as a number.

Unlike [`INCR`]({{< relref "/commands/incr" >}}) and [`INCRBY`]({{< relref "/commands/incrby" >}}), `INCREX` always returns an array of two elements: the new value of the key after the increment, and the increment that was actually applied. The `OVERFLOW` option controls what happens when the computed result would fall outside an explicit `LBOUND`/`UBOUND` or the type limits: the command can fail with an error (the default), saturate the result to the bound, or silently skip the operation.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key to increment.

</details>

## Optional arguments

<details open><summary><code>BYFLOAT float | BYINT integer</code></summary>

Specifies the increment amount and type:

* `BYFLOAT increment`: increment the value by the given long-double float. The key's existing value may be either an integer or a float, since integers can be promoted to floats losslessly. Results that would produce NaN or Infinity are rejected.
* `BYINT increment`: increment the value by the given 64-bit signed integer. The increment may be negative to decrement the value. `BYINT` requires the key's existing value to be integer-typed; a stored float such as `"1.5"` cannot be parsed back as an integer. This is consistent with [`INCR`]({{< relref "/commands/incr" >}})/[`INCRBY`]({{< relref "/commands/incrby" >}}) (integer-only) and [`INCRBYFLOAT`]({{< relref "/commands/incrbyfloat" >}}) (accepts both). Type-limit overflow is governed by the `OVERFLOW` option.

If neither `BYFLOAT` nor `BYINT` is specified, the key is incremented by `1` in integer mode. `BYFLOAT` and `BYINT` are mutually exclusive.

</details>

<details open><summary><code>LBOUND lowerbound</code></summary>

Sets a lower bound for the resulting value. If the computed result would fall below `lowerbound`, the behavior is determined by the `OVERFLOW` option. Defaults to `LLONG_MIN` in integer mode or `-LDBL_MAX` in `BYFLOAT` mode. `LBOUND` must be less than or equal to `UBOUND` when both are specified.

</details>

<details open><summary><code>UBOUND upperbound</code></summary>

Sets an upper bound for the resulting value. If the computed result would exceed `upperbound`, the behavior is determined by the `OVERFLOW` option. Defaults to `LLONG_MAX` in integer mode or `LDBL_MAX` in `BYFLOAT` mode. `UBOUND` must be greater than or equal to `LBOUND` when both are specified.

</details>

<details open><summary><code>OVERFLOW FAIL | SAT | REJECT</code></summary>

Sets the policy for handling out-of-bounds results. A bound violation includes both exceeding an explicit `LBOUND`/`UBOUND` and overflowing the type limits when no explicit bound is given.

* `FAIL` (default): if the computed result would violate a bound, the command returns an error and the key is left unchanged. This matches the existing semantics of [`INCRBY`]({{< relref "/commands/incrby" >}}) and [`INCRBYFLOAT`]({{< relref "/commands/incrbyfloat" >}}) on overflow.
* `SAT`: the result is silently capped at `UBOUND` or floored at `LBOUND` (or saturated to the type limits when no explicit bound is given). The second element of the reply reflects the saturated delta. An error is returned if the delta cannot be represented as a 64-bit signed integer in integer mode, or would produce Infinity in `BYFLOAT` mode. If the result is saturated, any expiration option is still applied as specified.
* `REJECT`: the operation is silently skipped. The key value and its TTL are left unchanged, no keyspace notification is fired, and nothing is replicated. The reply is `[current_value, 0]`, allowing the caller to detect the rejection without handling an error. Any expiration option is ignored on the rejected branch.

</details>

<details open><summary><code>expiration flags</code></summary>

The `INCREX` command supports a set of options that modify its expiration behavior:

* `EX seconds`: set the specified expiration time in seconds (a positive integer).
* `PX milliseconds`: set the specified expiration time in milliseconds (a positive integer).
* `EXAT unix-time-seconds`: set the specified Unix time in seconds (a positive integer) at which the key will expire.
* `PXAT unix-time-milliseconds`: set the specified Unix time in milliseconds (a positive integer) at which the key will expire.
* `PERSIST`: remove the expiration associated with the key.

When no expiration option is given, the key's existing TTL (if any) is preserved.

</details>

<details open><summary><code>ENX</code></summary>

Only sets the expiration if the key currently has no TTL. If the key already has an expiration, the increment is still applied but the TTL is left unchanged. `ENX` must be combined with `EX`, `PX`, `EXAT`, or `PXAT` and is incompatible with `PERSIST`.

</details>

## Examples

Default increment (by 1), starting from 0 if the key does not exist:

{{% redis-cli %}}
DEL mykey
INCREX mykey
INCREX mykey
{{% /redis-cli %}}

Increment by a specific integer using `BYINT`, including a negative increment to decrement:

{{% redis-cli %}}
SET mykey 100
INCREX mykey BYINT 5
INCREX mykey BYINT -10
{{% /redis-cli %}}

Increment by a floating-point number using `BYFLOAT`:

{{% redis-cli %}}
SET mykey 1.5
INCREX mykey BYFLOAT 0.25
{{% /redis-cli %}}

Set an expiration on every increment with `EX`:

{{% redis-cli %}}
DEL mykey
INCREX mykey BYINT 1 EX 100
TTL mykey
{{% /redis-cli %}}

Use `ENX` to set an expiration only when the key has no existing TTL. The increment is always applied regardless:

{{% redis-cli %}}
SET mykey 10
INCREX mykey BYINT 1 EX 100 ENX
TTL mykey
SET mykey 10 EX 500
INCREX mykey BYINT 1 EX 10 ENX
TTL mykey
{{% /redis-cli %}}

Use `PERSIST` to remove the key's expiration while incrementing:

{{% redis-cli %}}
SET mykey 5 EX 1000
TTL mykey
INCREX mykey BYINT 1 PERSIST
TTL mykey
{{% /redis-cli %}}

Compare the three `OVERFLOW` policies when the result would exceed `UBOUND`. The default `FAIL` returns an error, `SAT` caps the result at the bound, and `REJECT` leaves the key untouched and reports a zero delta:

{{% redis-cli %}}
SET mykey 99
INCREX mykey BYINT 5 UBOUND 100
SET mykey 99
INCREX mykey BYINT 5 UBOUND 100 OVERFLOW SAT
SET mykey 99
INCREX mykey BYINT 5 UBOUND 100 OVERFLOW REJECT
{{% /redis-cli %}}

## Pattern: window counter rate limiter

A common rate-limiting pattern requires atomically incrementing a counter and setting its expiration. With plain [`INCR`]({{< relref "/commands/incr" >}}) and [`EXPIRE`]({{< relref "/commands/expire" >}}), this typically requires a Lua script to be atomic.

`INCREX` requires a single native command. `UBOUND` enforces the rate cap, `OVERFLOW REJECT` silently skips the operation once the cap is reached, and `ENX` ensures that a new window with the correct duration is created if the previous one has expired; if a window already exists, it won't be extended. When the counter has already reached the cap, `actual_increment` is `0`, giving the caller immediate feedback without extra reads or error handling:

```python
new_val, actual_incr = redis.execute_command(
    "INCREX", f"ratelimit:{user_id}",
    "BYINT", 1, "UBOUND", 100, "OVERFLOW", "REJECT",
    "EX", 60, "ENX",
)
if actual_incr == 0:
    reject_request()  # rate limit exceeded
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a two-element array:

1. **New value** — the value of the key after the increment, or the unchanged current value under `OVERFLOW REJECT`.
2. **Actual increment** — the increment that was actually applied. May differ from the requested increment when `OVERFLOW SAT` saturates the result to a bound, and is always `0` when `OVERFLOW REJECT` skipped the operation.

Both elements are [Integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) in integer mode (default or `BYINT`), or [Bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the float values in `BYFLOAT` mode.

-tab-sep-

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a two-element array:

1. **New value** — the value of the key after the increment, or the unchanged current value under `OVERFLOW REJECT`.
2. **Actual increment** — the increment that was actually applied. May differ from the requested increment when `OVERFLOW SAT` saturates the result to a bound, and is always `0` when `OVERFLOW REJECT` skipped the operation.

Both elements are [Integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) in integer mode (default or `BYINT`), or [Double replies]({{< relref "/develop/reference/protocol-spec#doubles" >}}) in `BYFLOAT` mode.

{{< /multitabs >}}
