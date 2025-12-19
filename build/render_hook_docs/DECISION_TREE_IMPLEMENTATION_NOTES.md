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

## 11. Sentiment-Based Styling for Suitability Trees

**Discovery**: Not all decision trees are "selection trees" (choose between options). Some are "suitability trees" (determine if something is appropriate).

**Problem**: Selection trees and suitability trees have fundamentally different semantics:
- **Selection trees**: All outcomes are valid recommendations (e.g., "Use JSON" vs. "Use Hash" vs. "Use String")
- **Suitability trees**: Outcomes are binary (suitable vs. unsuitable) (e.g., "RDI is a good fit" vs. "RDI won't work")

**Solution**: Add optional `sentiment` field to outcomes:
```yaml
outcome:
    label: "✅ RDI is a good fit for your use case"
    id: goodFit
    sentiment: "positive"  # Green styling
```

**Implementation Details**:
- Extract `sentiment` field during YAML parsing in JavaScript
- Apply conditional styling in SVG rendering:
  - `sentiment: "positive"` → Green background (`#0fa869`) and border
  - `sentiment: "negative"` → Red background (`#d9534f`) and border
  - No sentiment → Red (default, maintains backward compatibility)

**Key Insight**: Explicit metadata is better than heuristics. Don't try to infer sentiment from emoji (✅/❌) or label text. Use explicit fields for reliability and AI agent compatibility.

**Backward Compatibility**: Existing trees without sentiment fields continue to work with default red styling. This allows gradual adoption.

## 12. Answer Order Respects YAML Structure

**Discovery**: The JavaScript had two issues preventing YAML answer order from being respected:
1. The `flattenDecisionTree()` function was hardcoded to process "yes" first, then "no"
2. The tree line drawing code was deriving Yes/No labels from position (first child = Yes, others = No) instead of using the actual answer value

**Problem**: This prevented authors from controlling the visual layout of the tree. If you wanted "no" outcomes to appear first (for early rejection patterns), the diagram would still show "yes" first.

**Solution**:
1. Modified `flattenDecisionTree()` to iterate through answer keys in the order they appear in the YAML
2. Modified `drawTreeLines()` to use the actual `answer` value stored in each item instead of deriving it from position

```javascript
// In flattenDecisionTree():
const answerKeys = Object.keys(question.answers);
answerKeys.forEach(answerKey => {
  const answer = question.answers[answerKey];
  // Process in order, storing answer.value in the item
});

// In drawTreeLines():
answerLabel = item.answer || 'Yes';  // Use stored value, not position
```

**Benefit**: Authors can now control tree layout by ordering answers in the YAML:
- Put `no` first for early rejection patterns (negative outcomes appear left)
- Put `yes` first for positive-path-first patterns (positive outcomes appear left)

**Key Insight**: YAML object key order is preserved in JavaScript (since ES2015), and we now respect both the order AND the actual answer values, making the layout fully author-controlled.

## 13. Configurable Indent Width for Deeply Nested Trees

**Problem**: Deeply nested decision trees (with many levels of questions) can become too wide to fit on the page, requiring horizontal scrolling.

**Solution**: Added optional `indentWidth` parameter to the YAML root object that controls the horizontal spacing between parent and child nodes:

```yaml
id: when-to-use-rdi
scope: rdi
indentWidth: 25  # Reduce from default 40 to make tree narrower
rootQuestion: cacheTarget
questions:
  # ...
```

**Implementation**:
In `renderDecisionTree()`, the indent width is read from `treeData.indentWidth` with a sensible default:
```javascript
const indentWidth = treeData.indentWidth ? parseInt(treeData.indentWidth) : 40;
```

**Design Rationale**: While `indentWidth` is a rendering preference, it's included in the YAML because:
1. Hugo's Goldmark attribute parsing doesn't reliably expose custom attributes from the code block info string to the render hook
2. Including it in the YAML keeps all tree configuration in one place
3. AI agents can still access the semantic metadata (id, scope, questions) separately from rendering preferences

**Benefit**: Authors can now control tree width by adjusting `indentWidth`:
- Default (40): Comfortable spacing for shallow trees
- Reduced (20-30): Compact layout for deeply nested trees
- The SVG width is calculated as: `leftMargin + (maxDepth + 1) * indentWidth + maxBoxWidth + 40`

**Recommendation**: For trees with 8+ levels of nesting, try `indentWidth: 25` or lower to keep the diagram readable without horizontal scrolling.

## 14. Improved Label Visibility with Reduced Indent Width

**Problem**: When using reduced `indentWidth` values, the Yes/No labels on the connecting lines were being covered by the node boxes they referred to.

**Solution**:
1. Increased the vertical offset of labels from `y + 10` to `y + 16` pixels
2. Added a white background rectangle behind each label to ensure visibility even when overlapping with boxes

**Implementation**:
```javascript
const labelY = y + 16;  // Increased offset

// Add white background rectangle behind label
const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
labelBg.setAttribute('x', labelX - 12);
labelBg.setAttribute('y', labelY - 9);
labelBg.setAttribute('width', '24');
labelBg.setAttribute('height', '12');
labelBg.setAttribute('fill', 'white');
svg.appendChild(labelBg);
```

**Benefit**: Labels remain readable regardless of indent width or tree density.

