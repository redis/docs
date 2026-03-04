# node-redis Test File Patterns

This document describes the conventions used in node-redis documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable Node.js scripts** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Original tests**: `/path/to/node-redis/doctests/*.js`
- **Sample template**: `/path/to/docs/for-ais-only/examples/node-redis/sample_test.js`

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
// BINDER_ID nodejs-example

// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END

// REMOVE_START
await client.del('mykey');
// REMOVE_END

// STEP_START operation_name
const res = await client.set('mykey', 'Hello');
console.log(res); // >>> OK

const value = await client.get('mykey');
console.log(value); // >>> Hello
// STEP_END

// REMOVE_START
assert.equal(res, 'OK');
assert.equal(value, 'Hello');
await client.del('mykey');
// REMOVE_END

// HIDE_START
await client.quit();
// HIDE_END
```

## Key Patterns

### 1. Connection Setup (in HIDE block)
```javascript
// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END
```

### 2. Assertions (Always in REMOVE blocks)
```javascript
// REMOVE_START
assert.equal(res, 1);
assert.equal(value, 'Hello');
assert.deepEqual(data, { field1: 'value1', field2: 'value2' });
await client.del('mykey');
// REMOVE_END
```

### 3. Console Output Comments
```javascript
console.log(res); // >>> OK
console.log(value); // >>> Hello
console.log(data);
// >>> { field1: 'value1', field2: 'value2' }
```

### 4. Hash Operations
```javascript
// Single field
await client.hSet('myhash', 'field1', 'value1');

// Multiple fields (object)
await client.hSet('myhash', {
    field2: 'value2',
    field3: 'value3'
});

// Get operations
const value = await client.hGet('myhash', 'field1');
const all = await client.hGetAll('myhash');
```

### 5. Connection Cleanup (in HIDE block)
```javascript
// HIDE_START
await client.quit();
// HIDE_END
```

## Common Imports

```javascript
import assert from 'node:assert';
import { createClient } from 'redis';
import { SchemaFieldTypes, AggregateSteps } from 'redis';
```

## Setup

```bash
cd examples/node-redis
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
  "name": "node-redis-examples",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node sample_test.js"
  },
  "dependencies": {
    "redis": "^5.0.0"
  }
}
```

## API Notes

- node-redis uses **camelCase** method names: `hSet`, `hGet`, `hGetAll`
- All operations return Promises (use `await`)
- Connection requires explicit `connect()` call

## See Also

- Sample template: `/path/to/docs/for-ais-only/examples/node-redis/sample_test.js`
- Hash commands: `/path/to/node-redis/doctests/cmds-hash.js`
- String commands: `/path/to/node-redis/doctests/cmds-string.js`
