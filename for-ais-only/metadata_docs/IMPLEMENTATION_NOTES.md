# Implementation Notes: Metadata Features

## Overview

This document captures lessons learned from implementing auto-generated metadata features for Redis documentation pages, including:
- Table of Contents (TOC) metadata
- Per-language identifiers and code examples
- Per-codetabs metadata with language/client mappings
- Metadata deduplication with location tracking

These insights should help guide future metadata feature implementations.

## Key Lessons

### 1. Start with Hugo's Built-in Functions

**Lesson**: Always check what Hugo provides before building custom solutions.

**Context**: Initial attempts tried to manually extract headers from page content using custom partials. This was complex, error-prone, and required parsing HTML/Markdown.

**Solution**: Hugo's `.TableOfContents` method already generates HTML TOC from page headings. Using this as the source was much simpler and more reliable.

**Takeaway**: For future metadata features, audit Hugo's built-in methods first. They often solve 80% of the problem with minimal code.

### 2. Regex Substitution for Format Conversion

**Lesson**: Simple regex transformations can convert between formats more reliably than complex parsing.

**Context**: Converting HTML to JSON seemed like it would require a full HTML parser or complex state machine.

**Solution**: Breaking the conversion into small, sequential regex steps:
1. Remove wrapper elements (`<nav>`, `</nav>`)
2. Replace structural tags (`<ul>` → `[`, `</ul>` → `]`)
3. Replace content tags (`<li><a href="#ID">TITLE</a>` → `{"id":"ID","title":"TITLE"`)
4. Add structural elements (commas, nested arrays)

**Takeaway**: For format conversions, think in terms of sequential substitution patterns rather than parsing. This is often simpler and more maintainable.

### 3. Hugo Template Whitespace Matters

**Lesson**: Hugo template whitespace and comments generate output that affects final formatting.

**Context**: Generated JSON had many blank lines, making it less readable.

**Solution**: Use Hugo's whitespace trimming markers (`{{-` and `-}}`) to prevent unwanted newlines.

**Takeaway**: When generating structured output (JSON, YAML), always consider whitespace. Test the final output, not just the template logic.

### 4. Markdown Templates Have Different Processing Rules

**Lesson**: Hugo's markdown template processor (`.md` files) behaves differently from HTML templates.

**Context**: Initial attempts to include metadata in markdown output failed because the template processor treated code blocks as boundaries.

**Solution**: Place metadata generation in the template itself, not in content blocks. Use `safeHTML` filter to prevent HTML entity escaping.

**Takeaway**: When targeting multiple output formats, test each format separately. Markdown templates have unique constraints that HTML templates don't have.

### 5. Validate Against Schema Early

**Lesson**: Create the schema before or immediately after implementation, not after.

**Context**: Schema was created last, after implementation was complete.

**Better approach**: Define the schema first, then implement to match it. This:
- Clarifies the target structure
- Enables validation during development
- Provides documentation for implementers
- Helps catch structural issues early

**Takeaway**: For future metadata features, write the schema first as a specification.

### 6. Centralize Configuration in `config.toml`

**Lesson**: Language and client identifiers should be centralized in configuration, not hardcoded in templates.

**Context**: When implementing per-language metadata, we initially considered hardcoding language/client mappings in templates. This would have been error-prone and difficult to maintain.

**Solution**: Created a centralized `clientsConfig` in `config.toml` with:
```toml
[params.clientsConfig.Python]
langId = "python"
clientId = "redis-py"
clientName = "redis-py"
```

Then referenced this in templates via `index $.Site.Params.clientsConfig $tabTitle`.

**Takeaway**: For metadata that maps display names to stable identifiers, use `config.toml` as the single source of truth. This enables:
- Easy updates without template changes
- Consistency across all pages
- Clear documentation of all supported languages/clients
- Reusability across multiple templates

### 7. Use Data Attributes for Per-Element Metadata

**Lesson**: For metadata that applies to individual DOM elements (not page-level), use data attributes instead of separate metadata blocks.

**Context**: When implementing per-codetabs metadata, we could have created separate metadata blocks for each codetabs container. Instead, we used a `data-codetabs-meta` attribute on the container itself.

**Solution**: Store JSON metadata directly in data attributes:
```html
<div class="codetabs" data-codetabs-meta='{"Python": {"language": "python", "client": "redis-py"}, ...}'>
```

**Benefits**:
- Single source of truth per element
- No duplication across panels
- Easy runtime access via `element.getAttribute()`
- Scales well with multiple instances on same page
- Reduces overall page size vs. separate metadata blocks

**Takeaway**: For element-level metadata, prefer data attributes over separate metadata blocks. This is more efficient and easier to access at runtime.

### 8. Clarify Duplicate Metadata with Location Fields

**Lesson**: When metadata is duplicated in multiple locations, explicitly mark which is primary and which is fallback.

**Context**: We embed page metadata in both `<head>` (script tag) and `<body>` (hidden div) for redundancy. Without clear marking, downstream tools couldn't determine which to use.

**Solution**: Added two fields to every metadata instance:
- `location`: "head" or "body" - indicates where this copy is located
- `duplicateOf`: "head:data-ai-metadata" - references the primary copy (only in duplicates)

**Benefits**:
- Eliminates confusion for downstream tooling
- Enables smart caching (use head, skip body)
- Supports fallback logic (if head unavailable, use body)
- Documents precedence clearly
- Minimal overhead (just 2 small fields)

**Takeaway**: When duplicating metadata for redundancy, always include location markers. This enables intelligent handling by tools and AI agents.

### 9. Document Metadata Precedence Explicitly

**Lesson**: When multiple metadata sources exist, document which takes precedence and why.

**Context**: With head and body metadata, per-codetabs metadata, and per-panel attributes, tools need to know which to use.

**Solution**: Added a "Metadata Precedence" section to documentation that clearly states:
1. Prefer head metadata (primary, efficient)
2. Use body as fallback (if head unavailable)
3. Check `duplicateOf` field (indicates duplicate)

**Takeaway**: Always document metadata precedence explicitly. This prevents tools from making incorrect assumptions and enables consistent behavior across different implementations.

### 10. Test Multiple Page Types

**Lesson**: Metadata features must work across different page types with different content.

**Context**: Implementation was tested on data types pages and command pages, which have different metadata fields.

**Takeaway**: Always test on at least 2-3 different page types to ensure the feature is robust and handles optional fields correctly.

## Implementation Checklist for Future Metadata Features

When implementing new metadata features, follow this order:

### Phase 1: Planning & Configuration

1. **Identify the metadata scope**
   - Is this page-level or element-level metadata?
   - Will it be duplicated across multiple locations?
   - Does it need to map display names to stable identifiers?

2. **Centralize configuration** (if needed)
   - Add mappings to `config.toml` under `params`
   - Use consistent naming conventions
   - Document all supported values

3. **Define the schema** (`static/schemas/feature-name.json`)
   - Specify required and optional fields
   - Use JSON Schema Draft 7
   - Include examples
   - If duplicating metadata, include `location` and `duplicateOf` fields

### Phase 2: Documentation

4. **Create documentation** (`for-ais-only/metadata_docs/FEATURE_NAME_FORMAT.md`)
   - Explain the purpose and structure
   - Show examples for different scenarios
   - Document embedding locations (HTML, Markdown, data attributes)
   - If multiple metadata sources exist, document precedence clearly
   - Include usage examples for downstream tools

### Phase 3: Implementation

5. **Implement the feature**
   - For page-level metadata: Create/modify Hugo partials
   - For element-level metadata: Use data attributes on the element
   - Test on multiple page types
   - Verify output in both HTML and Markdown formats

6. **Handle optional fields gracefully**
   - Use Hugo's `if` statements to only include fields when present
   - Test on pages with and without optional metadata

### Phase 4: Validation & Documentation

7. **Validate the output**
   - Write validation scripts
   - Test against the schema
   - Check whitespace and formatting
   - Verify on multiple page types

8. **Document implementation notes**
   - Capture lessons learned
   - Note any workarounds or gotchas
   - Provide guidance for future similar features
   - Update this file with new insights

## Common Gotchas

### Template & Output Issues
- **HTML entity escaping**: Use `safeHTML` filter when outputting HTML/JSON in markdown templates
- **Whitespace in templates**: Use `{{-` and `-}}` to trim whitespace
- **Nested structures**: Test deeply nested content to ensure regex patterns handle all cases
- **Optional fields**: Remember that not all pages have all metadata fields
- **Markdown vs HTML**: Always test both output formats

### Metadata Design Issues
- **Hardcoded identifiers**: Don't hardcode language/client mappings in templates - use `config.toml`
- **Duplicate metadata confusion**: Always include `location` and `duplicateOf` fields when duplicating metadata
- **Missing precedence documentation**: Tools won't know which metadata to use without explicit precedence guidance
- **Element-level metadata in separate blocks**: Use data attributes instead of separate metadata blocks for element-level metadata
- **Inconsistent naming**: Use stable identifiers (langId, clientId) separate from display names (id, clientName)

### Testing Issues
- **Single page type testing**: Test on at least 2-3 different page types (command pages, guide pages, etc.)
- **Missing optional fields**: Test pages that don't have all optional metadata fields
- **Large nested structures**: Test with deeply nested content (e.g., multi-level TOC, many code examples)
- **Multiple instances**: Test pages with multiple instances of the same metadata type

## Complete Metadata Architecture

The Redis documentation now has a comprehensive, multi-layered metadata system:

### Layer 1: Page-Level Metadata (Primary)
- **Location**: `<script type="application/json" data-ai-metadata>` in `<head>`
- **Purpose**: Static analysis, AI agent processing, schema validation
- **Content**: Title, description, categories, TOC, code examples, command info
- **Fields**: `location: "head"`

### Layer 2: Page-Level Metadata (Fallback)
- **Location**: `<div hidden data-redis-metadata="page">` in `<body>`
- **Purpose**: DOM-based extraction, fallback access, runtime scripts
- **Content**: Identical to Layer 1
- **Fields**: `location: "body"`, `duplicateOf: "head:data-ai-metadata"`

### Layer 3: Per-Codetabs Metadata
- **Location**: `data-codetabs-meta` attribute on codetabs container
- **Purpose**: Runtime language/client mapping, AI agent interaction
- **Content**: Tab name → language/client/mode mapping
- **Benefits**: Single source of truth, zero duplication, efficient access

### Layer 4: Per-Panel Attributes
- **Location**: Individual panel `<div>` elements
- **Purpose**: Panel-specific configuration (BinderHub, display language)
- **Content**: `data-lang`, `data-binder-id`, `data-codetabs-id`

### Design Principles

1. **Single Source of Truth**: Each piece of information exists in exactly one authoritative location
2. **Minimal Duplication**: When duplication is necessary (head/body), mark it explicitly
3. **Efficient Access**: Use data attributes for element-level metadata, script tags for page-level
4. **Clear Precedence**: Document which metadata to use when multiple sources exist
5. **Stable Identifiers**: Separate display names from stable identifiers (langId vs. id)
6. **Centralized Configuration**: Use `config.toml` for mappings that apply across pages

## Tools and Techniques

- **Hugo filters**: `replaceRE`, `jsonify`, `safeHTML`
- **Configuration**: `config.toml` for centralized mappings
- **Data attributes**: HTML5 data-* attributes for element-level metadata
- **Validation**: Python's `jsonschema` library for schema validation
- **Testing**: Extract metadata from generated files and validate against schema
- **Debugging**: Use `grep` and `head` to inspect generated output


