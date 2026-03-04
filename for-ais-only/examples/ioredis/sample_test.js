// =============================================================================
// CANONICAL IOREDIS TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for ioredis
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
// BINDER_ID ioredis-sample

// STEP_START connect
import { Redis } from 'ioredis';

const redis = new Redis();
// STEP_END

// REMOVE_START
// Clean up any existing data before tests
await redis.del('mykey');
await redis.del('myhash');
await redis.del('bike:1');
await redis.del('bike:1:stats');
// REMOVE_END

// STEP_START string_ops
// Basic string SET/GET operations
const res1 = await redis.set('mykey', 'Hello');
console.log(res1); // >>> OK

const res2 = await redis.get('mykey');
console.log(res2); // >>> Hello
// STEP_END

// REMOVE_START
if (res1 !== 'OK') throw new Error('Expected OK');
if (res2 !== 'Hello') throw new Error('Expected Hello');
await redis.del('mykey');
// REMOVE_END

// STEP_START hash_ops
// Hash operations: HSET, HGET, HGETALL
const res3 = await redis.hset('myhash', 'field1', 'value1');
console.log(res3); // >>> 1

const res4 = await redis.hset('myhash', {
    'field2': 'value2',
    'field3': 'value3'
});
console.log(res4); // >>> 2

const res5 = await redis.hget('myhash', 'field1');
console.log(res5); // >>> value1

const res6 = await redis.hgetall('myhash');
console.log(res6);
// >>> { field1: 'value1', field2: 'value2', field3: 'value3' }
// STEP_END

// REMOVE_START
if (res3 !== 1) throw new Error('Expected 1');
if (res4 !== 2) throw new Error('Expected 2');
if (res5 !== 'value1') throw new Error('Expected value1');
await redis.del('myhash');
// REMOVE_END

// STEP_START hash_tutorial
// Tutorial-style example with bike data
await redis.hset('bike:1', {
    model: 'Deimos',
    brand: 'Ergonom',
    type: 'Enduro bikes',
    price: 4972
});

const res7 = await redis.hget('bike:1', 'model');
console.log(res7); // >>> Deimos

const res8 = await redis.hget('bike:1', 'price');
console.log(res8); // >>> 4972

const res9 = await redis.hgetall('bike:1');
console.log(JSON.stringify(res9, null, 2));
/* >>>
{
  "model": "Deimos",
  "brand": "Ergonom",
  "type": "Enduro bikes",
  "price": "4972"
}
*/
// STEP_END

// REMOVE_START
if (res7 !== 'Deimos') throw new Error('Expected Deimos');
if (res8 !== '4972') throw new Error('Expected 4972');
await redis.del('bike:1');
// REMOVE_END

// STEP_START hincrby
// Numeric operations on hash fields
await redis.hset('bike:1:stats', 'rides', 0);

const res10 = await redis.hincrby('bike:1:stats', 'rides', 1);
console.log(res10); // >>> 1

const res11 = await redis.hincrby('bike:1:stats', 'rides', 1);
console.log(res11); // >>> 2

const res12 = await redis.hincrby('bike:1:stats', 'crashes', 1);
console.log(res12); // >>> 1
// STEP_END

// REMOVE_START
if (res10 !== 1) throw new Error('Expected 1');
if (res11 !== 2) throw new Error('Expected 2');
if (res12 !== 1) throw new Error('Expected 1');
await redis.del('bike:1:stats');
// REMOVE_END

// STEP_START close
redis.disconnect();
// STEP_END

