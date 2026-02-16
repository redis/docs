# Development Guide

This guide covers how to set up your development environment and work with the Redis Command-to-API Mapping MCP Server.

## Environment Setup

### Prerequisites

1. **Rust** (1.70+)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** (18+)
   ```bash
   # Using Homebrew (macOS)
   brew install node
   
   # Or download from https://nodejs.org/
   ```

3. **wasm-pack**
   ```bash
   cargo install wasm-pack
   ```

### Initial Setup

```bash
# Clone/navigate to the project
cd build/command_api_mapping/mcp-server

# Install Node.js dependencies
cd node && npm install && cd ..

# Build both projects
npm run build
```

## Development Workflow

### Working on Rust Code

1. Edit `rust/src/lib.rs`
2. Build and test:
   ```bash
   npm run build:rust
   npm run test:rust
   ```
3. The WASM binary will be generated in `wasm/pkg/`

### Working on Node.js Code

1. Edit `node/src/index.ts`
2. Build and test:
   ```bash
   npm run build:node
   npm run test:node
   ```
3. TypeScript will compile to `node/dist/`

### Running in Development Mode

```bash
npm run dev
```

This starts the Node.js server with hot reload enabled (via `tsx watch`).

## Building

### Full Build

```bash
npm run build
```

This builds both Rust and Node.js projects in sequence.

### Incremental Builds

```bash
# Build only Rust
npm run build:rust

# Build only Node.js
npm run build:node
```

### Clean Build

```bash
npm run clean
npm run build
```

## Testing

### Run All Tests

```bash
npm run test
```

### Test Rust Only

```bash
npm run test:rust
```

### Test Node.js Only

```bash
npm run test:node
```

### Add New Tests

**Rust Tests** - Add to `rust/src/lib.rs`:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_my_function() {
        assert_eq!(my_function(), expected_value);
    }
}
```

**Node.js Tests** - Create test files in `node/src/` and run with `npm run test`.

## Debugging

### Rust Debugging

1. Add debug output:
   ```rust
   eprintln!("Debug: {:?}", value);
   ```

2. Run tests with output:
   ```bash
   cd rust && cargo test -- --nocapture
   ```

### Node.js Debugging

1. Add console output:
   ```typescript
   console.error("Debug:", value);
   ```

2. Run with Node debugger:
   ```bash
   node --inspect-brk node/dist/index.js
   ```

3. Open `chrome://inspect` in Chrome to debug

## Common Issues and Solutions

### Issue: `wasm-pack not found`

**Solution:**
```bash
cargo install wasm-pack
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
cd node
npm install
npm run build
```

### Issue: Rust compilation errors

**Solution:**
```bash
cd rust
cargo clean
cargo build --release
```

### Issue: Node.js dependencies out of date

**Solution:**
```bash
cd node
rm -rf node_modules package-lock.json
npm install
```

### Issue: WASM binary not found

**Solution:**
```bash
npm run build:rust
# Check that wasm/pkg/ directory exists
ls -la wasm/pkg/
```

## Project Structure Details

### Rust Project (`rust/`)

- **Cargo.toml** - Rust package configuration
  - `wasm-bindgen` - JavaScript bindings for WASM
  - `serde` - Serialization framework
  - `serde_json` - JSON support

- **src/lib.rs** - Main Rust library code
  - WASM-bindgen functions for parsing
  - Serialization/deserialization logic

### Node.js Project (`node/`)

- **package.json** - Node.js package configuration
  - `@modelcontextprotocol/sdk` - MCP protocol
  - `zod` - Input validation
  - `typescript` - Type checking
  - `tsx` - TypeScript runner

- **tsconfig.json** - TypeScript configuration
  - Target: ES2020
  - Module: CommonJS
  - Strict mode enabled

- **src/index.ts** - MCP server implementation
  - Tool definitions
  - Request handlers
  - Server startup

## Performance Considerations

1. **WASM Compilation** - First build takes longer due to WASM compilation
2. **Incremental Builds** - Subsequent builds are faster
3. **Development Mode** - Use `npm run dev` for faster iteration
4. **Release Builds** - Use `npm run build` for optimized binaries

## Code Style

### Rust

- Follow Rust conventions (use `rustfmt`)
- Use meaningful variable names
- Add doc comments for public functions

### TypeScript

- Use strict mode (enabled in tsconfig.json)
- Add type annotations
- Use meaningful variable names
- Follow ESLint rules (if configured)

## Next Steps

1. Review the [README.md](./README.md) for project overview
2. Check the main design documents in `build/command_api_mapping/`
3. Start implementing Milestone 1.2 (Basic WASM Module & Node.js Integration)

## Getting Help

- Check existing issues in the project
- Review the design documents for architecture details
- Consult the MCP SDK documentation: https://modelcontextprotocol.io/

