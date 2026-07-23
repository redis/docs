// EXAMPLE: cmds_servermgmt

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// STEP_START flushall
const res1 = await redis.flushall(); // or flushall('ASYNC')
console.log(res1); // >>> OK

const res2 = await redis.keys('*');
console.log(res2); // >>> []
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK');
assert.deepEqual(res2, []);
// REMOVE_END

// STEP_START info
const res3 = await redis.info();
console.log(res3);
// >>> # Server
// >>> redis_version:7.4.0
// >>> ...
// STEP_END

// REMOVE_START
assert.ok(res3.includes('redis_version'));
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
