# Node.js MCP Server Source Code

This directory contains the TypeScript source code for the MCP server.

## Files

- **index.ts** - Main MCP server entry point with tool definitions and handlers
- **wasm-wrapper.ts** - TypeScript wrapper for calling Rust WASM functions
- **test-wasm.ts** - Simple test script for WASM functionality
- **integration-test.ts** - Comprehensive integration tests for WASM

## WASM Integration Pattern

The WASM wrapper pattern provides a clean interface for calling Rust WASM functions from Node.js:

```typescript
import { callAdd, callGreet } from './wasm-wrapper';

// Call WASM functions
const result = callAdd(5, 3);        // Returns 8
const greeting = callGreet('World'); // Returns "Hello, World!"
```

## Adding New WASM Functions

To add a new WASM function:

1. **Define in Rust** (`rust/src/lib.rs`):
   ```rust
   #[wasm_bindgen]
   pub fn my_function(param: String) -> String {
       // Implementation
   }
   ```

2. **Build WASM**:
   ```bash
   cd rust && wasm-pack build --target nodejs
   ```

3. **Create wrapper** in `wasm-wrapper.ts`:
   ```typescript
   export function callMyFunction(param: string): string {
       return wasmModule.my_function(param);
   }
   ```

4. **Test the function**:
   ```bash
   npm run test-wasm
   npm test
   ```

## Testing WASM Functions

### Quick Test
```bash
npm run test-wasm
```

### Comprehensive Tests
```bash
npm test
```

### Manual Testing
```bash
npm run build
node -e "import('./dist/wasm-wrapper.js').then(m => console.log(m.callAdd(5, 3)))"
```

## Common Issues

### WASM Module Not Found
- Ensure `wasm-pack build --target nodejs` was run
- Check that `wasm/pkg/` directory exists with compiled files
- Verify import path in `wasm-wrapper.ts` is correct

### TypeScript Errors
- Run `npm run build` to check for type errors
- Ensure WASM types are generated in `wasm/pkg/redis_parser.d.ts`

### Runtime Errors
- Check that WASM functions are marked with `#[wasm_bindgen]`
- Verify function signatures match between Rust and TypeScript
- Check console output for detailed error messages

## Performance Considerations

- WASM functions are synchronous and fast
- No async overhead for simple operations
- Ideal for CPU-intensive parsing tasks
- Consider batching multiple calls for better performance

## References

- [wasm-bindgen Documentation](https://rustwasm.org/docs/wasm-bindgen/)
- [WASM in Node.js](https://nodejs.org/en/docs/guides/nodejs-wasm-support/)
- [Rust WASM Book](https://rustwasm.org/docs/book/)

