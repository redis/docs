// EXAMPLE: cmds_list

// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// STEP_START lpush
// REMOVE_START
await redis.del('mylist');
// REMOVE_END
const res1 = await redis.lpush('mylist', 'world');
console.log(res1); // >>> 1

const res2 = await redis.lpush('mylist', 'hello');
console.log(res2); // >>> 2

const res3 = await redis.lrange('mylist', 0, -1);
console.log(res3); // >>> ['hello', 'world']
// STEP_END

// REMOVE_START
assert.equal(res1, 1);
assert.equal(res2, 2);
assert.deepEqual(res3, ['hello', 'world']);
await redis.del('mylist');
// REMOVE_END

// STEP_START lrange
// REMOVE_START
await redis.del('mylist');
// REMOVE_END
const res4 = await redis.rpush('mylist', 'one');
console.log(res4); // >>> 1

const res5 = await redis.rpush('mylist', 'two');
console.log(res5); // >>> 2

const res6 = await redis.rpush('mylist', 'three');
console.log(res6); // >>> 3

const res7 = await redis.lrange('mylist', 0, 0);
console.log(res7); // >>> ['one']

const res8 = await redis.lrange('mylist', -3, 2);
console.log(res8); // >>> ['one', 'two', 'three']

const res9 = await redis.lrange('mylist', -100, 100);
console.log(res9); // >>> ['one', 'two', 'three']

const res10 = await redis.lrange('mylist', 5, 10);
console.log(res10); // >>> []
// STEP_END

// REMOVE_START
assert.deepEqual(res7, ['one']);
assert.deepEqual(res8, ['one', 'two', 'three']);
assert.deepEqual(res9, ['one', 'two', 'three']);
assert.deepEqual(res10, []);
await redis.del('mylist');
// REMOVE_END

// STEP_START llen
// REMOVE_START
await redis.del('mylist');
// REMOVE_END
const res11 = await redis.lpush('mylist', 'World');
console.log(res11); // >>> 1

const res12 = await redis.lpush('mylist', 'Hello');
console.log(res12); // >>> 2

const res13 = await redis.llen('mylist');
console.log(res13); // >>> 2
// STEP_END

// REMOVE_START
assert.equal(res13, 2);
await redis.del('mylist');
// REMOVE_END

// STEP_START rpush
// REMOVE_START
await redis.del('mylist');
// REMOVE_END
const res14 = await redis.rpush('mylist', 'hello');
console.log(res14); // >>> 1

const res15 = await redis.rpush('mylist', 'world');
console.log(res15); // >>> 2

const res16 = await redis.lrange('mylist', 0, -1);
console.log(res16); // >>> ['hello', 'world']
// STEP_END

// REMOVE_START
assert.deepEqual(res16, ['hello', 'world']);
await redis.del('mylist');
// REMOVE_END

// STEP_START lpop
// REMOVE_START
await redis.del('mylist');
// REMOVE_END
const res17 = await redis.rpush('mylist', 'one', 'two', 'three', 'four', 'five');
console.log(res17); // >>> 5

const res18 = await redis.lpop('mylist');
console.log(res18); // >>> one

const res19 = await redis.lpop('mylist', 2);
console.log(res19); // >>> ['two', 'three']

const res20 = await redis.lrange('mylist', 0, -1);
console.log(res20); // >>> ['four', 'five']
// STEP_END

// REMOVE_START
assert.equal(res18, 'one');
assert.deepEqual(res19, ['two', 'three']);
assert.deepEqual(res20, ['four', 'five']);
await redis.del('mylist');
// REMOVE_END

// STEP_START rpop
// REMOVE_START
await redis.del('mylist');
// REMOVE_END
const res21 = await redis.rpush('mylist', 'one', 'two', 'three', 'four', 'five');
console.log(res21); // >>> 5

const res22 = await redis.rpop('mylist');
console.log(res22); // >>> five

const res23 = await redis.rpop('mylist', 2);
console.log(res23); // >>> ['four', 'three']

const res24 = await redis.lrange('mylist', 0, -1);
console.log(res24); // >>> ['one', 'two']
// STEP_END

// REMOVE_START
assert.equal(res22, 'five');
assert.deepEqual(res23, ['four', 'three']);
assert.deepEqual(res24, ['one', 'two']);
await redis.del('mylist');
// REMOVE_END

// HIDE_START
redis.disconnect();
// HIDE_END
