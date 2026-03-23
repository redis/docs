# RAG Quality Analysis Tool

An MCP tool for evaluating documentation pages for RAG (Retrieval Augmented Generation) suitability.

## Quick Start

**Tool name:** `analyze_rag_quality_redis-parser-mcp`

**Usage:**
```
analyze_rag_quality_redis-parser-mcp({
  file_path: "/absolute/path/to/public/some-page/index.html.md"
})
```

**Important:** Analyze `public/` (build output), not `content/` (source files).

## What It Does

1. Parses Markdown structure (H1-H4 headings)
2. Chunks content respecting heading boundaries
3. Detects hard-fail conditions (split code blocks, split tables, empty sections)
4. Scores the page for RAG quality
5. Returns actionable recommendations

## Output Labels

| Label | Score | Meaning |
|-------|-------|---------|
| 🟢 GREEN | 45+ | Good for RAG, no hard-fails |
| 🟡 YELLOW | 30-44 | Usable but has issues |
| 🔴 RED | <30 or any hard-fail | Poor RAG quality |

## Hard-Fail Types

- **SPLIT_CODE_BLOCK** - Code block split across chunks (loses syntax context)
- **SPLIT_TABLE** - Table split across chunks (loses headers)
- **EMPTY_SECTION** - Heading with no content

## Known Repository Issues

See `/chunking_issues.md` for documented patterns:
- Code Examples shortcode creates empty parents + oversized children
- Command summary tables are too large (24-37 rows)
- Some organizational headings have no content

## Detailed Documentation

For implementation details and modification guide, see:
`build/command_api_mapping/mcp-server/node/RAG_QUALITY_TOOL_AI_GUIDE.md`

## Development

```bash
cd build/command_api_mapping/mcp-server/node
npm run build
npm run test-rag-quality  # Quick sanity check
```

After changes, restart VS Code to reload the MCP server.

