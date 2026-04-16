# RAG Chunking Issues

Issues discovered during RAG quality analysis that may need documentation or build changes.

## Code Examples Pattern

**Status:** ✅ Resolved
**Discovered:** 2026-03-23
**Resolved:** 2026-03-23
**Affected pages:** Command pages, data type pages, client guides

### Problem

The `{{< clients-example />}}` Hugo shortcode generates a structure that causes two RAG quality issues:

1. **Empty parent section** - The source Markdown has `### Code examples`, and the shortcode generates `#### Code Examples`, leaving the H3 with no content between it and the H4.

2. **Oversized section** - The generated `#### Code Examples` section contains the same example in 5+ languages (Python, JS, Java, Go, C#), often totalling 500-800+ tokens.

### Example

**Source file** (`content/commands/set.md`):
```markdown
### Code examples

{{< clients-example set="set_and_get" step="set" ... />}}
```

**Built output** (`public/commands/set/index.html.md`):
```markdown
### Code examples

#### Code Examples

Foundational: Set the string value of a key using SET...

**Python:**
[~20 lines of Python code]

**JavaScript (Node.js):**
[~20 lines of JavaScript code]

**Java (Synchronous - Jedis):**
[~20 lines of Java code]

... (continues for Go, C#)
```

### RAG Impact

- **EMPTY_SECTION hard-fail** on the `### Code examples` heading
- **OVERSIZED_SECTION warning** on the `#### Code Examples` content
- When chunked, the multi-language examples may be split mid-code-block

### Possible Solutions

1. **Change the shortcode** - Don't emit `#### Code Examples` heading if parent already has a code examples heading

2. **Remove H3 from source** - If the shortcode provides its own heading, remove `### Code examples` from source files

3. **Split by language** - Have the shortcode emit separate H4/H5 sections per language so each is independently retrievable

4. **Collapse in RAG** - Treat multi-language code examples as a single retrievable unit with language variants

### Resolution

**Solution implemented:** Option 3 - Split by language with H5 headings

Changes made to `layouts/partials/markdown-code-examples.html`:
1. Removed the `#### Code Examples` heading from the shortcode output
2. Changed language labels from `**Python:**` to `##### Python` (etc.)
3. Metadata (description, difficulty, commands, availability) now flows under the source `### Code examples` heading

**Result:**
- No more empty parent sections
- Each language example is its own ~50-100 token H5 section
- Pages like SET, HSET, ZADD, LPUSH now score 🟢 GREEN (48-50 points)

### Notes

This pattern appears in:
- `/commands/*/index.html.md` - Command reference pages
- `/develop/data-types/*/index.html.md` - Data type pages
- `/develop/clients/*/index.html.md` - Client guide pages


## GPG issue

**Status:** ✅ Resolved
**Discovered:** 2026-03-23
**Resolved:** 2026-04-16
**Affected pages:** `/operate/oss_and_stack/management/security/index.html.md`

### Problem

The GPG key block at the bottom of the page was a single 1000+ token section that caused an **OVERSIZED_SECTION** warning.

### Resolution

GPG key moved into a separate downloadable text file, removing the oversized inline block.

**Result:**
- Page now scores 🟢 GREEN (51/55) with 0 hard-fails

## Long command tables

**Status:** ✅ Resolved
**Discovered:** 2026-03-23
**Resolved:** 2026-03-23
**Affected pages:** `/develop/data-types/*/index.html.md` - Data type overview pages

### Problem

Data type pages (strings, hashes, lists, sorted-sets, json) have "command summary" tables with 24-37 rows. These tables:

1. **Exceed 512 tokens** - causing OVERSIZED_SECTION warnings
2. **Get split across multiple chunks** - triggering SPLIT_TABLE hard-fails
3. **Lose context when split** - a chunk with rows 15-25 of a table has no column headers

### Observed Examples

| Page | Table Rows | Chunks Split Across |
|------|------------|---------------------|
| Hashes | 30 rows | 2 chunks |
| Sorted sets | 37 rows | 3 chunks |
| Lists | 24 rows | 2 chunks |
| Strings | 27 rows | 2 chunks |
| JSON | 28 rows | 2 chunks |

### Resolution

**Solution implemented:** Row count splitting with repeated headers

Changes made to `layouts/partials/markdown-command-group.html`:
1. Tables are split into chunks of 10 rows maximum
2. Each chunk gets its own Markdown table header row (`| Command | Summary | Complexity | Since |`)
3. Continuation chunks get unique headings like `#### {Title} (part 2)`, `#### {Title} (part 3)`, etc.
4. Only affects the `.html.md` AI-facing output; HTML output for humans remains unchanged

**Result:**
- No more SPLIT_TABLE hard-fails
- Each retrievable chunk contains column headers
- Pages score 🟢 GREEN (49-50 points):
  - Hashes: 49
  - Strings: 49
  - Sorted Sets: 49
  - Lists: 50

### Notes

This approach works because:
- For AI retrieval, the semantic meaning of groupings is irrelevant
- What matters is that each chunk has complete headers and context
- The solution is automatic and works identically for all data types


## Empty organizational headings

**Status:** ✅ Resolved
**Discovered:** 2026-03-23
**Resolved:** 2026-03-23
**Affected pages:** Various (encryption, REST API, etc.)

### Problem

Some pages use headings purely for organizational structure, with no content between the heading and its children. This triggered EMPTY_SECTION hard-fails.

### Example

**Encryption page** (`public/operate/rs/security/encryption/index.html.md`):
```markdown
## Encrypt data in transit

### TLS
[content about TLS]

### Internode encryption
[content about internode encryption]
```

The `## Encrypt data in transit` heading has no content - it just groups the subsections.

### Resolution

**Solution implemented:** Adjusted tool detection to recognize organizational headings.

Changes made to `build/command_api_mapping/mcp-server/node/src/chunking/hard-fail-detector.ts`:
1. Modified `detectEmptySections()` to check if an empty section is followed by a child section (higher heading level)
2. If so, it's recognized as a structural grouping heading and skipped

**Result:**
- Encryption page now scores 🟢 GREEN (50/55) with 0 hard-fails
- True empty sections (heading followed by same-level or lower-level heading) still detected
- No changes needed to documentation content


## Empty "Examples" sections on command pages

**Status:** ✅ Resolved (as part of Code Examples Pattern fix)
**Discovered:** 2026-03-23
**Resolved:** 2026-03-23
**Affected pages:** `/commands/*/index.html.md` - Many command reference pages

### Problem

Many command pages have a `## Examples` heading with no content before the `### Code examples` or `#### Code Examples` section. This is a variant of the "Code Examples Pattern" issue.

### Resolution

This was resolved as part of the Code Examples Pattern fix. The `clients-example` shortcode now outputs:
- Description, difficulty, commands, and availability info directly under the parent heading
- This content fills the `## Examples` section on pages that use this structure

Example result (LPUSH page):
```markdown
## Examples
Foundational: Add one or more elements to the head of a list...

**Difficulty:** Beginner
**Commands:** LPUSH, LRANGE
**Available in:** Redis CLI, Python, JavaScript, ...

##### Redis CLI
[code]

##### Python
[code]
```
