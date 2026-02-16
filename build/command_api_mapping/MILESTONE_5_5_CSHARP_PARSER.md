# Milestone 5.5: C# Parser Implementation

**Objective**: Implement C# language support for extracting method signatures and XML doc comments.

**Estimated Duration**: 3-4 hours
**Status**: NOT STARTED

## Overview

This milestone adds C# parsing capabilities to the MCP server. You'll:
1. Add tree-sitter-c-sharp to Rust project
2. Create Rust WASM parser for C# methods
3. Implement XML doc comment extraction
4. Create Node.js wrapper for C# parser
5. Create comprehensive tests with NRedisStack

## Prerequisites

- Milestone 5.4 completed (Rust parser working)
- Understanding of C# syntax and XML doc format
- Familiarity with async/Task patterns

## Tasks

### Task 1: Add tree-sitter-c-sharp Dependencies
**File**: `rust/Cargo.toml`

Add:
- `tree-sitter-c-sharp = "0.20"`

Update `src/lib.rs`:
- Create `parse_csharp_signatures()` function
- Extract method definitions with modifiers
- Extract parameters with types
- Extract return types (including Task<T>)
- Handle async methods
- Handle nullable types
- Extract XML doc comments

**Success Criteria**:
- [ ] Dependencies compile
- [ ] Parses C# correctly
- [ ] Extracts all required fields
- [ ] Handles async/Task patterns

### Task 2: Create WASM Bindings for C#
**File**: `rust/src/lib.rs`

Add bindings:
- `parse_csharp_signatures(code: &str) -> JsValue`
- `parse_csharp_doc_comments(code: &str) -> JsValue`
- Handle C#-specific patterns (async, Task, nullable)

**Success Criteria**:
- [ ] WASM compiles successfully
- [ ] Returns correct structure
- [ ] Handles C# patterns

### Task 3: Create Node.js C# Parser Wrapper
**File**: `node/src/parsers/csharp-parser.ts`

Create module that:
- Calls WASM C# parser
- Validates output structure
- Filters by method names
- Returns typed results

**Success Criteria**:
- [ ] Wrapper works with WASM
- [ ] Filtering works correctly
- [ ] Handles C# patterns

### Task 4: Extend extract_signatures Tool
**File**: `node/src/tools/extract-signatures.ts`

Update to:
- Support C# language
- Call C# parser when language=csharp
- Return proper response structure

**Success Criteria**:
- [ ] Tool works with C# files
- [ ] Response matches schema

### Task 5: Extend extract_doc_comments Tool
**File**: `node/src/tools/extract-doc-comments.ts`

Update to:
- Support C# language
- Parse XML doc comment format
- Extract <summary>, <param>, <returns> tags

**Success Criteria**:
- [ ] Tool works with C# files
- [ ] XML docs parsed correctly

### Task 6: Create Test Suite
**File**: `node/src/test-csharp-parser.ts`

Create tests for:
- Simple methods
- Methods with parameters
- Async methods
- Task<T> return types
- Nullable types
- XML doc comments
- <param> and <returns> tags
- Edge cases

**Success Criteria**:
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] Tests with real NRedisStack code

### Task 7: Update Documentation
**Files**: `DEVELOPMENT.md`, `node/src/tools/README.md`

Update to:
- Document C# parser
- Document XML doc format support
- Add usage examples
- Update tool status

**Success Criteria**:
- [ ] Documentation clear and complete

## Deliverables

✅ **Rust WASM C# Parser**
✅ **Node.js C# Parser Wrapper**
✅ **Extended extract_signatures Tool**
✅ **Extended extract_doc_comments Tool**
✅ **Comprehensive Test Suite**
✅ **Updated Documentation**

## Success Criteria

- [ ] Parses C# correctly
- [ ] Extracts parameters and return types
- [ ] Handles async/Task patterns
- [ ] Handles nullable types
- [ ] Parses XML doc comments
- [ ] All tests pass (15+)
- [ ] TypeScript compiles without errors
- [ ] Works with NRedisStack

## Notes

- Test with real NRedisStack source code
- Handle C#-specific patterns (async, Task, nullable)
- Document any parsing limitations

## When Complete

1. Verify all success criteria are met
2. Run full test suite: `npm run test`
3. Build successfully: `npm run build`
4. Update IMPLEMENTATION_PLAN.md:
   - Mark Milestone 5.5 as COMPLETE
   - Update progress (13/20 milestones)
   - Move to Milestone 5.6 (PHP Parser)

---

**Milestone Status**: NOT STARTED
**Last Updated**: 2026-02-16
**Next Milestone**: MILESTONE_5_6_PHP_PARSER.md

