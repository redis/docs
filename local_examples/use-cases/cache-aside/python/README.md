---
title: Cache-Aside Pattern Python Tutorial
description: Complete Python implementation of the cache-aside pattern with Redis
categories:
  - docs
  - develop
  - use-cases
---

# Cache-Aside Pattern Python Tutorial

Complete Python implementation of the cache-aside pattern using Redis.

---

## 📋 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Example

```bash
python cache_aside_example.py
```

### 3. Run Tests

```bash
# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run with coverage
pytest --cov

# Run specific test file
pytest test_cache_manager.py

# Run integration tests only
pytest -m integration

# Run async tests only
pytest -m async
```

---

## 📁 File Structure

### Core Implementation

- **`cache_config.py`** - Configuration class for cache settings
- **`cache_manager.py`** - Main cache manager classes (sync and async)
- **`cache_aside.py`** - Utility functions for cache operations
- **`mock_data_store.py`** - Mock data source for testing

### Examples

- **`cache_aside_example.py`** - Complete working example demonstrating all features

### Tests

- **`conftest.py`** - Pytest fixtures and configuration
- **`test_cache_manager.py`** - Unit tests for cache manager (18 tests)
- **`test_cache_aside.py`** - Unit tests for utility functions (14 tests)
- **`test_integration.py`** - Integration tests with real Redis (9 tests)
- **`test_async.py`** - Async tests (11 tests)

### Configuration

- **`requirements.txt`** - Core dependencies
- **`requirements-test.txt`** - Test dependencies
- **`pytest.ini`** - Pytest configuration
- **`SPECIFICATION.md`** - Complete specification (1,350 lines)

---

## 🚀 Usage Examples

### Basic Cache-Aside

```python
from cache_config import CacheConfig
from cache_manager import CacheAsideManager
from mock_data_store import MockDataStore

# Setup
config = CacheConfig()
redis_client = config.create_redis_client()
data_store = MockDataStore()
manager = CacheAsideManager(redis_client, config)

# Use
user = manager.get('user:1', data_store.get)
print(user)  # {'id': 1, 'name': 'Alice', ...}
```

### Cache Invalidation

```python
# Update data
data_store.update('user:1', {'id': 1, 'name': 'Alice Updated'})

# Invalidate cache
manager.invalidate('user:1')

# Fetch updated data
user = manager.get('user:1', data_store.get)
```

### Async Usage

```python
import asyncio
from cache_manager import AsyncCacheAsideManager

async def main():
    config = CacheConfig()
    redis = await aioredis.create_redis_pool('redis://localhost')
    manager = AsyncCacheAsideManager(redis, config)
    
    async def data_source(key):
        # Async data fetch
        return {'id': 1}
    
    user = await manager.get('user:1', data_source)
    print(user)

asyncio.run(main())
```

### Utility Functions

```python
from cache_aside import (
    get_cached_data,
    invalidate_cache,
    invalidate_pattern,
    set_ttl,
    get_ttl,
    serialize_json,
    deserialize_json
)

# Get with fallback
data = get_cached_data(redis_client, 'key', data_source)

# Invalidate pattern
deleted = invalidate_pattern(redis_client, 'cache:user:*')

# TTL management
set_ttl(redis_client, 'key', 120)
ttl = get_ttl(redis_client, 'key')
```

---

## 🧪 Test Coverage

### Test Statistics

- **Total Tests:** 52+
- **Unit Tests:** 32 tests
- **Integration Tests:** 9 tests
- **Async Tests:** 11 tests
- **Coverage Target:** 85%+

### Test Categories

#### Unit Tests (test_cache_manager.py)
- Cache hit/miss logic
- Cache invalidation
- Error handling
- TTL management
- Hit ratio calculation
- Edge cases (empty string, zero, false values)

#### Utility Tests (test_cache_aside.py)
- Basic cache-aside functions
- Invalidation functions
- TTL functions
- Serialization (JSON, MessagePack, compressed)
- Error handling with fallback
- Retry logic

#### Integration Tests (test_integration.py)
- Basic cache-aside flow with real Redis
- Update and invalidation
- TTL expiration
- Cache stampede prevention
- Pattern invalidation
- Multiple keys performance
- Null value handling
- Serialization with real Redis

#### Async Tests (test_async.py)
- Async cache hit/miss
- Async invalidation
- Async error handling
- Async concurrent requests
- Async multiple keys
- Async error recovery

---

## 📊 Performance

### Cache Hit vs Miss

```
Cache Miss (first fetch):  ~100ms (with 100ms data source latency)
Cache Hit (subsequent):    ~1ms
Speedup:                   ~100x
```

### Multiple Keys

```
First fetch (4 keys):      ~400ms (4 x 100ms)
Second fetch (4 keys):     ~4ms (all cached)
Speedup:                   ~100x
```

---

## 🔧 Configuration

### CacheConfig Options

```python
config = CacheConfig(
    host='localhost',           # Redis host
    port=6379,                  # Redis port
    db=0,                       # Redis database
    ttl=60,                     # Default TTL in seconds
    key_prefix='cache:',        # Cache key prefix
    socket_timeout=5.0,         # Socket timeout
    socket_connect_timeout=5.0  # Connection timeout
)
```

### Pytest Configuration

```ini
[pytest]
testpaths = .
python_files = test_*.py
addopts = -v --cov=. --cov-report=html --timeout=10
asyncio_mode = auto
```

---

## 🐛 Troubleshooting

### Redis Connection Error

```
Error: ConnectionRefusedError
Solution: Ensure Redis is running on localhost:6379
```

### Test Failures

```bash
# Run with verbose output
pytest -v --tb=short

# Run specific test
pytest test_cache_manager.py::TestCacheAsideManager::test_cache_hit_returns_cached_value

# Run with print statements
pytest -s
```

### Coverage Issues

```bash
# Generate HTML coverage report
pytest --cov --cov-report=html

# View report
open htmlcov/index.html
```

---

## 📚 Documentation

- **SPECIFICATION.md** - Complete technical specification (1,350 lines)
- **../cache-aside-specification.md** - Language-neutral specification
- **../cache-aside-tutorial-overview.md** - Tutorial overview

---

## 🎯 Learning Paths

### Path 1: Understand the Pattern (30 min)
1. Read `../cache-aside-specification.md` sections 1-2
2. Run `cache_aside_example.py`
3. Review `cache_manager.py` implementation

### Path 2: Implement from Scratch (2 hours)
1. Read SPECIFICATION.md Part 1 (Implementation)
2. Implement each class from scratch
3. Run tests to verify

### Path 3: Write Tests (1 hour)
1. Read SPECIFICATION.md Part 2 (Tests)
2. Review `test_cache_manager.py`
3. Write additional test cases

### Path 4: Async Patterns (1 hour)
1. Read SPECIFICATION.md section 10
2. Review `test_async.py`
3. Implement async version

---

## ✅ Checklist

- [ ] Install dependencies
- [ ] Run example
- [ ] Run all tests
- [ ] Achieve 85%+ coverage
- [ ] Review specification
- [ ] Understand cache-aside pattern
- [ ] Implement in your project
- [ ] Add monitoring
- [ ] Deploy to production

---

## 🚀 Next Steps

1. **Customize** - Adapt to your data model
2. **Monitor** - Add metrics collection
3. **Optimize** - Tune TTL and eviction policies
4. **Scale** - Implement distributed invalidation
5. **Extend** - Add other caching patterns

---

## 📖 References

- [Redis Documentation](https://redis.io/docs/)
- [redis-py Documentation](https://redis-py.readthedocs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [asyncio Documentation](https://docs.python.org/3/library/asyncio.html)

---

## 📝 License

This tutorial is part of the Redis documentation project.

---

**Status:** ✅ Complete and Production-Ready  
**Python Version:** 3.8+  
**Last Updated:** 2025-10-27


