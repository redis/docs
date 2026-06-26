# Render Hook Implementation Lessons

## Overview
This document captures key lessons learned while implementing the checklist render hook for Hugo. These insights should help guide future render hook implementations.

## 1. Progressive Enhancement Pattern

**Key Principle**: Preserve the original Markdown source in a `<pre>` element for non-JS viewers and AI agents, then progressively enhance it with JavaScript for users with JS enabled.

**Implementation**:
```html
<pre class="checklist-source" data-checklist-id="{{ $id }}">{{ .Inner | htmlEscape | safeHTML }}</pre>
{{ .Page.Store.Set "hasChecklist" true }}
```

**Benefits**:
- AI agents can easily parse the raw Markdown source (e.g., via `.html.md` URLs)
- Graceful degradation for users without JavaScript
- SEO-friendly (content is in the HTML)
- Easier to debug and maintain

**Lesson**: Always preserve the source content in a way that's accessible without JavaScript.

---

## 2. Avoiding Duplicate JavaScript on Multi-Component Pages

**Problem**: If a page has multiple checklists, the JavaScript would be loaded multiple times, causing inefficiency and potential conflicts.

**Solution**: Use Hugo's page store pattern (like Mermaid does):

1. **Render hook sets a flag**:
   ```html
   {{ .Page.Store.Set "hasChecklist" true }}
   ```

2. **Base template conditionally loads the script**:
   ```html
   {{ if .Page.Store.Get "hasChecklist" }}
   <script src="{{ "js/checklist.js" | relURL }}"></script>
   {{ end }}
   ```

3. **JavaScript finds all instances and processes them**:
   ```javascript
   const checklists = document.querySelectorAll('pre.checklist-source');
   checklists.forEach(pre => { /* process each */ });
   ```

**Lesson**: Use page store flags to conditionally load resources only when needed, and design JavaScript to handle multiple instances on a single page.

---

## 3. Static Files vs Asset Pipeline

**Problem**: Initially placed `checklist.js` in `assets/js/` but got 404 errors.

**Solution**: Hugo's static JavaScript files must go in `static/js/`, not `assets/js/`.

**Explanation**:
- `assets/` directory: For CSS, images, and files processed by Hugo's asset pipeline
- `static/` directory: For files served directly as-is (JavaScript, fonts, etc.)

**Lesson**: Know the difference between Hugo's asset pipeline and static files. JavaScript typically goes in `static/js/`.

---

## 4. Security: Avoid innerHTML with Dynamic Content

**Problem**: Using `innerHTML` with template literals containing dynamic IDs is an XSS vulnerability vector.

**Bad**:
```javascript
countersDiv.innerHTML = `<label for="${formId}-count">...</label>`;
```

**Good**:
```javascript
const label = document.createElement('label');
label.htmlFor = formId + '-count';
label.textContent = 'text';
countersDiv.appendChild(label);
```

**Additional Tips**:
- Use `textContent` instead of `innerHTML` for text content
- Use `document.createTextNode()` for text nodes
- Use `document.createDocumentFragment()` for efficient DOM building
- Use actual emoji characters instead of HTML entities (safer and cleaner)

**Lesson**: Always use safe DOM methods. Even if the data source is controlled, defense-in-depth is important.

---

## 5. Code Block Attributes and Extraction

**Pattern**: Hugo render hooks receive code block attributes via `.Attributes`.

**Example**:
```markdown
```checklist {id="pyprodlist"}
- [ ] Item 1
- [ ] Item 2
```
```

**Extraction in render hook**:
```html
{{- $id := .Attributes.id | default "checklist" -}}
```

**Lesson**: Use `.Attributes` to extract custom parameters from code block headers. Provide sensible defaults.

---

## 6. Data Attributes for JavaScript Communication

**Pattern**: Use `data-*` attributes to pass information from HTML to JavaScript.

**Example**:
```html
<pre class="checklist-source" data-checklist-id="{{ $id }}">...</pre>
```

**JavaScript access**:
```javascript
const checklistId = pre.getAttribute('data-checklist-id');
```

**Lesson**: Data attributes are the clean way to pass server-side data to client-side JavaScript. Avoid embedding data in class names or other hacks.

---

## 7. Markdown Parsing in JavaScript

**Pattern**: Parse Markdown in JavaScript using regex patterns.

**Example** (checklist items):
```javascript
const linkMatch = item.match(/\[([^\]]+)\]\(([^\)]+)\)/);
if (linkMatch) {
    const a = document.createElement('a');
    a.href = linkMatch[2];
    a.textContent = linkMatch[1];
}
```

**Lesson**: For simple Markdown patterns, regex is sufficient. For complex parsing, consider a lightweight Markdown parser library.

---

## 8. State Persistence with localStorage

**Pattern**: Use `localStorage` to persist user interactions across page reloads.

**Example**:
```javascript
// Save state
localStorage.setItem(formId, itemChoices);

// Load state
let itemString = localStorage.getItem(formId);
if (itemString) {
    setCLItemsFromString(formId, itemString);
}
```

**Considerations**:
- Use unique keys (e.g., based on checklist ID) to avoid conflicts
- Handle missing/corrupted data gracefully
- Consider privacy implications

**Lesson**: localStorage is useful for persisting user state, but always validate and handle edge cases.

---

## 9. Template Context Limitations

**Problem**: Render hook context doesn't have access to `.Page.Store` directly in some Hugo versions.

**Solution**: Use `.Page.Store` in the render hook template, not `.Store`.

**Lesson**: Understand the context available in render hooks vs other templates. Test with your Hugo version.

---

## 10. Testing Multiple Instances

**Pattern**: Always test with multiple instances of the component on the same page.

**Why**: 
- ID conflicts can occur
- Event handlers might interfere
- localStorage keys might collide
- Performance issues might only appear with multiple instances

**Lesson**: Test with at least 2-3 instances of your component on the same page before considering it complete.

---

## 11. Consistency Across Similar Components

**Pattern**: When implementing similar components (like checklists for multiple client libraries), use the same Markdown format and render hook.

**Benefits**:
- Easier maintenance
- Consistent user experience
- Easier for AI agents to parse
- Reduces code duplication

**Lesson**: Design render hooks to be reusable across similar content. Use consistent naming conventions and ID patterns.

---

## 12. Accessibility Considerations

**Implemented**:
- Proper `<label>` elements with `htmlFor` attributes
- Semantic HTML (`<form>`, `<select>`, `<output>`)
- Text content accessible without JavaScript

**Lesson**: Build accessibility in from the start. Use semantic HTML and proper ARIA relationships.

---

## 13. Custom Parsing for Structured Data Formats

**Pattern**: When working with structured data (YAML, JSON, etc.), implement a custom parser in JavaScript rather than relying on external libraries.

**Example** (YAML parser for hierarchies):
```javascript
function parseYAML(yamlText) {
    const lines = yamlText.split('\n');
    const root = {};
    const stack = [{ node: root, indent: -1 }];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const indent = line.search(/\S/);
        // ... parse logic
    }
    return root;
}
```

**Considerations**:
- Custom parsers are lightweight and don't require external dependencies
- They can be tailored to your specific format needs
- For complex formats, consider a lightweight library instead
- Always handle edge cases (empty lines, comments, special characters)

**Lesson**: A simple custom parser can be more efficient than adding a library dependency, especially for domain-specific formats.

---

## 14. SVG Generation for Complex Diagrams

**Pattern**: Use SVG for rendering complex visual structures (trees, hierarchies, etc.) rather than HTML/CSS.

**Benefits**:
- Precise control over positioning and lines
- Efficient rendering of complex structures
- Scalable without quality loss
- Can draw arbitrary shapes and connectors

**Example** (drawing tree lines):
```javascript
const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
line.setAttribute('x1', x1);
line.setAttribute('y1', y1);
line.setAttribute('x2', x2);
line.setAttribute('y2', y2);
line.setAttribute('stroke', '#999');
svg.appendChild(line);
```

**Lesson**: For hierarchical or graph-like structures, SVG is more appropriate than HTML/CSS. Use `createElementNS` with the SVG namespace.

---

## 15. Attribute Case Sensitivity in Hugo

**Problem**: Hugo code block attributes are case-sensitive and converted to lowercase.

**Example**:
```markdown
```hierarchy {type="filesystem" noIcons="true"}
```
```

In the render hook, access as:
```html
{{- $noIcons := .Attributes.noicons -}}
```

**Not**:
```html
{{- $noIcons := .Attributes.noIcons -}}
```

**Lesson**: Hugo converts attribute names to lowercase. Always use lowercase when accessing `.Attributes` in render hooks.

---

## 16. Metadata Parsing with Line Tracking

**Pattern**: When parsing nested structures with metadata, track which lines have been processed to avoid duplicate processing.

**Example**:
```javascript
const skipLines = new Set();

// When processing metadata
while (i < lines.length) {
    // ... parse metadata
    skipLines.add(i);
    i++;
}

// In main loop
if (skipLines.has(lineIndex)) continue;
```

**Lesson**: Use a Set to track processed lines when parsing complex nested structures. This prevents metadata properties from being treated as separate items.

---

## 17. Dimension Calculation for Dynamic Content

**Pattern**: Calculate SVG/container dimensions based on content, accounting for all visual elements.

**Considerations**:
- Text width varies by font and character
- Icons, decorations, and spacing add to dimensions
- Comments or descriptions may extend width
- Nesting depth affects height

**Example**:
```javascript
const charWidth = 8; // Space Mono at 14px
const iconSize = 16;
const iconGap = 6;
const commentGap = 40;

const iconOffset = showIcons ? iconSize + iconGap : 0;
const svgWidth = leftMargin + (maxDepth + 1) * indentWidth + iconOffset +
                 maxTextWidth * charWidth + commentGap + maxCommentWidth * charWidth + 20;
```

**Lesson**: Account for all visual elements when calculating dimensions. Test with various content sizes to ensure proper layout.

---

## 18. Progressive Enhancement with Type-Specific Features

**Pattern**: Use the `type` attribute to enable type-specific rendering features while maintaining a generic base.

**Example**:
```javascript
const showIcons = hierarchyType === 'filesystem' && !noIcons;
```

**Benefits**:
- Single render hook handles multiple hierarchy types
- Type-specific features don't interfere with other types
- Easy to add new types in the future
- Keeps code organized and maintainable

**Lesson**: Use type attributes to conditionally enable features. This allows one render hook to serve multiple purposes.

---

## 19. String Unescaping in Parsed Data

**Pattern**: When parsing quoted strings from YAML/JSON, properly unescape special characters.

**Example**:
```javascript
if ((metaValue.startsWith('"') && metaValue.endsWith('"'))) {
    metaValue = metaValue.slice(1, -1);
    metaValue = metaValue.replace(/\\"/g, '"');
    metaValue = metaValue.replace(/\\\\/g, '\\');
}
```

**Lesson**: Handle quote removal and character unescaping during parsing, not during rendering. This keeps rendering logic clean.

---

## 20. Documentation Format Specification

**Pattern**: Create a separate documentation file specifying the format for your render hook.

**Should Include**:
- Basic syntax with examples
- Metadata fields and their purposes
- Type-specific features
- Code block attributes
- Real-world examples
- Best practices

**Benefits**:
- Helps users understand the format
- Guides future implementations
- Serves as reference for AI agents
- Reduces support questions

**Lesson**: Invest time in clear format documentation. It pays dividends in usability and maintainability.

---

## 21. Server-Side Metadata Extraction for AI Agents

**Pattern**: Extract metadata from structured content (YAML, JSON) in the Hugo render hook and embed it as JSON in the HTML output for AI agents that don't execute JavaScript.

**Implementation**:
```html
{{- /* Extract top-level fields only (no indentation) */ -}}
{{- $lines := split .Inner "\n" -}}
{{- $id := "" -}}
{{- range $lines -}}
  {{- /* Check if line starts without whitespace (32=space, 9=tab) */ -}}
  {{- if and (gt (len .) 0) (ne (index . 0) 32) (ne (index . 0) 9) -}}
    {{- $trimmed := strings.TrimSpace . -}}
    {{- if strings.HasPrefix $trimmed "id:" -}}
      {{- $afterPrefix := strings.Replace $trimmed "id:" "" 1 -}}
      {{- $id = strings.TrimSpace $afterPrefix -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- /* Embed as JSON for AI agents */ -}}
{{- $metadata := dict "type" "decision-tree" "id" $id -}}
{{ $jsonMetadata := $metadata | jsonify (dict "indent" "  ") }}
{{ printf "<script type=\"application/json\" data-redis-metadata=\"decision-tree\">\n%s\n</script>" $jsonMetadata | safeHTML }}
```

**Key Considerations**:
- **Indentation detection**: When parsing nested structures, only extract top-level fields by checking if the line starts with whitespace
- **String manipulation**: Use `strings.Replace` instead of `strings.TrimPrefix` for more reliable extraction
- **Character codes**: Use ASCII codes (32 for space, 9 for tab) to detect indentation reliably
- **Metadata format**: Use simple JSON (not JSON-LD) for clarity and ease of parsing
- **Data attributes**: Use `data-*` attributes to mark metadata elements for AI agents

**Why This Matters**:
- AI agents typically don't execute JavaScript, so metadata must be in static HTML
- Server-side extraction ensures metadata is available even if JavaScript fails
- Structured metadata helps AI agents understand the purpose and scope of components
- Separating metadata from content improves maintainability

**Lesson**: Always provide metadata in static HTML for AI agents. Use server-side extraction to ensure accuracy and avoid relying on JavaScript parsing.

---

## 22. Handling Nested Structures in Hugo Templates

**Pattern**: When extracting data from nested YAML/JSON structures, distinguish between top-level and nested fields using indentation detection.

**Problem**: If you extract all occurrences of a field (e.g., `id:`), you'll get nested occurrences too, leading to incorrect values.

**Solution**: Check indentation before processing:
```html
{{- if and (gt (len .) 0) (ne (index . 0) 32) (ne (index . 0) 9) -}}
  {{- /* Process only top-level lines */ -}}
{{- end -}}
```

**Why This Works**:
- YAML indentation is significant and indicates nesting level
- Top-level fields have no leading whitespace
- Nested fields have leading spaces or tabs
- Character code 32 = space, 9 = tab

**Lesson**: When parsing nested structures in Hugo templates, use indentation detection to distinguish between levels. This prevents extracting nested values when you only want top-level ones.

---

## 23. Progressive Enhancement with Metadata

**Pattern**: Combine progressive enhancement with metadata embedding to serve both humans and AI agents from a single source.

**Architecture**:
1. **Server-side (Hugo)**:
   - Extract metadata from source content
   - Embed metadata as JSON in HTML
   - Preserve raw source in `<pre>` element

2. **Client-side (JavaScript)**:
   - Parse raw source for rendering
   - Use metadata for context/identification
   - Enhance with interactivity

3. **AI agents**:
   - Read static JSON metadata
   - Parse raw source from `<pre>` element
   - No JavaScript execution needed

**Benefits**:
- Single source of truth (the YAML/JSON in the Markdown)
- Metadata available to all consumers (humans, AI agents, JavaScript)
- Graceful degradation if JavaScript fails
- AI-friendly without extra work

**Lesson**: Design render hooks to serve multiple audiences simultaneously. Metadata should be available in static HTML, not just in JavaScript.

---

## 24. Text Wrapping and Box Sizing in SVG Diagrams

**Pattern**: When rendering text in SVG boxes, calculate dimensions based on character width and implement text wrapping to fit within maximum width.

**Implementation**:
```javascript
const charWidth = 8; // Space Mono at 14px
const maxBoxWidth = 420;
const maxCharsPerLine = Math.floor(maxBoxWidth / charWidth);

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
```

**Considerations**:
- **Font metrics**: Different fonts have different character widths
- **Padding**: Account for box padding when calculating available width
- **Line height**: Multiply number of lines by line height for total box height
- **Dynamic sizing**: Calculate SVG dimensions based on content, not fixed values

**Common Pitfall**: Hardcoding SVG width can cause content to be cut off. Instead:
```javascript
const svgWidth = leftMargin + (maxDepth + 1) * indentWidth + maxBoxWidth + 40;
```

**Lesson**: Calculate SVG dimensions dynamically based on content. Account for all visual elements (padding, margins, decorations) when sizing boxes and containers.

---

## 25. Scope and Context Metadata for Component Discovery

**Pattern**: Add `scope` or `category` metadata to components to help AI agents understand their purpose and applicability.

**Implementation**:
```yaml
id: documents-tree
scope: documents
rootQuestion: root
questions:
  # ...
```

**Benefits**:
- **Discoverability**: AI agents can filter components by scope
- **Context awareness**: Agents know which problem domain each component addresses
- **Prevents misapplication**: Agents won't use a "collections" tree to recommend document storage
- **Relationship mapping**: Enables linking related components

**Use Cases**:
- Filtering decision trees by data type category
- Finding all components related to a specific feature
- Organizing components hierarchically
- Providing context in search results

**Lesson**: Add semantic metadata (scope, category, type) to components. This helps AI agents understand purpose and applicability, enabling better recommendations and filtering.

---

## Quick Checklist for Future Render Hooks

### Core Patterns
- [ ] Preserve source content in a `<pre>` or similar element
- [ ] Use page store pattern to avoid duplicate resource loading
- [ ] Place static JavaScript in `static/js/`, not `assets/js/`
- [ ] Avoid `innerHTML` with dynamic content; use safe DOM methods
- [ ] Use `data-*` attributes to pass server data to JavaScript

### Testing & Accessibility
- [ ] Test with multiple instances on the same page
- [ ] Consider state persistence if needed
- [ ] Use semantic HTML and proper accessibility attributes
- [ ] Document the Markdown format clearly
- [ ] Provide sensible defaults for optional parameters

### Hugo-Specific
- [ ] Remember Hugo converts attribute names to lowercase
- [ ] Use indentation detection when parsing nested structures
- [ ] Extract top-level metadata in render hook (not JavaScript)
- [ ] Use `strings.Replace` for reliable string manipulation in templates

### Advanced Features
- [ ] Use SVG for complex visual structures
- [ ] Track processed lines when parsing nested structures
- [ ] Account for all visual elements in dimension calculations
- [ ] Use type attributes for conditional features
- [ ] Handle string unescaping during parsing, not rendering
- [ ] Create comprehensive format documentation

### AI Agent Compatibility
- [ ] Embed metadata as JSON in static HTML (not just JavaScript)
- [ ] Add `scope` or `category` metadata for component discovery
- [ ] Use `data-*` attributes to mark metadata elements
- [ ] Ensure metadata is available without JavaScript execution
- [ ] Preserve raw source content for AI parsing

