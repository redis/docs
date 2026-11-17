---
LinkTitle: OpenResty (NGINX)
Title: Redis with OpenResty
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Use Redis from NGINX through OpenResty for rate limiting and caching.
group: platform
hideListLinks: false
stack: true
summary: Stock NGINX has no Redis module. OpenResty bundles NGINX with Lua and the lua-resty-redis client, so you can rate limit and cache with Redis directly from NGINX.
type: integration
weight: 23
---

Open source [NGINX](https://nginx.org/) has no built-in Redis module. The modules index lists none. You can use
Redis from NGINX with [OpenResty](https://openresty.org/), a web platform that bundles NGINX,
LuaJIT, and the [lua-resty-redis](https://github.com/openresty/lua-resty-redis) client, which
talks to Redis without blocking NGINX's event loop. See the
[rate limiter](/content/develop/use-cases/rate-limiter/_index.md) and
[cache-aside](/content/develop/use-cases/cache-aside/_index.md) use cases for when to choose
these patterns.

## Requirements

The examples on this page were run with OpenResty 1.31 (the `openresty/openresty:alpine` image),
which includes lua-resty-redis 0.34, against Redis 8.0.

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Limit requests with Redis

Use `access_by_lua_block` to count requests in Redis before NGINX proxies them. This example
allows 3 requests a minute for each client address. A Lua script runs `INCR` and `EXPIRE` in one
atomic step, so a crash between the two commands can't leave a counter without an expiry:

```nginx
location /api {
  access_by_lua_block {
    local redis = require "resty.redis"
    local red = redis:new()
    red:set_timeouts(1000, 1000, 1000)  -- connect, send, read (ms)

    local ok, err = red:connect("<your-redis-host>", 6379)
    if not ok then
      ngx.log(ngx.ERR, "redis unavailable: ", err)
      return  -- fail open: let the request through
    end

    local script = [[
      local n = redis.call('INCR', KEYS[1])
      if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
      return n
    ]]
    local n = red:eval(script, 1, "ratelimit:" .. ngx.var.remote_addr, 60)
    red:set_keepalive(10000, 100)

    if n and n > 3 then
      return ngx.exit(429)
    end
  }
  proxy_pass http://<your-upstream>;
}
```

In a test, five requests returned `200`, `200`, `200`, `429`, and `429`. The counter was a string,
`ratelimit:<client-ip>`, with a TTL of 60 seconds, and it held `5` because the script also counts
rejected requests.

## Cache responses with Redis

This route implements [cache-aside](/content/develop/use-cases/cache-aside/_index.md) in NGINX. It
reads the response from Redis if it's there, and otherwise fetches it from an upstream, stores it with
a 30-second expiry, and returns it:

```nginx
location = /upstream { internal; proxy_pass http://<your-upstream>/; }

location = /cached {
  content_by_lua_block {
    local redis = require "resty.redis"
    local red = redis:new()
    red:set_timeouts(1000, 1000, 1000)
    assert(red:connect("<your-redis-host>", 6379))

    local key = "cache:" .. ngx.var.uri
    local body = red:get(key)
    if body and body ~= ngx.null then
      ngx.header["X-Cache"] = "HIT"
      ngx.say(body)
    else
      local res = ngx.location.capture("/upstream")
      red:set(key, res.body, "EX", 30)
      ngx.header["X-Cache"] = "MISS"
      ngx.say(res.body)
    end
    red:set_keepalive(10000, 100)
  }
}
```

In a test, the first request returned `X-Cache: MISS` and the next two returned `X-Cache: HIT`, and
the key `cache:/cached` had a TTL of 30 seconds.

## When Redis is unavailable

The rate limiter above fails open: with the Redis server stopped, a request returned `200`
after about 1 second, which is the connect timeout. The cache route uses `assert`, so it fails the
request if Redis is down. Handle the error in your own code if you want a different behavior.

## More information

- [lua-resty-redis](https://github.com/openresty/lua-resty-redis)
- [OpenResty](https://openresty.org/)
