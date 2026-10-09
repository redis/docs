// EXAMPLE: hash_import
// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END

// REMOVE_START
const userKeys = Array.from({ length: 1000 }, (_, i) => `user:${i + 1}`);
await client.del(userKeys);
// REMOVE_END

// STEP_START himport_basic
// Declare the field names once.
await client.hImportPrepare('user', ['name', 'email', 'age']);

// Create each hash by sending only its values.
const res1 = await client.hImportSet('user:1', 'user', ['Alice', 'alice@example.com', '34']);
console.log(res1); // >>> OK

await client.hImportSet('user:2', 'user', ['Bob', 'bob@example.com', '41']);
await client.hImportSet('user:3', 'user', ['Carol', 'carol@example.com', '29']);

// The result is an ordinary hash.
const res2 = await client.hGetAll('user:2');
console.log(res2);
// >>> { age: '41', name: 'Bob', email: 'bob@example.com' }
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK');
assert.deepEqual(res2, { name: 'Bob', email: 'bob@example.com', age: '41' });
// REMOVE_END

// STEP_START himport_pipeline
await client.hImportPrepare('user', ['name', 'email', 'age']);

// Commands issued together are automatically pipelined.
const imports = [];
for (let i = 1; i <= 1000; i++) {
  imports.push(
    client.hImportSet(`user:${i}`, 'user', [`user${i}`, `user${i}@example.com`, String(20 + i % 50)])
  );
}
const res3 = await Promise.all(imports);

console.log(res3.length, res3.every((r) => r === 'OK'));
// >>> 1000 true

const res4 = await client.hGet('user:1000', 'email');
console.log(res4); // >>> user1000@example.com
// STEP_END

// REMOVE_START
assert.equal(res3.length, 1000);
assert.ok(res3.every((r) => r === 'OK'));
assert.equal(res4, 'user1000@example.com');
await client.del(userKeys);
await client.hImportDiscard('user');
// REMOVE_END

// HIDE_START
await client.quit();
// HIDE_END
