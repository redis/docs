# RAG Quality Tool - AI Assistant Guide

Documentation for AI assistants modifying the `analyze_rag_quality` MCP tool.

## Quick Reference

**Location:** `build/command_api_mapping/mcp-server/node/`
**Entry point:** `src/tools/analyze-rag-quality.ts`
**Test command:** `npm run build && npm run test-rag-quality`
**MCP tool name:** `analyze_rag_quality_redis-parser-mcp`

## Architecture Flow

```
Input (file_path or content)
    ↓
markdown-parser.ts     → Section[] + metadataBlockRanges
    ↓
structure-chunker.ts   → Chunk[] + oversizedSections
    ↓
page-type-detector.ts  → PageType (index|tutorial|reference|concept)
    ↓
hard-fail-detector.ts  → HardFail[] (SPLIT_CODE_BLOCK, SPLIT_TABLE, EMPTY_SECTION)
    ↓
recommender.ts         → Issue[] + Recommendation[]
    ↓
scorer.ts              → CategoryScores + overall_score + label (GREEN|YELLOW|RED)
    ↓
Output JSON
```

## Key Interfaces

### Section (from markdown-parser.ts)
```typescript
interface Section {
  level: number;           // 1-4 for H1-H4, 0 for root
  title: string;           // Heading text
  startLine: number;       // 1-indexed line where heading appears
  endLine: number;         // Last line of section content
  content: string;         // Raw content (after metadata stripping)
  originallyOnlyMetadata: boolean;  // True if content was ONLY metadata block
}
```

### Chunk (from structure-chunker.ts)
```typescript
interface Chunk {
  content: string;
  headingPath: string[];   // ["H1 title", "H2 title", "H3 title"]
  tokenCount: number;
  startLine: number;
  endLine: number;
  sectionIndex: number;    // Index into Section[]
  partNumber?: number;     // If split: 1, 2, 3...
  totalParts?: number;     // If split: total parts
}
```

## Common Modifications

### Adding a New Hard-Fail Type

1. Add to `HardFailType` in `src/tools/schemas.ts`:
```typescript
export const HardFailType = z.enum([
  "SPLIT_CODE_BLOCK",
  "SPLIT_TABLE",
  "EMPTY_SECTION",
  "YOUR_NEW_TYPE",  // Add here
]);
```

2. Add detection in `src/chunking/hard-fail-detector.ts`:
```typescript
function detectYourNewIssue(chunks: Chunk[], structure: Section[]): HardFail[] {
  // Return array of HardFail objects
}

// Add to detectHardFails():
fails.push(...detectYourNewIssue(chunks, structure));
```

### Adding a New Issue Type (warning/info)

1. Add to `IssueType` in `src/tools/schemas.ts`
2. Add detection in `src/chunking/recommender.ts` → `generateIssues()`

### Adjusting Scoring

Edit `src/chunking/scorer.ts`:
- `computeStructuralIntegrity()` - penalizes hard-fails
- `computeSelfContainment()` - penalizes tiny/oversized chunks
- `computeEfficiency()` - rewards ideal chunk sizes
- `computeOrderingRisk()` - penalizes many similar-sized chunks

### Adjusting Page Type Detection

Edit `src/chunking/page-type-detector.ts`:
- `detectPageType()` - content heuristics (NOT file paths!)
- `getScoringAdjustments()` - thresholds per page type

## Critical Implementation Details

### Metadata Block Stripping
The parser strips `json metadata` code blocks from section content but tracks them:
- `metadataBlockRanges` in parseMarkdownStructure() output
- `originallyOnlyMetadata` flag prevents false EMPTY_SECTION on sections that only had metadata

### Line Number Tracking
All line numbers are **1-indexed** (matching what users see in editors).
`startLine` is the heading line, `endLine` is the last content line.

### Token Counting
Uses `gpt-tokenizer` (GPT-4 compatible). Falls back to word-based estimate if unavailable.
Initialize with `await initTokenCounter()` before use.

### Page Types Affect Scoring
- `index` pages: tiny chunks are expected, no warnings
- `tutorial` pages: sequential flow is important
- `reference` pages: strict structural rules apply
- `concept` pages: balanced approach

## Testing Changes

1. **Quick test:** `npm run build && npm run test-rag-quality`
2. **Test specific file:** Use MCP tool with absolute path
3. **Verify no regressions:** Test known good pages (quick starts), known bad pages (hashes, streams)

## Files Changed During Development

If you modify the tool, you'll likely touch:
- `src/chunking/*.ts` - Core logic
- `src/tools/schemas.ts` - Add new types
- `src/tools/analyze-rag-quality.ts` - Orchestration (rarely needs changes)
- `src/test-rag-quality.ts` - Test harness

## Gotchas and Lessons Learned

### 1. Test on Built Output, Not Source Files
The tool analyzes `public/**/*.html.md` (Hugo build output), NOT `content/**/*.md` (source).
Shortcodes expand in the build, creating different structure than source.

### 2. Path Resolution
MCP tool requires **absolute paths** or paths relative to workspace root.
The test harness in `test-rag-quality.ts` constructs paths from `__dirname`.

### 3. Metadata Block Detection
Initially detected metadata by checking line BEFORE code fence. Wrong!
Must check the code fence line itself: `` ```json metadata ``
See `parseMarkdownStructure()` → `codeBlockOpenLine.includes('metadata')`.

### 4. Empty Section False Positives
Stripping metadata can make sections appear empty. Solution:
Track `originallyOnlyMetadata` flag and skip those in EMPTY_SECTION detection.

### 5. Page Type Detection
File paths are NOT reliable (all files are `index.html.md`).
Detection uses content signals: code ratio, prose ratio, list density, link density.

### 6. Code Examples Shortcode Pattern
The `{{< clients-example />}}` shortcode creates:
- Empty H3 (source has `### Code examples`)
- Oversized H4 (shortcode generates `#### Code Examples` with all languages)
This is a SYSTEMIC issue affecting 100+ pages. See `/chunking_issues.md`.

### 7. Large Tables Split Badly
Command summary tables (24-37 rows) split across chunks, losing headers.
This triggers SPLIT_TABLE hard-fail. Data type pages are most affected.

## Repository-Specific Patterns

| Pattern | Location | Effect on RAG |
|---------|----------|---------------|
| JSON metadata blocks | Top of sections | Strip from content, don't count as empty |
| `{{< clients-example />}}` | Command/data type pages | Creates empty parent + oversized child |
| Command summary tables | Data type overview pages | Too large, split across chunks |
| GPG key blocks | Security page | 50+ line code block, oversized |

## Future Enhancement Ideas

1. **Shortcode-aware parsing** - Detect known shortcode patterns and adjust expectations
2. **Table row counting** - Warn before tables get too large
3. **Language-specific code block handling** - Treat multi-language examples specially
4. **Severity escalation** - If same issue appears 5+ times, escalate to error

