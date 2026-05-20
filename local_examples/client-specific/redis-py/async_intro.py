# EXAMPLE: async_intro
import asyncio

# STEP_START connect
import redis.asyncio as redis

async def basic_example():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    await r.set('foo', 'bar')
    value = await r.get('foo')
    print(value)
    # bar
    await r.aclose()

asyncio.run(basic_example())
# STEP_END

# STEP_START context_manager
async def context_example():
    async with redis.Redis(
        host='localhost', port=6379, decode_responses=True
    ) as r:
        await r.set('foo', 'bar')
        value = await r.get('foo')
        print(value)
        # bar

asyncio.run(context_example())
# STEP_END

# STEP_START pool
async def pool_example():
    pool = redis.ConnectionPool(
        host='localhost', port=6379, decode_responses=True,
        max_connections=10,
    )
    r = redis.Redis(connection_pool=pool)
    await r.set('foo', 'bar')
    await r.aclose()
    await pool.aclose()

asyncio.run(pool_example())
# STEP_END

# STEP_START gather
async def gather_example():
    async with redis.Redis(
        host='localhost', port=6379, decode_responses=True
    ) as r:
        await r.mset({'a': '1', 'b': '2', 'c': '3'})
        a, b, c = await asyncio.gather(
            r.get('a'),
            r.get('b'),
            r.get('c'),
        )
        print(a, b, c)
        # 1 2 3

asyncio.run(gather_example())
# STEP_END

# STEP_START pipeline
async def pipeline_example():
    async with redis.Redis(
        host='localhost', port=6379, decode_responses=True
    ) as r:
        async with r.pipeline(transaction=True) as pipe:
            pipe.set('a', '1')
            pipe.set('b', '2')
            pipe.get('a')
            pipe.get('b')
            results = await pipe.execute()
            print(results)
            # [True, True, '1', '2']

asyncio.run(pipeline_example())
# STEP_END

# STEP_START watch
from redis.exceptions import WatchError

async def watch_example():
    async with redis.Redis(
        host='localhost', port=6379, decode_responses=True
    ) as r:
        await r.set('counter', '0')
        async with r.pipeline(transaction=True) as pipe:
            while True:
                try:
                    await pipe.watch('counter')
                    current = int(await pipe.get('counter'))
                    pipe.multi()
                    pipe.set('counter', str(current + 1))
                    await pipe.execute()
                    break
                except WatchError:
                    continue
        print(await r.get('counter'))
        # 1

asyncio.run(watch_example())
# STEP_END

# STEP_START pubsub
async def pubsub_example():
    async with redis.Redis(
        host='localhost', port=6379, decode_responses=True
    ) as r:
        async with r.pubsub() as pubsub:
            await pubsub.subscribe('channel-1')

            async def reader():
                async for message in pubsub.listen():
                    if message['type'] == 'message':
                        print(message['data'])
                        # hello
                        break

            reader_task = asyncio.create_task(reader())
            await asyncio.sleep(0.1)
            await r.publish('channel-1', 'hello')
            await reader_task

asyncio.run(pubsub_example())
# STEP_END

# STEP_START cluster
from redis.asyncio.cluster import RedisCluster

async def cluster_example():
    rc = RedisCluster(host='localhost', port=16379, decode_responses=True)
    await rc.set('foo', 'bar')
    value = await rc.get('foo')
    print(value)
    # bar
    await rc.aclose()

asyncio.run(cluster_example())
# STEP_END

# STEP_START timeout
async def timeout_example():
    async with redis.Redis(
        host='localhost', port=6379, decode_responses=True
    ) as r:
        try:
            # BLPOP blocks waiting for a value, so the timeout reliably fires.
            await asyncio.wait_for(r.blpop('empty-queue'), timeout=0.1)
        except asyncio.TimeoutError:
            print('command canceled')

asyncio.run(timeout_example())
# STEP_END
