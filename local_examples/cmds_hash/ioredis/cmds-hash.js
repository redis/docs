// EXAMPLE: cmds_hash

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// REMOVE_START
await redis.del('myhash');
// REMOVE_END

// STEP_START hmget
await redis.hset('myhash', { field1: 'Hello', field2: 'World' });

const hmgetResult = await redis.hmget('myhash', 'field1', 'field2', 'nofield');
console.log(hmgetResult); // >>> ['Hello', 'World', null]
// STEP_END

// REMOVE_START
assert.deepEqual(hmgetResult, ['Hello', 'World', null]);
await redis.del('myhash');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END

