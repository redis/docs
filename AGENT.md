# Redis Guide for AI Agents

This document provides guidance for AI agents working with Redis, including key concepts, common patterns, and best practices.

## What is Redis?

Redis is an open-source, in-memory data structure store used as a database, cache, message broker, and streaming engine. It supports various data structures such as strings, hashes, lists, sets, sorted sets, bitmaps, hyperloglogs, geospatial indexes, and streams.

## Key Concepts

### Data Structures

- **Strings**: Binary-safe strings up to 512 MB
- **Lists**: Collections of strings ordered by insertion order
- **Sets**: Unordered collections of unique strings
- **Sorted Sets**: Sets ordered by a score
- **Hashes**: Maps of field-value pairs
- **Streams**: Append-only log data structure
- **Bitmaps**: Bit-level operations on strings
- **HyperLogLogs**: Probabilistic data structure for cardinality estimation
- **Geospatial**: Latitude/longitude coordinate storage and queries
- **JSON**: Native JSON document storage (Redis Stack)

### Persistence

Redis offers multiple persistence options:
- **RDB (Redis Database)**: Point-in-time snapshots
- **AOF (Append Only File)**: Log of every write operation
- **Hybrid**: Combination of RDB and AOF

### Replication and High Availability

- **Replication**: Master-replica architecture for read scaling and data redundancy
- **Sentinel**: Automatic failover and monitoring
- **Cluster**: Horizontal scaling with automatic sharding

## Common Use Cases

1. **Caching**: Store frequently accessed data to reduce database load
2. **Session Management**: Store user session data
3. **Real-time Analytics**: Count, rank, and aggregate data in real-time
4. **Message Queues**: Pub/Sub messaging and stream processing
5. **Leaderboards**: Sorted sets for ranking systems
6. **Rate Limiting**: Track and limit API requests
7. **Geospatial Applications**: Location-based queries
8. **Vector Search**: Similarity search with Redis Stack

## Basic Commands

### String Operations
```
SET key value [EX seconds] [NX|XX]
GET key
INCR key
DECR key
MGET key1 key2 ...
MSET key1 value1 key2 value2 ...
```

### Hash Operations
```
HSET key field value
HGET key field
HMGET key field1 field2 ...
HGETALL key
HINCRBY key field increment
```

### List Operations
```
LPUSH key value1 [value2 ...]
RPUSH key value1 [value2 ...]
LPOP key
RPOP key
LRANGE key start stop
```

### Set Operations
```
SADD key member1 [member2 ...]
SMEMBERS key
SISMEMBER key member
SINTER key1 key2 ...
SUNION key1 key2 ...
```

### Sorted Set Operations
```
ZADD key score1 member1 [score2 member2 ...]
ZRANGE key start stop [WITHSCORES]
ZRANK key member
ZINCRBY key increment member
```

### Key Management
```
DEL key1 [key2 ...]
EXISTS key1 [key2 ...]
EXPIRE key seconds
TTL key
KEYS pattern (use with caution in production)
SCAN cursor [MATCH pattern] [COUNT count]
```

## Best Practices for Agents

### 1. Connection Management
- Use connection pooling for better performance
- Close connections properly when done
- Handle connection errors gracefully

### 2. Key Naming Conventions
- Use descriptive, hierarchical names: `user:1000:profile`
- Use colons (`:`) as separators
- Keep keys reasonably short but readable
- Include version numbers if schema changes: `user:v2:1000`

### 3. Performance Optimization
- Use pipelining for multiple commands
- Prefer `SCAN` over `KEYS` in production
- Use appropriate data structures for your use case
- Set expiration times on temporary data
- Use `MGET`/`MSET` for batch operations

### 4. Data Modeling
- Denormalize data for read performance
- Use hashes for objects with multiple fields
- Use sorted sets for rankings and time-series data
- Consider memory usage when choosing data structures

### 5. Error Handling
- Always check command return values
- Handle `nil` responses appropriately
- Implement retry logic for transient failures
- Use transactions (MULTI/EXEC) for atomic operations

### 6. Security
- Never expose Redis directly to the internet
- Use ACLs (Access Control Lists) for authentication
- Enable TLS for encrypted connections
- Rename or disable dangerous commands in production

## Common Patterns

### Caching Pattern
```
GET cache_key
if nil:
    data = fetch_from_database()
    SET cache_key data EX 3600
    return data
else:
    return cached_data
```

### Rate Limiting Pattern
```
key = "rate_limit:user:" + user_id + ":" + current_minute
count = INCR key
if count == 1:
    EXPIRE key 60
if count > limit:
    return "rate limit exceeded"
```

### Distributed Lock Pattern
```
SET lock_key unique_value NX EX 10
if success:
    # perform critical section
    # release lock only if we own it
    DEL lock_key (with Lua script to verify ownership)
```

## Resources in This Repository

- `/content/commands/`: Complete command reference
- `/content/develop/`: Development guides and tutorials
- `/content/operate/`: Operational guides for deployment and management
- `/content/integrate/`: Integration guides for various languages and frameworks

## Version-Specific Features

Redis evolves with each version. Check the version-specific command references:
- Redis 8.6: Latest features including HOTKEYS command
- Redis 8.4: Previous stable release
- Redis 8.2, 8.0: Earlier 8.x releases
- Redis 7.4, 7.2: 7.x series
- Redis 6.2: Long-term support release

## Getting Help

When working with Redis commands:
1. Check the command documentation in `/content/commands/`
2. Look for code examples in `/content/develop/`
3. Review integration guides for your programming language
4. Consider the Redis version you're targeting

## Important Notes

- Redis is single-threaded for command execution (though I/O is multi-threaded in recent versions)
- All data is stored in memory (with optional persistence to disk)
- Commands are atomic
- Use Lua scripts for complex atomic operations
- Redis Cluster has some limitations (e.g., multi-key operations must be on the same hash slot)

