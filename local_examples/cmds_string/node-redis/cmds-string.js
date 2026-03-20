// EXAMPLE: cmds_string
// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END

// REMOVE_START
await client.del(['key1', 'key2', 'nonexisting']);
// REMOVE_END

// STEP_START mget
await client.set('key1', 'Hello');
await client.set('key2', 'World');

const mgetResult = await client.mGet(['key1', 'key2', 'nonexisting']);
console.log(mgetResult); // >>> [ 'Hello', 'World', null ]
// STEP_END

// REMOVE_START
assert.deepEqual(mgetResult, ['Hello', 'World', null]);
await client.del(['key1', 'key2', 'nonexisting']);
// REMOVE_END

// HIDE_START
await client.close();
// HIDE_END
