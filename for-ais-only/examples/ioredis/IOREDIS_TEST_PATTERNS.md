# ioredis Test File Patterns

This document describes the conventions used in ioredis documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable Node.js scripts** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Original tests**: `/path/to/docs/local_examples/client-specific/ioredis/*.js`
- **Sample template**: `/path/to/docs/for-ais-only/examples/ioredis/sample_test.js`

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// BINDER_ID <id>` | Optional identifier for online code runners |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

```javascript
// EXAMPLE: example_name
// BINDER_ID ioredis-example

// STEP_START connect
import { Redis } from 'ioredis';

const redis = new Redis();
// STEP_END

// REMOVE_START
await redis.del('mykey');
// REMOVE_END

// STEP_START operation_name
const res = await redis.set('mykey', 'Hello');
console.log(res); // >>> OK

const value = await redis.get('mykey');
console.log(value); // >>> Hello
// STEP_END

// REMOVE_START
if (res !== 'OK') throw new Error('Expected OK');
if (value !== 'Hello') throw new Error('Expected Hello');
await redis.del('mykey');
// REMOVE_END

// STEP_START close
redis.disconnect();
// STEP_END
```

## Key Patterns

### 1. Connection Setup
```javascript
// STEP_START connect
import { Redis } from 'ioredis';

const redis = new Redis();
// STEP_END

// Or with options:
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: ''
});
```

### 2. Assertions (in REMOVE blocks)
```javascript
// REMOVE_START
if (res !== 'OK') throw new Error('Expected OK');
if (value !== 'Hello') throw new Error('Expected Hello');
await redis.del('mykey');
// REMOVE_END
```

### 3. Console Output Comments
```javascript
console.log(res); // >>> OK
console.log(value); // >>> Hello

// Multi-line output:
console.log(JSON.stringify(data, null, 2));
/* >>>
{
  "field1": "value1",
  "field2": "value2"
}
*/
```

### 4. Hash Operations
```javascript
// Single field
await redis.hset('myhash', 'field1', 'value1');

// Multiple fields (object)
await redis.hset('myhash', {
    field2: 'value2',
    field3: 'value3'
});

// Get operations
const value = await redis.hget('myhash', 'field1');
const all = await redis.hgetall('myhash');
```

### 5. Disconnect
```javascript
// STEP_START close
redis.disconnect();
// STEP_END
```

## ioredis vs node-redis API Differences

| Operation | ioredis | node-redis |
|-----------|---------|------------|
| Import | `import { Redis } from 'ioredis'` | `import { createClient } from 'redis'` |
| Create | `new Redis()` | `createClient()` |
| Connect | Auto-connects | `await client.connect()` |
| Methods | lowercase: `hset`, `hget` | camelCase: `hSet`, `hGet` |
| Disconnect | `redis.disconnect()` | `await client.quit()` |

## Setup

```bash
cd examples/ioredis
npm install
```

## Running Tests

```bash
# Run directly
node sample_test.js

# Or use npm script
npm test
```

## package.json

```json
{
  "name": "ioredis-examples",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node sample_test.js"
  },
  "dependencies": {
    "ioredis": "^5.4.0"
  }
}
```

## See Also

- Sample template: `/path/to/docs/for-ais-only/examples/ioredis/sample_test.js`
- Landing example: `/path/to/docs/local_examples/client-specific/ioredis/landing.js`
