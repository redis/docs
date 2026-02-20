# Milestone 3.2: Extract Doc Comments Tool Implementation

**Objective**: Implement the `extract_doc_comments` tool with Python language support using tree-sitter parser in Rust WASM.

**Estimated Duration**: 2-3 hours
**Status**: NOT STARTED

## Overview

This milestone implements the doc comment extraction tool that parses docstrings from Python source code. You'll:
1. Extend Rust WASM parser for docstring extraction
2. Create docstring parser for Google/NumPy style docs
3. Implement Node.js wrapper for doc extraction
4. Implement the `extract_doc_comments` tool handler
5. Create comprehensive tests

## Prerequisites

- Milestone 3.1 completed (extract_signatures working)
- Understanding of Python docstring formats
- Familiarity with tree-sitter queries

## Tasks

### Task 1: Extend Rust Parser for Docstrings
**File**: `rust/src/lib.rs`

Add to parser:
- Extract docstrings from function definitions
- Parse Google-style docstrings (Args, Returns, Raises)
- Parse NumPy-style docstrings (Parameters, Returns)
- Extract summary and description
- Handle edge cases (no docstring, malformed)

**Success Criteria**:
- [ ] Docstrings extracted correctly
- [ ] Both Google and NumPy styles parsed
- [ ] Summary/description separated
- [ ] Parameters documented

### Task 2: Create WASM Bindings for Doc Extraction
**File**: `rust/src/lib.rs`

Add `#[wasm_bindgen]` binding:
- `parse_python_doc_comments(code: &str) -> JsValue`
- Returns JSON with docstrings by function name
- Includes parsed components (summary, description, params, returns)

**Success Criteria**:
- [ ] WASM compiles successfully
- [ ] Returns correct structure
- [ ] Handles missing docstrings gracefully

### Task 3: Create Node.js Doc Parser Wrapper
**File**: `node/src/parsers/python-doc-parser.ts`

Create module that:
- Calls WASM doc parser
- Validates output structure
- Filters by method_names
- Returns typed results

**Success Criteria**:
- [ ] Wrapper works with WASM
- [ ] Filtering works correctly
- [ ] Handles missing docs

### Task 4: Implement extract_doc_comments Tool
**File**: `node/src/tools/extract-doc-comments.ts`

Update handler to:
- Read file from disk
- Call Python doc parser
- Validate with Zod schema
- Return proper response structure
- Track missing documentation

**Success Criteria**:
- [ ] Tool reads files correctly
- [ ] Doc extraction works end-to-end
- [ ] Response matches schema
- [ ] Missing docs tracked

### Task 5: Create Test Suite
**File**: `node/src/test-extract-doc-comments.ts`

Create tests for:
- Google-style docstrings
- NumPy-style docstrings
- Mixed parameter documentation
- Functions without docstrings
- Malformed docstrings
- Filtering by method name
- Edge cases

**Success Criteria**:
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] Edge cases handled

### Task 6: Update Documentation
**Files**: `DEVELOPMENT.md`, `node/src/tools/README.md`

Update to:
- Document doc comment parser
- Document supported docstring formats
- Add usage examples
- Update tool status to "Implemented"

**Success Criteria**:
- [ ] Documentation clear and complete
- [ ] Examples work correctly

## Deliverables

✅ **Extended Rust WASM Parser**
✅ **Node.js Doc Parser Wrapper**
✅ **extract_doc_comments Tool Implementation**
✅ **Comprehensive Test Suite**
✅ **Updated Documentation**

## Success Criteria

- [ ] Docstrings extracted from Python files
- [ ] Google-style docs parsed correctly
- [ ] NumPy-style docs parsed correctly
- [ ] Summary and description separated
- [ ] Parameters documented
- [ ] Return values documented
- [ ] Missing docs tracked
- [ ] Filtering works correctly
- [ ] All tests pass (15+)
- [ ] TypeScript compiles without errors

## Common Issues & Solutions

**Issue**: Docstring parsing fails for edge cases
- **Solution**: Add more test cases, refine parsing logic

**Issue**: Mixed docstring styles not recognized
- **Solution**: Implement fallback parsing for unrecognized formats

## Notes

- Focus on Google and NumPy styles (most common)
- Handle edge cases gracefully
- Test with real redis-py docstrings
- Document any parsing limitations

## When Complete

1. Verify all success criteria are met
2. Run full test suite: `npm run test`
3. Build successfully: `npm run build`
4. Update IMPLEMENTATION_PLAN.md:
   - Mark Milestone 3.2 as COMPLETE
   - Update progress (7/20 milestones)
   - Move to Milestone 4.1 (validate_signature)

---

**Milestone Status**: NOT STARTED
**Last Updated**: 2026-02-16
**Next Milestone**: MILESTONE_4_1_VALIDATE_SIGNATURE.md

