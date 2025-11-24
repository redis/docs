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

## Quick Checklist for Future Render Hooks

- [ ] Preserve source content in a `<pre>` or similar element
- [ ] Use page store pattern to avoid duplicate resource loading
- [ ] Place static JavaScript in `static/js/`, not `assets/js/`
- [ ] Avoid `innerHTML` with dynamic content; use safe DOM methods
- [ ] Use `data-*` attributes to pass server data to JavaScript
- [ ] Test with multiple instances on the same page
- [ ] Consider state persistence if needed
- [ ] Use semantic HTML and proper accessibility attributes
- [ ] Document the Markdown format clearly
- [ ] Provide sensible defaults for optional parameters
- [ ] Remember Hugo converts attribute names to lowercase
- [ ] Use SVG for complex visual structures
- [ ] Track processed lines when parsing nested structures
- [ ] Account for all visual elements in dimension calculations
- [ ] Use type attributes for conditional features
- [ ] Handle string unescaping during parsing, not rendering
- [ ] Create comprehensive format documentation

