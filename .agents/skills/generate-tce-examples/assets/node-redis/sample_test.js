// =============================================================================
// CANONICAL NODE-REDIS TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for node-redis
// documentation test files. These tests serve dual purposes:
// 1. Executable tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// RUN: node sample_test.js
// =============================================================================

// EXAMPLE: sample_example
// BINDER_ID nodejs-sample

// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END

// REMOVE_START
// Clean up any existing data before tests
await client.del('mykey');
await client.del('myhash');
await client.del('bike:1');
await client.del('bike:1:stats');
// REMOVE_END

// STEP_START string_ops
// Basic string SET/GET operations
const res1 = await client.set('mykey', 'Hello');
console.log(res1); // >>> OK

const res2 = await client.get('mykey');
console.log(res2); // >>> Hello
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK');
assert.equal(res2, 'Hello');
await client.del('mykey');
// REMOVE_END

// STEP_START hash_ops
// Hash operations: HSET, HGET, HGETALL
const res3 = await client.hSet('myhash', 'field1', 'value1');
console.log(res3); // >>> 1

const res4 = await client.hSet('myhash', {
    'field2': 'value2',
    'field3': 'value3'
});
console.log(res4); // >>> 2

const res5 = await client.hGet('myhash', 'field1');
console.log(res5); // >>> value1

const res6 = await client.hGetAll('myhash');
console.log(res6); // >>> { field1: 'value1', field2: 'value2', field3: 'value3' }
// STEP_END

// REMOVE_START
assert.equal(res3, 1);
assert.equal(res4, 2);
assert.equal(res5, 'value1');
assert.deepEqual(res6, { field1: 'value1', field2: 'value2', field3: 'value3' });
await client.del('myhash');
// REMOVE_END

// STEP_START hash_tutorial
// Tutorial-style example with bike data
const bike1 = {
    model: 'Deimos',
    brand: 'Ergonom',
    type: 'Enduro bikes',
    price: '4972'
};

const res7 = await client.hSet('bike:1', bike1);
console.log(res7); // >>> 4

const res8 = await client.hGet('bike:1', 'model');
console.log(res8); // >>> Deimos

const res9 = await client.hGet('bike:1', 'price');
console.log(res9); // >>> 4972

const res10 = await client.hGetAll('bike:1');
console.log(res10);
// >>> { model: 'Deimos', brand: 'Ergonom', type: 'Enduro bikes', price: '4972' }
// STEP_END

// REMOVE_START
assert.equal(res7, 4);
assert.equal(res8, 'Deimos');
assert.equal(res9, '4972');
assert.deepEqual(res10, { model: 'Deimos', brand: 'Ergonom', type: 'Enduro bikes', price: '4972' });
await client.del('bike:1');
// REMOVE_END

// STEP_START hincrby
// Numeric operations on hash fields
await client.hSet('bike:1:stats', 'rides', 0);

const res11 = await client.hIncrBy('bike:1:stats', 'rides', 1);
console.log(res11); // >>> 1

const res12 = await client.hIncrBy('bike:1:stats', 'rides', 1);
console.log(res12); // >>> 2

const res13 = await client.hIncrBy('bike:1:stats', 'crashes', 1);
console.log(res13); // >>> 1
// STEP_END

// REMOVE_START
assert.equal(res11, 1);
assert.equal(res12, 2);
assert.equal(res13, 1);
await client.del('bike:1:stats');
// REMOVE_END

// HIDE_START
await client.quit();
// HIDE_END

