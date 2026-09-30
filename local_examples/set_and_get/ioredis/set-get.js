// EXAMPLE: set_and_get

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// REMOVE_START
await redis.del('bike:1');
// REMOVE_END

const res1 = await redis.set('bike:1', 'Process 134');
console.log(res1); // >>> OK

const res2 = await redis.get('bike:1');
console.log(res2); // >>> Process 134

// REMOVE_START
assert.equal(res1, 'OK');
assert.equal(res2, 'Process 134');
await redis.del('bike:1');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
