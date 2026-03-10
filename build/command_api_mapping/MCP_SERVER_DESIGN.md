# MCP Server Implementation Design

## Overview

The MCP server is a Node.js application that exposes Rust WASM parsing tools via the Model Context Protocol. It enables Augment agents to extract method signatures and documentation from Redis client libraries.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Node.js MCP Server                                      │
│ ┌───────────────────────────────────────────────────┐   │
│ │ MCP Protocol Handler                              │   │
│ │ - Tool registration                               │   │
│ │ - Request/response handling                       │   │
│ │ - Error handling                                  │   │
│ └───────────────────────────────────────────────────┘   │
│                      ↓                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Tool Implementations (TypeScript)                 │   │
│ │ - list_redis_commands()                           │   │
│ │ - extract_signatures()                            │   │
│ │ - extract_doc_comments()                          │   │
│ │ - validate_signature()                            │   │
│ │ - get_client_info()                               │   │
│ │ - list_clients()                                  │   │
│ └───────────────────────────────────────────────────┘   │
│                      ↓                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Rust WASM Parsing Library                         │   │
│ │ - tree-sitter bindings                            │   │
│ │ - Language-specific parsers                       │   │
│ │ - Doc comment extraction                          │   │
│ │ - Signature validation                            │   │
│ └───────────────────────────────────────────────────┘   │
│                      ↓                                   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Data Access Layer                                 │   │
│ │ - Load commands_*.json files                      │   │
│ │ - Load components/index.json                      │   │
│ │ - Cache parsed results                            │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
build/command_api_mapping/mcp-server/
├── Cargo.toml                          # Rust WASM library
├── src/
│   ├── lib.rs                          # WASM library entry point
│   ├── parsers/
│   │   ├── mod.rs
│   │   ├── python.rs                   # Python AST parsing
│   │   ├── java.rs                     # Java parsing (tree-sitter)
│   │   ├── go.rs                       # Go parsing (tree-sitter)
│   │   ├── typescript.rs               # TypeScript parsing (tree-sitter)
│   │   ├── rust.rs                     # Rust parsing (tree-sitter)
│   │   ├── csharp.rs                   # C# parsing (tree-sitter)
│   │   └── php.rs                      # PHP parsing (tree-sitter)
│   ├── extractors/
│   │   ├── mod.rs
│   │   ├── signature.rs                # Extract method signatures
│   │   ├── doc_comments.rs             # Extract doc comments
│   │   └── validators.rs               # Validate signatures
│   └── types.rs                        # Shared types
├── Cargo.lock
├── package.json                        # Node.js wrapper
├── tsconfig.json
├── src-ts/
│   ├── index.ts                        # MCP server entry point
│   ├── tools/
│   │   ├── list-redis-commands.ts
│   │   ├── extract-signatures.ts
│   │   ├── extract-doc-comments.ts
│   │   ├── validate-signature.ts
│   │   ├── get-client-info.ts
│   │   └── list-clients.ts
│   ├── wasm/
│   │   └── bindings.ts                 # WASM bindings (auto-generated)
│   ├── data/
│   │   ├── commands-loader.ts          # Load commands_*.json
│   │   ├── components-loader.ts        # Load components/index.json
│   │   └── cache.ts                    # Result caching
│   └── utils/
│       ├── logger.ts
│       └── error-handler.ts
├── wasm/
│   └── pkg/                            # Compiled WASM (generated)
└── README.md
```

## Technology Stack

### Rust WASM Library

**Dependencies**:
- `tree-sitter` - Universal parser for all languages
- `tree-sitter-python` - Python grammar
- `tree-sitter-java` - Java grammar
- `tree-sitter-go` - Go grammar
- `tree-sitter-typescript` - TypeScript grammar
- `tree-sitter-rust` - Rust grammar
- `tree-sitter-c-sharp` - C# grammar
- `tree-sitter-php` - PHP grammar
- `wasm-bindgen` - JavaScript bindings
- `serde` / `serde_json` - JSON serialization
- `regex` - Pattern matching for doc comments

**Build Tools**:
- `wasm-pack` - Build Rust → WASM
- `wasm-opt` - Optimize WASM binary

### Node.js Wrapper

**Dependencies**:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `typescript` - Type safety
- `zod` - Input validation
- `pino` - Structured logging

**Dev Dependencies**:
- `@types/node`
- `tsx` - TypeScript execution
- `jest` - Testing

## Implementation Details

### 1. Rust WASM Library Structure

#### `lib.rs` - Entry Point
```rust
// Exports WASM functions that Node.js can call
pub fn extract_signatures_wasm(file_content: &str, language: &str) -> String
pub fn extract_doc_comments_wasm(file_content: &str, language: &str) -> String
pub fn validate_signature_wasm(signature: &str, language: &str) -> String
```

#### `parsers/mod.rs` - Language Router
```rust
pub fn parse_file(content: &str, language: &str) -> Result<ParseTree>
// Routes to language-specific parser
```

#### Language-Specific Parsers
Each language module:
- Creates tree-sitter parser for that language
- Implements signature extraction
- Implements doc comment extraction
- Handles language-specific quirks

**Example: `parsers/python.rs`**
- Use tree-sitter-python grammar
- Find function definitions (FunctionDef nodes)
- Extract parameters from function signature
- Extract docstrings (first statement in function body)
- Parse docstring format (Google/NumPy style)

**Example: `parsers/java.rs`**
- Use tree-sitter-java grammar
- Find method declarations
- Extract parameters and return type
- Extract JavaDoc comments (/** ... */)
- Parse @param and @return tags

#### `extractors/signature.rs`
```rust
pub struct Signature {
    pub method_name: String,
    pub signature: String,
    pub parameters: Vec<Parameter>,
    pub return_type: String,
    pub line_number: usize,
    pub is_async: bool,
}

pub fn extract_signatures(tree: &ParseTree, language: &str) -> Vec<Signature>
```

#### `extractors/doc_comments.rs`
```rust
pub struct DocComment {
    pub raw_comment: String,
    pub summary: String,
    pub description: String,
    pub parameters: HashMap<String, String>,
    pub returns: String,
    pub line_number: usize,
}

pub fn extract_doc_comments(tree: &ParseTree, language: &str) -> HashMap<String, DocComment>
```

#### `extractors/validators.rs`
```rust
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

pub fn validate_signature(signature: &str, language: &str) -> ValidationResult
```

### 2. Node.js MCP Server

#### `index.ts` - Server Setup
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'redis-command-api-mapping',
  version: '1.0.0',
});

// Register all tools
server.setRequestHandler(ListToolsRequestSchema, handleListTools);
server.setRequestHandler(CallToolRequestSchema, handleCallTool);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

#### Tool Implementations

Each tool in `src-ts/tools/` follows this pattern:

```typescript
export async function listRedisCommands(
  includeModules: boolean,
  includeDeprecated: boolean,
  moduleFilter: string[]
): Promise<ListRedisCommandsOutput> {
  // 1. Load commands from data files
  const commands = await loadAllCommands();
  
  // 2. Filter based on parameters
  const filtered = filterCommands(commands, {
    includeModules,
    includeDeprecated,
    moduleFilter,
  });
  
  // 3. Return formatted output
  return {
    commands: filtered,
    total_count: filtered.length,
    by_module: countByModule(filtered),
  };
}
```

#### `data/commands-loader.ts`
```typescript
export async function loadAllCommands(): Promise<Command[]> {
  // Load from:
  // - data/commands_core.json
  // - data/commands_redisearch.json
  // - data/commands_redisjson.json
  // - data/commands_redisbloom.json
  // - data/commands_redistimeseries.json
  
  // Merge and return
}
```

#### `data/components-loader.ts`
```typescript
export async function loadClientInfo(clientId: string): Promise<ClientInfo> {
  // Load from data/components/index.json
  // Return metadata for specific client
}

export async function loadAllClients(): Promise<ClientInfo[]> {
  // Load all clients, exclude hiredis
}
```

#### `data/cache.ts`
```typescript
class ParseCache {
  private cache: Map<string, CacheEntry> = new Map();
  
  get(key: string): ParseResult | null {
    // Return cached result if not expired
  }
  
  set(key: string, value: ParseResult, ttl: number): void {
    // Cache with TTL
  }
  
  clear(): void {
    // Clear all cache
  }
}
```

### 3. WASM Integration

#### Building WASM
```bash
cd build/command_api_mapping/mcp-server
wasm-pack build --target nodejs --release
```

This generates:
- `wasm/pkg/redis_parser.js` - JavaScript wrapper
- `wasm/pkg/redis_parser_bg.wasm` - Compiled WASM binary
- `wasm/pkg/redis_parser.d.ts` - TypeScript definitions

#### Calling WASM from Node.js
```typescript
import * as wasmModule from './wasm/pkg/redis_parser.js';

const result = wasmModule.extract_signatures_wasm(
  fileContent,
  'python'
);
const parsed = JSON.parse(result);
```

## Configuration

### Environment Variables

```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Caching
CACHE_TTL=3600  # Cache results for 1 hour
CACHE_MAX_SIZE=1000  # Max number of cached results

# Data paths (relative to repo root)
COMMANDS_DATA_PATH=data
COMPONENTS_DATA_PATH=data/components

# Performance
MAX_FILE_SIZE=10485760  # 10MB max file size
PARSER_TIMEOUT=30000  # 30 second timeout per file
```

### MCP Configuration

Clients (like Augment) configure the MCP server in their config:

```json
{
  \"mcpServers\": {
    \"redis-command-api-mapping\": {
      \"command\": \"node\",
      \"args\": [
        \"build/command_api_mapping/mcp-server/dist/index.js\"
      ],
      \"env\": {
        \"LOG_LEVEL\": \"info\"
      }
    }
  }
}
```

## Error Handling Strategy

### Parsing Errors
- **Graceful degradation**: Return partial results if some methods fail
- **Error tracking**: Include error messages in response
- **Logging**: Log all errors for debugging

### Validation Errors
- **Input validation**: Use Zod schemas to validate inputs
- **Return validation errors**: Include in response
- **Never crash**: Always return valid response structure

### File Access Errors
- **File not found**: Return empty results with error message
- **Permission denied**: Log and return error
- **File too large**: Return error, don't attempt to parse

## Performance Considerations

### Caching Strategy
- Cache parsed results by file path + language
- TTL: 1 hour (configurable)
- Clear cache on server restart
- Manual cache clear endpoint (for testing)

### WASM Optimization
- Compile with `--release` flag
- Use `wasm-opt` to optimize binary size
- Lazy-load tree-sitter grammars
- Reuse parser instances across calls

### Streaming Large Results
- For large files with many methods, consider streaming
- Return results in chunks if needed
- Implement pagination for command lists

## Testing Strategy

### Unit Tests (Rust)
- Test each parser with sample code
- Test signature extraction
- Test doc comment extraction
- Test validation logic

### Integration Tests (Node.js)
- Test each MCP tool with real client libraries
- Test error handling
- Test caching behavior
- Test with actual commands_*.json files

### End-to-End Tests
- Test full workflow: extract → validate → format
- Test with multiple clients
- Test with edge cases (missing docs, complex signatures)

## Deployment

### Development
```bash
cd build/command_api_mapping/mcp-server
npm install
wasm-pack build --target nodejs
npm run build
npm run dev
```

### Production
```bash
wasm-pack build --target nodejs --release
npm run build
node dist/index.js
```

### Distribution
- Package as npm module (optional)
- Or distribute as part of docs repo
- Include pre-built WASM binary

## Future Enhancements

1. **Incremental Parsing**: Only re-parse changed files
2. **Parallel Processing**: Parse multiple files concurrently
3. **Custom Grammars**: Support for custom language extensions
4. **Signature Normalization**: Normalize signatures across languages
5. **Semantic Analysis**: Understand method relationships
6. **Performance Metrics**: Track parsing performance
7. **Web Interface**: Optional UI for testing tools
"
