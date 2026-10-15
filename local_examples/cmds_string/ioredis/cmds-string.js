// EXAMPLE: cmds_string

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// REMOVE_START
await redis.del('key1', 'key2', 'mykey', 'nonexisting');
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

// STEP_START incr
const incrResult1 = await redis.set('mykey', '10');
console.log(incrResult1); // >>> OK

const incrResult2 = await redis.incr('mykey');
console.log(incrResult2); // >>> 11

const incrResult3 = await redis.get('mykey');
console.log(incrResult3); // >>> 11
// STEP_END

// REMOVE_START
assert.equal(incrResult1, 'OK');
assert.equal(incrResult2, 11);
assert.equal(incrResult3, '11');
await redis.del('mykey');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
