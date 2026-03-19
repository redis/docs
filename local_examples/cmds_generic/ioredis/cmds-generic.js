// EXAMPLE: cmds_generic

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// REMOVE_START
await redis.del('firstname', 'lastname', 'age');
// REMOVE_END

// STEP_START keys
const keysRes1 = await redis.mset({ firstname: 'Jack', lastname: 'Stuntman', age: '35' });
console.log(keysRes1); // >>> OK

const keysRes2 = await redis.keys('*name*');
console.log(keysRes2.sort()); // >>> ['firstname', 'lastname']

const keysRes3 = await redis.keys('a??');
console.log(keysRes3); // >>> ['age']

const keysRes4 = await redis.keys('*');
console.log(keysRes4.sort()); // >>> ['age', 'firstname', 'lastname']
// STEP_END

// REMOVE_START
assert.equal(keysRes1, 'OK');
assert.deepEqual(keysRes2.sort(), ['firstname', 'lastname']);
assert.deepEqual(keysRes3, ['age']);
assert.deepEqual(keysRes4.sort(), ['age', 'firstname', 'lastname']);
await redis.del('firstname', 'lastname', 'age');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END

