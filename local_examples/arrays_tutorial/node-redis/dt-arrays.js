// EXAMPLE: arrays_tutorial
// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END

// REMOVE_START
await client.del('events:1');
// REMOVE_END

// STEP_START arset_arget
const setResult = await client.arSet('events:1', 0, ['login', 'click', 'purchase']);
console.log(setResult); // >>> 3

const getResult = await client.arGet('events:1', 0);
console.log(getResult); // >>> login

const missingResult = await client.arGet('events:1', 999);
console.log(missingResult); // >>> null
// STEP_END

// REMOVE_START
assert.equal(setResult, 3);
assert.equal(getResult, 'login');
assert.equal(missingResult, null);
await client.del('events:1');
// REMOVE_END

// REMOVE_START
await client.del('metrics');
// REMOVE_END

// STEP_START armset_armget
const mSetResult = await client.arMSet('metrics', { 0: '10', 5: '20', 100: '30' });
console.log(mSetResult); // >>> 3

const mGetResult = await client.arMGet('metrics', [0, 5, 100, 999]);
console.log(mGetResult); // >>> [ '10', '20', '30', null ]
// STEP_END

// REMOVE_START
assert.equal(mSetResult, 3);
assert.deepEqual(mGetResult, ['10', '20', '30', null]);
await client.del('metrics');
// REMOVE_END

// REMOVE_START
await client.del('sparse');
// REMOVE_END

// STEP_START len_count
const setA = await client.arSet('sparse', 0, 'a');
console.log(setA); // >>> 1

const setB = await client.arSet('sparse', 1000000, 'b');
console.log(setB); // >>> 1

const lenResult = await client.arLen('sparse');
console.log(lenResult); // >>> 1000001

const countResult = await client.arCount('sparse');
console.log(countResult); // >>> 2
// STEP_END

// REMOVE_START
assert.equal(setA, 1);
assert.equal(setB, 1);
assert.equal(lenResult, 1000001);
assert.equal(countResult, 2);
await client.del('sparse');
// REMOVE_END

// REMOVE_START
await client.del('seq');
// REMOVE_END

// STEP_START argetrange
const rangeSetResult = await client.arMSet('seq', { 0: 'a', 1: 'b', 3: 'd' });
console.log(rangeSetResult); // >>> 3

const rangeResult = await client.arGetRange('seq', 0, 3);
console.log(rangeResult); // >>> [ 'a', 'b', null, 'd' ]
// STEP_END

// REMOVE_START
assert.equal(rangeSetResult, 3);
assert.deepEqual(rangeResult, ['a', 'b', null, 'd']);
await client.del('seq');
// REMOVE_END

// REMOVE_START
await client.del('seq');
// REMOVE_END

// STEP_START arscan
const scanSetResult = await client.arMSet('seq', { 0: 'a', 1: 'b', 3: 'd' });
console.log(scanSetResult); // >>> 3

const scanResult = await client.arScan('seq', 0, 3);
for (const { index, value } of scanResult) {
  console.log(`${index} -> ${value}`);
}
// >>> 0 -> a
// >>> 1 -> b
// >>> 3 -> d
// STEP_END

// REMOVE_START
assert.equal(scanSetResult, 3);
assert.deepEqual(scanResult, [
  { index: 0, value: 'a' },
  { index: 1, value: 'b' },
  { index: 3, value: 'd' }
]);
await client.del('seq');
// REMOVE_END

// REMOVE_START
await client.del('log');
// REMOVE_END

// STEP_START arinsert
const insert1 = await client.arInsert('log', 'event1');
console.log(insert1); // >>> 0

const insert2 = await client.arInsert('log', 'event2');
console.log(insert2); // >>> 1

const nextResult = await client.arNext('log');
console.log(nextResult); // >>> 2

const seekResult = await client.arSeek('log', 10);
console.log(seekResult); // >>> 1

const insert3 = await client.arInsert('log', 'event3');
console.log(insert3); // >>> 10
// STEP_END

// REMOVE_START
assert.equal(insert1, 0);
assert.equal(insert2, 1);
assert.equal(nextResult, 2);
assert.equal(seekResult, 1);
assert.equal(insert3, 10);
await client.del('log');
// REMOVE_END

// REMOVE_START
await client.del('readings');
// REMOVE_END

// STEP_START arring
const ring0 = await client.arRing('readings', 3, 'v0');
console.log(ring0); // >>> 0

const ring1 = await client.arRing('readings', 3, 'v1');
console.log(ring1); // >>> 1

const ring2 = await client.arRing('readings', 3, 'v2');
console.log(ring2); // >>> 2

const ring3 = await client.arRing('readings', 3, 'v3');
console.log(ring3); // >>> 0

const ringGet = await client.arGet('readings', 0);
console.log(ringGet); // >>> v3
// STEP_END

// REMOVE_START
assert.equal(ring0, 0);
assert.equal(ring1, 1);
assert.equal(ring2, 2);
assert.equal(ring3, 0);
assert.equal(ringGet, 'v3');
await client.del('readings');
// REMOVE_END

// REMOVE_START
await client.del('readings');
// REMOVE_END

// STEP_START arlastitems
await client.arRing('readings', 3, 'v0');
await client.arRing('readings', 3, 'v1');
await client.arRing('readings', 3, 'v2');
await client.arRing('readings', 3, 'v3');

const lastItems = await client.arLastItems('readings', 3);
console.log(lastItems); // >>> [ 'v1', 'v2', 'v3' ]

const lastItemsRev = await client.arLastItems('readings', 3, { REV: true });
console.log(lastItemsRev); // >>> [ 'v3', 'v2', 'v1' ]
// STEP_END

// REMOVE_START
assert.deepEqual(lastItems, ['v1', 'v2', 'v3']);
assert.deepEqual(lastItemsRev, ['v3', 'v2', 'v1']);
await client.del('readings');
// REMOVE_END

// REMOVE_START
await client.del('scores');
// REMOVE_END

// STEP_START arop
const opSetResult = await client.arMSet('scores', { 0: '10', 1: '20', 2: '30' });
console.log(opSetResult); // >>> 3

const sumResult = await client.arOp('scores', 0, 2, 'SUM');
console.log(sumResult); // >>> 60

const maxResult = await client.arOp('scores', 0, 2, 'MAX');
console.log(maxResult); // >>> 30

const matchResult = await client.arOp('scores', 0, 2, 'MATCH', '10');
console.log(matchResult); // >>> 1
// STEP_END

// REMOVE_START
assert.equal(opSetResult, 3);
assert.equal(sumResult, '60');
assert.equal(maxResult, '30');
assert.equal(matchResult, 1);
await client.del('scores');
// REMOVE_END

// REMOVE_START
await client.del('log');
// REMOVE_END

// STEP_START argrep
const grepSetResult = await client.arMSet('log', {
  0: 'boot: ok',
  1: 'warn: disk',
  2: 'ERROR: cpu',
  3: 'info: ready',
  4: 'error: net'
});
console.log(grepSetResult); // >>> 5

const grepResult = await client.arGrep(
  'log',
  0,
  4,
  [['MATCH', 'error']],
  { NOCASE: true }
);
console.log(grepResult); // >>> [ 2, 4 ]

const grepWithValues = await client.arGrepWithValues(
  'log',
  0,
  4,
  [['GLOB', 'warn:*'], ['GLOB', 'error:*']],
  { COMBINATOR: 'OR' }
);
for (const { index, value } of grepWithValues) {
  console.log(`${index} -> ${value}`);
}
// >>> 1 -> warn: disk
// >>> 4 -> error: net
// STEP_END

// REMOVE_START
assert.equal(grepSetResult, 5);
assert.deepEqual(grepResult, [2, 4]);
assert.deepEqual(grepWithValues, [
  { index: 1, value: 'warn: disk' },
  { index: 4, value: 'error: net' }
]);
await client.del('log');
// REMOVE_END

// REMOVE_START
await client.del('scores');
// REMOVE_END

// STEP_START ardel
const delSetResult = await client.arMSet('scores', { 0: '10', 1: '20', 2: '30' });
console.log(delSetResult); // >>> 3

const delResult = await client.arDel('scores', 1);
console.log(delResult); // >>> 1

const delRangeResult = await client.arDelRange('scores', [[0, 2]]);
console.log(delRangeResult); // >>> 2
// STEP_END

// REMOVE_START
assert.equal(delSetResult, 3);
assert.equal(delResult, 1);
assert.equal(delRangeResult, 2);
await client.del('scores');
// REMOVE_END

// HIDE_START
await client.close();
// HIDE_END
