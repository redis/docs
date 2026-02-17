# Augment Integration Guide

This guide provides step-by-step instructions for integrating the Redis Command-to-API Mapping MCP server with Augment.

## Prerequisites

- Augment installed and configured
- Node.js 18+ installed
- Rust 1.70+ installed (for building)
- wasm-pack installed (`cargo install wasm-pack`)

## Setup Instructions

### Step 1: Build the MCP Server

```bash
cd build/command_api_mapping/mcp-server

# Install dependencies
npm install

# Build both Rust and Node.js
npm run build
```

### Step 2: Configure Augment

Add the MCP server to your Augment configuration. The configuration depends on your Augment setup:

#### Option A: Using mcp.json

If your Augment instance uses `mcp.json`:

```json
{
  "mcpServers": {
    "redis-parser-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/mcp-server"
    }
  }
}
```

#### Option B: Using Environment Variables

```bash
export MCP_REDIS_PARSER_COMMAND="node"
export MCP_REDIS_PARSER_ARGS="dist/index.js"
export MCP_REDIS_PARSER_CWD="/path/to/mcp-server"
```

#### Option C: Using Augment CLI

```bash
augment mcp add redis-parser-mcp \
  --command node \
  --args "dist/index.js" \
  --cwd /path/to/mcp-server
```

### Step 3: Verify Configuration

Test that the MCP server is properly configured:

```bash
# Start the server
npm start

# In another terminal, verify it's running
curl http://localhost:3000/health  # If HTTP endpoint available
```

## Testing the Integration

### Test 1: Tool Discovery

Verify that Augment can discover all tools:

```bash
npm run test-augment-discovery
```

Expected output:
```
✅ Server instance created
✅ Tool discovery handler registered
✅ All 6 tools discoverable
✅ All tool schemas valid
✅ All tools have required fields
```

### Test 2: Tool Invocation

Test that tools can be invoked correctly:

```bash
npm run test-augment-invocation
```

Expected output:
```
✅ list_redis_commands invocation
✅ list_clients invocation
✅ get_client_info invocation with valid client
✅ Error handling for invalid client
✅ Response format validation
✅ Tool invocation with optional parameters
```

### Test 3: End-to-End Workflow

Test the complete workflow with Augment:

```bash
npm run test-augment-e2e
```

Expected output:
```
✅ Workflow: List clients → Get client info
✅ Workflow: List Redis commands
✅ Error handling: Invalid file path
✅ Error handling: Invalid language
✅ Data consistency: Multiple calls return same data
✅ Response time: Tools respond quickly
```

### Test 4: Full Test Suite

Run all tests to ensure everything works:

```bash
npm run test
```

## Configuration Details

### MCP Server Configuration (mcp.json)

The server is configured with:

- **Name**: redis-parser-mcp
- **Version**: 0.1.0
- **Transport**: stdio (standard input/output)
- **Tools**: 6 tools with full schemas
- **Logging**: JSON format, info level
- **Error Handling**: Graceful shutdown, error logging

### Tool Schemas

All tools have complete JSON schemas defining:
- Input parameters (required and optional)
- Parameter types and descriptions
- Validation rules

### Supported Languages

The server supports parsing and validation for:
- Python
- Java
- Go
- TypeScript
- Rust
- C#
- PHP

## Usage Examples

### Example 1: List All Clients

```javascript
// Using Augment SDK
const result = await augment.callTool('list_clients', {});
console.log(result); // Array of client objects
```

### Example 2: Get Client Information

```javascript
const result = await augment.callTool('get_client_info', {
  client_id: 'redis-py'
});
console.log(result); // Client details
```

### Example 3: Extract Signatures

```javascript
const result = await augment.callTool('extract_signatures', {
  file_path: 'redis/client.py',
  language: 'python',
  method_name_filter: ['get', 'set']
});
console.log(result); // Array of signatures
```

### Example 4: Validate Signature

```javascript
const result = await augment.callTool('validate_signature', {
  signature: 'def get(self, name: str) -> Optional[bytes]:',
  language: 'python'
});
console.log(result); // Validation result
```

## Troubleshooting

### Issue: MCP Server Won't Start

**Symptoms**: Server fails to start or crashes immediately

**Solutions**:
1. Check Node.js version: `node --version` (should be 18+)
2. Verify dependencies: `npm install`
3. Check for TypeScript errors: `npm run build`
4. Review error logs: `npm start 2>&1 | head -50`

### Issue: Tools Not Discoverable

**Symptoms**: Augment can't find the tools

**Solutions**:
1. Verify server is running: `npm start`
2. Check MCP configuration is correct
3. Run discovery test: `npm run test-augment-discovery`
4. Check server logs for errors

### Issue: Tool Invocation Fails

**Symptoms**: Tools return errors or invalid responses

**Solutions**:
1. Verify input parameters are correct
2. Check file paths exist (for extract_* tools)
3. Verify language is supported
4. Run invocation test: `npm run test-augment-invocation`
5. Check server logs for detailed errors

### Issue: Performance Issues

**Symptoms**: Tools respond slowly

**Solutions**:
1. Use method_name_filter to reduce output
2. Extract signatures for entire files at once
3. Cache client info and command lists
4. Check system resources (CPU, memory)
5. Run performance test: `npm run test-performance`

## Development Workflow

### Making Changes

1. Edit source files in `node/src/`
2. Build: `npm run build:node`
3. Test: `npm run test`
4. Run in development: `npm run dev`

### Adding New Tools

1. Create tool handler in `node/src/tools/`
2. Add schema to `tools/schemas.ts`
3. Register in `index.ts`
4. Add tests in `node/src/test-*.ts`
5. Update documentation

### Debugging

```bash
# Run with verbose logging
DEBUG=* npm start

# Run specific test with output
npm run test-augment-discovery -- --verbose

# Check server health
curl http://localhost:3000/health
```

## Performance Metrics

Expected performance:
- Tool discovery: < 100ms
- Tool invocation: < 1000ms
- Signature extraction: < 5000ms (depends on file size)
- Signature validation: < 100ms

## Next Steps

1. Review [augment-workflow.md](./augment-workflow.md) for workflow examples
2. Check [DEVELOPMENT.md](./DEVELOPMENT.md) for development details
3. Run full test suite: `npm run test`
4. Deploy to production

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review test output for error details
3. Check server logs
4. Consult [augment-workflow.md](./augment-workflow.md) for usage patterns

