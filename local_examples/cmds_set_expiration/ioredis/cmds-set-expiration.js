// EXAMPLE: cmds_set_expiration

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// STEP_START saddex
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res1 = await redis.saddex('myset', 'EX', 300, 'MEMBERS', 2, 'member1', 'member2');
console.log(res1); // >>> 1

const res2 = await redis.sttl('myset', 'MEMBERS', 2, 'member1', 'member2');
console.log(res2); // >>> [300, 300]

const res3 = await redis.saddex('myset', 'MNX', 'EX', 60, 'MEMBERS', 2, 'member2', 'member3');
console.log(res3); // >>> 0

const res4 = await redis.saddex('myset', 'KEEPTTL', 'MEMBERS', 2, 'member1', 'member3');
console.log(res4); // >>> 1

const res5 = await redis.sttl('myset', 'MEMBERS', 3, 'member1', 'member2', 'member3');
console.log(res5); // >>> [300, 300, -1]

// REMOVE_START
assert.equal(res1, 1);
assert.deepEqual(res2, [300, 300]);
assert.equal(res3, 0);
assert.equal(res4, 1);
assert.deepEqual(res5, [300, 300, -1]);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START sexpire
// REMOVE_START
await redis.del('myset', 'no-key');
// REMOVE_END
const res6 = await redis.sexpire('no-key', 20, 'NX', 'MEMBERS', 2, 'member1', 'member2');
console.log(res6); // >>> [-2, -2]

const res7 = await redis.sadd('myset', 'member1', 'member2');
console.log(res7); // >>> 2

const res8 = await redis.sexpire('myset', 10, 'MEMBERS', 3, 'member1', 'member2', 'member3');
console.log(res8); // >>> [1, 1, -2]

const res9 = await redis.sexpire('myset', 20, 'NX', 'MEMBERS', 1, 'member1');
console.log(res9); // >>> [0]

const res10 = await redis.sexpire('myset', 20, 'GT', 'MEMBERS', 1, 'member1');
console.log(res10); // >>> [1]

const res11 = await redis.sttl('myset', 'MEMBERS', 2, 'member1', 'member2');
console.log(res11); // >>> [20, 10]

// REMOVE_START
assert.deepEqual(res6, [-2, -2]);
assert.equal(res7, 2);
assert.deepEqual(res8, [1, 1, -2]);
assert.deepEqual(res9, [0]);
assert.deepEqual(res10, [1]);
assert.deepEqual(res11, [20, 10]);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START spexpire
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res12 = await redis.sadd('myset', 'member1', 'member2');
console.log(res12); // >>> 2

const res13 = await redis.spexpire('myset', 2000, 'MEMBERS', 2, 'member1', 'member2');
console.log(res13); // >>> [1, 1]

const res14 = await redis.spexpire('myset', 500, 'LT', 'MEMBERS', 1, 'member1');
console.log(res14); // >>> [1]

const res15 = await redis.spttl('myset', 'MEMBERS', 2, 'member1', 'member2');
console.log(res15); // >>> [491, 1982] (for example)

// REMOVE_START
assert.equal(res12, 2);
assert.deepEqual(res13, [1, 1]);
assert.deepEqual(res14, [1]);
assert.ok(res15[0] > 0 && res15[0] <= 500);
assert.ok(res15[1] > 500 && res15[1] <= 2000);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START sexpireat
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res16 = await redis.sadd('myset', 'member1', 'member2');
console.log(res16); // >>> 2

const res17 = await redis.sexpireat('myset', 4102444800, 'MEMBERS', 1, 'member1');
console.log(res17); // >>> [1]

const res18 = await redis.sexpiretime('myset', 'MEMBERS', 2, 'member1', 'member2');
console.log(res18); // >>> [4102444800, -1]

// A timestamp in the past deletes the member immediately.
const res19 = await redis.sexpireat('myset', 1, 'MEMBERS', 1, 'member2');
console.log(res19); // >>> [2]

const res20 = await redis.smembers('myset');
console.log(res20); // >>> ['member1']

// REMOVE_START
assert.equal(res16, 2);
assert.deepEqual(res17, [1]);
assert.deepEqual(res18, [4102444800, -1]);
assert.deepEqual(res19, [2]);
assert.deepEqual(res20, ['member1']);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START spexpireat
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res21 = await redis.sadd('myset', 'member1', 'member2');
console.log(res21); // >>> 2

const res22 = await redis.spexpireat('myset', 4102444800000, 'MEMBERS', 1, 'member1');
console.log(res22); // >>> [1]

const res23 = await redis.spexpireat('myset', 4102444800000, 'XX', 'MEMBERS', 1, 'member2');
console.log(res23); // >>> [0]

const res24 = await redis.spexpiretime('myset', 'MEMBERS', 2, 'member1', 'member2');
console.log(res24); // >>> [4102444800000, -1]

// REMOVE_START
assert.equal(res21, 2);
assert.deepEqual(res22, [1]);
assert.deepEqual(res23, [0]);
assert.deepEqual(res24, [4102444800000, -1]);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START sexpiretime
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res25 = await redis.sadd('myset', 'member1', 'member2');
console.log(res25); // >>> 2

const res26 = await redis.sexpire('myset', 300, 'MEMBERS', 1, 'member1');
console.log(res26); // >>> [1]

const res27 = await redis.sexpiretime('myset', 'MEMBERS', 3, 'member1', 'member2', 'member3');
console.log(res27); // >>> [1792684428, -1, -2] (for example)

// REMOVE_START
assert.equal(res25, 2);
assert.deepEqual(res26, [1]);
assert.ok(Math.abs(res27[0] - (Date.now() / 1000 + 300)) < 5);
assert.deepEqual(res27.slice(1), [-1, -2]);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START spexpiretime
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res28 = await redis.sadd('myset', 'member1', 'member2');
console.log(res28); // >>> 2

const res29 = await redis.spexpire('myset', 300000, 'MEMBERS', 1, 'member1');
console.log(res29); // >>> [1]

const res30 = await redis.spexpiretime('myset', 'MEMBERS', 3, 'member1', 'member2', 'member3');
console.log(res30); // >>> [1792684427589, -1, -2] (for example)

// REMOVE_START
assert.equal(res28, 2);
assert.deepEqual(res29, [1]);
assert.ok(Math.abs(res30[0] - (Date.now() + 300000)) < 5000);
assert.deepEqual(res30.slice(1), [-1, -2]);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START sttl
// REMOVE_START
await redis.del('myset', 'no-key');
// REMOVE_END
const res31 = await redis.sttl('no-key', 'MEMBERS', 2, 'member1', 'member2');
console.log(res31); // >>> [-2, -2]

const res32 = await redis.sadd('myset', 'member1', 'member2');
console.log(res32); // >>> 2

const res33 = await redis.sexpire('myset', 300, 'MEMBERS', 2, 'member1', 'member3');
console.log(res33); // >>> [1, -2]

const res34 = await redis.sttl('myset', 'MEMBERS', 3, 'member1', 'member2', 'member3');
console.log(res34); // >>> [300, -1, -2]

// REMOVE_START
assert.deepEqual(res31, [-2, -2]);
assert.equal(res32, 2);
assert.deepEqual(res33, [1, -2]);
assert.deepEqual(res34, [300, -1, -2]);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START spttl
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res35 = await redis.sadd('myset', 'member1', 'member2');
console.log(res35); // >>> 2

const res36 = await redis.spexpire('myset', 300000, 'MEMBERS', 1, 'member1');
console.log(res36); // >>> [1]

const res37 = await redis.spttl('myset', 'MEMBERS', 3, 'member1', 'member2', 'member3');
console.log(res37); // >>> [299993, -1, -2] (for example)

// REMOVE_START
assert.equal(res35, 2);
assert.deepEqual(res36, [1]);
assert.ok(res37[0] > 295000 && res37[0] <= 300000);
assert.deepEqual(res37.slice(1), [-1, -2]);
await redis.del('myset');
// REMOVE_END
// STEP_END

// STEP_START spersist
// REMOVE_START
await redis.del('myset');
// REMOVE_END
const res38 = await redis.sadd('myset', 'member1', 'member2');
console.log(res38); // >>> 2

const res39 = await redis.sexpire('myset', 300, 'MEMBERS', 2, 'member1', 'member2');
console.log(res39); // >>> [1, 1]

const res40 = await redis.spersist('myset', 'MEMBERS', 1, 'member2');
console.log(res40); // >>> [1]

const res41 = await redis.sttl('myset', 'MEMBERS', 2, 'member1', 'member2');
console.log(res41); // >>> [300, -1]

const res42 = await redis.spersist('myset', 'MEMBERS', 2, 'member2', 'member3');
console.log(res42); // >>> [-1, -2]

// REMOVE_START
assert.equal(res38, 2);
assert.deepEqual(res39, [1, 1]);
assert.deepEqual(res40, [1]);
assert.deepEqual(res41, [300, -1]);
assert.deepEqual(res42, [-1, -2]);
await redis.del('myset');
// REMOVE_END
// STEP_END

// HIDE_START
redis.disconnect();
// HIDE_END
