// EXAMPLE: sets_tutorial
// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END
// REMOVE_START
await redis.del('bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy');
// REMOVE_END

// STEP_START sadd
const res1 = await redis.sadd('bikes:racing:france', 'bike:1');
console.log(res1);  // >>> 1

const res2 = await redis.sadd('bikes:racing:france', 'bike:1');
console.log(res2);  // >>> 0

const res3 = await redis.sadd('bikes:racing:france', 'bike:2', 'bike:3');
console.log(res3);  // >>> 2

const res4 = await redis.sadd('bikes:racing:usa', 'bike:1', 'bike:4');
console.log(res4);  // >>> 2
// STEP_END

// REMOVE_START
assert.equal(res1, 1);
assert.equal(res2, 0);
assert.equal(res3, 2);
assert.equal(res4, 2);
// REMOVE_END

// STEP_START sismember
// HIDE_START
await redis.del('bikes:racing:france', 'bikes:racing:usa');
await redis.sadd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3');
await redis.sadd('bikes:racing:usa', 'bike:1', 'bike:4');
// HIDE_END
const res5 = await redis.sismember('bikes:racing:usa', 'bike:1');
console.log(res5);  // >>> 1

const res6 = await redis.sismember('bikes:racing:usa', 'bike:2');
console.log(res6);  // >>> 0
// STEP_END

// REMOVE_START
assert.equal(res5, 1);
assert.equal(res6, 0);
// REMOVE_END

// STEP_START sinter
// HIDE_START
await redis.del('bikes:racing:france', 'bikes:racing:usa');
await redis.sadd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3');
await redis.sadd('bikes:racing:usa', 'bike:1', 'bike:4');
// HIDE_END
const res7 = await redis.sinter('bikes:racing:france', 'bikes:racing:usa');
console.log(res7);  // >>> [ 'bike:1' ]
// STEP_END

// REMOVE_START
assert.deepEqual(res7, ['bike:1']);
// REMOVE_END

// STEP_START scard
// HIDE_START
await redis.del('bikes:racing:france');
await redis.sadd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3');
// HIDE_END
const res8 = await redis.scard('bikes:racing:france');
console.log(res8);  // >>> 3
// STEP_END

// REMOVE_START
assert.equal(res8, 3);
// REMOVE_END

// STEP_START sadd_smembers
await redis.del('bikes:racing:france');

const res9 = await redis.sadd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3');
console.log(res9);  // >>> 3

const res10 = await redis.smembers('bikes:racing:france');
console.log(res10);  // >>> [ 'bike:1', 'bike:2', 'bike:3' ]
// STEP_END

// REMOVE_START
assert.equal(res9, 3);
assert.deepEqual([...res10].sort(), ['bike:1', 'bike:2', 'bike:3']);
// REMOVE_END

// STEP_START smismember
// Recreate the set so this example runs on its own.
await redis.del('bikes:racing:france');
await redis.sadd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3');

const res11 = await redis.sismember('bikes:racing:france', 'bike:1');
console.log(res11);  // >>> 1

const res12 = await redis.smismember('bikes:racing:france', 'bike:2', 'bike:3', 'bike:4');
console.log(res12);  // >>> [ 1, 1, 0 ]
// STEP_END

// REMOVE_START
assert.equal(res11, 1);
assert.deepEqual(res12, [1, 1, 0]);
// REMOVE_END

// STEP_START sdiff
await redis.del('bikes:racing:france', 'bikes:racing:usa');

await redis.sadd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3');
await redis.sadd('bikes:racing:usa', 'bike:1', 'bike:4');

const res13 = await redis.sdiff('bikes:racing:france', 'bikes:racing:usa');
console.log(res13);  // >>> [ 'bike:2', 'bike:3' ]
// STEP_END

// REMOVE_START
assert.deepEqual([...res13].sort(), ['bike:2', 'bike:3']);
// REMOVE_END

// STEP_START multisets
await redis.del('bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy');

await redis.sadd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3');
await redis.sadd('bikes:racing:usa', 'bike:1', 'bike:4');
await redis.sadd('bikes:racing:italy', 'bike:1', 'bike:2', 'bike:3', 'bike:4');

const res14 = await redis.sinter(
  'bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy'
);
console.log(res14);  // >>> [ 'bike:1' ]

const res15 = await redis.sunion(
  'bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy'
);
console.log(res15);  // >>> [ 'bike:1', 'bike:2', 'bike:3', 'bike:4' ]

const res16 = await redis.sdiff(
  'bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy'
);
console.log(res16);  // >>> []

const res17 = await redis.sdiff('bikes:racing:usa', 'bikes:racing:france');
console.log(res17);  // >>> [ 'bike:4' ]

const res18 = await redis.sdiff('bikes:racing:france', 'bikes:racing:usa');
console.log(res18);  // >>> [ 'bike:2', 'bike:3' ]
// STEP_END

// REMOVE_START
assert.deepEqual(res14, ['bike:1']);
assert.deepEqual([...res15].sort(), ['bike:1', 'bike:2', 'bike:3', 'bike:4']);
assert.deepEqual(res16, []);
assert.deepEqual(res17, ['bike:4']);
assert.deepEqual([...res18].sort(), ['bike:2', 'bike:3']);
// REMOVE_END

// STEP_START srem
await redis.del('bikes:racing:france');

await redis.sadd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5');

const res19 = await redis.srem('bikes:racing:france', 'bike:1');
console.log(res19);  // >>> 1

const res20 = await redis.spop('bikes:racing:france');
console.log(res20);  // >>> bike:3 (for example)

const res21 = await redis.smembers('bikes:racing:france');
console.log(res21);  // >>> [ 'bike:2', 'bike:4', 'bike:5' ] (depends on the previous result)

const res22 = await redis.srandmember('bikes:racing:france');
console.log(res22);  // >>> bike:4 (for example)
// STEP_END

// REMOVE_START
assert.equal(res19, 1);
// None of the other results are deterministic.
// REMOVE_END

// STEP_START member_expiration
await redis.del('bikes:reserved');

const res23 = await redis.saddex('bikes:reserved', 'EX', 900, 'MEMBERS', 2, 'bike:1', 'bike:2');
console.log(res23);  // >>> 1

const res24 = await redis.sadd('bikes:reserved', 'bike:3');
console.log(res24);  // >>> 1

const res25 = await redis.sttl('bikes:reserved', 'MEMBERS', 3, 'bike:1', 'bike:2', 'bike:3');
console.log(res25);  // >>> [ 900, 900, -1 ]
// STEP_END

// REMOVE_START
assert.equal(res23, 1);
assert.equal(res24, 1);
assert.deepEqual(res25, [900, 900, -1]);
await redis.del('bikes:reserved');
// REMOVE_END

// STEP_START member_expiration_ms
await redis.del('bikes:reserved');
await redis.sadd('bikes:reserved', 'bike:1', 'bike:2');

const res26 = await redis.spexpire('bikes:reserved', 60000, 'MEMBERS', 1, 'bike:1');
console.log(res26);  // >>> [ 1 ]

const res27 = await redis.spttl('bikes:reserved', 'MEMBERS', 2, 'bike:1', 'bike:2');
console.log(res27);  // >>> [ 59994, -1 ] (for example)

const res28 = await redis.spersist('bikes:reserved', 'MEMBERS', 1, 'bike:1');
console.log(res28);  // >>> [ 1 ]

const res29 = await redis.spttl('bikes:reserved', 'MEMBERS', 1, 'bike:1');
console.log(res29);  // >>> [ -1 ]
// STEP_END

// REMOVE_START
assert.deepEqual(res26, [1]);
assert.deepEqual(res28, [1]);
assert.deepEqual(res29, [-1]);
await redis.del('bikes:reserved');
// REMOVE_END

// STEP_START member_expiration_at
await redis.del('bikes:reserved');
await redis.sadd('bikes:reserved', 'bike:1', 'bike:2');

// 4102444800 is an example Unix time in the future.
const res30 = await redis.sexpireat('bikes:reserved', 4102444800, 'MEMBERS', 1, 'bike:1');
console.log(res30);  // >>> [ 1 ]

const res31 = await redis.sexpiretime('bikes:reserved', 'MEMBERS', 2, 'bike:1', 'bike:2');
console.log(res31);  // >>> [ 4102444800, -1 ]
// STEP_END

// REMOVE_START
assert.deepEqual(res30, [1]);
assert.deepEqual(res31, [4102444800, -1]);
await redis.del('bikes:reserved', 'bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy');
redis.disconnect();
// REMOVE_END
