# Milestone 3.1: Extract Signatures Tool Implementation

**Objective**: Implement the `extract_signatures` tool with Python language support using tree-sitter parser in Rust WASM.

**Estimated Duration**: 3-4 hours
**Status**: NOT STARTED

## Overview

This milestone implements the first parsing tool that extracts method/function signatures from source code. You'll:
1. Add tree-sitter-python to Rust project
2. Create Rust WASM parser for Python signatures
3. Implement Node.js wrapper for the parser
4. Implement the `extract_signatures` tool handler
5. Create comprehensive tests

## Prerequisites

- Milestone 2.2 completed (data access layer working)
- Understanding of tree-sitter basics
- Familiarity with Rust and WASM

## Tasks

### Task 1: Add tree-sitter Dependencies to Rust
**File**: `rust/Cargo.toml`

Add dependencies:
- `tree-sitter = "0.20"`
- `tree-sitter-python = "0.20"`

Update `src/lib.rs` to:
- Import tree-sitter modules
- Create `parse_python_signatures()` function
- Extract function definitions with parameters and return types
- Handle async functions
- Return structured data (method_name, signature, parameters, return_type, line_number, is_async)

**Success Criteria**:
- [ ] Dependencies added and compile
- [ ] Function parses Python code correctly
- [ ] Extracts all required fields
- [ ] Handles edge cases (decorators, type hints, docstrings)

### Task 2: Create WASM Bindings
**File**: `rust/src/lib.rs`

Add `#[wasm_bindgen]` bindings:
- `parse_python_signatures(code: &str) -> JsValue`
- Returns JSON array of signatures
- Proper error handling

**Success Criteria**:
- [ ] WASM compiles successfully
- [ ] Binary size reasonable (<50KB)
- [ ] TypeScript types generated

### Task 3: Create Node.js Parser Wrapper
**File**: `node/src/parsers/python-parser.ts`

Create module that:
- Calls WASM parser
- Validates output structure
- Filters by method_name_filter
- Returns typed results

**Success Criteria**:
- [ ] Wrapper works with WASM
- [ ] Filtering works correctly
- [ ] Error handling robust

### Task 4: Implement extract_signatures Tool
**File**: `node/src/tools/extract-signatures.ts`

Update handler to:
- Read file from disk
- Call Python parser
- Validate with Zod schema
- Return proper response structure
- Handle errors gracefully

**Success Criteria**:
- [ ] Tool reads files correctly
- [ ] Parsing works end-to-end
- [ ] Response matches schema
- [ ] Error handling works

### Task 5: Create Test Suite
**File**: `node/src/test-extract-signatures.ts`

Create tests for:
- Simple function parsing
- Functions with parameters
- Functions with type hints
- Async functions
- Decorators
- Edge cases (empty file, syntax errors)
- Filtering by method name

**Success Criteria**:
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] Edge cases handled

### Task 6: Update Documentation
**Files**: `DEVELOPMENT.md`, `node/src/tools/README.md`

Update to:
- Document Python parser implementation
- Document tool usage with examples
- Update tool status to "Implemented"
- Add troubleshooting guide

**Success Criteria**:
- [ ] Documentation clear and complete
- [ ] Examples work correctly

## Deliverables

✅ **Rust WASM Parser**
✅ **Node.js Parser Wrapper**
✅ **extract_signatures Tool Implementation**
✅ **Comprehensive Test Suite**
✅ **Updated Documentation**

## Success Criteria

- [ ] Tool extracts signatures from Python files
- [ ] All parameters extracted correctly
- [ ] Return types identified
- [ ] Async functions detected
- [ ] Line numbers accurate
- [ ] Filtering works correctly
- [ ] Error handling robust
- [ ] All tests pass (15+)
- [ ] TypeScript compiles without errors
- [ ] Documentation complete

## Common Issues & Solutions

**Issue**: tree-sitter compilation fails
- **Solution**: Ensure Rust toolchain updated: `rustup update`

**Issue**: WASM binary too large
- **Solution**: Use `wasm-opt` for optimization in build script

**Issue**: Parser doesn't find functions
- **Solution**: Check tree-sitter query syntax, test with simple examples first

## Notes

- Start with Python only (other languages in later milestones)
- Use tree-sitter queries for robust parsing
- Test with real redis-py source code
- Document any parser limitations

## When Complete

1. Verify all success criteria are met
2. Run full test suite: `npm run test`
3. Build successfully: `npm run build`
4. Update IMPLEMENTATION_PLAN.md:
   - Mark Milestone 3.1 as COMPLETE
   - Update progress (6/20 milestones)
   - Move to Milestone 3.2 (extract_doc_comments)

---

**Milestone Status**: NOT STARTED
**Last Updated**: 2026-02-16
**Next Milestone**: MILESTONE_3_2_EXTRACT_DOC_COMMENTS.md

