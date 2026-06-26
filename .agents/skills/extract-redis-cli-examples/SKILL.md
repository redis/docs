---
name: extract-redis-cli-examples
description: Extract Redis CLI examples from documentation pages, identify which commands are demonstrated, and determine what multi-language code examples need to be created or updated.
---

# Extract Redis CLI Examples

This skill helps you extract Redis CLI examples from Redis documentation pages and prepare them for multi-language tabbed code example (TCE) implementation.

## When to Use This Skill

Use this skill when you need to:
- Analyze a command documentation page to find CLI examples
- Identify which Redis commands are demonstrated in examples
- Determine if multi-language examples already exist or need to be created
- Prepare a list of examples that need client library implementations

## Source Formats

Redis CLI examples appear in documentation in **four formats**:

### 1. Redis CLI Shortcode (Interactive)

```markdown
{{% redis-cli %}}
SET mykey "Hello"
GET mykey
{{% /redis-cli %}}
```

This creates an interactive redis-cli experience. The text between shortcodes contains executable commands.

### 2. Highlight Shortcode

```markdown
{{< highlight bash >}}
127.0.0.1:6379> SET mykey "Hello"
OK
127.0.0.1:6379> GET mykey
"Hello"
{{< / highlight >}}
```

Used for syntax-highlighted code blocks. The `[lang]` parameter (e.g., `bash`) specifies highlighting.

### 3. Clients-Example Shortcode (Multi-Language)

```markdown
{{< clients-example set="set_and_get" step="basic" >}}
> SET mykey "Hello"
OK
> GET mykey
"Hello"
{{< /clients-example >}}
```

**Important**: This format indicates multi-language examples MAY already exist. Check `data/examples.json` for the example ID to see which languages are implemented.

### 4. Fenced Code Blocks

```markdown
````bash
> SET mykey "Hello"
OK
> GET mykey
"Hello"
````　
```

Standard markdown code blocks, often with `bash`, `plaintext`, or no language specified.

## Command Extraction Rules

### Identifying Command Lines

Command lines are identified by prompt prefixes:
- `>` - Standard prompt
- `redis>` - Redis prompt
- `127.0.0.1:6379>` - Full Redis prompt

Lines WITHOUT these prefixes are typically output and should be ignored.
However, it may be the case that lines without prefixes are actual Redis commands, and represent code examples.

### Parsing Command Names

| Pattern | Example | Extracted Command |
|---------|---------|-------------------|
| Single-word | `> SET key value` | `SET` |
| Multi-word | `> ACL CAT` | `ACL CAT` |
| Dot notation | `> JSON.SET doc $ '{}'` | `JSON.SET` |
| With arguments | `> HSET key field value` | `HSET` |

### Command Extraction Examples

**Input:**
```
> HSET bike:1 model Deimos brand Ergonom
(integer) 2
> HGET bike:1 model
"Deimos"
> HGETALL bike:1
1) "model"
2) "Deimos"
```

**Extracted commands:** `["HSET", "HGET", "HGETALL"]`

## Extraction Workflow

### Step 1: Scan the Document

Look for all four source formats in the markdown file. For each occurrence, extract:
- The source format type
- The raw CLI content
- The location in the document (line number or section)
- For `clients-example`: the `set` and `step` parameter values

### Step 2: Parse Commands

For each CLI block:
1. Identify lines with command prompts (`>`, `redis>`, `127.0.0.1:6379>`)
2. Extract the command name (first token, or first two tokens for multi-word commands)
3. Deduplicate commands within the same example

### Step 3: Check Existing Coverage

For `clients-example` blocks, check if implementations exist:

```bash
# Check data/examples.json for the example ID
cat data/examples.json | jq '.["<example-id>"]'
```

This shows which client languages already have implementations.

### Step 4: Generate Report

Output a structured report with:

```markdown
## Extraction Report: [filename]

### Examples Found

| # | Format | Commands | Example ID | Status |
|---|--------|----------|------------|--------|
| 1 | redis-cli | SET, GET | N/A | Needs TCE |
| 2 | clients-example | HSET, HGET | hash_tutorial | Partial (missing: Go, Rust) |
| 3 | highlight | ZADD, ZRANGE | N/A | Needs TCE |

### Action Items

1. **Create new TCE**: Examples 1, 3 need full multi-language implementation
2. **Add languages**: Example 2 needs Go, Rust implementations added
```

## Supported Client Languages

The following languages are configured in `config.toml` (in display order):

1. Python (redis-py)
2. Node.js (node-redis)
3. ioredis
4. Java-Sync (Jedis)
5. Lettuce-Sync
6. Java-Async (Lettuce)
7. Java-Reactive (Lettuce)
8. Go (go-redis)
9. C (hiredis)
10. C#-Sync (NRedisStack)
11. C#-Async (NRedisStack)
12. RedisVL
13. PHP (Predis)
14. Rust-Sync (redis-rs)
15. Rust-Async (redis-rs)

## Key Reference Files

- `for-ais-only/tcedocs/README.md` - How to add multi-language examples
- `for-ais-only/tcedocs/SPECIFICATION.md` - Complete TCE specification
- `for-ais-only/tcedocs/CLI_COMMAND_EXTRACTION_QUICK_REFERENCE.md` - Quick reference
- `config.toml` - Client configuration and display order
- `data/examples.json` - Existing example implementations
- `data/commands_core.json` - Command metadata (summaries, groups, complexity)

## Example: Analyzing a Command Page

When asked to extract examples from a command page like `content/commands/hset.md`:

1. **Read the file** to find all CLI example formats
2. **Extract commands** from each example block
3. **Check `data/examples.json`** for existing implementations
4. **Report findings** with clear action items

### Sample Output

```
Analyzing: content/commands/hset.md

Found 3 CLI example blocks:

1. Lines 45-52: redis-cli shortcode
   Commands: HSET, HGET
   Status: No TCE exists
   Action: Create new example set "cmds_hash" with step "hset_basic"

2. Lines 78-95: clients-example (set="hash_tutorial", step="hset_hget")
   Commands: HSET, HGET, HGETALL
   Status: TCE exists with Python, Node.js, Java-Sync
   Action: Add missing languages (Go, C#, Rust, PHP)

3. Lines 120-125: fenced code block
   Commands: HSET
   Status: No TCE exists
   Action: Can merge with example #1 or create separate step
```

## Tips

- **Prioritize `redis-cli` shortcodes** - These are interactive and high-value for conversion
- **Check the surrounding context** - The section heading often indicates the example's purpose
- **Group related commands** - Multiple commands in one block usually demonstrate a workflow
- **Note the complexity** - Simple SET/GET vs. complex pipeline operations need different handling
