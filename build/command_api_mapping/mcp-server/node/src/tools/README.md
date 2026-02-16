# MCP Tools

This directory contains the implementation of all 6 MCP tools for the Redis Command-to-API Mapping server.

## Tools Overview

### 1. list_redis_commands
**Purpose**: List all Redis commands from command definition files.

**Input**:
- `include_modules` (boolean, default: true) - Include module commands
- `include_deprecated` (boolean, default: true) - Include deprecated commands
- `module_filter` (array, default: []) - Filter to specific modules

**Output**:
- `commands` - Array of command objects with name, module, deprecated status, and summary
- `total_count` - Total number of commands
- `by_module` - Count of commands per module

**Status**: ✅ Fully Implemented (Milestone 2.1)

**Implementation Details**:
- Loads commands from 5 JSON files: core, redisearch, redisjson, redisbloom, redistimeseries
- Total: 532 commands across all modules
- Supports filtering by module and deprecated status
- Includes caching for performance
- All tests passing (6/6 data loader tests, 5/5 tool integration tests)

### 2. extract_signatures
**Purpose**: Extract method signatures from client library source files.

**Input**:
- `file_path` (string, required) - Path to source file
- `language` (enum, required) - Programming language (python, java, go, typescript, rust, csharp, php)
- `method_name_filter` (array, default: []) - Filter to specific method names

**Output**:
- `file_path` - Input file path
- `language` - Input language
- `signatures` - Array of extracted signatures with parameters and return types
- `total_count` - Number of signatures extracted
- `errors` - Any parsing errors encountered

**Status**: ✅ Fully Implemented for Python (Milestone 3.1), Java (Milestone 5.1), and Go (Milestone 5.2)

**Implementation Details**:
- Python parser implemented using regex-based parsing in Rust WASM
  - Extracts function names, parameters, return types, and async status
  - Supports type hints and default parameters
  - Tracks line numbers for each signature
  - All tests passing (15/15 parser tests)
- Java parser implemented using regex-based parsing in Rust WASM
  - Extracts method names, parameters, return types, and modifiers
  - Supports generics and complex return types
  - Extracts throws clauses
  - Tracks line numbers for each signature
  - All tests passing (39/39 parser tests)
- Go parser implemented using regex-based parsing in Rust WASM
  - Extracts function names, parameters, return types, and receiver info
  - Supports receiver methods (pointer and value receivers)
  - Handles multiple return values and variadic parameters
  - Supports complex types (slices, maps, channels, pointers)
  - Tracks line numbers for each signature
  - All tests passing (15/15 parser tests)
- Other languages (TypeScript, Rust, C#, PHP) will be implemented in Phase 5

**Example Usage**:
```typescript
// Extract all signatures from a Python file
const result = await extractSignatures({
  file_path: '/path/to/redis_py/client.py',
  language: 'python'
});

// Extract specific methods
const result = await extractSignatures({
  file_path: '/path/to/redis_py/client.py',
  language: 'python',
  method_name_filter: ['get', 'set']
});
```

### 3. extract_doc_comments
**Purpose**: Extract documentation comments from source code.

**Input**:
- `file_path` (string, required) - Path to source file
- `language` (enum, required) - Programming language
- `method_names` (array, default: []) - Specific methods to extract docs for

**Output**:
- `file_path` - Input file path
- `language` - Input language
- `doc_comments` - Map of method_name -> doc comment object with:
  - `raw_comment` - Full docstring text
  - `summary` - First line/summary
  - `description` - Full description (optional)
  - `parameters` - Map of parameter names to descriptions
  - `returns` - Return value documentation
  - `line_number` - Line where docstring appears
- `total_count` - Number of doc comments extracted
- `missing_docs` - Methods with no documentation

**Status**: ✅ Fully Implemented for Python (Milestone 3.2), Java (Milestone 5.1), and Go (Milestone 5.2)

**Implementation Details**:
- Python parser implemented using regex-based parsing in Rust WASM
  - Extracts docstrings from function definitions
  - Parses Google-style docstrings (Args, Returns, Raises sections)
  - Parses NumPy-style docstrings (Parameters, Returns sections)
  - Separates summary, description, parameters, and returns
  - Handles multi-line docstrings
  - Tracks line numbers for each docstring
  - All tests passing (15/15 parser tests)
- Java parser implemented using regex-based parsing in Rust WASM
  - Extracts JavaDoc comments from method definitions
  - Parses @param, @return, @throws tags
  - Separates summary, description, parameters, returns, and throws
  - Handles multi-line JavaDoc comments
  - Tracks line numbers for each JavaDoc
  - All tests passing (39/39 parser tests)
- Go parser implemented using regex-based parsing in Rust WASM
  - Extracts Go doc comments from function definitions
  - Parses // style comments
  - Separates summary, description, parameters, and returns
  - Handles multi-line doc comments
  - Tracks line numbers for each doc comment
  - All tests passing (15/15 parser tests)
- Other languages will be implemented in Phase 5

**Example Usage**:
```typescript
// Extract all doc comments from a Python file
const result = await extractDocComments({
  file_path: '/path/to/redis_py/client.py',
  language: 'python'
});

// Extract docs for specific methods
const result = await extractDocComments({
  file_path: '/path/to/redis_py/client.py',
  language: 'python',
  method_names: ['get', 'set']
});

// Result example:
// {
//   file_path: '/path/to/redis_py/client.py',
//   language: 'python',
//   doc_comments: {
//     get: {
//       raw_comment: 'Get value by key...',
//       summary: 'Get value by key.',
//       parameters: { key: 'The key to retrieve' },
//       returns: 'The value associated with the key',
//       line_number: 42
//     }
//   },
//   total_count: 1,
//   missing_docs: ['set', 'delete']
// }
```

**Supported Docstring Formats**:
- Google-style: `Args:`, `Returns:`, `Raises:` sections
- NumPy-style: `Parameters`, `Returns` sections (basic support)
- Single-line docstrings
- Multi-line docstrings with descriptions

### 4. validate_signature
**Purpose**: Validate that a signature is well-formed for a given language.

**Input**:
- `signature` (string, required) - Signature to validate
- `language` (enum, required) - Programming language (python, java, go, typescript, rust, csharp, php)

**Output**:
- `valid` (boolean) - Whether signature is valid
- `errors` (array) - Validation errors if any
- `warnings` (array) - Non-critical issues (best practices)

**Status**: ✅ Fully Implemented (Milestone 4.1)

**Implementation Details**:
- Language-specific validators for all 7 supported languages
- Rust WASM module with comprehensive validation rules
- Detects syntax errors and missing components
- Provides helpful error messages
- Generates warnings for best practices
- All tests passing (40/40 tests, 100% success rate)

**Supported Languages**:
1. **Python**: `def`, `async def`, parentheses, return type annotations
2. **Java**: Method names, return types, parentheses, keyword validation
3. **Go**: `func` keyword, receiver methods, error return patterns
4. **TypeScript**: Function declarations, async/Promise, return types
5. **Rust**: `fn` keyword, return type annotations, Result<T> validation
6. **C#**: Method names, async/Task, return types
7. **PHP**: `function` keyword, visibility modifiers, return type hints

**Example Usage**:
```typescript
// Validate a Python signature
const result = await validateSignature({
  signature: 'def get(self, key: str) -> str:',
  language: 'python'
});
// Returns: { valid: true, errors: [], warnings: [] }

// Validate an invalid signature
const result = await validateSignature({
  signature: 'def hello',
  language: 'python'
});
// Returns: {
//   valid: false,
//   errors: ['Python signature must have parentheses for parameters'],
//   warnings: []
// }

// Validate with warnings
const result = await validateSignature({
  signature: 'async def fetch_data():',
  language: 'python'
});
// Returns: {
//   valid: true,
//   errors: [],
//   warnings: ['Python signature should end with \':\' or have return type annotation']
// }
```

**Validation Rules**:

**Python**:
- ✓ Must start with `def` or `async def`
- ✓ Must have parentheses for parameters
- ✓ Should end with `:` or have return type annotation
- ✓ Valid method name format

**Java**:
- ✓ Must have parentheses for parameters
- ✓ Must have valid method name (not a keyword)
- ✓ Should have explicit return type
- ✓ Optional semicolon at end

**Go**:
- ✓ Must start with `func`
- ✓ Must have parentheses for parameters
- ✓ Supports receiver methods
- ✓ Validates error return pattern

**TypeScript**:
- ✓ Must be function or arrow function
- ✓ Must have parentheses for parameters
- ✓ Should have return type annotation
- ✓ Async functions should return Promise

**Rust**:
- ✓ Must start with `fn`, `pub fn`, or `async fn`
- ✓ Must have parentheses for parameters
- ✓ Should have explicit return type annotation
- ✓ Validates Result<T> type parameters

**C#**:
- ✓ Must have parentheses for parameters
- ✓ Should have explicit return type
- ✓ Async methods should return Task or Task<T>
- ✓ Validates method name format

**PHP**:
- ✓ Must start with `function` or visibility modifier
- ✓ Must have parentheses for parameters
- ✓ Should have return type hint (PHP 7+)
- ✓ Validates function name format

### 5. get_client_info
**Purpose**: Get metadata about a specific Redis client library.

**Input**:
- `client_id` (string, required) - Client ID (e.g., 'redis_py', 'node_redis')

**Output**:
- `id` - Client ID
- `name` - Client name
- `language` - Programming language
- `type` - Client type (sync, async, reactive, etc.)
- `label` - Display label
- `repository` - Repository information (git_uri, branch, path)

**Status**: ✅ Fully Implemented (Milestone 2.2)

**Implementation Details**:
- Loads client metadata from 14 JSON files in `data/components/`
- Supports all 14 Redis client libraries (excluding hiredis)
- Returns full client metadata including repository information
- Includes error handling for missing clients
- All tests passing (2/2 tool integration tests)

### 6. list_clients
**Purpose**: List all supported Redis client libraries.

**Input**:
- `language_filter` (array, default: []) - Filter to specific languages

**Output**:
- `clients` - Array of client objects with id, name, language, type
- `total_count` - Total number of clients
- `by_language` - Count of clients per language

**Status**: ✅ Fully Implemented (Milestone 2.2)

**Implementation Details**:
- Loads client metadata from 14 JSON files in `data/components/`
- Supports filtering by programming language
- Returns 14 clients across 11 languages
- Includes client counts by language
- Includes caching for performance
- All tests passing (2/2 tool integration tests)

## File Structure

```
tools/
├── README.md                      # This file
├── schemas.ts                     # Zod validation schemas for all tools
├── list-redis-commands.ts         # Tool 1 handler
├── extract-signatures.ts          # Tool 2 handler
├── extract-doc-comments.ts        # Tool 3 handler
├── validate-signature.ts          # Tool 4 handler
├── get-client-info.ts             # Tool 5 handler
└── list-clients.ts                # Tool 6 handler
```

## Adding a New Tool

1. **Define schemas** in `schemas.ts`:
   ```typescript
   export const MyToolInputSchema = z.object({...});
   export type MyToolInput = z.infer<typeof MyToolInputSchema>;
   export const MyToolOutputSchema = z.object({...});
   export type MyToolOutput = z.infer<typeof MyToolOutputSchema>;
   ```

2. **Create handler** in `my-tool.ts`:
   ```typescript
   export async function myTool(input: unknown): Promise<MyToolOutput> {
     const validatedInput = MyToolInputSchema.parse(input);
     // Implementation
     return {...};
   }
   ```

3. **Register in** `../index.ts`:
   - Import the handler and schemas
   - Add tool definition to TOOLS array
   - Add case in CallToolRequestSchema handler

## Error Handling

All tools should:
- Validate input using Zod schemas
- Return partial results if some operations fail
- Include error messages in `errors` array
- Never fail completely (graceful degradation)
- Throw descriptive errors for validation failures

## Implementation Phases

- **Phase 1**: Project setup (✅ COMPLETE)
- **Phase 2**: Data access (✅ COMPLETE - Commands & Clients loaders)
- **Phase 3**: Python parser (✅ COMPLETE)
  - ✅ Milestone 3.1: Extract Signatures Tool (Python) - 15/15 tests passing
  - ✅ Milestone 3.2: Extract Doc Comments Tool (Python) - 15/15 tests passing
- **Phase 4**: Validation tools (✅ COMPLETE)
  - ✅ Milestone 4.1: Validate Signature Tool - 40/40 tests passing (100% success rate)
- **Phase 5**: Other language parsers (🔄 IN PROGRESS)
  - ✅ Milestone 5.1: Java Parser - 39/39 tests passing (100% success rate)
    - Extract Signatures Tool (Java) - Fully implemented
    - Extract Doc Comments Tool (Java) - Fully implemented
  - ✅ Milestone 5.2: Go Parser - 15/15 tests passing (100% success rate)
    - Extract Signatures Tool (Go) - Fully implemented
    - Extract Doc Comments Tool (Go) - Fully implemented
  - [ ] Milestone 5.3: TypeScript Parser
  - [ ] Milestone 5.4: Rust Parser
  - [ ] Milestone 5.5: C# Parser
  - [ ] Milestone 5.6: PHP Parser
- **Phase 6**: End-to-end testing and integration

## Testing

Run tests with:
```bash
npm run test-server
```

This verifies:
- Server starts successfully
- All tools are registered
- Tool files compile correctly

