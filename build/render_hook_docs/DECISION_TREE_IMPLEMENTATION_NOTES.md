# Decision Tree Implementation Notes

## Key Learnings from Implementation

This document captures insights from implementing the decision tree render hook that go beyond the standard lessons.

## 1. Metadata Extraction Challenges

**Problem**: Extracting metadata from nested YAML structures in Hugo templates is tricky because simple field matching returns nested occurrences.

**Example**: When extracting `id:` from a decision tree YAML, you might get:
- Top-level: `id: documents-tree` ✅
- Nested: `id: jsonOutcome` ❌ (from outcome objects)

**Solution**: Use indentation detection to distinguish levels:
```html
{{- if and (gt (len .) 0) (ne (index . 0) 32) (ne (index . 0) 9) -}}
  {{- /* Process only top-level lines (no leading space/tab) */ -}}
{{- end -}}
```

**Key Insight**: Character codes matter - 32 = space, 9 = tab. This is more reliable than string operations.

## 2. String Manipulation in Hugo Templates

**Problem**: `strings.TrimPrefix` doesn't always work as expected in Hugo templates.

**Solution**: Use `strings.Replace` with a count parameter instead:
```html
{{- $afterPrefix := strings.Replace $trimmed "id:" "" 1 -}}
{{- $id = strings.TrimSpace $afterPrefix -}}
```

**Why**: `Replace` is more predictable and handles edge cases better than `TrimPrefix`.

## 3. Server-Side vs Client-Side Metadata

**Key Principle**: Metadata for AI agents MUST be in static HTML, not JavaScript.

**Why**: AI agents typically don't execute JavaScript. If metadata is only created by JavaScript, AI agents won't see it.

**Implementation**:
- Extract metadata in Hugo render hook
- Embed as `<script type="application/json">` in HTML
- JavaScript can use the same metadata if needed
- AI agents read static JSON without executing JS

## 4. Scope Metadata for Discovery

**Pattern**: Add `scope` field to help AI agents understand component purpose.

**Benefits**:
- Enables filtering (e.g., "show me all documents-related trees")
- Prevents misapplication (e.g., using collections tree for documents)
- Improves search and discovery
- Provides semantic context

**Example**:
```yaml
id: documents-tree
scope: documents
```

## 5. Progressive Enhancement Architecture

**Three-Layer Design**:
1. **Server-side (Hugo)**: Extract metadata, preserve source, set page store flag
2. **Static HTML**: Metadata in JSON, source in `<pre>`, ready for AI agents
3. **Client-side (JavaScript)**: Parse source, render diagrams, enhance with interactivity

**Benefit**: Each layer works independently. AI agents get metadata without JS. Humans get interactive diagrams. Non-JS users get raw content.

## 6. SVG Dimension Calculation

**Lesson**: Never hardcode SVG dimensions. Calculate dynamically based on content.

**Common Mistake**:
```javascript
const svgWidth = leftMargin + (maxDepth + 1) * indentWidth + 320; // ❌ Hardcoded
```

**Better**:
```javascript
const svgWidth = leftMargin + (maxDepth + 1) * indentWidth + maxBoxWidth + 40;
```

**Why**: Content varies. Hardcoded values cause cutoff issues when content is larger than expected.

## 7. Text Wrapping in Boxes

**Pattern**: Calculate max characters per line based on font metrics:
```javascript
const charWidth = 8; // Space Mono at 14px
const maxCharsPerLine = Math.floor(maxBoxWidth / charWidth);
```

**Considerations**:
- Different fonts have different character widths
- Account for padding when calculating available width
- Test with various content lengths

## 8. Code Block Attributes

**Pattern**: Use info string attributes to pass metadata to render hook:
```markdown
```decision-tree {id="documents-tree"}
```

**Access in render hook**:
```html
{{- $id := .Attributes.id -}}
```

**Lesson**: Keep fence attributes simple. Complex data should go in the YAML body.

## 9. Testing Multiple Instances

**Critical**: Always test with 3+ instances on the same page.

**Why**:
- ID conflicts
- Event handler interference
- localStorage key collisions
- Performance issues
- SVG rendering issues

**Result**: Discovered that multiple trees on one page work correctly with proper ID handling.

## 10. Documentation is Part of Implementation

**Lesson**: Comprehensive documentation is not optional—it's part of making the component usable.

**Should Document**:
- Format specification (YAML structure)
- Code block attributes
- Metadata fields and their purposes
- Real-world examples
- Best practices
- AI agent compatibility

**Benefit**: Helps future implementers and enables AI agents to understand the format.

