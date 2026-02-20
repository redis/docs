# Milestone 5.1: Java Parser Implementation

**Objective**: Implement Java language support for extracting method signatures and JavaDoc comments.

**Estimated Duration**: 3-4 hours
**Status**: NOT STARTED

## Overview

This milestone adds Java parsing capabilities to the MCP server. You'll:
1. Add tree-sitter-java to Rust project
2. Create Rust WASM parser for Java methods
3. Implement JavaDoc comment extraction
4. Create Node.js wrapper for Java parser
5. Create comprehensive tests with Jedis and Lettuce

## Prerequisites

- Milestone 4.1 completed (validate_signature working)
- Understanding of Java syntax and JavaDoc format
- Familiarity with tree-sitter queries

## Tasks

### Task 1: Add tree-sitter-java Dependencies
**File**: `rust/Cargo.toml`

Add:
- `tree-sitter-java = "0.20"`

Update `src/lib.rs`:
- Create `parse_java_signatures()` function
- Extract method definitions with modifiers
- Extract parameters with types
- Extract return types
- Handle generics and annotations
- Extract JavaDoc comments

**Success Criteria**:
- [ ] Dependencies compile
- [ ] Parses Java methods correctly
- [ ] Extracts all required fields
- [ ] Handles generics and annotations

### Task 2: Create WASM Bindings for Java
**File**: `rust/src/lib.rs`

Add bindings:
- `parse_java_signatures(code: &str) -> JsValue`
- `parse_java_doc_comments(code: &str) -> JsValue`
- Handle Java-specific patterns (throws, generics)

**Success Criteria**:
- [ ] WASM compiles successfully
- [ ] Returns correct structure
- [ ] Handles Java patterns

### Task 3: Create Node.js Java Parser Wrapper
**File**: `node/src/parsers/java-parser.ts`

Create module that:
- Calls WASM Java parser
- Validates output structure
- Filters by method names
- Returns typed results

**Success Criteria**:
- [ ] Wrapper works with WASM
- [ ] Filtering works correctly
- [ ] Handles Java patterns

### Task 4: Extend extract_signatures Tool
**File**: `node/src/tools/extract-signatures.ts`

Update to:
- Support Java language
- Call Java parser when language=java
- Return proper response structure

**Success Criteria**:
- [ ] Tool works with Java files
- [ ] Response matches schema

### Task 5: Extend extract_doc_comments Tool
**File**: `node/src/tools/extract-doc-comments.ts`

Update to:
- Support Java language
- Parse JavaDoc format
- Extract @param, @return, @throws tags

**Success Criteria**:
- [ ] Tool works with Java files
- [ ] JavaDoc parsed correctly

### Task 6: Create Test Suite
**File**: `node/src/test-java-parser.ts`

Create tests for:
- Simple methods
- Methods with parameters
- Generic methods
- Methods with annotations
- JavaDoc comments
- @param and @return tags
- @throws documentation
- Edge cases

**Success Criteria**:
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] Tests with real Jedis/Lettuce code

### Task 7: Update Documentation
**Files**: `DEVELOPMENT.md`, `node/src/tools/README.md`

Update to:
- Document Java parser
- Document JavaDoc format support
- Add usage examples
- Update tool status

**Success Criteria**:
- [ ] Documentation clear and complete

## Deliverables

✅ **Rust WASM Java Parser**
✅ **Node.js Java Parser Wrapper**
✅ **Extended extract_signatures Tool**
✅ **Extended extract_doc_comments Tool**
✅ **Comprehensive Test Suite**
✅ **Updated Documentation**

## Success Criteria

- [ ] Parses Java methods correctly
- [ ] Extracts parameters and return types
- [ ] Handles generics and annotations
- [ ] Parses JavaDoc comments
- [ ] Extracts @param, @return, @throws
- [ ] All tests pass (15+)
- [ ] TypeScript compiles without errors
- [ ] Works with Jedis and Lettuce

## Notes

- Test with real Jedis and Lettuce source code
- Handle Java-specific patterns (throws, generics)
- Document any parsing limitations

## When Complete

1. Verify all success criteria are met
2. Run full test suite: `npm run test`
3. Build successfully: `npm run build`
4. Update IMPLEMENTATION_PLAN.md:
   - Mark Milestone 5.1 as COMPLETE
   - Update progress (9/20 milestones)
   - Move to Milestone 5.2 (Go Parser)

---

**Milestone Status**: NOT STARTED
**Last Updated**: 2026-02-16
**Next Milestone**: MILESTONE_5_2_GO_PARSER.md

