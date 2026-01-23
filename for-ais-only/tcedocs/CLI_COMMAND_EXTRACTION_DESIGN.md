# CLI Command Extraction Design Document

## Overview

This document summarizes the design for extracting Redis CLI commands from code examples and exposing them as metadata to AI agents and documentation systems.

## Problem Statement

Currently, when AI agents (like myself) encounter code examples in the Redis documentation, we can see the code but lack semantic understanding of which Redis commands are being demonstrated. This is especially problematic for:

1. **Cross-language Understanding**: The same CLI command appears in Python, Node.js, Java, etc., but we must infer the connection
2. **Pattern Recognition**: We can't easily identify that multiple examples demonstrate the same command
3. **Semantic Search**: Documentation systems can't find examples by the commands they use
4. **AI Context**: We lack explicit metadata about command purpose, complexity, and documentation links

## Solution Design

### High-Level Approach

Extract Redis CLI commands from `{{< clients-example >}}` blocks and enrich them with metadata from `data/commands_core.json`, storing the result in `data/examples.json` for use by templates and AI systems.

### Key Components

1. **CLI Parser** (`build/components/cli_parser.py`)
   - Extracts command names from CLI content
   - Handles single-word (SET), multi-word (ACL CAT), and dot notation (JSON.SET) commands
   - Deduplicates commands within each example

2. **Command Enricher** (`build/components/command_enricher.py`)
   - Loads `data/commands_core.json`
   - Looks up metadata for each extracted command
   - Generates command reference links
   - Handles missing/deprecated commands gracefully

3. **Integration Points**
   - `build/local_examples.py`: Process local examples
   - `build/components/component.py`: Process remote examples
   - Both call extraction and enrichment functions

### Metadata Schema

Each example in `data/examples.json` gains an optional `cli_commands` field:

```json
{
  "cli_commands": [
    {
      "name": "HSET",
      "summary": "Creates or modifies the value of a field in a hash.",
      "group": "hash",
      "complexity": "O(1) for each field/value pair...",
      "since": "2.0.0",
      "link": "/commands/hset"
    }
  ]
}
```

### Command Name Parsing Rules

- **Single-word**: `SET` → `SET`
- **Multi-word**: `ACL CAT` → `ACL CAT` (check if both tokens form known command)
- **Dot notation**: `JSON.SET` → `JSON.SET` (detect dot in first token)
- **Arguments ignored**: `HSET key field value` → `HSET`

### Data Flow

```
Markdown with CLI example
    ↓
Parse CLI content (extract commands)
    ↓
Normalize command names
    ↓
Look up in commands_core.json
    ↓
Generate metadata objects
    ↓
Store in examples.json
    ↓
Available to Hugo templates and AI systems
```

## Benefits for AI Agents

1. **Semantic Understanding**: Know exactly which commands an example demonstrates
2. **Cross-language Mapping**: Understand how the same command is used across languages
3. **Documentation Links**: Direct access to command reference pages
4. **Complexity Awareness**: Understand performance characteristics of demonstrated operations
5. **Pattern Matching**: Identify similar examples by command usage

## Implementation Phases

1. **Phase 1**: CLI Parser - Extract command names from CLI content
2. **Phase 2**: Command Enricher - Enrich with metadata from commands_core.json
3. **Phase 3**: Integration - Modify build scripts to call extraction
4. **Phase 4**: Validation - Verify metadata accuracy
5. **Phase 5**: Documentation - Update specs and provide usage examples

## Design Decisions

### Why Optional Field?
Not all examples have CLI content. The `cli_commands` field is only present when commands are found, keeping JSON clean.

### Why Deduplicate?
If an example uses `HSET` multiple times, we list it once. The focus is on *which* commands are demonstrated, not *how many times*.

### Why Store at Language Level?
Different languages in the same example set may have different CLI examples. Metadata is language-specific.

### Why Generate Links?
Enables templates to create clickable command references and helps AI agents navigate to detailed documentation.

## Integration with Existing System

- **Non-breaking**: Adds optional field to existing metadata
- **Backward compatible**: Existing templates work unchanged
- **Opt-in for templates**: Templates can check for field before using it
- **Transparent to authors**: No changes needed to how examples are written

## Next Steps

See `for-ais-only/tcedocs/SPECIFICATION.md` section "CLI Command Extraction" for:
- Detailed implementation strategy
- Complete metadata schema
- Command parsing rules and edge cases
- Data flow examples
- Implementation checklist

