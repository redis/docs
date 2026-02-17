# Phase 2: Parse Signatures to Extract Parameters and Return Types

**Status**: Ready to Start  
**Related Files**: 
- `extracted-real-signatures.json` - Contains signature strings that need parsing
- `generate-real-signatures-from-docs.ts` - Generator that needs updating

## Problem Statement

The `extracted-real-signatures.json` file contains real method signatures, but the `params` and `returns` fields are not properly populated:

```json
{
  "signature": "Del(ctx context.Context, keys ...string) *IntCmd",
  "params": [],  // ❌ Should be parsed from signature
  "returns": {
    "type": "any",  // ❌ Should be "*IntCmd" not "any"
    "description": "Result"  // ❌ Generic, should be specific
  }
}
```

## What Needs to Be Done

Parse each signature string to extract:

1. **Parameter Information**:
   - Parameter names
   - Parameter types
   - Parameter descriptions (if available)

2. **Return Type Information**:
   - Return type (extracted from signature)
   - Return description (language-specific)

## Examples of Signatures to Parse

### Python
```
get(name: str) -> str | None
delete(*names: str) -> int
```

### Node.js/TypeScript
```
get(key: string): Promise<string | null>
del(...keys: string[]): Promise<number>
```

### Java
```
get(key: String): String
del(keys: String...): Long
```

### Go
```
Get(ctx context.Context, key string) *StringCmd
Del(ctx context.Context, keys ...string) *IntCmd
```

### C#
```
StringGetAsync(string key): Task<string>
KeyDeleteAsync(params string[] keys): Task<long>
```

### PHP
```
get($key): mixed
del(...$keys): int
```

### Rust
```
fn get<K: ToRedisArgs>(&self, key: K) -> RedisResult<String>
fn del<K: ToRedisArgs>(&self, keys: K) -> RedisResult<i64>
```

## Implementation Approach

Create a signature parser that:

1. **Identifies the language** from the client ID
2. **Extracts parameters** using language-specific regex patterns
3. **Extracts return type** using language-specific patterns
4. **Generates descriptions** based on parameter names and types

## Key Challenges

1. **Language-specific syntax** - Each language has different parameter/return syntax
2. **Generic types** - Handle `<T>`, `Promise<T>`, `Task<T>`, `Mono<T>`, etc.
3. **Variadic parameters** - Handle `...args`, `*args`, `params`, etc.
4. **Optional parameters** - Handle `?`, `= None`, etc.
5. **Context parameters** - Go's `context.Context` should be documented but not as a "user" parameter

## Files to Modify

- `generate-real-signatures-from-docs.ts` - Add parsing logic
- `extracted-real-signatures.json` - Will be regenerated with proper params/returns

## Success Criteria

✅ All parameters extracted with names and types  
✅ Return types match the signature (not generic "any")  
✅ Descriptions are language-specific and meaningful  
✅ All 140 mappings properly populated  
✅ Schema validation passes  

## Notes

- The signature strings in the source file are correct
- Only the parsing/extraction logic needs to be implemented
- This is a pure data transformation task (no external API calls needed)

