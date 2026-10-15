// EXAMPLE: cmds_hash

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// REMOVE_START
await redis.del('myhash');
// REMOVE_END

// STEP_START hmget
await redis.hset('myhash', { field1: 'Hello', field2: 'World' });

const hmgetResult = await redis.hmget('myhash', 'field1', 'field2', 'nofield');
console.log(hmgetResult); // >>> ['Hello', 'World', null]
// STEP_END

// REMOVE_START
assert.deepEqual(hmgetResult, ['Hello', 'World', null]);
await redis.del('myhash');
// REMOVE_END

// STEP_START hlen
const hlenSet1 = await redis.hset('myhash', 'field1', 'Hello');
console.log(hlenSet1); // >>> 1

const hlenSet2 = await redis.hset('myhash', 'field2', 'World');
console.log(hlenSet2); // >>> 1

const hlenResult = await redis.hlen('myhash');
console.log(hlenResult); // >>> 2
// STEP_END

// REMOVE_START
assert.equal(hlenSet1, 1);
assert.equal(hlenSet2, 1);
assert.equal(hlenResult, 2);
await redis.del('myhash');
// REMOVE_END

// STEP_START hset
const hsetRes1 = await redis.hset('myhash', 'field1', 'Hello');
console.log(hsetRes1); // >>> 1

console.log(await redis.hget('myhash', 'field1')); // >>> Hello

const hsetRes2 = await redis.hset('myhash', { field2: 'Hi', field3: 'World' });
console.log(hsetRes2); // >>> 2

console.log(await redis.hget('myhash', 'field2')); // >>> Hi
console.log(await redis.hget('myhash', 'field3')); // >>> World

const hsetRes3 = await redis.hgetall('myhash');
console.log(hsetRes3);
// >>> { field1: 'Hello', field2: 'Hi', field3: 'World' }
// STEP_END

// REMOVE_START
assert.equal(hsetRes1, 1);
assert.equal(hsetRes2, 2);
assert.deepEqual(hsetRes3, { field1: 'Hello', field2: 'Hi', field3: 'World' });
await redis.del('myhash');
// REMOVE_END

// STEP_START hget
const hgetRes1 = await redis.hset('myhash', 'field1', 'foo');
console.log(hgetRes1); // >>> 1

const hgetRes2 = await redis.hget('myhash', 'field1');
console.log(hgetRes2); // >>> foo

// A field that does not exist reads back as null.
const hgetRes3 = await redis.hget('myhash', 'field2');
console.log(hgetRes3); // >>> null
// STEP_END

// REMOVE_START
assert.equal(hgetRes1, 1);
assert.equal(hgetRes2, 'foo');
assert.equal(hgetRes3, null);
await redis.del('myhash');
// REMOVE_END

// STEP_START hgetall
await redis.hset('myhash', { field1: 'Hello', field2: 'World' });

const hgetallRes = await redis.hgetall('myhash');
console.log(hgetallRes); // >>> { field1: 'Hello', field2: 'World' }
// STEP_END

// REMOVE_START
assert.deepEqual(hgetallRes, { field1: 'Hello', field2: 'World' });
await redis.del('myhash');
// REMOVE_END

// STEP_START hdel
const hdelRes1 = await redis.hset('myhash', 'field1', 'foo');
console.log(hdelRes1); // >>> 1

const hdelRes2 = await redis.hdel('myhash', 'field1');
console.log(hdelRes2); // >>> 1

// Deleting a field that is not there removes nothing.
const hdelRes3 = await redis.hdel('myhash', 'field2');
console.log(hdelRes3); // >>> 0
// STEP_END

// REMOVE_START
assert.equal(hdelRes1, 1);
assert.equal(hdelRes2, 1);
assert.equal(hdelRes3, 0);
await redis.del('myhash');
// REMOVE_END

// STEP_START hvals
await redis.hset('myhash', { field1: 'Hello', field2: 'World' });

// HVALS follows the hash's field order, which Redis does not promise, so sort.
const hvalsRes = await redis.hvals('myhash');
console.log(hvalsRes.sort()); // >>> [ 'Hello', 'World' ]
// STEP_END

// REMOVE_START
assert.deepEqual(hvalsRes.sort(), ['Hello', 'World']);
await redis.del('myhash');
// REMOVE_END

// STEP_START hexpire
await redis.hset('myhash', { field1: 'Hello', field2: 'World' });

const hexpireRes1 = await redis.hexpire('myhash', 10, 'FIELDS', 2, 'field1', 'field2');
console.log(hexpireRes1); // >>> [ 1, 1 ]

const hexpireRes2 = await redis.httl('myhash', 'FIELDS', 2, 'field1', 'field2');
console.log(hexpireRes2); // >>> [ 10, 10 ]

// -2 means the field does not exist.
const hexpireRes3 = await redis.hexpire('myhash', 10, 'FIELDS', 1, 'nonexistent');
console.log(hexpireRes3); // >>> [ -2 ]
// STEP_END

// REMOVE_START
assert.deepEqual(hexpireRes1, [1, 1]);
assert.deepEqual(hexpireRes3, [-2]);
assert.ok(hexpireRes2.every((ttl) => ttl > 0 && ttl <= 10));
await redis.del('myhash');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END

