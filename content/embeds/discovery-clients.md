* [Redis-py](https://github.com/andymccurdy/redis-py) (Python redis client)
* [HiRedis](https://github.com/redis/hiredis) (C redis client)
* [Jedis](https://github.com/xetorthio/jedis) (Java redis client)
* [Ioredis](https://github.com/luin/ioredis) (NodeJS redis client)

If you need to use another client, consider using [Sentinel Tunnel](https://github.com/RedisLabs/sentinel_tunnel)
to discover the current Redis master with Sentinel and create a TCP tunnel between a local port on the client and the master.
