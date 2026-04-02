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
description: How to use the GCRA command for rate limiting in Redis
linkTitle: Rate limiting
title: Rate limiting
weight: 40
---

Rate limiting controls how often a user or client can perform an action within
a given time period. Common use cases include:

- **Preventing DDoS attacks**: throttle incoming requests to keep services
  available during traffic floods.
- **Blocking brute-force attacks**: limit login attempts per account to slow
  down credential stuffing.
- **Preventing API abuse**: enforce per-user or per-key request quotas on
  public APIs.
- **Preventing web scraping**: restrict how quickly an IP address or user agent
  can crawl your pages.
- **Limiting resource consumption by subscription tier**: give free-tier users
  a lower request allowance than paying customers.

Redis is a natural fit for rate limiting because it offers fast, atomic
operations with low latency. Starting in version 8.8, Redis provides the
[`GCRA`]({{< relref "/commands/gcra" >}}) command, which implements rate
limiting directly in the server using the
[Generic Cell Rate Algorithm](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm).

## How GCRA works

In a typical deployment, the application server calls
[`GCRA`]({{< relref "/commands/gcra" >}}) on each end user's request.
Based on the response, the application server either fulfills the
request or rejects it.

GCRA uses a [leaky bucket](https://en.wikipedia.org/wiki/Leaky_bucket) model.
Imagine a bucket with a fixed capacity. Water
leaks out of the bucket at a constant rate, and each accepted request adds
water to it. The available tokens correspond to the empty space in the bucket —
the more empty space, the more requests can be accepted. If a request would
cause the bucket to overflow, it's rejected. Over time the bucket leaks,
freeing up capacity for new requests.
There's an excellent visual aid for this process on [this page](https://davecturner.github.io/2016/12/01/rate-limiting.html).

Two parameters control the behavior:

- **Sustained rate**: defined as `tokens_per_period / period`. This is the
  steady-state token throughput. For example, 10 tokens per 60 seconds means
  one token replenishes every 6 seconds.
- **Burst allowance**: defined by `max_burst`. This lets clients consume a
  burst of tokens above the sustained rate. The total token capacity is
  `max_burst + 1`.

## Basic usage

The [`GCRA`]({{< relref "/commands/gcra" >}}) command has the following syntax:

```
GCRA key max_burst tokens_per_period period [TOKENS count]
```

For example, to allow a sustained rate of 30 tokens per minute with a burst
allowance of 5 additional tokens:

```
> GCRA api:user:123 5 30 60
1) (integer) 0
2) (integer) 6
3) (integer) 5
4) (integer) -1
5) (integer) 10
```

The response is an array of five integers:

1. **Limited**: `0` means the request is allowed; `1` means it's denied.
2. **Max tokens**: the total token capacity (`max_burst + 1`).
3. **Remaining tokens**: the number of tokens available right now.
4. **Retry after**: seconds until the application server should retry.
   Returns `-1` when the request isn't denied.
5. **Reset after**: seconds until the full token allowance is restored.

## Handling rate-limited requests

When a request is denied, the response tells the application server exactly
when to retry:

```
> GCRA api:user:123 5 30 60
1) (integer) 1
2) (integer) 6
3) (integer) 0
4) (integer) 2
5) (integer) 12
```

The first element is `1`, which means the request was denied. The fourth
element tells the application server to wait 2 seconds before retrying.

## Weighted requests

Some operations cost more than others. Use the `TOKENS` option to
assign a higher token cost to expensive operations:

```
> GCRA api:user:123 5 30 60 TOKENS 3
1) (integer) 0
2) (integer) 6
3) (integer) 2
4) (integer) -1
5) (integer) 16
```

This request consumes 3 tokens instead of the default 1, so the remaining
token count drops by 3.

## Example: rate limiting in action

The following example walks through a sequence of requests to show how the
token allowance drains and recovers over time. It configures a sustained rate
of 5 tokens per 10 seconds with a burst allowance of 3 additional tokens (total
capacity of 4).

The first request arrives on a fresh key. The full token allowance is
available:

```
> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed
2) (integer) 4        # total token capacity (max_burst + 1)
3) (integer) 3        # 3 tokens remaining
4) (integer) -1       # not denied, so retry-after is -1
5) (integer) 2        # full allowance restored in 2 seconds
```

Three more requests arrive immediately. Each one consumes a token:

```
> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed
2) (integer) 4
3) (integer) 2        # 2 tokens remaining
4) (integer) -1
5) (integer) 4

> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed
2) (integer) 4
3) (integer) 1        # 1 token remaining
4) (integer) -1
5) (integer) 6

> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed
2) (integer) 4
3) (integer) 0        # 0 tokens remaining — allowance exhausted
4) (integer) -1
5) (integer) 8
```

The next request is denied because no tokens are available:

```
> GCRA api:user:1 3 5 10
1) (integer) 1        # DENIED
2) (integer) 4
3) (integer) 0        # still 0 tokens remaining
4) (integer) 2        # retry after 2 seconds
5) (integer) 8
```

After waiting for the retry-after period, a token has replenished and the
request succeeds:

```
> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed again
2) (integer) 4
3) (integer) 0
4) (integer) -1
5) (integer) 8
```

### Using GCRA in application code

The following Python example shows how an application server checks the
rate limit before handling an end user's request:

```python
import redis
import time

r = redis.Redis()

def handle_request(user_id, action):
    """Check the rate limit and handle the end user's request."""
    key = f"api:user:{user_id}"
    # Sustained rate: 5 tokens per 10 seconds, burst of 3 tokens
    limited, max_tokens, remaining, retry_after, reset_after = (
        r.execute_command("GCRA", key, 3, 5, 10)
    )

    if limited:
        # Deny the end user's request
        return {"error": "Too many requests", "retry_after": retry_after}

    # Tokens available — fulfill the end user's request
    result = perform_action(action)
    return {"result": result, "remaining_tokens": remaining}
```

## Real-world examples

### Limit credit card transactions

A payment processor needs to flag suspicious activity. The application server
limits each user to 5 tokens per minute with a small burst of 2 to handle
rapid legitimate retries:

```
GCRA txn:user:8841 2 5 60
```

If the response returns `limited = 1`, the application server rejects the
end user's transaction and returns an error prompting them to wait.

### Throttle profile views on a dating site

To prevent scraping of user profiles, the application server allocates 60
tokens per hour per member with a burst of 10:

```
GCRA profiles:user:2297 10 60 3600
```

This lets an end user browse through a handful of profiles quickly, but
enforces a steady pace over the course of an hour.

### Restrict downloads by subscription tier

A file-hosting service offers different token budgets for free and
paid users. Free-tier users get 10 tokens per day with no burst.
Premium users get 100 tokens per day with a burst of 20:

```
# Free tier
GCRA downloads:user:5510 0 10 86400

# Premium tier
GCRA downloads:user:5510 20 100 86400
```

### Per-endpoint API rate limiting

Combine the user and endpoint in the key for more granular control:

```
GCRA api:user:42:/search 2 10 60
GCRA api:user:42:/export 0 2 3600
```

The search endpoint allows 10 tokens per minute with a burst of 2.
The export endpoint allows 2 tokens per hour with no burst.

## Choose parameter values

When configuring rate limits, consider these guidelines:

- **`tokens_per_period` and `period`** define the sustained rate. Choose
  values that reflect your actual capacity. A period of `60` (one minute) is
  a common starting point.
- **`max_burst`** controls how tolerant you are of traffic spikes. A value of
  `0` enforces strict spacing between requests. Higher values accommodate
  bursty workloads like page loads that trigger multiple API calls at once.
- **`period`** accepts floating-point values (minimum `1.0`), which gives you
  fine-grained control. Internally, Redis calculates timing with microsecond
  precision.

## Learn more

- [`GCRA` command reference]({{< relref "/commands/gcra" >}})
- [Generic Cell Rate Algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm)
