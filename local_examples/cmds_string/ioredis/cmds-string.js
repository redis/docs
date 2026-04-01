// EXAMPLE: cmds_string

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// REMOVE_START
await redis.del('key1', 'key2', 'nonexisting');
// REMOVE_END

// STEP_START mget
await redis.set('key1', 'Hello');
await redis.set('key2', 'World');

const mgetResult = await redis.mget('key1', 'key2', 'nonexisting');
console.log(mgetResult); // >>> ['Hello', 'World', null]
// STEP_END

// REMOVE_START
assert.deepEqual(mgetResult, ['Hello', 'World', null]);
await redis.del('key1', 'key2', 'nonexisting');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
