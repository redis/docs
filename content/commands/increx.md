---
acl_categories:
- '@string'
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
- name: lowerbound
  optional: true
  token: LBOUND
  type: double
- name: upperbound
  optional: true
  token: UBOUND
  type: double
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
syntax_fmt: "INCREX key [BYFLOAT\_float | BYINT\_integer] [LBOUND\_lowerbound] [UBOUND\_upperbound]\n \
  \ [EX\_seconds | PX\_milliseconds | EXAT\_unix-time-seconds | PXAT\_unix-time-milliseconds | PERSIST]\n \
  \ [ENX]"
title: INCREX
---
Increments the numeric value stored at `key` by the specified amount, with optional bounds clamping and expiration control, in a single atomic operation.
If the key does not exist, it is set to `0` before performing the operation.
An error is returned if the key contains a value of the wrong type or a string that cannot be interpreted as a number.

Unlike [`INCR`]({{< relref "/commands/incr" >}}) and [`INCRBY`]({{< relref "/commands/incrby" >}}), `INCREX` always returns an array of two elements: the new value of the key after the increment, and the actual increment applied. When bounds clamping is in effect, the actual increment may be less than the requested increment.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key to increment.

</details>

## Optional arguments

<details open><summary><code>BYFLOAT float | BYINT integer</code></summary>

Specifies the increment amount and type:

* `BYFLOAT float`: increment the value by the given floating-point number. The key's value must be parseable as a double-precision floating-point number. Results that would produce NaN or Infinity are rejected.
* `BYINT integer`: increment the value by the given integer. The integer may be negative to decrement the value. Integer overflow is clamped to the 64-bit signed integer minimum or maximum rather than producing an error.

If neither `BYFLOAT` nor `BYINT` is specified, the key is incremented by `1` in integer mode. `BYFLOAT` and `BYINT` are mutually exclusive.

</details>

<details open><summary><code>LBOUND lowerbound</code></summary>

Sets a lower bound for the resulting value. If the computed result falls below `lowerbound`, the stored value is clamped to `lowerbound` and the actual increment in the reply reflects only the change that was applied. `LBOUND` must be less than or equal to `UBOUND` when both are specified.

</details>

<details open><summary><code>UBOUND upperbound</code></summary>

Sets an upper bound for the resulting value. If the computed result exceeds `upperbound`, the stored value is clamped to `upperbound` and the actual increment in the reply reflects only the change that was applied. `UBOUND` must be greater than or equal to `LBOUND` when both are specified.

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

Clamp the result within bounds using `UBOUND` and `LBOUND`. The second array element reflects the actual increment applied after clamping:

{{% redis-cli %}}
SET mykey 50
INCREX mykey BYINT 100 UBOUND 80
SET mykey 10
INCREX mykey BYINT -100 LBOUND 0
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

## Pattern: Rate limiter

A common rate-limiting pattern requires atomically incrementing a counter and setting its expiration. With plain [`INCR`]({{< relref "/commands/incr" >}}) and [`EXPIRE`]({{< relref "/commands/expire" >}}), this typically requires a Lua script to be atomic:

```lua
local current = redis.call('INCR', KEYS[1])
if current > tonumber(ARGV[1]) then
    return 0  -- rejected
end
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end
return 1  -- allowed
```

`INCREX` collapses this into a single native command. `UBOUND` enforces the rate cap, and `ENX` sets the TTL only when the counter first starts — matching the `if current == 1 then EXPIRE` logic. When the counter has already reached the cap, `actual_increment` is `0`, giving the caller immediate feedback without extra reads:

```python
new_val, actual_incr = redis.execute_command(
    "INCREX", f"ratelimit:{user_id}", "BYINT", 1, "UBOUND", 100, "EX", 60, "ENX"
)
if actual_incr == 0:
    reject_request()  # rate limit exceeded
```

## Pattern: Token bucket

Refill a token bucket up to a capacity ceiling and auto-expire inactive keys in a single command:

{{% redis-cli %}}
INCREX tokens:user123 BYINT 10 UBOUND 100 EX 3600 ENX
{{% /redis-cli %}}

Tokens cannot exceed 100, and the key expires after one hour of inactivity. `ENX` ensures the expiration window is only started fresh when the key has no existing TTL — subsequent refills within the same window leave the expiration unchanged.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a two-element array where the first element is the new value of the key after the increment and the second element is the actual increment applied. Both elements are [Integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) in `BYINT` or default mode, or [Bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) in `BYFLOAT` mode.

-tab-sep-

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a two-element array where the first element is the new value of the key after the increment and the second element is the actual increment applied. Both elements are [Integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) in `BYINT` or default mode, or [Double replies]({{< relref "/develop/reference/protocol-spec#doubles" >}}) in `BYFLOAT` mode.

{{< /multitabs >}}
