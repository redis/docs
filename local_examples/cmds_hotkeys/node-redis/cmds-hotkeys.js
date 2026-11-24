// EXAMPLE: cmds_hotkeys
// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END

// REMOVE_START
await client.hotkeysStop();
await client.hotkeysReset();
await client.del(['product:1', 'product:2', 'product:3']);
await client.mSet({ 'product:1': 'Laptop', 'product:2': 'Phone', 'product:3': 'Tablet' });
// REMOVE_END

// STEP_START hotkeys
// Track the 10 hottest keys by CPU time and network bytes.
const res1 = await client.hotkeysStart({
    METRICS: { count: 2, CPU: true, NET: true },
    COUNT: 10
});
console.log(res1); // >>> OK

// Generate some traffic. In production, this is your application's workload.
for (let i = 0; i < 100; i++) {
    await client.get('product:1');
}

for (let i = 0; i < 10; i++) {
    await client.get('product:2');
}

await client.get('product:3');

const res2 = await client.hotkeysGet();
console.log(res2.trackingActive); // >>> 1

const byNet = res2.byNetBytes.map(({ key, value }) => [key, value]);
console.log(byNet);
// >>> [ [ 'product:1', 4000 ], [ 'product:2', 390 ], [ 'product:3', 40 ] ]

const res3 = await client.hotkeysStop();
console.log(res3); // >>> OK

const res4 = await client.hotkeysReset();
console.log(res4); // >>> OK
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK');
assert.equal(res2.trackingActive, 1);
assert.deepEqual(byNet, [['product:1', 4000], ['product:2', 390], ['product:3', 40]]);
assert.equal(res3, 'OK');
assert.equal(res4, 'OK');
assert.equal(await client.hotkeysGet(), null);
await client.del(['product:1', 'product:2', 'product:3']);
// REMOVE_END

// HIDE_START
await client.close();
// HIDE_END
