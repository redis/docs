---
acl_categories:
- '@string'
- '@write'
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: max-burst
  type: integer
- name: requests-per-period
  type: integer
- name: period
  type: double
- name: count
  optional: true
  token: NUM_REQUESTS
  type: integer
arity: -5
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
description: Rate limit via GCRA (Generic Cell Rate Algorithm).
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
linkTitle: GCRA
reply_schema:
  description: Rate limiting result
  items:
  - description: 'Limited: 0 if allowed, 1 if rate limited'
    type: integer
  - description: 'Max request number: always equal to max_burst+1'
    type: integer
  - description: Number of requests available immediately
    type: integer
  - description: 'Retry after: seconds after which caller should retry. Always -1
      if not limited'
    type: integer
  - description: 'Full burst after: seconds after which a full burst will be allowed'
    type: integer
  maxItems: 5
  minItems: 5
  type: array
since: 8.8.0
summary: Rate limit via GCRA (Generic Cell Rate Algorithm).
syntax_fmt: "GCRA key max-burst requests-per-period period [NUM_REQUESTS\_count]"
title: GCRA
---

Performs rate limiting using the [Generic Cell Rate Algorithm (GCRA)](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm).

GCRA is a popular rate limiting algorithm known for its simplicity and speed. It allows a sustained rate of `requests_per_period` requests per `period` seconds, with a minimum spacing (emission interval) of `period / requests_per_period` seconds between each request. The `max_burst` parameter allows for occasional spikes by granting up to `max_burst` additional requests to be consumed at once beyond the sustained rate.

The implementation is based on the popular [redis-cell](https://github.com/brandur/redis-cell) module with small changes in the API. Unlike redis-cell and most other implementations where `period` is given as an integer number of seconds, this command accepts `period` as a floating-point number for greater flexibility. Internally, time periods are calculated with microsecond granularity.

See the [rate limiting docs]({{< relref "/develop/using-commands/rate-limiting" >}}) for more information.

## Required arguments

<details open><summary><code>key</code></summary>

is the key associated with a specific rate limiting case. The key stores the internal state needed for the GCRA algorithm to track request timing.

</details>

<details open><summary><code>max-burst</code></summary>

is the maximum number of tokens allowed as a burst, in addition to the sustained rate. This controls how many requests can be made at once before rate limiting kicks in. The maximum number of requests that can be made immediately is `max_burst + 1`. Minimum value: `0`.

</details>

<details open><summary><code>requests-per-period</code></summary>

is the number of requests allowed per `period` at a sustained rate. This defines the steady-state throughput of the rate limiter. Minimum value: `1`.

</details>

<details open><summary><code>period</code></summary>

is the time period in seconds, specified as a floating-point number, used for calculating the sustained rate. The emission interval (minimum spacing between requests) is calculated as `period / requests_per_period`. Minimum value: `1.0`.

</details>

## Optional arguments

<details open><summary><code>NUM_REQUESTS count</code></summary>

is the cost (or weight) of this rate-limiting request. A higher cost drains the allowance faster. This is useful when different operations have different costs. Default value: `1`.

</details>

## Examples

Rate limit an API endpoint to 10 requests per 60 seconds with a burst of 5:

```
127.0.0.1:6379> GCRA api:user:123 5 10 60
1) (integer) 0
2) (integer) 6
3) (integer) 5
4) (integer) -1
5) (integer) 30
```

The response shows: the request is not rate limited (`0`), the maximum number of requests is `6` (`max_burst + 1`), `5` requests are available immediately, retry-after is `-1` (not limited), and a full burst will be available after `30` seconds.

After exhausting the burst allowance:

```
127.0.0.1:6379> GCRA api:user:123 5 10 60
1) (integer) 1
2) (integer) 6
3) (integer) 0
4) (integer) 6
5) (integer) 36
```

This time the request is rate limited (`1`), `0` requests are available, and the caller should retry after `6` seconds.

Using the `NUM_REQUESTS` option to apply a higher cost:

```
127.0.0.1:6379> GCRA api:user:123 5 10 60 NUM_REQUESTS 3
1) (integer) 0
2) (integer) 6
3) (integer) 2
4) (integer) -1
5) (integer) 24
```

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- Returns an [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with exactly 5 elements:
    1. **limited** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `0` if the request is allowed, `1` if the request is rate limited.
    1. **max-req-num** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the maximum number of requests allowed. Always equal to `max_burst + 1`.
    1. **num-avail-req** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of requests available to be made immediately.
    1. **retry-after** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of seconds after which the caller should retry. Always returns `-1` if the request is not limited.
    1. **full-burst-after** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of seconds after which a full burst will be available again.
- A [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) for the following cases: wrong number of arguments,
incorrect value for `max_burst`, `tokens_per_period` <= 1, `period` <= 1, or `tokens` <= 1.

-tab-sep-

Returns an [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with exactly 5 elements:

- Returns an [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with exactly 5 elements:
    1. **limited** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `0` if the request is allowed, `1` if the request is rate limited.
    1. **max-req-num** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the maximum number of requests allowed. Always equal to `max_burst + 1`.
    1. **num-avail-req** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of requests available to be made immediately.
    1. **retry-after** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of seconds after which the caller should retry. Always returns `-1` if the request is not limited.
    1. **full-burst-after** - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of seconds after which a full burst will be available again.
- A [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) for the following cases: wrong number of arguments,
incorrect value for `max_burst`, `tokens_per_period` <= 1, `period` <= 1, or `tokens` <= 1.

{{< /multitabs >}}

