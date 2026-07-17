// EXAMPLE: cmds_set

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// STEP_START sadd
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res1 = await redis.sadd('myset', 'Hello', 'World');
console.log(res1); // >>> 2

const res2 = await redis.sadd('myset', 'World');
console.log(res2); // >>> 0

const res3 = await redis.smembers('myset');
console.log(res3); // >>> ['Hello', 'World']
// STEP_END

// REMOVE_START
assert.equal(res1, 2);
assert.equal(res2, 0);
assert.deepEqual([...res3].sort(), ['Hello', 'World']);
await redis.del('myset');
// REMOVE_END

// STEP_START smembers
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res4 = await redis.sadd('myset', 'Hello', 'World');
console.log(res4); // >>> 2

const res5 = await redis.smembers('myset');
console.log(res5); // >>> ['Hello', 'World']
// STEP_END

// REMOVE_START
assert.equal(res4, 2);
assert.deepEqual([...res5].sort(), ['Hello', 'World']);
await redis.del('myset');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
