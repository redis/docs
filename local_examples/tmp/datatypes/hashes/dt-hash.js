// EXAMPLE: hash_tutorial
// BINDER_ID nodejs-dt-hash
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END
// STEP_START set_get_all
const res1 = await client.hSet(
  'bike:1',
  {
    'model': 'Deimos',
    'brand': 'Ergonom',
    'type': 'Enduro bikes',
    'price': 4972,
  }
)
console.log(res1) // 4

const res2 = await client.hGet('bike:1', 'model')
console.log(res2)  // 'Deimos'

const res3 = await client.hGet('bike:1', 'price')
console.log(res3)  // '4972'

const res4 = await client.hGetAll('bike:1')
console.log(res4)  
/*
{
  brand: 'Ergonom',
  model: 'Deimos',
  price: '4972',
  type: 'Enduro bikes'
}
*/
// STEP_END

// REMOVE_START
assert.equal(res1, 4);
assert.equal(res2, 'Deimos');
assert.equal(res3, '4972');
assert.deepEqual(res4, {
  model: 'Deimos',
  brand: 'Ergonom',
  type: 'Enduro bikes',
  price: '4972'
});
// REMOVE_END

// STEP_START hmGet
// Recreate the bike:1 hash so this example runs on its own.
await client.del('bike:1')
await client.hSet(
  'bike:1',
  {
    'model': 'Deimos',
    'brand': 'Ergonom',
    'type': 'Enduro bikes',
    'price': 4972,
  }
)

const res5 = await client.hmGet('bike:1', ['model', 'price'])
console.log(res5)  // ['Deimos', '4972']
// STEP_END

// REMOVE_START
assert.deepEqual(Object.values(res5), ['Deimos', '4972'])
// REMOVE_END

// STEP_START hIncrBy
// Recreate the bike:1 hash so this example runs on its own.
await client.del('bike:1')
await client.hSet(
  'bike:1',
  {
    'model': 'Deimos',
    'brand': 'Ergonom',
    'type': 'Enduro bikes',
    'price': 4972,
  }
)

const res6 = await client.hIncrBy('bike:1', 'price', 100)
console.log(res6)  // 5072
const res7 = await client.hIncrBy('bike:1', 'price', -100)
console.log(res7)  // 4972
// STEP_END

// REMOVE_START
assert.equal(res6, 5072)
assert.equal(res7, 4972)
// REMOVE_END

// STEP_START hIncrBy_hGet_hMget
const res11 = await client.hIncrBy('bike:1:stats', 'rides', 1)
console.log(res11)  // 1
const res12 = await client.hIncrBy('bike:1:stats', 'rides', 1)
console.log(res12)  // 2
const res13 = await client.hIncrBy('bike:1:stats', 'rides', 1)
console.log(res13)  // 3
const res14 = await client.hIncrBy('bike:1:stats', 'crashes', 1)
console.log(res14)  // 1
const res15 = await client.hIncrBy('bike:1:stats', 'owners', 1)
console.log(res15)  // 1
const res16 = await client.hGet('bike:1:stats', 'rides')
console.log(res16)  // 3
const res17 = await client.hmGet('bike:1:stats', ['crashes', 'owners'])
console.log(res17)  // ['1', '1']
// STEP_END

// REMOVE_START
assert.equal(res11, 1);
assert.equal(res12, 2);
assert.equal(res13, 3);
assert.equal(res14, 1);
assert.equal(res15, 1);
assert.equal(res16, '3');
assert.deepEqual(res17, ['1', '1']);
// REMOVE_END

// STEP_START hExpire
// Recreate the sensor:sensor1 hash so this example runs on its own.
await client.del('sensor:sensor1')
await client.hSet('sensor:sensor1', { 'air_quality': 256, 'battery_level': 89 })

// Set a TTL of 60 seconds on two fields of the hash.
const res18 = await client.hExpire('sensor:sensor1', ['air_quality', 'battery_level'], 60)
console.log(res18)  // [1, 1]

// Retrieve the remaining TTL for those fields.
const res19 = await client.hTTL('sensor:sensor1', ['air_quality', 'battery_level'])
console.log(res19)  // [60, 60] (or close to 60)
// STEP_END

// REMOVE_START
assert.deepEqual(res18, [1, 1]);
assert(res19.every(ttl => ttl > 0 && ttl <= 60));
// REMOVE_END

// STEP_START hpExpire
// Recreate the sensor:sensor1 hash so this example runs on its own.
await client.del('sensor:sensor1')
await client.hSet('sensor:sensor1', { 'air_quality': 256, 'battery_level': 89 })

// Set the TTL of the 'air_quality' field in milliseconds.
const res20 = await client.hpExpire('sensor:sensor1', ['air_quality'], 60000)
console.log(res20)  // [1]

// Retrieve the remaining TTL in milliseconds.
const res21 = await client.hpTTL('sensor:sensor1', ['air_quality'])
console.log(res21)  // [59994] (your actual value may vary)
// STEP_END

// REMOVE_START
assert.deepEqual(res20, [1]);
assert(res21.every(pttl => pttl > 0 && pttl <= 60000));
// REMOVE_END

// STEP_START hExpireAt
// Recreate the sensor:sensor1 hash so this example runs on its own.
await client.del('sensor:sensor1')
await client.hSet('sensor:sensor1', { 'air_quality': 256, 'battery_level': 89 })

// Set the expiration of 'air_quality' to a Unix time 24 hours from now.
const expireAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60
const res22 = await client.hExpireAt('sensor:sensor1', ['air_quality'], expireAt)
console.log(res22)  // [1]

// Retrieve the expiration time as a Unix timestamp in seconds.
const res23 = await client.hExpireTime('sensor:sensor1', ['air_quality'])
console.log(res23)  // [1717668041] (your actual value will vary)
// STEP_END

// REMOVE_START
assert.deepEqual(res22, [1]);
assert(res23.every(ts => ts > Math.floor(Date.now() / 1000)));
await client.close();
// REMOVE_END