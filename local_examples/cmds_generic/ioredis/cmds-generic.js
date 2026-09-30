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

// STEP_START scan1
const scan1Res1 = await redis.sadd('myset', '1', '2', '3', 'foo', 'foobar', 'feelsgood');
console.log(scan1Res1); // >>> 6

const [, scan1Members] = await redis.sscan('myset', 0, 'MATCH', 'f*');
console.log(scan1Members.sort()); // >>> ['feelsgood', 'foo', 'foobar']
// STEP_END

// REMOVE_START
assert.equal(scan1Res1, 6);
assert.deepEqual(scan1Members.sort(), ['feelsgood', 'foo', 'foobar']);
await redis.del('myset');
// REMOVE_END

// STEP_START scan2
// REMOVE_START
const scan2Pipeline = redis.pipeline();
for (let i = 1; i <= 1000; i++) {
  scan2Pipeline.set(`key:${i}`, i);
}
await scan2Pipeline.exec();
// REMOVE_END

// MATCH filters after the elements are fetched, so most iterations return nothing.
let [scan2Cursor, scan2Keys] = await redis.scan(0, 'MATCH', '*11*');
let scan2Total = scan2Keys.length;
console.log(scan2Keys.length);

for (let i = 0; i < 3; i++) {
  [scan2Cursor, scan2Keys] = await redis.scan(scan2Cursor, 'MATCH', '*11*');
  scan2Total += scan2Keys.length;
  console.log(scan2Keys.length);
}

// A larger COUNT forces more scanning in a single iteration, so the rest of the
// matches arrive together. The scan continues from the cursor reached above.
[scan2Cursor, scan2Keys] = await redis.scan(scan2Cursor, 'MATCH', '*11*', 'COUNT', 1000);
scan2Total += scan2Keys.length;
console.log(scan2Keys.length);

// The per-call split isn't guaranteed, but the cumulative total is.
console.log(scan2Total); // >>> 19
// STEP_END

// REMOVE_START
assert.equal(scan2Total, 19);
await redis.flushdb();
// REMOVE_END

// STEP_START scan3
const scan3Res1 = await redis.geoadd('geokey', '0', '0', 'value');
console.log(scan3Res1); // >>> 1

const scan3Res2 = await redis.zadd('zkey', '1000', 'value');
console.log(scan3Res2); // >>> 1

console.log(await redis.type('geokey')); // >>> zset
console.log(await redis.type('zkey')); // >>> zset

// A single call isn't guaranteed to find every match, so loop until the cursor
// returns to 0, accumulating matches from every call.
let scan3Cursor = '0';
let scan3Keys = [];
do {
  let scan3Batch;
  [scan3Cursor, scan3Batch] = await redis.scan(scan3Cursor, 'TYPE', 'zset');
  scan3Keys = scan3Keys.concat(scan3Batch);
} while (scan3Cursor !== '0');
console.log(scan3Keys.sort()); // >>> ['geokey', 'zkey']
// STEP_END

// REMOVE_START
assert.deepEqual(scan3Keys.sort(), ['geokey', 'zkey']);
await redis.del('geokey', 'zkey');
// REMOVE_END

// STEP_START scan4
const scan4Res1 = await redis.hset('myhash', { a: 1, b: 2 });
console.log(scan4Res1); // >>> 2

// HSCAN returns field and value interleaved. Redis does not promise an order, so pair
// them up into an object rather than relying on the position of each element.
const [, scan4Flat] = await redis.hscan('myhash', 0);
const scan4Pairs = Object.fromEntries(
  scan4Flat.reduce((acc, v, i) => (i % 2 ? acc : [...acc, [v, scan4Flat[i + 1]]]), [])
);
console.log(scan4Pairs); // >>> { a: '1', b: '2' }

const [, scan4Fields] = await redis.hscan('myhash', 0, 'NOVALUES');
console.log(scan4Fields.sort()); // >>> [ 'a', 'b' ]
// STEP_END

// REMOVE_START
assert.equal(scan4Res1, 2);
assert.deepEqual(scan4Pairs, { a: '1', b: '2' });
assert.deepEqual(scan4Fields.sort(), ['a', 'b']);
await redis.del('myhash');
// REMOVE_END

// STEP_START del
console.log(await redis.set('key1', 'Hello')); // >>> OK
console.log(await redis.set('key2', 'World')); // >>> OK

const delResult = await redis.del('key1', 'key2', 'key3');
console.log(delResult); // >>> 2
// STEP_END

// REMOVE_START
assert.equal(delResult, 2);
// REMOVE_END

// STEP_START exists
console.log(await redis.set('key1', 'Hello')); // >>> OK

console.log(await redis.exists('key1')); // >>> 1
console.log(await redis.exists('nosuchkey')); // >>> 0

console.log(await redis.set('key2', 'World')); // >>> OK

const existsResult = await redis.exists('key1', 'key2', 'nosuchkey');
console.log(existsResult); // >>> 2
// STEP_END

// REMOVE_START
assert.equal(existsResult, 2);
await redis.del('key1', 'key2');
// REMOVE_END

// STEP_START expire
console.log(await redis.set('mykey', 'Hello')); // >>> OK

console.log(await redis.expire('mykey', 10)); // >>> 1
console.log(await redis.ttl('mykey')); // >>> 10

// Overwriting a key with SET clears its expiry.
console.log(await redis.set('mykey', 'Hello World')); // >>> OK
console.log(await redis.ttl('mykey')); // >>> -1

// XX only sets the expiry when one already exists, so this is a no-op.
console.log(await redis.expire('mykey', 10, 'XX')); // >>> 0
console.log(await redis.ttl('mykey')); // >>> -1

// NX only sets the expiry when there is none, so this one applies.
console.log(await redis.expire('mykey', 10, 'NX')); // >>> 1
const expireTtl = await redis.ttl('mykey');
console.log(expireTtl); // >>> 10
// STEP_END

// REMOVE_START
assert.equal(expireTtl, 10);
await redis.del('mykey');
// REMOVE_END

// STEP_START ttl
console.log(await redis.set('mykey', 'Hello')); // >>> OK
console.log(await redis.expire('mykey', 10)); // >>> 1

const ttlResult = await redis.ttl('mykey');
console.log(ttlResult); // >>> 10
// STEP_END

// REMOVE_START
assert.equal(ttlResult, 10);
await redis.del('mykey');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END

