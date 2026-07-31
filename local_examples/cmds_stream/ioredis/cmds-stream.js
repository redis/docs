// EXAMPLE: cmds_stream

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// STEP_START xadd1
// REMOVE_START
await redis.del('mystream');
// REMOVE_END
const res1 = await redis.xadd('mystream', '*', 'name', 'Sara', 'surname', 'OConnor');
console.log(res1); // >>> 1726055713866-0

const res2 = await redis.xadd('mystream', '*', 'field1', 'value1', 'field2', 'value2', 'field3', 'value3');
console.log(res2); // >>> 1726055713866-1

const res3 = await redis.xlen('mystream');
console.log(res3); // >>> 2

const res4 = await redis.xrange('mystream', '-', '+');
console.log(res4);
// >>> [
//   ['1726055713866-0', ['name', 'Sara', 'surname', 'OConnor']],
//   ['1726055713866-1', ['field1', 'value1', 'field2', 'value2', 'field3', 'value3']]
// ]
// STEP_END

// REMOVE_START
assert.equal(res3, 2);
assert.equal(res4.length, 2);
assert.deepEqual(res4[0][1], ['name', 'Sara', 'surname', 'OConnor']);
assert.deepEqual(res4[1][1], ['field1', 'value1', 'field2', 'value2', 'field3', 'value3']);
await redis.del('mystream');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
