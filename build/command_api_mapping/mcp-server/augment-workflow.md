# Augment Workflow: Redis Command-to-API Mapping

This document describes how to use the Redis Command-to-API Mapping MCP server with Augment.

## Overview

The MCP server provides 6 tools for extracting and analyzing Redis command API signatures across 14 client libraries:

1. **list_redis_commands** - List all Redis commands
2. **list_clients** - List all supported Redis clients
3. **get_client_info** - Get information about a specific client
4. **extract_signatures** - Extract method signatures from source code
5. **extract_doc_comments** - Extract documentation from source code
6. **validate_signature** - Validate a method signature

## Common Workflows

### Workflow 1: Discover Available Clients

**Goal**: Find all supported Redis clients and their details

**Steps**:
1. Call `list_clients` to get all available clients
2. For each client of interest, call `get_client_info` with the client ID
3. Review client metadata (language, version, repository, etc.)

**Example**:
```
1. list_clients() → Returns array of clients
2. get_client_info(client_id: "redis-py") → Returns Python client details
3. get_client_info(client_id: "jedis") → Returns Java client details
```

### Workflow 2: Extract Method Signatures

**Goal**: Extract all method signatures from a client library

**Steps**:
1. Identify the source file to analyze
2. Call `extract_signatures` with file path and language
3. Optionally filter by method names
4. Review extracted signatures

**Example**:
```
extract_signatures(
  file_path: "redis/client.py",
  language: "python",
  method_name_filter: ["get", "set", "delete"]
)
```

### Workflow 3: Extract Documentation

**Goal**: Get documentation for specific methods

**Steps**:
1. Identify the source file and methods
2. Call `extract_doc_comments` with file path and language
3. Optionally specify specific method names
4. Review extracted documentation

**Example**:
```
extract_doc_comments(
  file_path: "redis/client.py",
  language: "python",
  method_names: ["get", "set"]
)
```

### Workflow 4: Validate Signatures

**Goal**: Verify that a method signature is valid

**Steps**:
1. Prepare the signature string
2. Call `validate_signature` with signature and language
3. Review validation results

**Example**:
```
validate_signature(
  signature: "def get(self, name: str) -> Optional[bytes]:",
  language: "python"
)
```

### Workflow 5: Complete Analysis Pipeline

**Goal**: Fully analyze a client library

**Steps**:
1. List all clients
2. Select a client and get its info
3. Extract all method signatures
4. Extract documentation for key methods
5. Validate critical signatures

**Example**:
```
1. clients = list_clients()
2. client_info = get_client_info(client_id: clients[0].id)
3. signatures = extract_signatures(
     file_path: client_info.source_path,
     language: client_info.language
   )
4. docs = extract_doc_comments(
     file_path: client_info.source_path,
     language: client_info.language
   )
5. For each signature, validate_signature(...)
```

## Tool Parameters

### list_redis_commands
- `include_modules` (boolean, optional): Include module commands (default: true)
- `include_deprecated` (boolean, optional): Include deprecated commands (default: true)
- `module_filter` (array, optional): Filter to specific modules

### list_clients
- `language_filter` (array, optional): Filter by programming language

### get_client_info
- `client_id` (string, required): Client ID

### extract_signatures
- `file_path` (string, required): Path to source file
- `language` (string, required): Programming language
- `method_name_filter` (array, optional): Filter to specific method names

### extract_doc_comments
- `file_path` (string, required): Path to source file
- `language` (string, required): Programming language
- `method_names` (array, optional): Specific methods to extract docs for

### validate_signature
- `signature` (string, required): Method signature to validate
- `language` (string, required): Programming language

## Supported Languages

- Python
- Java
- Go
- TypeScript
- Rust
- C#
- PHP

## Error Handling

All tools return structured error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common errors:
- Invalid file path: File does not exist
- Invalid language: Language not supported
- Invalid client ID: Client not found
- Invalid signature: Signature format incorrect

## Best Practices

1. **Always validate inputs** - Check that file paths exist and languages are supported
2. **Use filters wisely** - Filter by method names or modules to reduce output
3. **Handle errors gracefully** - Check for error responses and retry if needed
4. **Cache results** - Store client info and command lists to avoid repeated calls
5. **Validate signatures** - Use validate_signature before processing extracted signatures

## Performance Tips

1. Extract signatures for entire files rather than individual methods
2. Use method_name_filter to reduce output size
3. Cache client info and command lists
4. Batch multiple validations together
5. Use language-specific optimizations when available

## Troubleshooting

**Issue**: Tool not found
- **Solution**: Verify MCP server is running and tools are registered

**Issue**: File not found
- **Solution**: Check file path is correct and file exists

**Issue**: Invalid language
- **Solution**: Use one of the supported languages (python, java, go, typescript, rust, csharp, php)

**Issue**: Signature validation fails
- **Solution**: Check signature format matches language syntax

## Next Steps

See [AUGMENT_INTEGRATION.md](./AUGMENT_INTEGRATION.md) for setup and configuration instructions.

