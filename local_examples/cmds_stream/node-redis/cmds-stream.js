// EXAMPLE: cmds_stream
// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END
// REMOVE_START
await client.del('mystream');
// REMOVE_END

// STEP_START xadd1
const res1 = await client.xAdd('mystream', '*', {
  'name': 'Sara',
  'surname': 'OConnor'
});
console.log(res1); // >>> 1726055713866-0

const res2 = await client.xAdd('mystream', '*', {
  'field1': 'value1',
  'field2': 'value2',
  'field3': 'value3'
});
console.log(res2); // >>> 1726055713866-1

const res3 = await client.xLen('mystream');
console.log(res3); // >>> 2

const res4 = await client.xRange('mystream', '-', '+');
console.log(res4);
// >>> [
//   { id: '1726055713866-0', message: { name: 'Sara', surname: 'OConnor' } },
//   { id: '1726055713866-1', message: { field1: 'value1', field2: 'value2', field3: 'value3' } }
// ]
// STEP_END

// REMOVE_START
assert.equal(res3, 2);
assert.equal(res4.length, 2);
await client.del('mystream');
// REMOVE_END

// STEP_START xadd2
const res5 = await client.xAdd('mystream', '*', { 'field': 'value' }, {
  IDMP: { pid: 'producer1', iid: 'msg1' }
});
console.log(res5); // >>> 1726055713867-0

// Attempting to add the same message again with IDMP returns the original entry ID
const res6 = await client.xAdd('mystream', '*', { 'field': 'different_value' }, {
  IDMP: { pid: 'producer1', iid: 'msg1' }
});
console.log(res6); // >>> 1726055713867-0 (same ID as res5, message was deduplicated)

const res7 = await client.xAdd('mystream', '*', { 'field': 'value' }, {
  IDMPAUTO: { pid: 'producer2' }
});
console.log(res7); // >>> 1726055713867-1

// Auto-generated idempotent ID prevents duplicates for same producer+content
const res8 = await client.xAdd('mystream', '*', { 'field': 'value' }, {
  IDMPAUTO: { pid: 'producer2' }
});
console.log(res8); // >>> 1726055713867-1 (same ID as res7, duplicate detected)

// Configure idempotent message processing settings
const res9 = await client.xCfgSet('mystream', {
  IDMP_DURATION: 300,
  IDMP_MAXSIZE: 1000
});
console.log(res9); // >>> OK
// STEP_END

// REMOVE_START
assert.ok(res5);
await client.del('mystream');
// REMOVE_END

// HIDE_START
await client.quit();
// HIDE_END

