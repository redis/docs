# Implementation Notes: Table of Contents Metadata

## Overview

This document captures lessons learned from implementing auto-generated table of contents (TOC) metadata for Redis documentation pages. These insights should help guide future metadata feature implementations.

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

### 6. Test Multiple Page Types

**Lesson**: Metadata features must work across different page types with different content.

**Context**: Implementation was tested on data types pages and command pages, which have different metadata fields.

**Takeaway**: Always test on at least 2-3 different page types to ensure the feature is robust and handles optional fields correctly.

## Implementation Checklist for Future Metadata Features

When implementing new metadata features, follow this order:

1. **Define the schema** (`static/schemas/feature-name.json`)
   - Specify required and optional fields
   - Use JSON Schema Draft 7
   - Include examples

2. **Create documentation** (`build/metadata_docs/FEATURE_NAME_FORMAT.md`)
   - Explain the purpose and structure
   - Show examples
   - Document embedding locations (HTML, Markdown)

3. **Implement the feature**
   - Create/modify Hugo partials
   - Test on multiple page types
   - Verify output in both HTML and Markdown formats

4. **Validate the output**
   - Write validation scripts
   - Test against the schema
   - Check whitespace and formatting

5. **Document implementation notes**
   - Capture lessons learned
   - Note any workarounds or gotchas
   - Provide guidance for future similar features

## Common Gotchas

- **HTML entity escaping**: Use `safeHTML` filter when outputting HTML/JSON in markdown templates
- **Whitespace in templates**: Use `{{-` and `-}}` to trim whitespace
- **Nested structures**: Test deeply nested content to ensure regex patterns handle all cases
- **Optional fields**: Remember that not all pages have all metadata fields
- **Markdown vs HTML**: Always test both output formats

## Tools and Techniques

- **Hugo filters**: `replaceRE`, `jsonify`, `safeHTML`
- **Validation**: Python's `jsonschema` library for schema validation
- **Testing**: Extract metadata from generated files and validate against schema
- **Debugging**: Use `grep` and `head` to inspect generated output


