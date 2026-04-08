# Schema Examples and Edge Cases

## Example 1: Simple Command (GET)

```json
{
  "GET": {
    "api_calls": {
      "redis_py": [
        {
          "signature": "get(name: str) -> str | None",
          "params": [
            {
              "name": "name",
              "type": "str",
              "description": "The key name"
            }
          ],
          "returns": {
            "type": "str | None",
            "description": "The value of the key, or None if the key does not exist"
          }
        }
      ],
      "node_redis": [
        {
          "signature": "get(key: string): Promise<string | null>",
          "params": [
            {
              "name": "key",
              "type": "string",
              "description": "The key name"
            }
          ],
          "returns": {
            "type": "Promise<string | null>",
            "description": "The value of the key, or null if the key does not exist"
          }
        }
      ]
    }
  }
}
```

## Example 2: Command with Multiple Overloads (EXPIRE)

```json
{
  "EXPIRE": {
    "api_calls": {
      "jedis": [
        {
          "signature": "expire(byte[] key, long seconds) -> long",
          "params": [
            {
              "name": "key",
              "type": "byte[]",
              "description": "The key"
            },
            {
              "name": "seconds",
              "type": "long",
              "description": "Timeout in seconds"
            }
          ],
          "returns": {
            "type": "long",
            "description": "1 if the timeout was set, 0 if the key does not exist"
          }
        },
        {
          "signature": "expire(byte[] key, long seconds, ExpiryOption expiryOption) -> long",
          "params": [
            {
              "name": "key",
              "type": "byte[]",
              "description": "The key"
            },
            {
              "name": "seconds",
              "type": "long",
              "description": "Timeout in seconds"
            },
            {
              "name": "expiryOption",
              "type": "ExpiryOption",
              "description": "Expiry option (NX, XX, GT, LT)"
            }
          ],
          "returns": {
            "type": "long",
            "description": "1 if the timeout was set, 0 otherwise"
          }
        }
      ]
    }
  }
}
```

## Example 3: Command Not Available in All Clients

```json
{
  "FT.SEARCH": {
    "api_calls": {
      "redis_py": [
        {
          "signature": "search(index: str, query: str, **kwargs) -> Result",
          "params": [
            {
              "name": "index",
              "type": "str",
              "description": "The index name"
            },
            {
              "name": "query",
              "type": "str",
              "description": "The search query"
            }
          ],
          "returns": {
            "type": "Result",
            "description": "Search results"
          }
        }
      ],
      "node_redis": [
        {
          "signature": "search(index: string, query: string, options?: SearchOptions): Promise<SearchResult>",
          "params": [
            {
              "name": "index",
              "type": "string",
              "description": "The index name"
            },
            {
              "name": "query",
              "type": "string",
              "description": "The search query"
            }
          ],
          "returns": {
            "type": "Promise<SearchResult>",
            "description": "Search results"
          }
        }
      ]
    }
  }
}
```

Note: Only includes clients that support RediSearch. Other clients omitted.

## Example 4: Command with Complex Parameters

```json
{
  "XREAD": {
    "api_calls": {
      "jedis": [
        {
          "signature": "xread(XReadParams xReadParams, Map<String, StreamEntryID> streams) -> List<Map.Entry<String, List<StreamEntry>>>",
          "params": [
            {
              "name": "xReadParams",
              "type": "XReadParams",
              "description": "Parameters object containing COUNT, BLOCK, STREAMS options"
            },
            {
              "name": "streams",
              "type": "Map<String, StreamEntryID>",
              "description": "Map of stream keys to entry IDs to start reading from"
            }
          ],
          "returns": {
            "type": "List<Map.Entry<String, List<StreamEntry>>>",
            "description": "List of stream entries grouped by stream key"
          }
        }
      ]
    }
  }
}
```

## Example 5: Deprecated Command

```json
{
  "SLAVEOF": {
    "api_calls": {
      "go_redis": [
        {
          "signature": "SlaveOf(ctx context.Context, host, port string) *StatusCmd",
          "params": [
            {
              "name": "ctx",
              "type": "context.Context",
              "description": "Context for cancellation and timeouts"
            },
            {
              "name": "host",
              "type": "string",
              "description": "The host of the master server"
            },
            {
              "name": "port",
              "type": "string",
              "description": "The port of the master server"
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

Note: SLAVEOF is deprecated in favor of REPLICAOF, but still included.

## Edge Cases & Handling

### 1. Commands with No Parameters (besides context)

```json
{
  "PING": {
    "api_calls": {
      "redis_py": [
        {
          "signature": "ping() -> bool",
          "params": [],
          "returns": {
            "type": "bool",
            "description": "True if PONG received"
          }
        }
      ]
    }
  }
}
```

### 2. Commands with Variadic Parameters

```json
{
  "DEL": {
    "api_calls": {
      "redis_py": [
        {
          "signature": "delete(*names: str) -> int",
          "params": [
            {
              "name": "names",
              "type": "str (variadic)",
              "description": "One or more key names to delete"
            }
          ],
          "returns": {
            "type": "int",
            "description": "Number of keys deleted"
          }
        }
      ]
    }
  }
}
```

### 3. Commands with No Return Value

```json
{
  "SUBSCRIBE": {
    "api_calls": {
      "redis_py": [
        {
          "signature": "subscribe(*channels: str) -> PubSub",
          "params": [
            {
              "name": "channels",
              "type": "str (variadic)",
              "description": "Channel names to subscribe to"
            }
          ],
          "returns": {
            "type": "PubSub",
            "description": "A PubSub object for receiving messages"
          }
        }
      ]
    }
  }
}
```

### 4. Commands with Async/Promise Returns

```json
{
  "SET": {
    "api_calls": {
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
            }
          ],
          "returns": {
            "type": "Promise<string | null>",
            "description": "Promise that resolves to OK or null"
          }
        }
      ]
    }
  }
}
```

### 5. Missing Doc Comments

When source code lacks doc comments, use empty string:

```json
{
  "COMMAND": {
    "api_calls": {
      "redis_py": [
        {
          "signature": "command() -> dict",
          "params": [],
          "returns": {
            "type": "dict",
            "description": ""
          }
        }
      ]
    }
  }
}
```

### 6. Multi-line Doc Comments

Preserve formatting:

```json
{
  "GEOADD": {
    "api_calls": {
      "redis_py": [
        {
          "signature": "geoadd(name: str, *values: float | str, nx: bool = False, xx: bool = False, ch: bool = False) -> int",
          "params": [
            {
              "name": "values",
              "type": "float | str (variadic)",
              "description": "Geospatial items as ordered members: longitude, latitude, name. Repeat for multiple items."
            },
            {
              "name": "nx",
              "type": "bool",
              "description": "Only add new elements, don't update existing ones"
            }
          ],
          "returns": {
            "type": "int",
            "description": "Number of elements added to the sorted set"
          }
        }
      ]
    }
  }
}
```

## Validation Rules

1. **Command names** must match entries in commands_core.json or module command files
2. **Client IDs** must match entries in data/components/index.json
3. **Signatures** must be valid for the language
4. **Params array** must not include context/self parameters
5. **Returns** object must be omitted if return type is void/None/unit
6. **Descriptions** should be non-empty when available from source

