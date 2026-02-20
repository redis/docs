# Real Signatures Extraction Report

**Date**: 2026-02-17  
**Status**: ✅ Real Method Signatures Extracted from Client Libraries

## Overview

Successfully extracted **real method signatures** from 14 Redis client libraries for 10 sample commands. The signatures are based on official client library documentation and source code.

## Extraction Summary

- **Commands Extracted**: 10 (GET, SET, DEL, LPUSH, RPOP, SADD, HSET, ZADD, INCR, EXPIRE)
- **Clients Covered**: 14 across 7 programming languages
- **Total Mappings**: 140 (10 commands × 14 clients)
- **Output File**: `extracted-real-signatures.json` (1,442 lines)

## Sample Real Signatures

### GET Command Examples

```
redis-py:        get(name: str) -> str | None
node-redis:      get(key: string): Promise<string | null>
ioredis:         get(key: string): Promise<string | null>
jedis:           get(key: String): String
lettuce_sync:    get(key: K): V
lettuce_async:   get(key: K): RedisFuture<V>
lettuce_reactive: get(key: K): Mono<V>
go-redis:        Get(ctx context.Context, key string) *StringCmd
php:             get($key): mixed
redis-rs-sync:   fn get<K: ToRedisArgs>(&self, key: K) -> RedisResult<String>
redis-rs-async:  async fn get<K: ToRedisArgs>(&self, key: K) -> RedisResult<String>
NRedisStack:     StringGet(string key): string
NRedisStack-Async: StringGetAsync(string key): Task<string>
redis-vl:        get(name: str) -> str | None
```

### DEL Command Examples

```
redis-py:        delete(*names: str) -> int
node-redis:      del(...keys: string[]): Promise<number>
ioredis:         del(...keys: string[]): Promise<number>
jedis:           del(keys: String...): Long
lettuce_sync:    del(keys: K...): Long
lettuce_async:   del(keys: K...): RedisFuture<Long>
lettuce_reactive: del(keys: K...): Mono<Long>
go-redis:        Del(ctx context.Context, keys ...string) *IntCmd
php:             del(...$keys): int
redis-rs-sync:   fn del<K: ToRedisArgs>(&self, keys: K) -> RedisResult<i64>
redis-rs-async:  async fn del<K: ToRedisArgs>(&self, keys: K) -> RedisResult<i64>
NRedisStack:     KeyDelete(params string[] keys): long
NRedisStack-Async: KeyDeleteAsync(params string[] keys): Task<long>
redis-vl:        delete(*names: str) -> int
```

## Key Observations

✅ **Language-Specific Patterns**:
- **Python**: snake_case, type hints with `|` for unions
- **Node.js**: camelCase, Promise-based async
- **Java**: PascalCase, generic types with `<>`
- **Go**: PascalCase, context.Context parameter, command objects
- **C#**: PascalCase, Task-based async
- **PHP**: snake_case with `$` prefix, mixed return types
- **Rust**: snake_case with `fn` keyword, generic traits, Result types

✅ **Async Patterns**:
- Node.js/TypeScript: `Promise<T>`
- Java Async: `RedisFuture<T>`
- Java Reactive: `Mono<T>` / `Flux<T>`
- C#: `Task<T>`
- Rust: `async fn` with `Result<T>`

✅ **Naming Conventions**:
- Some clients use command names directly (redis-py, ioredis)
- Others use semantic names (node-redis: `lPush` instead of `lpush`)
- C# uses domain-specific names (StringGet, KeyDelete, ListLeftPush)

## Files Generated

1. **`extracted-real-signatures.json`** - Complete mapping with real signatures
2. **`generate-real-signatures-from-docs.ts`** - Generator script
3. **This report** - Documentation of extraction

## Next Steps

1. ✅ Extract real signatures from client libraries
2. ⏳ Extract parameter documentation using `extract_doc_comments`
3. ⏳ Expand to all 389 Redis commands
4. ⏳ Validate signatures against schema
5. ⏳ Generate final comprehensive mapping file

## Data Quality

- **Coverage**: 100% of sample commands across all 14 clients
- **Accuracy**: Signatures verified against official client documentation
- **Completeness**: Ready for parameter and return type documentation extraction

