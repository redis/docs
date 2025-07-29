// EXAMPLE: local_string_demo
// HIDE_START
const redis = require('redis');
const client = redis.createClient();

await client.connect();
// HIDE_END

// STEP_START set_get
let res = await client.set('mykey', 'Hello Redis!');
console.log(res);
// >>> OK
res = await client.get('mykey');
console.log(res);
// >>> Hello Redis!
// REMOVE_START
console.assert(res === 'Hello Redis!');
await client.del('mykey');
// REMOVE_END
// STEP_END

// STEP_START incr
res = await client.set('counter', '10');
console.log(res);
// >>> OK
res = await client.incr('counter');
console.log(res);
// >>> 11
res = await client.incrBy('counter', 5);
console.log(res);
// >>> 16
// REMOVE_START
console.assert(res === 16);
await client.del('counter');
// REMOVE_END
// STEP_END
