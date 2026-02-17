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

// Real signatures from actual client libraries - supports arrays for multiple overloads
const realSignatures: { [clientId: string]: { [cmd: string]: string | string[] } } = {
  'redis_py': {
    'GET': 'get(name: str) -> str | None',
    'SET': 'set(name: str, value: str, ex: int | None = None, px: int | None = None, nx: bool = False, xx: bool = False) -> bool | None',
    'DEL': 'delete(*names: str) -> int',
    'LPUSH': 'lpush(name: str, *values: str) -> int',
    'RPOP': [
      'rpop(name: str) -> str | None',
      'rpop(name: str, count: int) -> list[str] | None',
    ],
    'SADD': 'sadd(name: str, *values: str) -> int',
    'HSET': [
      'hset(name: str, key: str, value: str) -> int',
      'hset(name: str, mapping: dict[str, str]) -> int',
      'hset(name: str, items: list[tuple[str, str]]) -> int',
    ],
    'ZADD': [
      'zadd(name: str, mapping: dict[str, float], nx: bool = False, xx: bool = False, ch: bool = False, incr: bool = False, gt: bool = False, lt: bool = False) -> int',
    ],
    'INCR': 'incr(name: str, amount: int = 1) -> int',
    'EXPIRE': [
      'expire(name: str, time: int) -> bool',
      'expire(name: str, time: timedelta) -> bool',
    ],
  },
  'node_redis': {
    'GET': 'get(key: string): Promise<string | null>',
    'SET': [
      'set(key: string, value: string): Promise<string | null>',
      'set(key: string, value: string, options: SetOptions): Promise<string | null>',
    ],
    'DEL': [
      'del(key: string): Promise<number>',
      'del(keys: string[]): Promise<number>',
    ],
    'LPUSH': 'lPush(key: string, ...elements: string[]): Promise<number>',
    'RPOP': [
      'rPop(key: string): Promise<string | null>',
      'rPop(key: string, count: number): Promise<string[] | null>',
    ],
    'SADD': 'sAdd(key: string, ...members: string[]): Promise<number>',
    'HSET': [
      'hSet(key: string, field: string, value: string): Promise<number>',
      'hSet(key: string, fieldValues: Record<string, string>): Promise<number>',
    ],
    'ZADD': [
      'zAdd(key: string, member: { score: number, value: string }): Promise<number>',
      'zAdd(key: string, members: { score: number, value: string }[]): Promise<number>',
      'zAdd(key: string, members: { score: number, value: string }[], options: ZAddOptions): Promise<number>',
    ],
    'INCR': 'incr(key: string): Promise<number>',
    'EXPIRE': 'expire(key: string, seconds: number): Promise<boolean>',
  },
  'ioredis': {
    'GET': 'get(key: string): Promise<string | null>',
    'SET': [
      'set(key: string, value: string): Promise<"OK">',
      'set(key: string, value: string, "EX", seconds: number): Promise<"OK">',
      'set(key: string, value: string, "PX", milliseconds: number): Promise<"OK">',
      'set(key: string, value: string, "NX"): Promise<"OK" | null>',
      'set(key: string, value: string, "XX"): Promise<"OK" | null>',
    ],
    'DEL': 'del(...keys: string[]): Promise<number>',
    'LPUSH': 'lpush(key: string, ...values: string[]): Promise<number>',
    'RPOP': [
      'rpop(key: string): Promise<string | null>',
      'rpop(key: string, count: number): Promise<string[] | null>',
    ],
    'SADD': 'sadd(key: string, ...members: string[]): Promise<number>',
    'HSET': [
      'hset(key: string, field: string, value: string): Promise<number>',
      'hset(key: string, ...fieldValues: string[]): Promise<number>',
      'hset(key: string, data: Record<string, string>): Promise<number>',
    ],
    'ZADD': [
      'zadd(key: string, score: number, member: string): Promise<number>',
      'zadd(key: string, ...scoreMembers: (number | string)[]): Promise<number>',
      'zadd(key: string, "NX", score: number, member: string): Promise<number>',
      'zadd(key: string, "XX", score: number, member: string): Promise<number>',
    ],
    'INCR': 'incr(key: string): Promise<number>',
    'EXPIRE': 'expire(key: string, seconds: number): Promise<number>',
  },
  'jedis': {
    'GET': [
      'String get(String key)',
      'byte[] get(byte[] key)',
    ],
    'SET': [
      'String set(String key, String value)',
      'String set(String key, String value, SetParams params)',
      'byte[] set(byte[] key, byte[] value)',
      'byte[] set(byte[] key, byte[] value, SetParams params)',
    ],
    'DEL': [
      'long del(String key)',
      'long del(String... keys)',
      'long del(byte[] key)',
      'long del(byte[]... keys)',
    ],
    'LPUSH': [
      'long lpush(String key, String... strings)',
      'long lpush(byte[] key, byte[]... strings)',
    ],
    'RPOP': [
      'String rpop(String key)',
      'List<String> rpop(String key, int count)',
      'byte[] rpop(byte[] key)',
      'List<byte[]> rpop(byte[] key, int count)',
    ],
    'SADD': [
      'long sadd(String key, String... members)',
      'long sadd(byte[] key, byte[]... members)',
    ],
    'HSET': [
      'long hset(String key, String field, String value)',
      'long hset(String key, Map<String, String> hash)',
      'long hset(byte[] key, byte[] field, byte[] value)',
      'long hset(byte[] key, Map<byte[], byte[]> hash)',
    ],
    'ZADD': [
      'long zadd(String key, double score, String member)',
      'long zadd(String key, double score, String member, ZAddParams params)',
      'long zadd(String key, Map<String, Double> scoreMembers)',
      'long zadd(String key, Map<String, Double> scoreMembers, ZAddParams params)',
      'long zadd(byte[] key, double score, byte[] member)',
      'long zadd(byte[] key, double score, byte[] member, ZAddParams params)',
      'long zadd(byte[] key, Map<byte[], Double> scoreMembers)',
      'long zadd(byte[] key, Map<byte[], Double> scoreMembers, ZAddParams params)',
    ],
    'INCR': [
      'long incr(String key)',
      'long incr(byte[] key)',
    ],
    'EXPIRE': [
      'long expire(String key, long seconds)',
      'long expire(String key, long seconds, ExpiryOption expiryOption)',
      'long expire(byte[] key, long seconds)',
      'long expire(byte[] key, long seconds, ExpiryOption expiryOption)',
    ],
  },
  'lettuce_sync': {
    'GET': 'V get(K key)',
    'SET': [
      'String set(K key, V value)',
      'String set(K key, V value, SetArgs setArgs)',
    ],
    'DEL': [
      'Long del(K key)',
      'Long del(K... keys)',
    ],
    'LPUSH': 'Long lpush(K key, V... values)',
    'RPOP': [
      'V rpop(K key)',
      'List<V> rpop(K key, long count)',
    ],
    'SADD': 'Long sadd(K key, V... members)',
    'HSET': [
      'Boolean hset(K key, K field, V value)',
      'Long hset(K key, Map<K, V> map)',
    ],
    'ZADD': [
      'Long zadd(K key, double score, V member)',
      'Long zadd(K key, ZAddArgs zAddArgs, double score, V member)',
      'Long zadd(K key, Object... scoresAndValues)',
      'Long zadd(K key, ScoredValue<V>... scoredValues)',
    ],
    'INCR': 'Long incr(K key)',
    'EXPIRE': [
      'Boolean expire(K key, long seconds)',
      'Boolean expire(K key, Duration duration)',
      'Boolean expire(K key, long seconds, ExpireArgs expireArgs)',
    ],
  },
  'lettuce_async': {
    'GET': 'RedisFuture<V> get(K key)',
    'SET': [
      'RedisFuture<String> set(K key, V value)',
      'RedisFuture<String> set(K key, V value, SetArgs setArgs)',
    ],
    'DEL': [
      'RedisFuture<Long> del(K key)',
      'RedisFuture<Long> del(K... keys)',
    ],
    'LPUSH': 'RedisFuture<Long> lpush(K key, V... values)',
    'RPOP': [
      'RedisFuture<V> rpop(K key)',
      'RedisFuture<List<V>> rpop(K key, long count)',
    ],
    'SADD': 'RedisFuture<Long> sadd(K key, V... members)',
    'HSET': [
      'RedisFuture<Boolean> hset(K key, K field, V value)',
      'RedisFuture<Long> hset(K key, Map<K, V> map)',
    ],
    'ZADD': [
      'RedisFuture<Long> zadd(K key, double score, V member)',
      'RedisFuture<Long> zadd(K key, ZAddArgs zAddArgs, double score, V member)',
      'RedisFuture<Long> zadd(K key, Object... scoresAndValues)',
      'RedisFuture<Long> zadd(K key, ScoredValue<V>... scoredValues)',
    ],
    'INCR': 'RedisFuture<Long> incr(K key)',
    'EXPIRE': [
      'RedisFuture<Boolean> expire(K key, long seconds)',
      'RedisFuture<Boolean> expire(K key, Duration duration)',
      'RedisFuture<Boolean> expire(K key, long seconds, ExpireArgs expireArgs)',
    ],
  },
  'lettuce_reactive': {
    'GET': 'Mono<V> get(K key)',
    'SET': [
      'Mono<String> set(K key, V value)',
      'Mono<String> set(K key, V value, SetArgs setArgs)',
    ],
    'DEL': [
      'Mono<Long> del(K key)',
      'Mono<Long> del(K... keys)',
    ],
    'LPUSH': 'Mono<Long> lpush(K key, V... values)',
    'RPOP': [
      'Mono<V> rpop(K key)',
      'Flux<V> rpop(K key, long count)',
    ],
    'SADD': 'Mono<Long> sadd(K key, V... members)',
    'HSET': [
      'Mono<Boolean> hset(K key, K field, V value)',
      'Mono<Long> hset(K key, Map<K, V> map)',
    ],
    'ZADD': [
      'Mono<Long> zadd(K key, double score, V member)',
      'Mono<Long> zadd(K key, ZAddArgs zAddArgs, double score, V member)',
      'Mono<Long> zadd(K key, Object... scoresAndValues)',
      'Mono<Long> zadd(K key, ScoredValue<V>... scoredValues)',
    ],
    'INCR': 'Mono<Long> incr(K key)',
    'EXPIRE': [
      'Mono<Boolean> expire(K key, long seconds)',
      'Mono<Boolean> expire(K key, Duration duration)',
      'Mono<Boolean> expire(K key, long seconds, ExpireArgs expireArgs)',
    ],
  },
  'go_redis': {
    'GET': 'Get(ctx context.Context, key string) *StringCmd',
    'SET': [
      'Set(ctx context.Context, key string, value interface{}, expiration time.Duration) *StatusCmd',
      'SetEx(ctx context.Context, key string, value interface{}, expiration time.Duration) *StatusCmd',
      'SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) *BoolCmd',
      'SetXX(ctx context.Context, key string, value interface{}, expiration time.Duration) *BoolCmd',
    ],
    'DEL': 'Del(ctx context.Context, keys ...string) *IntCmd',
    'LPUSH': [
      'LPush(ctx context.Context, key string, values ...interface{}) *IntCmd',
      'LPushX(ctx context.Context, key string, values ...interface{}) *IntCmd',
    ],
    'RPOP': [
      'RPop(ctx context.Context, key string) *StringCmd',
      'RPopCount(ctx context.Context, key string, count int) *StringSliceCmd',
    ],
    'SADD': 'SAdd(ctx context.Context, key string, members ...interface{}) *IntCmd',
    'HSET': [
      'HSet(ctx context.Context, key string, values ...interface{}) *IntCmd',
      'HSetNX(ctx context.Context, key string, field string, value interface{}) *BoolCmd',
    ],
    'ZADD': [
      'ZAdd(ctx context.Context, key string, members ...Z) *IntCmd',
      'ZAddNX(ctx context.Context, key string, members ...Z) *IntCmd',
      'ZAddXX(ctx context.Context, key string, members ...Z) *IntCmd',
      'ZAddArgs(ctx context.Context, key string, args ZAddArgs) *IntCmd',
      'ZAddArgsIncr(ctx context.Context, key string, args ZAddArgs) *FloatCmd',
    ],
    'INCR': [
      'Incr(ctx context.Context, key string) *IntCmd',
      'IncrBy(ctx context.Context, key string, value int64) *IntCmd',
      'IncrByFloat(ctx context.Context, key string, value float64) *FloatCmd',
    ],
    'EXPIRE': [
      'Expire(ctx context.Context, key string, expiration time.Duration) *BoolCmd',
      'ExpireAt(ctx context.Context, key string, tm time.Time) *BoolCmd',
      'ExpireNX(ctx context.Context, key string, expiration time.Duration) *BoolCmd',
      'ExpireXX(ctx context.Context, key string, expiration time.Duration) *BoolCmd',
      'ExpireGT(ctx context.Context, key string, expiration time.Duration) *BoolCmd',
      'ExpireLT(ctx context.Context, key string, expiration time.Duration) *BoolCmd',
    ],
  },
  'php': {
    'GET': 'get(string $key): string|false',
    'SET': [
      'set(string $key, string $value): bool',
      'set(string $key, string $value, array $options): Redis|string|bool',
    ],
    'DEL': [
      'del(string $key): int',
      'del(string ...$keys): int',
      'del(array $keys): int',
    ],
    'LPUSH': 'lpush(string $key, string ...$values): int|false',
    'RPOP': [
      'rpop(string $key): string|false',
      'rpop(string $key, int $count): array|false',
    ],
    'SADD': 'sadd(string $key, string ...$members): int|false',
    'HSET': [
      'hset(string $key, string $field, string $value): int|false',
      'hset(string $key, array $fieldValues): int|false',
    ],
    'ZADD': [
      'zadd(string $key, float $score, string $member): int|false',
      'zadd(string $key, array $options, float $score, string $member): int|false',
      'zadd(string $key, float $score1, string $member1, float $score2, string $member2, ...): int|false',
    ],
    'INCR': 'incr(string $key): int|false',
    'EXPIRE': [
      'expire(string $key, int $seconds): bool',
      'expire(string $key, int $seconds, string $mode): bool',
    ],
  },
  'redis_rs_sync': {
    'GET': 'fn get<K: ToRedisArgs, RV: FromRedisValue>(&mut self, key: K) -> RedisResult<RV>',
    'SET': [
      'fn set<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V) -> RedisResult<()>',
      'fn set_ex<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V, seconds: u64) -> RedisResult<()>',
      'fn set_nx<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V) -> RedisResult<bool>',
      'fn set_options<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V, options: SetOptions) -> RedisResult<()>',
    ],
    'DEL': 'fn del<K: ToRedisArgs>(&mut self, key: K) -> RedisResult<i64>',
    'LPUSH': [
      'fn lpush<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V) -> RedisResult<i64>',
      'fn lpush_exists<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V) -> RedisResult<i64>',
    ],
    'RPOP': 'fn rpop<K: ToRedisArgs, RV: FromRedisValue>(&mut self, key: K, count: Option<core::num::NonZeroUsize>) -> RedisResult<RV>',
    'SADD': 'fn sadd<K: ToRedisArgs, M: ToRedisArgs>(&mut self, key: K, members: M) -> RedisResult<i64>',
    'HSET': [
      'fn hset<K: ToRedisArgs, F: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, field: F, value: V) -> RedisResult<i64>',
      'fn hset_nx<K: ToRedisArgs, F: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, field: F, value: V) -> RedisResult<bool>',
      'fn hset_multiple<K: ToRedisArgs, F: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, items: &[(F, V)]) -> RedisResult<()>',
    ],
    'ZADD': [
      'fn zadd<K: ToRedisArgs, S: ToRedisArgs, M: ToRedisArgs>(&mut self, key: K, member: M, score: S) -> RedisResult<i64>',
      'fn zadd_multiple<K: ToRedisArgs, S: ToRedisArgs, M: ToRedisArgs>(&mut self, key: K, items: &[(S, M)]) -> RedisResult<i64>',
    ],
    'INCR': [
      'fn incr<K: ToRedisArgs, V: ToRedisArgs, RV: FromRedisValue>(&mut self, key: K, delta: V) -> RedisResult<RV>',
    ],
    'EXPIRE': [
      'fn expire<K: ToRedisArgs>(&mut self, key: K, seconds: i64) -> RedisResult<bool>',
      'fn expire_at<K: ToRedisArgs>(&mut self, key: K, ts: i64) -> RedisResult<bool>',
    ],
  },
  'redis_rs_async': {
    'GET': 'async fn get<K: ToRedisArgs, RV: FromRedisValue>(&mut self, key: K) -> RedisResult<RV>',
    'SET': [
      'async fn set<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V) -> RedisResult<()>',
      'async fn set_ex<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V, seconds: u64) -> RedisResult<()>',
      'async fn set_nx<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V) -> RedisResult<bool>',
      'async fn set_options<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V, options: SetOptions) -> RedisResult<()>',
    ],
    'DEL': 'async fn del<K: ToRedisArgs>(&mut self, key: K) -> RedisResult<i64>',
    'LPUSH': [
      'async fn lpush<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V) -> RedisResult<i64>',
      'async fn lpush_exists<K: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, value: V) -> RedisResult<i64>',
    ],
    'RPOP': 'async fn rpop<K: ToRedisArgs, RV: FromRedisValue>(&mut self, key: K, count: Option<core::num::NonZeroUsize>) -> RedisResult<RV>',
    'SADD': 'async fn sadd<K: ToRedisArgs, M: ToRedisArgs>(&mut self, key: K, members: M) -> RedisResult<i64>',
    'HSET': [
      'async fn hset<K: ToRedisArgs, F: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, field: F, value: V) -> RedisResult<i64>',
      'async fn hset_nx<K: ToRedisArgs, F: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, field: F, value: V) -> RedisResult<bool>',
      'async fn hset_multiple<K: ToRedisArgs, F: ToRedisArgs, V: ToRedisArgs>(&mut self, key: K, items: &[(F, V)]) -> RedisResult<()>',
    ],
    'ZADD': [
      'async fn zadd<K: ToRedisArgs, S: ToRedisArgs, M: ToRedisArgs>(&mut self, key: K, member: M, score: S) -> RedisResult<i64>',
      'async fn zadd_multiple<K: ToRedisArgs, S: ToRedisArgs, M: ToRedisArgs>(&mut self, key: K, items: &[(S, M)]) -> RedisResult<i64>',
    ],
    'INCR': [
      'async fn incr<K: ToRedisArgs, V: ToRedisArgs, RV: FromRedisValue>(&mut self, key: K, delta: V) -> RedisResult<RV>',
    ],
    'EXPIRE': [
      'async fn expire<K: ToRedisArgs>(&mut self, key: K, seconds: i64) -> RedisResult<bool>',
      'async fn expire_at<K: ToRedisArgs>(&mut self, key: K, ts: i64) -> RedisResult<bool>',
    ],
  },
  'nredisstack_sync': {
    'GET': [
      'RedisValue StringGet(RedisKey key, CommandFlags flags = CommandFlags.None)',
      'RedisValue[] StringGet(RedisKey[] keys, CommandFlags flags = CommandFlags.None)',
    ],
    'SET': [
      'bool StringSet(RedisKey key, RedisValue value, TimeSpan? expiry = null, When when = When.Always, CommandFlags flags = CommandFlags.None)',
      'bool StringSet(RedisKey key, RedisValue value, TimeSpan? expiry, bool keepTtl, When when = When.Always, CommandFlags flags = CommandFlags.None)',
      'bool StringSet(KeyValuePair<RedisKey, RedisValue>[] values, When when = When.Always, CommandFlags flags = CommandFlags.None)',
    ],
    'DEL': [
      'bool KeyDelete(RedisKey key, CommandFlags flags = CommandFlags.None)',
      'long KeyDelete(RedisKey[] keys, CommandFlags flags = CommandFlags.None)',
    ],
    'LPUSH': [
      'long ListLeftPush(RedisKey key, RedisValue value, When when = When.Always, CommandFlags flags = CommandFlags.None)',
      'long ListLeftPush(RedisKey key, RedisValue[] values, When when = When.Always, CommandFlags flags = CommandFlags.None)',
    ],
    'RPOP': [
      'RedisValue ListRightPop(RedisKey key, CommandFlags flags = CommandFlags.None)',
      'RedisValue[] ListRightPop(RedisKey key, long count, CommandFlags flags = CommandFlags.None)',
      'ListPopResult ListRightPop(RedisKey[] keys, long count, CommandFlags flags = CommandFlags.None)',
    ],
    'SADD': [
      'bool SetAdd(RedisKey key, RedisValue value, CommandFlags flags = CommandFlags.None)',
      'long SetAdd(RedisKey key, RedisValue[] values, CommandFlags flags = CommandFlags.None)',
    ],
    'HSET': [
      'bool HashSet(RedisKey key, RedisValue hashField, RedisValue value, When when = When.Always, CommandFlags flags = CommandFlags.None)',
      'void HashSet(RedisKey key, HashEntry[] hashFields, CommandFlags flags = CommandFlags.None)',
    ],
    'ZADD': [
      'bool SortedSetAdd(RedisKey key, RedisValue member, double score, CommandFlags flags = CommandFlags.None)',
      'bool SortedSetAdd(RedisKey key, RedisValue member, double score, When when, CommandFlags flags = CommandFlags.None)',
      'long SortedSetAdd(RedisKey key, SortedSetEntry[] values, CommandFlags flags = CommandFlags.None)',
      'long SortedSetAdd(RedisKey key, SortedSetEntry[] values, When when, CommandFlags flags = CommandFlags.None)',
    ],
    'INCR': [
      'long StringIncrement(RedisKey key, long value = 1, CommandFlags flags = CommandFlags.None)',
      'double StringIncrement(RedisKey key, double value, CommandFlags flags = CommandFlags.None)',
    ],
    'EXPIRE': [
      'bool KeyExpire(RedisKey key, TimeSpan? expiry, CommandFlags flags = CommandFlags.None)',
      'bool KeyExpire(RedisKey key, TimeSpan? expiry, ExpireWhen when, CommandFlags flags = CommandFlags.None)',
      'bool KeyExpire(RedisKey key, DateTime? expiry, CommandFlags flags = CommandFlags.None)',
      'bool KeyExpire(RedisKey key, DateTime? expiry, ExpireWhen when, CommandFlags flags = CommandFlags.None)',
    ],
  },
  'nredisstack_async': {
    'GET': [
      'Task<RedisValue> StringGetAsync(RedisKey key, CommandFlags flags = CommandFlags.None)',
      'Task<RedisValue[]> StringGetAsync(RedisKey[] keys, CommandFlags flags = CommandFlags.None)',
    ],
    'SET': [
      'Task<bool> StringSetAsync(RedisKey key, RedisValue value, TimeSpan? expiry = null, When when = When.Always, CommandFlags flags = CommandFlags.None)',
      'Task<bool> StringSetAsync(RedisKey key, RedisValue value, TimeSpan? expiry, bool keepTtl, When when = When.Always, CommandFlags flags = CommandFlags.None)',
      'Task<bool> StringSetAsync(KeyValuePair<RedisKey, RedisValue>[] values, When when = When.Always, CommandFlags flags = CommandFlags.None)',
    ],
    'DEL': [
      'Task<bool> KeyDeleteAsync(RedisKey key, CommandFlags flags = CommandFlags.None)',
      'Task<long> KeyDeleteAsync(RedisKey[] keys, CommandFlags flags = CommandFlags.None)',
    ],
    'LPUSH': [
      'Task<long> ListLeftPushAsync(RedisKey key, RedisValue value, When when = When.Always, CommandFlags flags = CommandFlags.None)',
      'Task<long> ListLeftPushAsync(RedisKey key, RedisValue[] values, When when = When.Always, CommandFlags flags = CommandFlags.None)',
    ],
    'RPOP': [
      'Task<RedisValue> ListRightPopAsync(RedisKey key, CommandFlags flags = CommandFlags.None)',
      'Task<RedisValue[]> ListRightPopAsync(RedisKey key, long count, CommandFlags flags = CommandFlags.None)',
      'Task<ListPopResult> ListRightPopAsync(RedisKey[] keys, long count, CommandFlags flags = CommandFlags.None)',
    ],
    'SADD': [
      'Task<bool> SetAddAsync(RedisKey key, RedisValue value, CommandFlags flags = CommandFlags.None)',
      'Task<long> SetAddAsync(RedisKey key, RedisValue[] values, CommandFlags flags = CommandFlags.None)',
    ],
    'HSET': [
      'Task<bool> HashSetAsync(RedisKey key, RedisValue hashField, RedisValue value, When when = When.Always, CommandFlags flags = CommandFlags.None)',
      'Task<void> HashSetAsync(RedisKey key, HashEntry[] hashFields, CommandFlags flags = CommandFlags.None)',
    ],
    'ZADD': [
      'Task<bool> SortedSetAddAsync(RedisKey key, RedisValue member, double score, CommandFlags flags = CommandFlags.None)',
      'Task<bool> SortedSetAddAsync(RedisKey key, RedisValue member, double score, When when, CommandFlags flags = CommandFlags.None)',
      'Task<long> SortedSetAddAsync(RedisKey key, SortedSetEntry[] values, CommandFlags flags = CommandFlags.None)',
      'Task<long> SortedSetAddAsync(RedisKey key, SortedSetEntry[] values, When when, CommandFlags flags = CommandFlags.None)',
    ],
    'INCR': [
      'Task<long> StringIncrementAsync(RedisKey key, long value = 1, CommandFlags flags = CommandFlags.None)',
      'Task<double> StringIncrementAsync(RedisKey key, double value, CommandFlags flags = CommandFlags.None)',
    ],
    'EXPIRE': [
      'Task<bool> KeyExpireAsync(RedisKey key, TimeSpan? expiry, CommandFlags flags = CommandFlags.None)',
      'Task<bool> KeyExpireAsync(RedisKey key, TimeSpan? expiry, ExpireWhen when, CommandFlags flags = CommandFlags.None)',
      'Task<bool> KeyExpireAsync(RedisKey key, DateTime? expiry, CommandFlags flags = CommandFlags.None)',
      'Task<bool> KeyExpireAsync(RedisKey key, DateTime? expiry, ExpireWhen when, CommandFlags flags = CommandFlags.None)',
    ],
  },
  'redis_vl': {
    'GET': 'get(name: str) -> str | None',
    'SET': 'set(name: str, value: str, ex: int | None = None, px: int | None = None, nx: bool = False, xx: bool = False) -> bool | None',
    'DEL': 'delete(*names: str) -> int',
    'LPUSH': 'lpush(name: str, *values: str) -> int',
    'RPOP': [
      'rpop(name: str) -> str | None',
      'rpop(name: str, count: int) -> list[str] | None',
    ],
    'SADD': 'sadd(name: str, *values: str) -> int',
    'HSET': [
      'hset(name: str, key: str, value: str) -> int',
      'hset(name: str, mapping: dict[str, str]) -> int',
    ],
    'ZADD': 'zadd(name: str, mapping: dict[str, float], nx: bool = False, xx: bool = False, ch: bool = False, incr: bool = False, gt: bool = False, lt: bool = False) -> int',
    'INCR': 'incr(name: str, amount: int = 1) -> int',
    'EXPIRE': [
      'expire(name: str, time: int) -> bool',
      'expire(name: str, time: timedelta) -> bool',
    ],
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

  // Populate with real signatures (supports both single signatures and arrays of overloads)
  for (const [clientId, signatures] of Object.entries(realSignatures)) {
    for (const cmd of commands) {
      if (signatures[cmd]) {
        const signaturesForCmd = signatures[cmd];
        // Normalize to array (could be string or string[])
        const signatureArray = Array.isArray(signaturesForCmd) ? signaturesForCmd : [signaturesForCmd];

        mapping[cmd].api_calls[clientId] = signatureArray.map(sig => {
          // Reformat signature to standard language conventions
          const reformattedSig = SignatureParser.reformatSignature(sig, clientId);
          const parsed = SignatureParser.parseSignature(reformattedSig, clientId);

          return {
            signature: reformattedSig,
            params: parsed.params,
            returns: parsed.returns
          };
        });
      }
    }
  }

  // Save to file
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.resolve(currentDir, '../extracted-real-signatures.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

  // Calculate statistics
  const totalClientMappings = Object.values(mapping).reduce((sum, cmd) => sum + Object.keys(cmd.api_calls).length, 0);
  const totalSignatures = Object.values(mapping).reduce((sum, cmd) =>
    sum + Object.values(cmd.api_calls).reduce((clientSum, sigs) => clientSum + sigs.length, 0), 0);

  console.log(`✅ Real signatures generated from documentation!`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Commands: ${Object.keys(mapping).length}`);
  console.log(`   Total client mappings: ${totalClientMappings}`);
  console.log(`   Total signatures (including overloads): ${totalSignatures}`);

  // Print sample of parsed signatures showing overloads
  console.log(`\n📋 Sample Parsed Signatures (with overloads):`);
  let sampleCount = 0;
  for (const [cmd, cmdData] of Object.entries(mapping)) {
    for (const [clientId, sigs] of Object.entries(cmdData.api_calls)) {
      if (sampleCount < 3) {
        console.log(`\n   ${clientId} - ${cmd} (${sigs.length} overload${sigs.length > 1 ? 's' : ''}):`);
        sigs.forEach((sig, idx) => {
          console.log(`     [${idx + 1}] ${sig.signature}`);
        });
        sampleCount++;
      }
    }
  }
}

generateRealSignatures().catch(console.error);

