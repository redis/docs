/**
 * Client-Specific Quirks Handler
 * 
 * Documents and handles language-specific patterns, naming conventions,
 * and special cases for each Redis client library.
 */

export interface ClientQuirk {
  client_id: string;
  language: string;
  quirks: {
    naming_conventions?: string[];
    special_patterns?: string[];
    file_locations?: string[];
    method_prefixes?: string[];
    async_patterns?: string[];
    documentation_style?: string;
    notes?: string[];
  };
}

export const CLIENT_QUIRKS: Record<string, ClientQuirk> = {
  // Python clients
  redis_py: {
    client_id: 'redis_py',
    language: 'Python',
    quirks: {
      naming_conventions: ['snake_case for methods', 'PascalCase for classes'],
      special_patterns: ['Uses @property decorators', 'Pipeline pattern for batching'],
      file_locations: ['redis/client.py', 'redis/commands/'],
      method_prefixes: ['execute_command', 'pipeline'],
      documentation_style: 'Google-style docstrings',
      notes: ['Async support via aioredis', 'Connection pooling built-in'],
    },
  },

  // Node.js clients
  node_redis: {
    client_id: 'node_redis',
    language: 'TypeScript',
    quirks: {
      naming_conventions: ['camelCase for methods', 'PascalCase for classes'],
      special_patterns: ['Promise-based API', 'Callback support'],
      file_locations: ['packages/client/lib/', 'packages/client/dist/'],
      async_patterns: ['async/await', 'Promises'],
      documentation_style: 'JSDoc comments',
      notes: ['Monorepo structure', 'Multiple packages'],
    },
  },

  ioredis: {
    client_id: 'ioredis',
    language: 'TypeScript',
    quirks: {
      naming_conventions: ['camelCase for methods'],
      special_patterns: ['Cluster support', 'Sentinel support'],
      file_locations: ['lib/redis.ts', 'lib/commands/'],
      async_patterns: ['Promise-based'],
      documentation_style: 'JSDoc comments',
      notes: ['High performance', 'Cluster-aware'],
    },
  },

  // Java clients
  jedis: {
    client_id: 'jedis',
    language: 'Java',
    quirks: {
      naming_conventions: ['camelCase for methods', 'PascalCase for classes'],
      special_patterns: ['Connection pooling', 'Pipeline pattern'],
      file_locations: ['src/main/java/redis/clients/jedis/'],
      method_prefixes: ['execute', 'pipeline'],
      documentation_style: 'JavaDoc comments',
      notes: ['Synchronous API', 'Thread-safe'],
    },
  },

  lettuce_sync: {
    client_id: 'lettuce_sync',
    language: 'Java',
    quirks: {
      naming_conventions: ['camelCase for methods'],
      special_patterns: ['Reactive streams', 'Async support'],
      file_locations: ['src/main/java/io/lettuce/core/'],
      documentation_style: 'JavaDoc comments',
      notes: ['Synchronous variant', 'Thread-safe'],
    },
  },

  lettuce_async: {
    client_id: 'lettuce_async',
    language: 'Java',
    quirks: {
      naming_conventions: ['camelCase for methods'],
      special_patterns: ['CompletableFuture-based', 'Async API'],
      file_locations: ['src/main/java/io/lettuce/core/'],
      async_patterns: ['CompletableFuture', 'RxJava'],
      documentation_style: 'JavaDoc comments',
      notes: ['Asynchronous variant', 'Non-blocking'],
    },
  },

  lettuce_reactive: {
    client_id: 'lettuce_reactive',
    language: 'Java',
    quirks: {
      naming_conventions: ['camelCase for methods'],
      special_patterns: ['Reactive streams', 'Project Reactor'],
      file_locations: ['src/main/java/io/lettuce/core/'],
      async_patterns: ['Mono', 'Flux'],
      documentation_style: 'JavaDoc comments',
      notes: ['Reactive variant', 'Project Reactor integration'],
    },
  },

  // Go client
  go_redis: {
    client_id: 'go_redis',
    language: 'Go',
    quirks: {
      naming_conventions: ['PascalCase for exported functions', 'snake_case for internal'],
      special_patterns: ['Interface-based design', 'Context support'],
      file_locations: ['redis.go', 'commands.go'],
      async_patterns: ['Goroutines', 'Channels'],
      documentation_style: 'Go doc comments (// style)',
      notes: ['Concurrent by default', 'Context-aware'],
    },
  },

  // PHP client
  php: {
    client_id: 'php',
    language: 'PHP',
    quirks: {
      naming_conventions: ['camelCase for methods', 'PascalCase for classes'],
      special_patterns: ['Magic methods (__call)', 'Fluent interface'],
      file_locations: ['src/Client.php', 'src/Commands/'],
      documentation_style: 'PHPDoc comments',
      notes: ['Synchronous API', 'Connection pooling'],
    },
  },

  // Rust clients
  redis_rs_sync: {
    client_id: 'redis_rs_sync',
    language: 'Rust',
    quirks: {
      naming_conventions: ['snake_case for functions', 'PascalCase for types'],
      special_patterns: ['Trait-based design', 'Error handling with Result'],
      file_locations: ['src/client.rs', 'src/commands/'],
      documentation_style: 'Rust doc comments (/// style)',
      notes: ['Synchronous variant', 'Type-safe'],
    },
  },

  redis_rs_async: {
    client_id: 'redis_rs_async',
    language: 'Rust',
    quirks: {
      naming_conventions: ['snake_case for functions'],
      special_patterns: ['Async/await support', 'Tokio integration'],
      file_locations: ['src/aio/client.rs'],
      async_patterns: ['async/await', 'Tokio'],
      documentation_style: 'Rust doc comments',
      notes: ['Asynchronous variant', 'Tokio-based'],
    },
  },

  // .NET clients
  nredisstack_sync: {
    client_id: 'nredisstack_sync',
    language: 'C#',
    quirks: {
      naming_conventions: ['PascalCase for methods and classes'],
      special_patterns: ['LINQ support', 'Extension methods'],
      file_locations: ['src/NRedisStack/'],
      documentation_style: 'XML doc comments',
      notes: ['Synchronous variant', 'Thread-safe'],
    },
  },

  nredisstack_async: {
    client_id: 'nredisstack_async',
    language: 'C#',
    quirks: {
      naming_conventions: ['PascalCase for methods'],
      special_patterns: ['async/await support', 'Task-based'],
      file_locations: ['src/NRedisStack/'],
      async_patterns: ['async/await', 'Task<T>'],
      documentation_style: 'XML doc comments',
      notes: ['Asynchronous variant', 'Task-based'],
    },
  },

  // Vector search client
  redis_vl: {
    client_id: 'redis_vl',
    language: 'Python',
    quirks: {
      naming_conventions: ['snake_case for methods'],
      special_patterns: ['Vector search specific', 'Semantic search'],
      file_locations: ['redisvl/'],
      documentation_style: 'Google-style docstrings',
      notes: ['Vector search focused', 'Built on redis-py'],
    },
  },
};

export function getClientQuirks(clientId: string): ClientQuirk | undefined {
  return CLIENT_QUIRKS[clientId];
}

export function getAllQuirks(): ClientQuirk[] {
  return Object.values(CLIENT_QUIRKS);
}

export function getQuirksByLanguage(language: string): ClientQuirk[] {
  return Object.values(CLIENT_QUIRKS).filter(q => q.language === language);
}

