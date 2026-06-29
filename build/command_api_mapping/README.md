# Command-to-API Mapping Project

## Overview

This project creates a comprehensive JSON mapping of Redis commands to their equivalent API calls across 14 client libraries in 7 programming languages.

**Goal**: Generate `data/commands_api_mapping.json` containing method signatures and documentation for every Redis command in every supported client library.

## Project Structure

All design documents are in `build/command_api_mapping/`:

### Design Phase (Complete)

1. **SCHEMA_DESIGN.md** - JSON schema definition
   - File structure and organization
   - Field definitions for all signature components
   - Language-specific signature format examples
   - Complete example for SET command

2. **SCHEMA_EXAMPLES_AND_EDGE_CASES.md** - Practical examples
   - 5 complete command examples (GET, EXPIRE, FT.SEARCH, XREAD, SLAVEOF)
   - 6 edge case scenarios with handling strategies
   - 6 validation rules

3. **IMPLEMENTATION_STRATEGY.md** - High-level approaches
   - 4 implementation options (language-specific parsers, tree-sitter, manual, LLM)
   - Recommended hybrid approach
   - 5-phase workflow
   - Key decisions and potential issues

4. **ARCHITECTURE_DECISION.md** - MCP server rationale
   - Why MCP server is better than direct integration
   - Team access without API key friction
   - Clean separation of concerns
   - Reusability benefits

5. **MCP_TOOL_SCHEMAS.md** - Tool specifications
   - 6 MCP tools with input/output schemas
   - `list_redis_commands` - Track all commands
   - `extract_signatures` - Extract method signatures
   - `extract_doc_comments` - Extract documentation
   - `validate_signature` - Validate signatures
   - `get_client_info` - Get client metadata
   - `list_clients` - List all clients

6. **MCP_SERVER_DESIGN.md** - Implementation design
   - Architecture diagram
   - Project structure
   - Technology stack (Rust WASM + Node.js)
   - Implementation details for each component
   - Configuration and deployment
   - Error handling and performance considerations

7. **IMPLEMENTATION_ROADMAP.md** - Execution plan
   - 9 phases spanning ~9 weeks
   - Detailed tasks and deliverables
   - Risk mitigation strategies
   - Success criteria

8. **TECHNICAL_CONSIDERATIONS.md** - Challenges & solutions
   - 11 major challenge areas
   - Mitigation strategies for each
   - Recommended approach

9. **IMPLEMENTATION_NOTES.md** - Architecture discussion
   - Method name matching challenge
   - WebAssembly approach rationale
   - Updated client list (14 total, excluding hiredis)
   - Next steps

## Key Decisions

### Architecture
- **MCP Server** (not direct integration)
  - Rust WASM for parsing (performance)
  - Node.js for orchestration
  - Augment for AI matching (team access)
  - No API key management needed

### Scope
- **Commands**: All (core + modules + deprecated)
- **Clients**: 14 total (excluding hiredis)
  - Python: redis-py, RedisVL
  - Node.js: node-redis, ioredis
  - Go: go-redis
  - Java: Jedis, Lettuce (3 variants)
  - C#: NRedisStack (2 variants)
  - PHP: phpredis
  - Rust: redis-rs (2 variants)

### Parsing
- **Tool**: tree-sitter (universal parser)
- **Languages**: 7 (Python, Java, Go, TypeScript, Rust, C#, PHP)
- **Approach**: Language-specific parsers in Rust

### Matching
- **Tool**: Claude API (via Augment)
- **Challenge**: Method names don't always match command names
- **Solution**: AI-assisted semantic matching

## Implementation Timeline

**Phase 1-2**: Foundation & Data Access (3 weeks)
- Set up Rust WASM library
- Set up Node.js MCP server
- Implement data loaders

**Phase 3-4**: Simple Tools & Python Parser (2 weeks)
- Implement list_redis_commands, list_clients, get_client_info
- Implement Python parser
- Test with redis-py

**Phase 5-6**: Other Language Parsers & Validation (3 weeks)
- Implement Java, Go, TypeScript, Rust, C#, PHP parsers
- Implement validation tool
- Test with all clients

**Phase 7-9**: Integration, Augment, & Scaling (3 weeks)
- End-to-end testing
- Augment integration
- Scale to all commands
- Manual review

**Total: ~9 weeks** (can be parallelized)

## Technology Stack

### Rust WASM Library
- tree-sitter (universal parser)
- tree-sitter-{language} grammars (7 languages)
- wasm-bindgen (JavaScript bindings)
- serde/serde_json (JSON serialization)
- regex (pattern matching)

### Node.js MCP Server
- @modelcontextprotocol/sdk (MCP protocol)
- TypeScript (type safety)
- zod (input validation)
- pino (logging)

### Build Tools
- wasm-pack (Rust → WASM)
- wasm-opt (WASM optimization)
- TypeScript compiler

## Success Criteria

- [ ] MCP server builds and runs
- [ ] All 6 tools implemented and functional
- [ ] All 7 languages supported
- [ ] Parsing accuracy > 95%
- [ ] Performance < 1 second per file
- [ ] Complete commands_api_mapping.json generated
- [ ] Schema validation passes
- [ ] Team can use via Augment

## Next Steps

1. **Review Design Documents**
   - Review all 9 design documents
   - Provide feedback and clarifications
   - Approve architecture and approach

2. **Approve Implementation Plan**
   - Review 9-phase roadmap
   - Adjust timeline if needed
   - Confirm resource allocation

3. **Begin Phase 1**
   - Set up Rust project
   - Set up Node.js project
   - Configure build pipeline

## Questions & Decisions Needed

1. **Timeline**: Is 9 weeks acceptable? Can we parallelize phases?
2. **Resources**: Who will implement? Full-time or part-time?
3. **Priorities**: Start with all languages or focus on specific ones first?
4. **Testing**: How much manual review is acceptable?
5. **Maintenance**: How will we keep the mapping updated?

## Document Navigation

- **Start here**: ARCHITECTURE_DECISION.md (why MCP server)
- **Understand scope**: SCHEMA_DESIGN.md + SCHEMA_EXAMPLES_AND_EDGE_CASES.md
- **Understand tools**: MCP_TOOL_SCHEMAS.md
- **Understand implementation**: MCP_SERVER_DESIGN.md
- **Understand timeline**: IMPLEMENTATION_ROADMAP.md
- **Understand challenges**: TECHNICAL_CONSIDERATIONS.md
- **Understand decisions**: IMPLEMENTATION_NOTES.md

## Contact & Questions

For questions about the design, refer to the relevant document or ask for clarification.
"
