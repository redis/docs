// EXAMPLE: cmds_cnxmgmt

// HIDE_START
import { Redis } from 'ioredis';

const redis = new Redis();
// HIDE_END

// STEP_START auth1
const res1 = await redis.auth('temp_pass');
console.log(res1); // >>> OK

const res2 = await redis.auth('default', 'temp_pass');
console.log(res2); // >>> OK
// STEP_END

// STEP_START auth2
const res3 = await redis.auth('test-user', 'strong_password');
console.log(res3); // >>> OK
// STEP_END

// HIDE_START
redis.disconnect();
// HIDE_END
