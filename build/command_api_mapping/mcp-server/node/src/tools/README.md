# MCP Tools

This directory contains the implementation of all 7 MCP tools for the Redis Command-to-API Mapping server.

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
- `method_name_filter` (array, default: []) - Filter to specific method names (optional)

**Output**:
- `file_path` - Input file path
- `language` - Input language
- `signatures` - Array of extracted signatures with parameters and return types
- `total_count` - Number of signatures extracted
- `errors` - Any parsing errors encountered

**Status**: ✅ Fully Implemented for Python (Milestone 3.1), Java (Milestone 5.1), Go (Milestone 5.2), TypeScript (Milestone 5.3), Rust (Milestone 5.4), and C# (Milestone 5.5)

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
- **TypeScript**: Fully implemented
  - Supports async functions and generics
  - Handles optional parameters
  - Extracts return type annotations
  - All tests passing (15/15 parser tests)
- **Rust**: Fully implemented
  - Supports async and unsafe functions
  - Handles pub visibility modifier
  - Extracts generic types and lifetime parameters
  - Supports Result<T, E> patterns
  - All tests passing (15/15 parser tests)
- **C#**: Fully implemented
  - Extracts method names, parameters, return types, and modifiers
  - Supports async methods and Task<T> return types
  - Handles nullable types (string?, int?)
  - Extracts method modifiers (public, private, protected, static, virtual, override, abstract)
  - Tracks line numbers for each signature
  - All tests passing (15/15 parser tests)
- **PHP**: Fully implemented (Milestone 5.6)
  - Extracts function/method names, parameters, return types, and modifiers
  - Supports variadic parameters (...$param)
  - Handles type hints and nullable types (?type)
  - Extracts method modifiers (public, private, protected, static, abstract, final)
  - Tracks line numbers for each signature
  - All tests passing (15/15 parser tests)

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

**Status**: ✅ Fully Implemented for Python (Milestone 3.2), Java (Milestone 5.1), Go (Milestone 5.2), TypeScript (Milestone 5.3), Rust (Milestone 5.4), C# (Milestone 5.5), and PHP (Milestone 5.6)

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
- **TypeScript**: Fully implemented
  - Extracts JSDoc comments from function definitions
  - Parses @param, @returns, @return tags
  - Separates summary, description, parameters, and returns
  - Handles multi-line JSDoc comments
  - All tests passing (15/15 parser tests)
- **Rust**: Fully implemented
  - Extracts Rust doc comments from function definitions
  - Parses /// style comments
  - Separates summary, description, parameters, and returns
  - Handles # Arguments and # Returns sections
  - All tests passing (15/15 parser tests)
- **C#**: Fully implemented
  - Extracts XML doc comments from method definitions
  - Parses <summary>, <param>, <returns> tags
  - Separates summary, description, parameters, and returns
  - Handles multi-line XML doc comments
  - Tracks line numbers for each doc comment
  - All tests passing (15/15 parser tests)
- **PHP**: Fully implemented (Milestone 5.6)
  - Extracts PHPDoc comments from function/method definitions
  - Parses @param and @return tags
  - Separates summary, description, parameters, and returns
  - Handles multi-line PHPDoc comments
  - Tracks line numbers for each doc comment
  - All tests passing (15/15 parser tests)

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

### 7. analyze_metadata_size
**Purpose**: Analyze the size of JSON metadata embedded in documentation pages to help AI agents understand context window usage.

**Input**:
- `file_path` (string, optional) - Path to local HTML or Markdown file
- `content` (string, optional) - Raw content to analyze (one of file_path or content required)

**Output**:
- `metadata_found` (boolean) - Whether metadata was found
- `total_bytes` (number) - Total size in bytes
- `total_chars` (number) - Total size in characters
- `sections` (object) - Breakdown by top-level JSON field:
  - `{field_name}` → `{ bytes, chars, item_count? }`
- `format` (string | null) - Detected format: `html-head`, `html-body`, or `markdown`
- `file_path` (string, optional) - Resolved file path if reading from file
- `errors` (array, optional) - Any errors encountered

**Status**: ✅ Fully Implemented

**Implementation Details**:
- Rust WASM function extracts and parses metadata JSON
- Supports three metadata formats:
  - HTML head: `<script type="application/json" data-ai-metadata>...</script>`
  - HTML body: `<div hidden data-redis-metadata="page">...</div>`
  - Markdown: ` ```json metadata\n...\n``` `
- Reports per-section breakdown with item counts for arrays/objects
- Gracefully handles malformed JSON with descriptive error messages
- See `for-ais-only/metadata_docs/PAGE_METADATA_FORMAT.md` for metadata spec

**Example Usage**:
```typescript
// Analyze a local file
const result = await analyzeMetadataSize({
  file_path: '/path/to/docs/public/develop/data-types/streams/index.html'
});

// Analyze raw content
const result = await analyzeMetadataSize({
  content: '<script data-ai-metadata>{"title":"Test"}</script>'
});

// Example output:
// {
//   metadata_found: true,
//   total_bytes: 34630,
//   total_chars: 34630,
//   sections: {
//     codeExamples: { bytes: 32303, chars: 32303, item_count: 34 },
//     tableOfContents: { bytes: 2108, chars: 2108, item_count: 1 },
//     categories: { bytes: 71, chars: 71, item_count: 9 },
//     ...
//   },
//   format: "html-head"
// }
```

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
├── list-clients.ts                # Tool 6 handler
└── analyze-metadata.ts            # Tool 7 handler (metadata size analysis)
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

## WASM Integration Patterns

### ⚠️ Critical: Map-to-Object Conversion

When using `serde-wasm-bindgen` (v0.4), Rust `HashMap`, `serde_json::Map`, and nested objects are serialized to JavaScript `Map` objects, **NOT plain objects**. This causes:
- `JSON.stringify(result)` → `"{}"` (empty object)
- Object spread `{...result}` → empty object
- Zod validation → fails silently

**Solution**: Add a recursive `mapToObject()` helper in your TypeScript wrapper:

```typescript
/**
 * Recursively convert Map objects to plain objects.
 * WASM with serde-wasm-bindgen returns Map objects instead of plain objects.
 */
function mapToObject(value: unknown): unknown {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    value.forEach((v, k) => {
      obj[k] = mapToObject(v);
    });
    return obj;
  }
  if (Array.isArray(value)) {
    return value.map(mapToObject);
  }
  if (value !== null && typeof value === 'object') {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      obj[k] = mapToObject(v);
    }
    return obj;
  }
  return value;
}

// Usage:
const rawResult = wasm_function(input);
const result = mapToObject(rawResult) as ExpectedType;
```

**Example**: See `go-parser.ts` and `analyze-metadata.ts` for working implementations.

### Testing WASM Tools from Command Line

Since the WASM module uses ESM, you need the experimental VM modules flag:

```bash
cd node && node --experimental-vm-modules -e "
(async () => {
  const { myToolFunction } = await import('./dist/tools/my-tool.js');
  const result = await myToolFunction({ input: 'test' });
  console.log(JSON.stringify(result, null, 2));
})();
"
```

### Debugging WASM Serialization Issues

If you see empty objects `{}` in output:
1. **Check raw WASM output**: Log `typeof result` and `result instanceof Map`
2. **Add Rust unit tests**: Test the extraction logic in isolation with `cargo test`
3. **Verify JSON structure**: Use `console.log(result)` before `JSON.stringify`
4. **Look at existing parsers**: `go-parser.ts`, `python-parser.ts` show correct patterns

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
  - ✅ Milestone 5.3: TypeScript Parser - 15/15 tests passing (100% success rate)
    - Extract Signatures Tool (TypeScript) - Fully implemented
    - Extract Doc Comments Tool (TypeScript) - Fully implemented
  - ✅ Milestone 5.4: Rust Parser - 15/15 tests passing (100% success rate)
    - Extract Signatures Tool (Rust) - Fully implemented
    - Extract Doc Comments Tool (Rust) - Fully implemented
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

