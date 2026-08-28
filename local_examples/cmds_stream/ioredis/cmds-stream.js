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

// STEP_START xadd2
const res5 = await redis.call('XADD', 'mystream', 'IDMP', 'producer1', 'msg1', '*', 'field', 'value');
console.log(res5); // >>> 1726055713867-0

// Attempting to add the same message again with IDMP returns the original entry ID
const res6 = await redis.call('XADD', 'mystream', 'IDMP', 'producer1', 'msg1', '*', 'field', 'different_value');
console.log(res6); // >>> 1726055713867-0 (same ID as res5, message was deduplicated)

const res7 = await redis.call('XADD', 'mystream', 'IDMPAUTO', 'producer2', '*', 'field', 'value');
console.log(res7); // >>> 1726055713867-1

// Auto-generated idempotent ID prevents duplicates for same producer+content
const res8 = await redis.call('XADD', 'mystream', 'IDMPAUTO', 'producer2', '*', 'field', 'value');
console.log(res8); // >>> 1726055713867-1 (same ID as res7, duplicate detected)

// Configure idempotent message processing settings
const res9 = await redis.call('XCFGSET', 'mystream', 'IDMP-DURATION', 300, 'IDMP-MAXSIZE', 1000);
console.log(res9); // >>> OK
// STEP_END

// REMOVE_START
assert.equal(res5, res6);
assert.equal(res7, res8);
await redis.del('mystream');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
