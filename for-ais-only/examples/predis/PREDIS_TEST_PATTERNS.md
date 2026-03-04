# Predis Test File Patterns

This document describes the conventions used in Predis documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable PHPUnit tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Sample template**: `/path/to/docs/for-ais-only/examples/predis/SampleTest.php`

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// BINDER_ID <id>` | Optional identifier for online code runners |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

```php
<?php
// EXAMPLE: example_name
// BINDER_ID php-example

// REMOVE_START
namespace Predis\Examples;

use PHPUnit\Framework\TestCase;
// REMOVE_END

// HIDE_START
require __DIR__ . '/vendor/autoload.php';

use Predis\Client;
// HIDE_END

// REMOVE_START
class SampleTest extends TestCase
{
    public function testRun()
    {
// REMOVE_END
        // STEP_START connect
        $redis = new Client([
            'host' => '127.0.0.1',
            'port' => 6379,
        ]);
        // STEP_END

        // REMOVE_START
        $redis->del('mykey');
        // REMOVE_END

        // STEP_START string_ops
        $res = $redis->set('mykey', 'Hello');
        echo $res . "\n"; // >>> OK

        $value = $redis->get('mykey');
        echo $value . "\n"; // >>> Hello
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res);
        $this->assertEquals('Hello', $value);
        $redis->del('mykey');
        // REMOVE_END
// REMOVE_START
    }
}
// REMOVE_END
```

## Key Patterns

### 1. Autoload and Imports (in HIDE block)
```php
// HIDE_START
require __DIR__ . '/vendor/autoload.php';

use Predis\Client;
// HIDE_END
```

### 2. Test Class Structure (in REMOVE blocks)
```php
// REMOVE_START
namespace Predis\Examples;

use PHPUnit\Framework\TestCase;
// REMOVE_END

// REMOVE_START
class SampleTest extends TestCase
{
    public function testRun()
    {
// REMOVE_END
        // ... code ...
// REMOVE_START
    }
}
// REMOVE_END
```

### 3. Connection Setup
```php
// STEP_START connect
$redis = new Client([
    'host' => '127.0.0.1',
    'port' => 6379,
]);
// STEP_END
```

### 4. Assertions (in REMOVE blocks)
```php
// REMOVE_START
$this->assertEquals('OK', $res);
$this->assertEquals('Hello', $value);
$this->assertCount(3, $all);
$redis->del('mykey');
// REMOVE_END
```

### 5. Console Output Comments
```php
echo $res . "\n"; // >>> OK
echo $value . "\n"; // >>> Hello

print_r($all);
/* >>>
Array
(
    [field1] => value1
    [field2] => value2
)
*/
```

### 6. Hash Operations
```php
// Single field
$redis->hset('myhash', 'field1', 'value1');

// Multiple fields
$redis->hmset('myhash', [
    'field2' => 'value2',
    'field3' => 'value3',
]);

// Get operations
$value = $redis->hget('myhash', 'field1');
$all = $redis->hgetall('myhash');
```

## Setup

```bash
cd examples/predis
composer install
```

## Running Tests

```bash
# Run with PHPUnit
./vendor/bin/phpunit SampleTest.php

# Run specific test
./vendor/bin/phpunit --filter testRun SampleTest.php
```

## composer.json

```json
{
    "name": "redis/predis-examples",
    "description": "Predis example tests for Redis documentation",
    "type": "project",
    "require": {
        "php": ">=8.1",
        "predis/predis": "^2.2"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0"
    },
    "autoload": {
        "psr-4": {
            "Redis\\Examples\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Redis\\Examples\\Tests\\": "tests/"
        }
    }
}
```

## API Notes

- Predis uses lowercase method names: `hset`, `hget`, `hgetall`
- `hmset` for setting multiple hash fields at once
- Returns strings or arrays depending on command

## See Also

- Sample template: `/path/to/docs/for-ais-only/examples/predis/SampleTest.php`
