# JSON Output for AI Systems

## Overview

The Redis documentation build system generates AI-friendly JSON output alongside the standard HTML site. This output is designed for:

- **RAG (Retrieval-Augmented Generation)** systems
- **AI crawlers** and indexing tools
- **LLM context windows** with structured, chunked content

## Output Files

| File | Location | Description |
|------|----------|-------------|
| Per-page JSON | `public/<path>/index.json` | Individual page data with sections |
| NDJSON feed | `public/docs.ndjson` | All pages in newline-delimited JSON |

## Build Pipeline

The JSON output is generated as part of `make all`:

```
Hugo Build
    ↓
[1] Hugo generates index.json for each page (layouts/_default/single.json, section.json)
    ↓
[2] transform_json_sections.ts splits content into sections, adds content_hash
    ↓
[3] generate_ndjson.py aggregates all JSON into docs.ndjson
    ↓
AI-ready output
```

**Note**: JSON transformation is NOT included in `make serve` or `make localserve` because `hugo serve` continuously rebuilds files, which would overwrite the transformed output.

## JSON Schema

Each page produces a JSON object with this structure:

```json
{
  "id": "set",
  "title": "SET",
  "url": "https://redis.io/commands/set/",
  "summary": "Sets the string value of a key...",
  "content_hash": "a1b2c3d4e5f6...",
  "tags": ["docs", "develop", "commands"],
  "last_updated": "2026-03-13T10:33:30Z",
  "sections": [
    {
      "id": "overview",
      "title": "Overview",
      "role": "overview",
      "text": "The SET command sets..."
    },
    {
      "id": "options",
      "title": "Options",
      "role": "parameters",
      "text": "The SET command supports..."
    }
  ]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | URL slug identifier |
| `title` | string | Page title |
| `url` | string | Canonical URL |
| `summary` | string | Short description |
| `content_hash` | string | SHA256 hash of original content (for cache invalidation) |
| `tags` | string[] | Category tags |
| `last_updated` | string | ISO 8601 timestamp |
| `sections` | Section[] | Content split by headings |

### Section Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Slugified heading (e.g., `"learn-more"`) |
| `title` | string | Original heading text |
| `role` | string | Semantic role (see below) |
| `text` | string | Section content (Markdown) |

### Semantic Roles

Roles are assigned based on heading text patterns:

| Role | Matches |
|------|---------|
| `overview` | Overview, Introduction, About, Description |
| `syntax` | Syntax, Usage, Command, Signature |
| `example` | Example, Demo, Sample, Code Example |
| `parameters` | Option, Parameter, Argument, Flag |
| `returns` | Return, Response, Output, Result |
| `errors` | Error, Exception, Troubleshoot |
| `performance` | Performance, Complexity, Benchmark |
| `limits` | Limit, Constraint, Restriction |
| `related` | See Also, Related, Learn More, Reference |
| `setup` | Install, Setup, Getting Started, Quickstart |
| `configuration` | Configure, Setting |
| `security` | Security, Auth, Permission, ACL |
| `compatibility` | Compatible, Support, Version |
| `history` | History, Changelog, Version History |
| `content` | (default for unmatched headings) |

## Key Files

| File | Purpose |
|------|---------|
| `layouts/_default/single.json` | Hugo template for page JSON |
| `layouts/_default/section.json` | Hugo template for section index JSON |
| `build/transform_json_sections.ts` | Post-processing: sections + hash |
| `build/generate_ndjson.py` | NDJSON aggregation |
| `Makefile` | Build targets (`json_transform`, `ndjson`) |

## Adapting the System

### Adding New Semantic Roles

Edit `build/transform_json_sections.ts` and add patterns to `ROLE_PATTERNS`:

```typescript
const ROLE_PATTERNS: [RegExp, string][] = [
  // Add new pattern here
  [/^(warning|caution|danger)/i, 'warning'],
  // ... existing patterns
];
```

### Changing JSON Structure

1. **Hugo-generated fields**: Edit `layouts/_default/single.json` and `section.json`
2. **Post-processing fields**: Edit `build/transform_json_sections.ts`

### Adding Fields to Sections

In `transform_json_sections.ts`, modify the `Section` interface and `splitContentIntoSections()`:

```typescript
interface Section {
  id: string;
  title: string;
  role: string;
  text: string;
  word_count?: number;  // Add new field
}
```

### Validating Output

```bash
# Validate NDJSON format
jq -e . public/docs.ndjson > /dev/null && echo "Valid!"

# Check specific page
cat public/commands/set/index.json | jq '.sections[] | {id, role}'

# Count sections by role
jq -s '[.[].sections[]?.role] | group_by(.) | map({role: .[0], count: length})' public/docs.ndjson
```

## Size Considerations

| Format | Approximate Size |
|--------|------------------|
| Per-page JSON (avg) | 5-15 KB |
| NDJSON (all pages) | ~32 MB |

The `content_hash` field enables incremental updates—consumers can check if content changed without downloading full text.

