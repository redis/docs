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

GCRA models rate limiting as a leaky bucket that drains at a steady rate.
Each request adds to the bucket, and the bucket drains over time at the
sustained rate you configure. If the bucket is full, further requests are
rate limited until enough time passes for it to drain.

Two parameters control the behavior:

- **Sustained rate**: defined as `tokens_per_period / period`. This is the
  steady-state throughput. For example, 10 tokens per 60 seconds means
  one request is allowed every 6 seconds on average.
- **Burst allowance**: defined by `max_burst`. This lets clients make a short
  burst of requests above the sustained rate. The total number of requests
  that can be made immediately is `max_burst + 1`.

## Basic usage

The [`GCRA`]({{< relref "/commands/gcra" >}}) command has the following syntax:

```
GCRA key max_burst tokens_per_period period [TOKENS count]
```

For example, to allow 30 tokens per minute with a burst of up to 5 extra
requests:

```
> GCRA api:user:123 5 30 60
1) (integer) 0
2) (integer) 6
3) (integer) 5
4) (integer) -1
5) (integer) 10
```

The response is an array of five integers:

1. **Limited**: `0` means the request is allowed; `1` means it's rate limited.
2. **Max requests**: the maximum number of requests that can be made in a burst
   (`max_burst + 1`).
3. **Remaining**: the number of requests available right now.
4. **Retry after**: seconds until the client should retry. Returns `-1` when
   the request isn't limited.
5. **Reset after**: seconds until the full burst allowance is restored.

## Handling rate-limited requests

When a request is rate limited, the response tells you exactly when to retry:

```
> GCRA api:user:123 5 30 60
1) (integer) 1
2) (integer) 6
3) (integer) 0
4) (integer) 2
5) (integer) 12
```

The first element is `1`, which means the request was denied. The fourth
element indicates the client should wait 2 seconds before retrying.

## Weighted requests

Some operations cost more than others. Use the `TOKENS` option to
assign a higher cost to expensive operations:

```
> GCRA api:user:123 5 30 60 TOKENS 3
1) (integer) 0
2) (integer) 6
3) (integer) 2
4) (integer) -1
5) (integer) 16
```

This consumes 3 units of the rate limit allowance in a single call. The
remaining count decreases by 3 instead of 1.

## Example: rate limiting in action

The following example walks through a sequence of requests to show how the
rate limit allowance drains and recovers over time. It configures a limit of
5 requests per 10 seconds with a burst of 3.

The first request arrives on a fresh key. The full burst is available:

```
> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed
2) (integer) 4        # max requests (max_burst + 1)
3) (integer) 3        # 3 remaining
4) (integer) -1       # not limited, so retry-after is -1
5) (integer) 2        # full burst restored in 2 seconds
```

Three more requests arrive immediately. Each one drains the remaining
allowance:

```
> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed
2) (integer) 4
3) (integer) 2        # 2 remaining
4) (integer) -1
5) (integer) 4

> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed
2) (integer) 4
3) (integer) 1        # 1 remaining
4) (integer) -1
5) (integer) 6

> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed
2) (integer) 4
3) (integer) 0        # 0 remaining — burst is exhausted
4) (integer) -1
5) (integer) 8
```

The next request exceeds the allowance and is rate limited:

```
> GCRA api:user:1 3 5 10
1) (integer) 1        # DENIED
2) (integer) 4
3) (integer) 0        # still 0 remaining
4) (integer) 2        # retry after 2 seconds
5) (integer) 8
```

After waiting for the retry-after period, the allowance has partially
recovered and the request succeeds:

```
> GCRA api:user:1 3 5 10
1) (integer) 0        # allowed again
2) (integer) 4
3) (integer) 0
4) (integer) -1
5) (integer) 8
```

### Using GCRA in application code

The following Python example shows how to check the rate limit response and
back off when a request is denied:

```python
import redis
import time

r = redis.Redis()

def rate_limited_request(user_id, action):
    """Attempt an action, respecting the rate limit."""
    key = f"api:user:{user_id}"
    # 5 requests per 10 seconds, burst of 3
    result = r.execute_command("GCRA", key, 3, 5, 10)

    limited, max_req, remaining, retry_after, reset_after = result

    if limited:
        print(f"Rate limited. Retry after {retry_after} seconds.")
        time.sleep(retry_after)
        # Retry once after waiting
        result = r.execute_command("GCRA", key, 3, 5, 10)
        limited = result[0]

    if not limited:
        print(f"Request allowed. {result[2]} remaining.")
        perform_action(action)
    else:
        print("Still rate limited. Try again later.")
```

## Real-world examples

### Limit credit card transactions

A payment processor needs to flag suspicious activity. Limit each user to
5 transaction attempts per minute with a small burst of 2 to handle
rapid legitimate retries:

```
GCRA txn:user:8841 2 5 60
```

If the response returns `limited = 1`, reject the transaction and prompt
the user to wait before trying again.

### Throttle profile views on a dating site

To prevent scraping of user profiles, limit each member to 60 profile
views per hour with a burst of 10:

```
GCRA profiles:user:2297 10 60 3600
```

This lets a user browse through a handful of profiles quickly, but
enforces a steady pace over the course of an hour.

### Restrict downloads by subscription tier

A file-hosting service offers different download limits for free and
paid users. Free-tier users get 10 downloads per day with no burst.
Premium users get 100 downloads per day with a burst of 20:

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

The search endpoint allows 10 requests per minute with a burst of 2.
The export endpoint allows 2 requests per hour with no burst.

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
