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
- name: tokens-per-period
  type: integer
- name: period
  type: double
- name: count
  optional: true
  token: TOKENS
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
since: 8.8.0
summary: Rate limit via GCRA (Generic Cell Rate Algorithm).
syntax_fmt: "GCRA key max-burst tokens-per-period period [TOKENS\_count]"
title: GCRA
---

Performs rate limiting using the [Generic Cell Rate Algorithm (GCRA)](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm).

GCRA is a popular rate limiting algorithm known for its simplicity and speed. Each request (a single call to this command) consumes a number of tokens; the default cost is one token per request. The sustained rate is `tokens-per-period` tokens per `period` seconds, with a minimum spacing (emission interval) of `period / tokens-per-period` seconds between requests. The `max_burst` parameter allows for occasional spikes by granting up to `max_burst` additional tokens that can be consumed at once beyond the sustained rate.

The implementation is based on the popular [redis-cell](https://github.com/brandur/redis-cell) module with small changes in the API. Unlike redis-cell and most other implementations where `period` is given as an integer number of seconds, this command accepts `period` as a floating-point number for greater flexibility. Internally, time periods are calculated with microsecond granularity.

The `GCRA` command is used either to establish a new rate limiter (if the key doesn't exist) or use an existing one (if the key exists).
All the parameters need to be repeated on each call, and clients don't need to validate that the key exists before using a rate limiter.
Under normal usage, `max-burst`, `tokens-per-period`, and `period` should not change between calls, though this command supports such changes.

In a typical deployment, the application server calls `GCRA` on each end user's request. Based on the response, the application server either fulfills the end user's request or rejects it.

See the [rate limiting docs]({{< relref "/develop/using-commands/rate-limiting" >}}) for more information.

## Required arguments

<details open><summary><code>key</code></summary>

is the key associated with a specific rate limiting case. The key stores the internal state needed for the GCRA algorithm to track request timing.

</details>

<details open><summary><code>max-burst</code></summary>

The maximum number of additional tokens allowed as a burst, above the sustained rate. This controls how many tokens can be consumed at once before rate limiting starts. The total token capacity is `max_burst + 1`. Minimum value: `0`.

</details>

<details open><summary><code>tokens-per-period</code></summary>

The number of tokens replenished per `period`, which defines the sustained rate of the rate limiter. Minimum value: `1`.

</details>

<details open><summary><code>period</code></summary>

The time period in seconds, specified as a floating-point number, over which `tokens-per-period` tokens are replenished. The emission interval (minimum spacing between single-token requests) is `period / tokens-per-period`. Minimum value: `1.0`.

</details>

## Optional arguments

<details open><summary><code>TOKENS count</code></summary>

The number of tokens consumed by this request. A higher value drains the token allowance faster, which is useful when different operations have different costs. Default value: `1`.

</details>

## Examples

Rate limit an API endpoint to 10 tokens per 60 seconds with a burst of 5:

```
127.0.0.1:6379> GCRA api:user:123 5 10 60
1) (integer) 0
2) (integer) 6
3) (integer) 5
4) (integer) -1
5) (integer) 30
```

The response shows: the request is allowed (`0`), the total token capacity is `6` (`max_burst + 1`), `5` tokens are available immediately, retry-after is `-1` (the request was allowed; no need to retry), and the full token allowance will be restored after `30` seconds.

After exhausting the token allowance:

```
127.0.0.1:6379> GCRA api:user:123 5 10 60
1) (integer) 1
2) (integer) 6
3) (integer) 0
4) (integer) 6
5) (integer) 36
```

This time the request is denied (`1`), `0` tokens remain, and the application server should retry after `6` seconds.

Using the `TOKENS` option to assign a higher cost to a request:

```
127.0.0.1:6379> GCRA api:user:123 5 10 60 TOKENS 3
1) (integer) 0
2) (integer) 6
3) (integer) 2
4) (integer) -1
5) (integer) 24
```

This request consumes 3 tokens instead of the default 1.

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- Returns an [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with exactly 5 elements:
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `0` if the request is allowed, `1` if the request is denied.
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): The maximum number of tokens that can be requested if no previous requests have been made, or if earlier requests are no longer within the relevant time window. Always equal to `max_burst` + 1 (+1 to allow requests when `max_burst` is 0).
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of remaining tokens that can be requested immediately (the remaining burst).
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of milliseconds until the caller can retry, or -1 if the request was allowed. 
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of milliseconds until the full burst will be allowed again.
- A [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) for the following cases: wrong number of arguments,
incorrect value for `max_burst`, `tokens_per_period` <= 1, `period` <= 1, or `tokens` <= 1.

-tab-sep-

One of the following:

- Returns an [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with exactly 5 elements:
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `0` if the request is allowed, `1` if the request is blocked.
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the maximum number of tokens that can be requested (if no previous requests were made, or if they were made long enough ago). Always equal to `max_burst` + 1 (+1 to allow requests when `max_burst` is 0).
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of remaining tokens that can be requested immediately (the remaining burst).
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of milliseconds until the caller can retry, or -1 if the request was allowed. 
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of milliseconds until the full burst will be allowed again.
- A [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) for the following cases: wrong number of arguments,
incorrect value for `max_burst`, `tokens_per_period` <= 1, `period` <= 1, or `tokens` <= 1.

{{< /multitabs >}}

