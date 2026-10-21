// EXAMPLE: hash_import
// HIDE_START
import assert from 'node:assert';
import { Redis } from 'ioredis';
// HIDE_END

// REMOVE_START
const cleanup = new Redis();
const userKeys = Array.from({ length: 1000 }, (_, i) => `user:${i + 1}`);
await cleanup.del(...userKeys);
{
// REMOVE_END
// STEP_START himport_basic
// Declare the field names once, when you create the client.
const redis = new Redis({
  himportFieldsets: [{ name: 'user', fields: ['name', 'email', 'age'] }],
});

// Create each hash by sending only its values.
const res1 = await redis.himport('SET', 'user:1', 'user', 'Alice', 'alice@example.com', '34');
console.log(res1); // >>> OK

await redis.himport('SET', 'user:2', 'user', 'Bob', 'bob@example.com', '41');
await redis.himport('SET', 'user:3', 'user', 'Carol', 'carol@example.com', '29');

// The result is an ordinary hash.
const res2 = await redis.hgetall('user:2');
console.log(res2);
// >>> { age: '41', name: 'Bob', email: 'bob@example.com' }
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK');
assert.deepEqual(res2, { name: 'Bob', email: 'bob@example.com', age: '41' });
redis.disconnect();
}
{
// REMOVE_END
// STEP_START himport_pipeline
const redis = new Redis({
  himportFieldsets: [{ name: 'user', fields: ['name', 'email', 'age'] }],
});

// Queue many imports and send them in one round trip.
const pipeline = redis.pipeline();
for (let i = 1; i <= 1000; i++) {
  pipeline.himport('SET', `user:${i}`, 'user', `user${i}`, `user${i}@example.com`, String(20 + i % 50));
}
const res3 = await pipeline.exec();

console.log(res3.length, res3.every(([err]) => err === null));
// >>> 1000 true

const res4 = await redis.hget('user:1000', 'email');
console.log(res4); // >>> user1000@example.com
// STEP_END

// REMOVE_START
assert.equal(res3.length, 1000);
assert.ok(res3.every(([err, result]) => err === null && result === 'OK'));
assert.equal(res4, 'user1000@example.com');
redis.disconnect();
}
await cleanup.del(...userKeys);
cleanup.disconnect();
// REMOVE_END
