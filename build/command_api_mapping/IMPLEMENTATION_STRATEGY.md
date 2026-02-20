# Implementation Strategy for Command-to-API Mapping

## Overview
This document outlines potential approaches for extracting and populating the `data/commands_api_mapping.json` file.

## Challenge: Semi-Automated Extraction

The core challenge is extracting signatures and doc comments from diverse client libraries with different:
- Programming languages
- Documentation formats (docstrings, JavaDoc, JSDoc, doc comments, etc.)
- Code organization patterns
- Type systems

## Approach Options

### Option 1: Language-Specific Parsers (Recommended for Accuracy)

Create dedicated extraction scripts for each language:

**Python (redis-py)**
- Use AST parsing to extract function signatures
- Extract docstrings using `inspect` module
- Parse parameter descriptions from docstring format
- Tools: `ast`, `inspect`, regex for docstring parsing

**Go (go-redis)**
- Parse Go source files to extract interface methods
- Extract doc comments (lines preceding function)
- Tools: `go/parser`, `go/ast` packages or equivalent

**Java (Jedis/Lettuce)**
- Parse Java source files for method signatures
- Extract JavaDoc comments
- Tools: ANTLR, tree-sitter, or simple regex-based parsing

**Node.js/TypeScript (node-redis)**
- Parse TypeScript definitions (.d.ts files)
- Extract JSDoc comments
- Tools: TypeScript compiler API, tree-sitter

**Rust (redis-rs)**
- Parse Rust source for function signatures
- Extract doc comments (///)
- Tools: `syn` crate, tree-sitter

**C# (NRedisStack)**
- Parse C# source for method signatures
- Extract XML doc comments
- Tools: Roslyn, tree-sitter

**PHP (phpredis)**
- Parse PHP source for function signatures
- Extract PHPDoc comments
- Tools: PHP-Parser, tree-sitter

**C (hiredis)**
- Parse C header files for function declarations
- Extract C-style comments
- Tools: tree-sitter, simple regex

### Option 2: Tree-Sitter Universal Parser

Use tree-sitter for all languages:
- Single tool that parses all languages
- Consistent query language (S-expressions)
- Extracts AST nodes uniformly
- Limitation: Still need language-specific logic for doc comment extraction

### Option 3: Manual Curation with Assisted Extraction

Hybrid approach:
1. Use automated tools to extract basic signatures
2. Manual review and correction
3. Manual extraction of doc comments (more reliable)
4. Validation against actual client behavior

### Option 4: LLM-Assisted Extraction

Use Claude or similar to:
- Read client source code
- Extract signatures and doc comments
- Generate JSON entries
- Limitation: Requires careful prompting, potential hallucinations

## Recommended Approach

**Combination of Options 1 + 3:**

1. **Phase 1: Signature Extraction (Automated)**
   - Language-specific parsers for each client
   - Extract method/function signatures programmatically
   - Generate skeleton JSON with signatures

2. **Phase 2: Doc Comment Extraction (Semi-Automated)**
   - Automated extraction of doc comments from source
   - Manual review for accuracy
   - Handle edge cases (multi-line docs, special formatting)

3. **Phase 3: Validation (Manual)**
   - Spot-check extracted data
   - Verify against actual client documentation
   - Test signatures against real client code

## Implementation Workflow

### Step 1: Setup
- Clone/fetch all client repositories
- Create extraction script framework
- Define output format validation

### Step 2: Per-Language Extraction
For each client library:
1. Identify command methods (e.g., methods matching Redis command names)
2. Extract signature
3. Extract doc comments
4. Map to Redis command names
5. Handle overloads (keep basic + params variants for Java)

### Step 3: Aggregation
- Merge per-client extractions into unified JSON
- Validate command names against commands_core.json
- Check for missing clients per command

### Step 4: Validation
- Verify all commands from commands_core.json are covered
- Check for orphaned client entries
- Validate JSON schema compliance

### Step 5: Manual Review
- Sample check 10-20 commands per client
- Verify doc comment accuracy
- Correct any extraction errors

## Key Decisions Needed

1. **Extraction Tool Choice**
   - Language-specific parsers (more accurate, more work)
   - Tree-sitter (unified, still needs language-specific logic)
   - Hybrid (best of both)

2. **Doc Comment Handling**
   - Fully automated (faster, less accurate)
   - Semi-automated with manual review (slower, more accurate)
   - Fully manual (slowest, most accurate)

3. **Scope for MVP**
   - Start with core commands only?
   - Include all modules from day 1?
   - Phased rollout?

4. **Maintenance Strategy**
   - How to keep in sync with client library updates?
   - Automated re-extraction on client updates?
   - Manual updates?

## Potential Issues & Mitigations

| Issue | Mitigation |
|-------|-----------|
| Doc comments missing/incomplete | Manual review and supplementation |
| Signature format inconsistency | Normalize to language-native syntax |
| Overload explosion (too many variants) | Apply selection criteria (basic + params) |
| Command name mismatches | Map client method names to Redis command names |
| Type system differences | Use language-native type syntax |
| Context/self parameters | Exclude from params array |
| Deprecated commands | Include with deprecation note |

## Questions for Discussion

1. Which extraction approach appeals to you most?
2. Should we start with a subset of commands/clients for MVP?
3. How important is doc comment accuracy vs. speed?
4. Should we build extraction tooling or do initial manual curation?

