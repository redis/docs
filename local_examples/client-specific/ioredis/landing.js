// EXAMPLE: landing
// STEP_START connect
import { Redis } from 'ioredis';

const redis = new Redis();
// STEP_END

// STEP_START set_get_string
await redis.set('key', 'value');
const value = await redis.get('key');
console.log(value); // >>> value
// STEP_END

// STEP_START set_get_hash
await redis.hset('user-session:123', {
    name: 'John',
    surname: 'Smith',
    company: 'Redis',
    age: 29
});

const userSession = await redis.hgetall('user-session:123');
console.log(JSON.stringify(userSession, null, 2));
/* >>>
{
  "surname": "Smith",
  "name": "John",
  "company": "Redis",
  "age": "29"
}
 */
// STEP_END

// STEP_START close
redis.disconnect();
// STEP_END
