# Command-to-API Mapping Schema Design

## Overview
This document defines the JSON schema for `data/commands_api_mapping.json`, which maps Redis commands to their equivalent API calls across all client libraries.

## File Structure

```json
{
  "SET": {
    "api_calls": {
      "redis_py": [ ... ],
      "node_redis": [ ... ],
      "go_redis": [ ... ],
      "jedis": [ ... ],
      "lettuce_sync": [ ... ],
      "nredisstack_sync": [ ... ],
      "ioredis": [ ... ],
      "php": [ ... ],
      "redis_rs_sync": [ ... ],
      "hi_redis": [ ... ]
    }
  }
}
```

## Signature Object Structure

Each client language has an array of signature objects:

```json
{
  "signature": "set(name: str, value: str, ex: int | None = None, ...) -> bool | None",
  "params": [
    {
      "name": "name",
      "type": "str",
      "description": "The key name"
    },
    {
      "name": "value",
      "type": "str",
      "description": "The value to set"
    }
  ],
  "returns": {
    "type": "bool | None",
    "description": "True if the key was set, None otherwise"
  }
}
```

## Field Definitions

### Top Level
- **Command Name** (key): Redis command name (e.g., "SET", "HSET", "ACL CAT")
  - Matches command names from `commands_core.json`, `commands_redisearch.json`, etc.
  - Includes deprecated commands
  - Includes module commands

### api_calls Object
- **Client ID** (key): Identifier from `data/components/` (e.g., "redis_py", "node_redis")
  - Only includes clients that have the command
  - Omit if command not available in that client

### Signature Array
Each command can have multiple overloads. Array contains signature objects.

### Signature Object Fields

#### signature (string, required)
- Full method/function signature as it appears in the client library
- Include parameter names, types, and defaults
- Include return type
- Format varies by language:
  - **Python**: `method_name(param1: type, param2: type = default) -> return_type`
  - **Go**: `MethodName(ctx context.Context, param1 type, param2 type) *ReturnType`
  - **Java**: `methodName(Type param1, Type param2, OptionalParams params) -> ReturnType`
  - **Node.js**: `methodName(param1: type, param2?: type): Promise<ReturnType>`
  - **Rust**: `fn method_name(&self, param1: Type, param2: Type) -> Result<ReturnType>`
  - **C#**: `MethodName(type param1, type param2, OptionalParams params) -> ReturnType`
  - **PHP**: `methodName($param1, $param2, $options = []) -> ReturnType`
  - **C**: `redisCommand(redisContext *c, const char *format, ...)`

#### params (array, optional)
- Array of parameter objects
- Omit if no parameters (besides context/self)
- Order matches signature order

#### params[].name (string, required)
- Parameter name as it appears in source code
- Exclude context parameters (ctx, self, etc.)

#### params[].type (string, required)
- Parameter type as declared in source
- Use language-native type syntax
- Examples: `str`, `int`, `Optional[str]`, `context.Context`, `String`, `Promise<T>`

#### params[].description (string, required)
- Extracted from source doc comments (docstrings, JavaDoc, JSDoc, etc.)
- Single line or multi-line
- Preserve original formatting from source
- If no doc comment exists, leave empty string

#### returns (object, optional)
- Omit if return type is void/None/unit
- Contains type and description

#### returns.type (string, required)
- Return type as declared in source
- Use language-native type syntax

#### returns.description (string, required)
- Extracted from source doc comments
- Describes what the return value represents
- If no doc comment exists, leave empty string

## Example: SET Command

```json
{
  "SET": {
    "api_calls": {
      "redis_py": [
        {
          "signature": "set(name: str, value: str, ex: int | None = None, px: int | None = None, exat: int | None = None, pxat: int | None = None, nx: bool = False, xx: bool = False, keepttl: bool = False, get: bool = False) -> bool | None",
          "params": [
            {
              "name": "name",
              "type": "str",
              "description": "The key name"
            },
            {
              "name": "value",
              "type": "str",
              "description": "The value to set"
            },
            {
              "name": "ex",
              "type": "int | None",
              "description": "Expire time in seconds"
            }
          ],
          "returns": {
            "type": "bool | None",
            "description": "True if the key was set, None if NX/XX condition not met"
          }
        }
      ],
      "node_redis": [
        {
          "signature": "set(key: string, value: string | Buffer, options?: SetOptions): Promise<string | null>",
          "params": [
            {
              "name": "key",
              "type": "string",
              "description": "The key name"
            },
            {
              "name": "value",
              "type": "string | Buffer",
              "description": "The value to set"
            },
            {
              "name": "options",
              "type": "SetOptions",
              "description": "Optional SET command options (EX, PX, NX, XX, etc.)"
            }
          ],
          "returns": {
            "type": "Promise<string | null>",
            "description": "OK if the key was set, null if NX/XX condition not met"
          }
        }
      ],
      "go_redis": [
        {
          "signature": "Set(ctx context.Context, key string, value interface{}, expiration time.Duration) *StatusCmd",
          "params": [
            {
              "name": "ctx",
              "type": "context.Context",
              "description": "Context for cancellation and timeouts"
            },
            {
              "name": "key",
              "type": "string",
              "description": "The key name"
            },
            {
              "name": "value",
              "type": "interface{}",
              "description": "The value to set"
            },
            {
              "name": "expiration",
              "type": "time.Duration",
              "description": "Expiration time (0 for no expiration)"
            }
          ],
          "returns": {
            "type": "*StatusCmd",
            "description": "A command that returns OK when executed"
          }
        }
      ]
    }
  }
}
```

## Notes

- **Command Coverage**: All commands from all modules (core, redisearch, redisjson, etc.)
- **Deprecated Commands**: Include with signatures as they exist
- **Missing Clients**: If a command isn't available in a client, omit that client from api_calls
- **Doc Comment Extraction**: Parameter descriptions come directly from source code doc comments
- **Overload Selection**: For Java, include basic + params variants; skip binary/string duplicates
- **Context Parameters**: Exclude language-specific context parameters (ctx, self, etc.) from params array

