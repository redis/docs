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
syntax_fmt: "GCRA key max-burst tokens-per-period period [TOKENS\_count]"
title: GCRA
---

Performs rate limiting using the [Generic Cell Rate Algorithm (GCRA)](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm).

GCRA is a popular rate limiting algorithm known for its simplicity and speed. Each key request is associated with a given number of tokens; the default is one token per request. In general, GCRA allows a sustained rate of `tokens-per-period` requests per `period` seconds, with a minimum spacing (emission interval) of `period / tokens-per-period` seconds between each request. The `max_burst` parameter allows for occasional spikes by granting up to `max_burst` additional tokens to be consumed at once beyond the sustained rate.

The implementation is based on the popular [redis-cell](https://github.com/brandur/redis-cell) module with small changes in the API. Unlike redis-cell and most other implementations where `period` is given as an integer number of seconds, this command accepts `period` as a floating-point number for greater flexibility. Internally, time periods are calculated with microsecond granularity.

The `GCRA` command is used either to establish a new rate limiter (if the key doesn't exist) or use an existing one (if the key exists).
All the parameters need to be repeated on each call, and clients don't need to validate that the key exists before using an existing rate limiter.
Under normal usage, `max-burst`, `tokens-per-period`, and `period` should not change between calls, though this command supports such changes.

See the [rate limiting docs]({{< relref "/develop/using-commands/rate-limiting" >}}) for more information.

## Required arguments

<details open><summary><code>key</code></summary>

is the key associated with a specific rate limiting case. The key stores the internal state needed for the GCRA algorithm to track request timing.

</details>

<details open><summary><code>max-burst</code></summary>

is the maximum number of tokens allowed as a burst, in addition to the sustained rate. This controls how many requests can be made at once before rate limiting starts. The maximum number of requests that can be made immediately is `max_burst + 1`. Minimum value: `0`.

</details>

<details open><summary><code>tokens-per-period</code></summary>

is the number of tokens allowed per `period` at a sustained rate. This defines the steady-state throughput of the rate limiter. Minimum value: `1`.

</details>

<details open><summary><code>period</code></summary>

is the time period in seconds, specified as a floating-point number, used for calculating the sustained rate. The emission interval (minimum spacing between requests) is calculated as `period / tokens-per-period`. Minimum value: `1.0`.

</details>

## Optional arguments

<details open><summary><code>TOKENS count</code></summary>

is the number of tokens that can be consumed for a single request. A higher number of tokens drains the allowance faster. This is useful when different operations have different costs. Default value: `1`.

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

Using the `TOKENS` option to apply a higher cost:

```
127.0.0.1:6379> GCRA api:user:123 5 10 60 TOKENS 3
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
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `0` if the request is allowed, `1` if the request is blocked.
    1. [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the maximum number of tokens that can be requested (if no previous requests were made, or if they were made long enough ago). Always equal to `max_burst` + 1 (+1 to allow requests when `max_burst` is 0).
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

