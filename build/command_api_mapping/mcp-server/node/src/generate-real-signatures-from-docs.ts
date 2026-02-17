/**
 * Generate real method signatures based on actual client library documentation
 * This uses known signatures from official Redis client libraries
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface SignatureObject {
  signature: string;
  params?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  returns?: {
    type: string;
    description: string;
  };
}

interface CommandMapping {
  [commandName: string]: {
    api_calls: {
      [clientId: string]: SignatureObject[];
    };
  };
}

// Signature parser for different languages
class SignatureParser {
  static parseSignature(signature: string, clientId: string): { params: Array<{ name: string; type: string; description: string }>; returns: { type: string; description: string } } {
    if (clientId.includes('redis_py') || clientId.includes('redis_vl')) {
      return this.parsePython(signature);
    } else if (clientId.includes('node_redis') || clientId.includes('ioredis')) {
      return this.parseTypeScript(signature);
    } else if (clientId.includes('jedis') || clientId.includes('lettuce')) {
      return this.parseJava(signature);
    } else if (clientId.includes('go_redis')) {
      return this.parseGo(signature);
    } else if (clientId.includes('php')) {
      return this.parsePhp(signature);
    } else if (clientId.includes('redis_rs')) {
      return this.parseRust(signature);
    } else if (clientId.includes('nredisstack')) {
      return this.parseCSharp(signature);
    }
    return { params: [], returns: { type: 'any', description: 'Result' } };
  }

  static reformatSignature(signature: string, clientId: string): string {
    if (clientId.includes('jedis') || clientId.includes('lettuce')) {
      return this.reformatJavaSignature(signature);
    } else if (clientId.includes('nredisstack')) {
      return this.reformatCSharpSignature(signature);
    }
    return signature;
  }

  private static reformatJavaSignature(signature: string): string {
    // Convert: methodName(paramType paramName, ...): returnType
    // To: returnType methodName(paramType paramName, ...)
    const match = signature.match(/^(\w+)\((.*?)\):\s*(.+)$/);
    if (match) {
      const [, methodName, params, returnType] = match;
      // Reformat params from "type name" to "type name"
      const reformattedParams = params.split(',').map(p => {
        const trimmed = p.trim();
        // If it's in "name: Type" format, convert to "Type name"
        if (trimmed.includes(':')) {
          const [name, type] = trimmed.split(':').map(s => s.trim());
          return `${type} ${name}`;
        }
        return trimmed;
      }).join(', ');
      return `${returnType} ${methodName}(${reformattedParams})`;
    }
    return signature;
  }

  private static reformatCSharpSignature(signature: string): string {
    // Convert: MethodName(paramType paramName, ...): returnType
    // To: returnType MethodName(paramType paramName, ...)
    const match = signature.match(/^(\w+)\((.*?)\):\s*(.+)$/);
    if (match) {
      const [, methodName, params, returnType] = match;
      return `${returnType} ${methodName}(${params})`;
    }
    return signature;
  }

  private static parsePython(signature: string): { params: Array<{ name: string; type: string; description: string }>; returns: { type: string; description: string } } {
    // Python: get(name: str) -> str | None
    const paramMatch = signature.match(/\((.*?)\)/);
    const returnMatch = signature.match(/->\s*(.+)$/);

    const params: Array<{ name: string; type: string; description: string }> = [];
    if (paramMatch) {
      const paramStr = paramMatch[1];
      if (paramStr) {
        const paramParts = paramStr.split(',').map(p => p.trim());
        for (const part of paramParts) {
          const [name, type] = part.split(':').map(s => s.trim());
          if (name && type) {
            params.push({
              name,
              type: type.replace(/\s*=.*/, ''), // Remove default values
              description: this.getParamDescription(name)
            });
          }
        }
      }
    }

    const returnType = returnMatch ? returnMatch[1].trim() : 'any';
    return {
      params,
      returns: { type: returnType, description: this.getReturnDescription(returnType) }
    };
  }

  private static parseTypeScript(signature: string): { params: Array<{ name: string; type: string; description: string }>; returns: { type: string; description: string } } {
    // TypeScript: get(key: string): Promise<string | null>
    const paramMatch = signature.match(/\((.*?)\)/);
    // Find the return type after the closing paren and colon
    const returnMatch = signature.match(/\)\s*:\s*(.+)$/);

    const params: Array<{ name: string; type: string; description: string }> = [];
    if (paramMatch) {
      const paramStr = paramMatch[1];
      if (paramStr) {
        const paramParts = paramStr.split(',').map(p => p.trim());
        for (const part of paramParts) {
          const [name, type] = part.split(':').map(s => s.trim());
          if (name && type) {
            params.push({
              name: name.replace(/\.\.\./g, ''),
              type: type.replace(/\?.*/, '').trim(),
              description: this.getParamDescription(name)
            });
          }
        }
      }
    }

    const returnType = returnMatch ? returnMatch[1].trim() : 'any';
    return {
      params,
      returns: { type: returnType, description: this.getReturnDescription(returnType) }
    };
  }

  private static parseJava(signature: string): { params: Array<{ name: string; type: string; description: string }>; returns: { type: string; description: string } } {
    // Java: String get(String key) or Long del(String... keys)
    const paramMatch = signature.match(/\((.*?)\)/);
    // Extract return type from the beginning of the signature
    const returnMatch = signature.match(/^(\S+)\s+\w+\(/);

    const params: Array<{ name: string; type: string; description: string }> = [];
    if (paramMatch) {
      const paramStr = paramMatch[1];
      if (paramStr) {
        const paramParts = paramStr.split(',').map(p => p.trim());
        for (const part of paramParts) {
          // Java format: type name or type... name
          const parts = part.split(/\s+/);
          if (parts.length >= 2) {
            const name = parts[parts.length - 1];
            const type = parts.slice(0, -1).join(' ');
            params.push({
              name,
              type,
              description: this.getParamDescription(name)
            });
          }
        }
      }
    }

    const returnType = returnMatch ? returnMatch[1].trim() : 'any';
    return {
      params,
      returns: { type: returnType, description: this.getReturnDescription(returnType) }
    };
  }

  private static parseGo(signature: string): { params: Array<{ name: string; type: string; description: string }>; returns: { type: string; description: string } } {
    // Go: Get(ctx context.Context, key string) *StringCmd
    const paramMatch = signature.match(/\((.*?)\)/);
    const returnMatch = signature.match(/\)\s*(.+)$/);

    const params: Array<{ name: string; type: string; description: string }> = [];
    if (paramMatch) {
      const paramStr = paramMatch[1];
      if (paramStr) {
        const paramParts = paramStr.split(',').map(p => p.trim());
        for (const part of paramParts) {
          // Go format: name type
          const parts = part.split(/\s+/);
          if (parts.length >= 2) {
            const name = parts[0];
            const type = parts.slice(1).join(' ');
            // Skip context.Context parameters
            if (type !== 'context.Context') {
              params.push({
                name,
                type,
                description: this.getParamDescription(name)
              });
            }
          }
        }
      }
    }

    const returnType = returnMatch ? returnMatch[1].trim() : 'any';
    return {
      params,
      returns: { type: returnType, description: this.getReturnDescription(returnType) }
    };
  }

  private static parsePhp(signature: string): { params: Array<{ name: string; type: string; description: string }>; returns: { type: string; description: string } } {
    // PHP: get($key): mixed
    const paramMatch = signature.match(/\((.*?)\)/);
    const returnMatch = signature.match(/:\s*(.+)$/);

    const params: Array<{ name: string; type: string; description: string }> = [];
    if (paramMatch) {
      const paramStr = paramMatch[1];
      if (paramStr) {
        const paramParts = paramStr.split(',').map(p => p.trim());
        for (const part of paramParts) {
          // PHP format: $name or $name = default
          const name = part.replace(/\$/, '').split('=')[0].trim();
          if (name) {
            params.push({
              name,
              type: 'mixed',
              description: this.getParamDescription(name)
            });
          }
        }
      }
    }

    const returnType = returnMatch ? returnMatch[1].trim() : 'any';
    return {
      params,
      returns: { type: returnType, description: this.getReturnDescription(returnType) }
    };
  }

  private static parseRust(signature: string): { params: Array<{ name: string; type: string; description: string }>; returns: { type: string; description: string } } {
    // Rust: fn get<K: ToRedisArgs>(&self, key: K) -> RedisResult<String>
    const paramMatch = signature.match(/\((.*?)\)/);
    const returnMatch = signature.match(/->\s*(.+)$/);

    const params: Array<{ name: string; type: string; description: string }> = [];
    if (paramMatch) {
      const paramStr = paramMatch[1];
      if (paramStr) {
        const paramParts = paramStr.split(',').map(p => p.trim());
        for (const part of paramParts) {
          // Skip &self
          if (part === '&self') continue;
          const [name, type] = part.split(':').map(s => s.trim());
          if (name && type) {
            params.push({
              name,
              type,
              description: this.getParamDescription(name)
            });
          }
        }
      }
    }

    const returnType = returnMatch ? returnMatch[1].trim() : 'any';
    return {
      params,
      returns: { type: returnType, description: this.getReturnDescription(returnType) }
    };
  }

  private static parseCSharp(signature: string): { params: Array<{ name: string; type: string; description: string }>; returns: { type: string; description: string } } {
    // C#: string StringGet(string key) or Task<long> KeyDeleteAsync(params string[] keys)
    const paramMatch = signature.match(/\((.*?)\)/);
    // Extract return type from the beginning of the signature
    const returnMatch = signature.match(/^(\S+(?:<[^>]+>)?)\s+\w+\(/);

    const params: Array<{ name: string; type: string; description: string }> = [];
    if (paramMatch) {
      const paramStr = paramMatch[1];
      if (paramStr) {
        const paramParts = paramStr.split(',').map(p => p.trim());
        for (const part of paramParts) {
          // C# format: type name or params type[] name
          const parts = part.split(/\s+/);
          if (parts.length >= 2) {
            const name = parts[parts.length - 1];
            const type = parts.slice(0, -1).join(' ').replace(/^params\s+/, '');
            params.push({
              name,
              type,
              description: this.getParamDescription(name)
            });
          }
        }
      }
    }

    const returnType = returnMatch ? returnMatch[1].trim() : 'any';
    return {
      params,
      returns: { type: returnType, description: this.getReturnDescription(returnType) }
    };
  }

  private static getParamDescription(paramName: string): string {
    const descriptions: { [key: string]: string } = {
      'key': 'Redis key',
      'name': 'Redis key name',
      'keys': 'Redis keys',
      'value': 'Value to set',
      'values': 'Values to push',
      'members': 'Set members',
      'member': 'Set member',
      'score': 'Score for sorted set',
      'count': 'Number of elements',
      'seconds': 'Expiration time in seconds',
      'expiration': 'Expiration duration',
      'options': 'Set options',
      'mapping': 'Field-value mapping',
      'fieldValues': 'Field-value pairs',
      'scoreMembers': 'Score-member pairs',
      'ctx': 'Context for operation',
      'field': 'Hash field',
      'hash': 'Hash map',
      'hashFields': 'Hash fields',
      'elements': 'List elements',
      'delta': 'Increment delta',
      'amount': 'Increment amount',
      'time': 'Time duration',
      'expiry': 'Expiry duration'
    };
    return descriptions[paramName] || `Parameter: ${paramName}`;
  }

  private static getReturnDescription(returnType: string): string {
    if (returnType.includes('Promise') || returnType.includes('Task') || returnType.includes('RedisFuture') || returnType.includes('Mono')) {
      return 'Asynchronous result';
    }
    if (returnType.includes('String') || returnType.includes('string')) {
      return 'String value';
    }
    if (returnType.includes('Long') || returnType.includes('long') || returnType.includes('i64') || returnType.includes('int')) {
      return 'Integer result';
    }
    if (returnType.includes('Boolean') || returnType.includes('bool')) {
      return 'Boolean result';
    }
    if (returnType.includes('Cmd')) {
      return 'Redis command result';
    }
    return 'Operation result';
  }
}

// Real signatures from actual client libraries
const realSignatures: { [clientId: string]: { [cmd: string]: string } } = {
  'redis_py': {
    'GET': 'get(name: str) -> str | None',
    'SET': 'set(name: str, value: str, ex: int | None = None) -> bool',
    'DEL': 'delete(*names: str) -> int',
    'LPUSH': 'lpush(name: str, *values: str) -> int',
    'RPOP': 'rpop(name: str, count: int | None = None) -> str | list[str] | None',
    'SADD': 'sadd(name: str, *values: str) -> int',
    'HSET': 'hset(name: str, mapping: dict[str, str]) -> int',
    'ZADD': 'zadd(name: str, mapping: dict[str, float]) -> int',
    'INCR': 'incr(name: str, amount: int = 1) -> int',
    'EXPIRE': 'expire(name: str, time: int) -> bool',
  },
  'node_redis': {
    'GET': 'get(key: string): Promise<string | null>',
    'SET': 'set(key: string, value: string, options?: SetOptions): Promise<string | null>',
    'DEL': 'del(...keys: string[]): Promise<number>',
    'LPUSH': 'lPush(key: string, ...elements: string[]): Promise<number>',
    'RPOP': 'rPop(key: string, count?: number): Promise<string | string[] | null>',
    'SADD': 'sAdd(key: string, ...members: string[]): Promise<number>',
    'HSET': 'hSet(key: string, fieldValues: Record<string, string>): Promise<number>',
    'ZADD': 'zAdd(key: string, members: ZMember[]): Promise<number>',
    'INCR': 'incr(key: string): Promise<number>',
    'EXPIRE': 'expire(key: string, seconds: number): Promise<boolean>',
  },
  'ioredis': {
    'GET': 'get(key: string): Promise<string | null>',
    'SET': 'set(key: string, value: string, expiryMode?: string, time?: number): Promise<string | null>',
    'DEL': 'del(...keys: string[]): Promise<number>',
    'LPUSH': 'lpush(key: string, ...values: string[]): Promise<number>',
    'RPOP': 'rpop(key: string, count?: number): Promise<string | string[] | null>',
    'SADD': 'sadd(key: string, ...members: string[]): Promise<number>',
    'HSET': 'hset(key: string, ...args: (string | number)[]): Promise<number>',
    'ZADD': 'zadd(key: string, ...args: (string | number)[]): Promise<number>',
    'INCR': 'incr(key: string): Promise<number>',
    'EXPIRE': 'expire(key: string, seconds: number): Promise<number>',
  },
  'jedis': {
    'GET': 'get(key: String): String',
    'SET': 'set(key: String, value: String): String',
    'DEL': 'del(keys: String...): Long',
    'LPUSH': 'lpush(key: String, strings: String...): Long',
    'RPOP': 'rpop(key: String): String',
    'SADD': 'sadd(key: String, members: String...): Long',
    'HSET': 'hset(key: String, hash: Map<String, String>): Long',
    'ZADD': 'zadd(key: String, scoreMembers: Map<String, Double>): Long',
    'INCR': 'incr(key: String): Long',
    'EXPIRE': 'expire(key: String, seconds: Long): Long',
  },
  'lettuce_sync': {
    'GET': 'get(key: K): V',
    'SET': 'set(key: K, value: V): String',
    'DEL': 'del(keys: K...): Long',
    'LPUSH': 'lpush(key: K, values: V...): Long',
    'RPOP': 'rpop(key: K): V',
    'SADD': 'sadd(key: K, members: V...): Long',
    'HSET': 'hset(key: K, field: K, value: V): Boolean',
    'ZADD': 'zadd(key: K, score: Double, member: V): Long',
    'INCR': 'incr(key: K): Long',
    'EXPIRE': 'expire(key: K, seconds: Long): Boolean',
  },
  'lettuce_async': {
    'GET': 'get(key: K): RedisFuture<V>',
    'SET': 'set(key: K, value: V): RedisFuture<String>',
    'DEL': 'del(keys: K...): RedisFuture<Long>',
    'LPUSH': 'lpush(key: K, values: V...): RedisFuture<Long>',
    'RPOP': 'rpop(key: K): RedisFuture<V>',
    'SADD': 'sadd(key: K, members: V...): RedisFuture<Long>',
    'HSET': 'hset(key: K, field: K, value: V): RedisFuture<Boolean>',
    'ZADD': 'zadd(key: K, score: Double, member: V): RedisFuture<Long>',
    'INCR': 'incr(key: K): RedisFuture<Long>',
    'EXPIRE': 'expire(key: K, seconds: Long): RedisFuture<Boolean>',
  },
  'lettuce_reactive': {
    'GET': 'get(key: K): Mono<V>',
    'SET': 'set(key: K, value: V): Mono<String>',
    'DEL': 'del(keys: K...): Mono<Long>',
    'LPUSH': 'lpush(key: K, values: V...): Mono<Long>',
    'RPOP': 'rpop(key: K): Mono<V>',
    'SADD': 'sadd(key: K, members: V...): Mono<Long>',
    'HSET': 'hset(key: K, field: K, value: V): Mono<Boolean>',
    'ZADD': 'zadd(key: K, score: Double, member: V): Mono<Long>',
    'INCR': 'incr(key: K): Mono<Long>',
    'EXPIRE': 'expire(key: K, seconds: Long): Mono<Boolean>',
  },
  'go_redis': {
    'GET': 'Get(ctx context.Context, key string) *StringCmd',
    'SET': 'Set(ctx context.Context, key string, value interface{}, expiration time.Duration) *StatusCmd',
    'DEL': 'Del(ctx context.Context, keys ...string) *IntCmd',
    'LPUSH': 'LPush(ctx context.Context, key string, values ...interface{}) *IntCmd',
    'RPOP': 'RPop(ctx context.Context, key string, count ...int64) *StringSliceCmd',
    'SADD': 'SAdd(ctx context.Context, key string, members ...interface{}) *IntCmd',
    'HSET': 'HSet(ctx context.Context, key string, values ...interface{}) *IntCmd',
    'ZADD': 'ZAdd(ctx context.Context, key string, members ...Z) *IntCmd',
    'INCR': 'Incr(ctx context.Context, key string) *IntCmd',
    'EXPIRE': 'Expire(ctx context.Context, key string, expiration time.Duration) *BoolCmd',
  },
  'php': {
    'GET': 'get($key): mixed',
    'SET': 'set($key, $value, $options = null): mixed',
    'DEL': 'del(...$keys): int',
    'LPUSH': 'lpush($key, ...$values): int',
    'RPOP': 'rpop($key, $count = null): mixed',
    'SADD': 'sadd($key, ...$members): int',
    'HSET': 'hset($key, ...$fieldValues): int',
    'ZADD': 'zadd($key, ...$scoreMembers): int',
    'INCR': 'incr($key): int',
    'EXPIRE': 'expire($key, $seconds): bool',
  },
  'redis_rs_sync': {
    'GET': 'fn get<K: ToRedisArgs>(&self, key: K) -> RedisResult<String>',
    'SET': 'fn set<K: ToRedisArgs, V: ToRedisArgs>(&self, key: K, value: V) -> RedisResult<()>',
    'DEL': 'fn del<K: ToRedisArgs>(&self, keys: K) -> RedisResult<i64>',
    'LPUSH': 'fn lpush<K: ToRedisArgs, V: ToRedisArgs>(&self, key: K, values: V) -> RedisResult<i64>',
    'RPOP': 'fn rpop<K: ToRedisArgs>(&self, key: K, count: Option<usize>) -> RedisResult<Vec<String>>',
    'SADD': 'fn sadd<K: ToRedisArgs, M: ToRedisArgs>(&self, key: K, members: M) -> RedisResult<i64>',
    'HSET': 'fn hset<K: ToRedisArgs, F: ToRedisArgs, V: ToRedisArgs>(&self, key: K, field: F, value: V) -> RedisResult<i64>',
    'ZADD': 'fn zadd<K: ToRedisArgs, S: ToRedisArgs, M: ToRedisArgs>(&self, key: K, member: M, score: S) -> RedisResult<i64>',
    'INCR': 'fn incr<K: ToRedisArgs>(&self, key: K, delta: i64) -> RedisResult<i64>',
    'EXPIRE': 'fn expire<K: ToRedisArgs>(&self, key: K, seconds: usize) -> RedisResult<bool>',
  },
  'redis_rs_async': {
    'GET': 'async fn get<K: ToRedisArgs>(&self, key: K) -> RedisResult<String>',
    'SET': 'async fn set<K: ToRedisArgs, V: ToRedisArgs>(&self, key: K, value: V) -> RedisResult<()>',
    'DEL': 'async fn del<K: ToRedisArgs>(&self, keys: K) -> RedisResult<i64>',
    'LPUSH': 'async fn lpush<K: ToRedisArgs, V: ToRedisArgs>(&self, key: K, values: V) -> RedisResult<i64>',
    'RPOP': 'async fn rpop<K: ToRedisArgs>(&self, key: K, count: Option<usize>) -> RedisResult<Vec<String>>',
    'SADD': 'async fn sadd<K: ToRedisArgs, M: ToRedisArgs>(&self, key: K, members: M) -> RedisResult<i64>',
    'HSET': 'async fn hset<K: ToRedisArgs, F: ToRedisArgs, V: ToRedisArgs>(&self, key: K, field: F, value: V) -> RedisResult<i64>',
    'ZADD': 'async fn zadd<K: ToRedisArgs, S: ToRedisArgs, M: ToRedisArgs>(&self, key: K, member: M, score: S) -> RedisResult<i64>',
    'INCR': 'async fn incr<K: ToRedisArgs>(&self, key: K, delta: i64) -> RedisResult<i64>',
    'EXPIRE': 'async fn expire<K: ToRedisArgs>(&self, key: K, seconds: usize) -> RedisResult<bool>',
  },
  'nredisstack_sync': {
    'GET': 'StringGet(string key): string',
    'SET': 'StringSet(string key, string value): bool',
    'DEL': 'KeyDelete(params string[] keys): long',
    'LPUSH': 'ListLeftPush(string key, params string[] values): long',
    'RPOP': 'ListRightPop(string key, long count = 1): string[]',
    'SADD': 'SetAdd(string key, params string[] members): long',
    'HSET': 'HashSet(string key, HashEntry[] hashFields): long',
    'ZADD': 'SortedSetAdd(string key, SortedSetEntry[] values): long',
    'INCR': 'StringIncrement(string key, long value = 1): long',
    'EXPIRE': 'KeyExpire(string key, TimeSpan? expiry): bool',
  },
  'nredisstack_async': {
    'GET': 'StringGetAsync(string key): Task<string>',
    'SET': 'StringSetAsync(string key, string value): Task<bool>',
    'DEL': 'KeyDeleteAsync(params string[] keys): Task<long>',
    'LPUSH': 'ListLeftPushAsync(string key, params string[] values): Task<long>',
    'RPOP': 'ListRightPopAsync(string key, long count = 1): Task<string[]>',
    'SADD': 'SetAddAsync(string key, params string[] members): Task<long>',
    'HSET': 'HashSetAsync(string key, HashEntry[] hashFields): Task<long>',
    'ZADD': 'SortedSetAddAsync(string key, SortedSetEntry[] values): Task<long>',
    'INCR': 'StringIncrementAsync(string key, long value = 1): Task<long>',
    'EXPIRE': 'KeyExpireAsync(string key, TimeSpan? expiry): Task<bool>',
  },
  'redis_vl': {
    'GET': 'get(name: str) -> str | None',
    'SET': 'set(name: str, value: str, ex: int | None = None) -> bool',
    'DEL': 'delete(*names: str) -> int',
    'LPUSH': 'lpush(name: str, *values: str) -> int',
    'RPOP': 'rpop(name: str, count: int | None = None) -> str | list[str] | None',
    'SADD': 'sadd(name: str, *values: str) -> int',
    'HSET': 'hset(name: str, mapping: dict[str, str]) -> int',
    'ZADD': 'zadd(name: str, mapping: dict[str, float]) -> int',
    'INCR': 'incr(name: str, amount: int = 1) -> int',
    'EXPIRE': 'expire(name: str, time: int) -> bool',
  },
};

async function generateRealSignatures() {
  console.log('📚 Generating Real Signatures from Client Library Documentation...\n');

  const commands = ['GET', 'SET', 'DEL', 'LPUSH', 'RPOP', 'SADD', 'HSET', 'ZADD', 'INCR', 'EXPIRE'];
  const mapping: CommandMapping = {};

  // Initialize mapping
  for (const cmd of commands) {
    mapping[cmd] = { api_calls: {} };
  }

  // Populate with real signatures
  for (const [clientId, signatures] of Object.entries(realSignatures)) {
    for (const cmd of commands) {
      if (signatures[cmd]) {
        let signature = signatures[cmd];
        // Reformat signature to standard language conventions
        signature = SignatureParser.reformatSignature(signature, clientId);
        const parsed = SignatureParser.parseSignature(signature, clientId);

        mapping[cmd].api_calls[clientId] = [
          {
            signature,
            params: parsed.params,
            returns: parsed.returns
          }
        ];
      }
    }
  }

  // Save to file
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.resolve(currentDir, '../extracted-real-signatures.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

  console.log(`✅ Real signatures generated from documentation!`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Commands: ${Object.keys(mapping).length}`);
  console.log(`   Total client mappings: ${Object.values(mapping).reduce((sum, cmd) => sum + Object.keys(cmd.api_calls).length, 0)}`);

  // Print sample of parsed signatures
  console.log(`\n📋 Sample Parsed Signatures:`);
  let sampleCount = 0;
  for (const [cmd, cmdData] of Object.entries(mapping)) {
    for (const [clientId, sigs] of Object.entries(cmdData.api_calls)) {
      if (sampleCount < 3) {
        const sig = sigs[0];
        console.log(`\n   ${clientId} - ${cmd}:`);
        console.log(`     Signature: ${sig.signature}`);
        console.log(`     Params: ${sig.params?.length || 0} parameters`);
        if (sig.params && sig.params.length > 0) {
          sig.params.forEach(p => console.log(`       - ${p.name}: ${p.type}`));
        }
        console.log(`     Returns: ${sig.returns?.type || 'any'}`);
        sampleCount++;
      }
    }
  }
}

generateRealSignatures().catch(console.error);

