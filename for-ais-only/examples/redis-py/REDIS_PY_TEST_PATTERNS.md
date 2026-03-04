# redis-py Test File Patterns

This document describes the conventions used in redis-py documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable Python scripts** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Original tests**: `/path/to/redis-py/doctests/*.py`
- **Sample template**: `/path/to/docs/for-ais-only/examples/redis-py/sample_test.py`

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `# EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `# BINDER_ID <id>` | Optional identifier for online code runners |
| `# HIDE_START` / `# HIDE_END` | Code hidden from docs but still executed |
| `# REMOVE_START` / `# REMOVE_END` | Code completely removed from docs |
| `# STEP_START <name>` / `# STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

```python
# EXAMPLE: example_name
# BINDER_ID python-example

# HIDE_START
import redis

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
# HIDE_END

# REMOVE_START
# Clean up any existing data before tests
r.delete("mykey")
# REMOVE_END

# STEP_START operation_name
# Code that appears in documentation
res = r.set("mykey", "Hello")
print(res)
# >>> True

res2 = r.get("mykey")
print(res2)
# >>> Hello
# STEP_END

# REMOVE_START
assert res == True
assert res2 == "Hello"
r.delete("mykey")
# REMOVE_END
```

## Key Patterns

### 1. Connection Setup (in HIDE block)
```python
# HIDE_START
import redis

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
# HIDE_END
```

### 2. Assertions (Always in REMOVE blocks)
```python
# REMOVE_START
assert res == 1
assert value == "Hello"
assert data == {"field1": "value1", "field2": "value2"}
r.delete("mykey")
# REMOVE_END
```

### 3. Console Output Comments
Always include expected output as comments:
```python
print(res)
# >>> True

print(data)
# >>> {'field1': 'value1', 'field2': 'value2'}
```

### 4. Hash Operations
```python
# Single field
r.hset("myhash", "field1", "value1")

# Multiple fields
r.hset("myhash", mapping={"field2": "value2", "field3": "value3"})

# Get operations
value = r.hget("myhash", "field1")
all_values = r.hgetall("myhash")
```

### 5. Numeric Operations
```python
r.hincrby("stats", "counter", 1)
r.hincrbyfloat("stats", "rate", 0.5)
```

## Common Imports

```python
import redis
from redis.commands.search.field import TextField, NumericField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from redis.commands.json.path import Path
```

## Setup

Create a virtual environment and install dependencies:

```bash
cd examples/redis-py
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running Tests

```bash
# Activate venv first
source venv/bin/activate

# Run as standalone script
python sample_test.py
```

## requirements.txt

```txt
# Redis Python client
redis>=5.0.0
```

## See Also

- Sample template: `/path/to/docs/for-ais-only/examples/redis-py/sample_test.py`
- Hash commands: `/path/to/redis-py/doctests/cmds_hash.py`
- String commands: `/path/to/redis-py/doctests/cmds_string.py`
