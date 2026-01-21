# CLI Command Extraction - Quick Reference

## What Gets Extracted?

From this markdown:
```markdown
{{< clients-example set="hash_tutorial" step="set_get_all" >}}
> HSET bike:1 model Deimos brand Ergonom
(integer) 2
> HGET bike:1 model
"Deimos"
> HGETALL bike:1
1) "model"
2) "Deimos"
{{< /clients-example >}}
```

We extract: `["HSET", "HGET", "HGETALL"]`

## Metadata Generated

For each command, we look it up in `data/commands_core.json` and create:

```json
{
  "name": "HSET",
  "summary": "Creates or modifies the value of a field in a hash.",
  "group": "hash",
  "complexity": "O(1) for each field/value pair added...",
  "since": "2.0.0",
  "link": "/commands/hset"
}
```

## Where It's Stored

In `data/examples.json`, under each example and language:

```json
{
  "hash_tutorial": {
    "Python": {
      "source": "...",
      "language": "python",
      "cli_commands": [
        {"name": "HSET", "summary": "...", ...},
        {"name": "HGET", "summary": "...", ...},
        {"name": "HGETALL", "summary": "...", ...}
      ]
    }
  }
}
```

## Command Parsing Examples

| Input | Extracted Command |
|-------|-------------------|
| `> SET key value` | `SET` |
| `> ACL CAT` | `ACL CAT` |
| `> JSON.SET doc $ '{}'` | `JSON.SET` |
| `> HSET key field value` | `HSET` |
| `(integer) 1` | *(ignored - no `>` prefix)* |
| `"value"` | *(ignored - output line)* |

## Files to Create/Modify

### New Files
- `build/components/cli_parser.py` - Extract command names
- `build/components/command_enricher.py` - Enrich with metadata

### Modified Files
- `build/local_examples.py` - Call extraction for local examples
- `build/components/component.py` - Call extraction for remote examples
- `for-ais-only/tcedocs/SPECIFICATION.md` - Already updated ✅

## How AI Agents Use This

1. Load `data/examples.json`
2. For each example, check for `cli_commands` field
3. Use command metadata to understand example intent
4. Link to command documentation via `link` field
5. Understand cross-language patterns via command names

## Example: Understanding a Python Example

**Before**: "This Python code does something with hashes"

**After**: "This Python code demonstrates HSET, HGET, and HGETALL commands. HSET creates/modifies hash fields (O(1) per field). HGET retrieves a single field (O(1)). HGETALL retrieves all fields (O(N))."

## Implementation Checklist

- [ ] Create `cli_parser.py` with `extract_cli_commands()` function
- [ ] Create `command_enricher.py` with `enrich_commands()` function
- [ ] Modify `local_examples.py` to call extraction
- [ ] Modify `component.py` to call extraction
- [ ] Test with existing examples
- [ ] Verify `data/examples.json` contains `cli_commands` field
- [ ] Verify command names and metadata are correct
- [ ] Update documentation with usage examples

## Key Design Principles

1. **Optional**: Only present if commands found
2. **Deduplicated**: Each command listed once per example
3. **Language-specific**: Different languages may have different CLI examples
4. **Enriched**: Includes summary, complexity, link, etc.
5. **Non-breaking**: Existing system works unchanged

