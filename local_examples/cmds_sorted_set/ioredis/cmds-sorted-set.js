// EXAMPLE: cmds_sorted_set

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// STEP_START zadd
// REMOVE_START
await redis.del('myzset');
// REMOVE_END
const res1 = await redis.zadd('myzset', 1, 'one');
console.log(res1); // >>> 1

const res2 = await redis.zadd('myzset', 1, 'uno');
console.log(res2); // >>> 1

const res3 = await redis.zadd('myzset', 2, 'two', 3, 'three');
console.log(res3); // >>> 2

const res4 = await redis.zrange('myzset', 0, -1, 'WITHSCORES');
console.log(res4); // >>> ['one', '1', 'uno', '1', 'two', '2', 'three', '3']
// STEP_END

// REMOVE_START
assert.deepEqual(res4, ['one', '1', 'uno', '1', 'two', '2', 'three', '3']);
await redis.del('myzset');
// REMOVE_END

// STEP_START zrange1
// REMOVE_START
await redis.del('myzset');
// REMOVE_END
const res5 = await redis.zadd('myzset', 1, 'one', 2, 'two', 3, 'three');
console.log(res5); // >>> 3

const res6 = await redis.zrange('myzset', 0, -1);
console.log(res6); // >>> ['one', 'two', 'three']

const res7 = await redis.zrange('myzset', 2, 3);
console.log(res7); // >>> ['three']

const res8 = await redis.zrange('myzset', -2, -1);
console.log(res8); // >>> ['two', 'three']
// STEP_END

// REMOVE_START
assert.deepEqual(res6, ['one', 'two', 'three']);
assert.deepEqual(res7, ['three']);
assert.deepEqual(res8, ['two', 'three']);
await redis.del('myzset');
// REMOVE_END

// STEP_START zrange2
// REMOVE_START
await redis.del('myzset');
// REMOVE_END
await redis.zadd('myzset', 1, 'one', 2, 'two', 3, 'three');

const res9 = await redis.zrange('myzset', 0, 1, 'WITHSCORES');
console.log(res9); // >>> ['one', '1', 'two', '2']
// STEP_END

// REMOVE_START
assert.deepEqual(res9, ['one', '1', 'two', '2']);
await redis.del('myzset');
// REMOVE_END

// STEP_START zrange3
// REMOVE_START
await redis.del('myzset');
// REMOVE_END
await redis.zadd('myzset', 1, 'one', 2, 'two', 3, 'three');

const res10 = await redis.zrange('myzset', '(1', '+inf', 'BYSCORE', 'LIMIT', 1, 1);
console.log(res10); // >>> ['three']
// STEP_END

// REMOVE_START
assert.deepEqual(res10, ['three']);
await redis.del('myzset');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
