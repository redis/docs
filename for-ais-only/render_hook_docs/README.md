# Render Hook Documentation

This folder contains documentation for Hugo render hooks implemented in the Redis documentation site.

## Overview

Render hooks are Hugo templates that intercept and transform specific Markdown elements. They enable progressive enhancement patterns where content is accessible without JavaScript (for AI agents and non-JS users) but enhanced with interactive features for users with JavaScript enabled.

## Render Hooks Implemented

### 1. Checklist Render Hook

**Purpose**: Transform Markdown checklists into interactive forms with state persistence.

**Markdown Format**:
```markdown
```checklist {id="my-checklist"}
- [ ] Item 1
- [ ] Item 2
- [x] Item 3
```
```

**Features**:
- ✅ Interactive dropdown for each item (❌ Not Done, ✅ Done, 🔍 In Progress, ∅ Skipped)
- 📊 Real-time progress counters showing completion status
- 💾 Automatic state persistence using localStorage
- 🎯 Graceful degradation - raw Markdown visible without JavaScript
- 🤖 AI-friendly - raw Markdown preserved for AI agents via `.html.md` URLs
- ♿ Accessible - semantic HTML with proper form elements and labels

**Implementation Files**:
- `layouts/_default/_markup/render-codeblock-checklist.html` - Hugo render hook
- `static/js/checklist.js` - JavaScript for interactivity
- Integrated into `layouts/_default/baseof.html` via page store pattern

**Real-World Examples**:
- Used in client library documentation for product checklists
- Enables users to track their progress through feature lists

---

### 2. Hierarchy Render Hook

**Purpose**: Render hierarchical structures (class inheritance, filesystem trees, etc.) as visual SVG diagrams.

**Markdown Format**:
```markdown
```hierarchy {type="filesystem"}
"(root)":
    "config.yaml":
        _meta:
            description: "Main configuration file"
    "jobs":
        "job1.yaml":
        "...":
            _meta:
                ellipsis: true
```
```

**Features**:
- 🌳 ASCII art-style tree structure with connected lines
- 📁 File and folder icons for filesystem hierarchies (optional)
- 📝 Descriptions displayed as italic text after items
- ⋯ Dotted lines for ellipsis items indicating continuation
- 🎨 Space Mono font matching Redis documentation style
- 🤖 AI-friendly - raw YAML preserved for AI agents
- 🔧 Type-specific rendering (exception, filesystem, generic)

**Implementation Files**:
- `layouts/_default/_markup/render-codeblock-hierarchy.html` - Hugo render hook
- `static/js/hierarchy.js` - JavaScript for SVG rendering
- Integrated into `layouts/_default/baseof.html` via page store pattern

**Real-World Examples**:
- `content/develop/clients/redis-py/error-handling.md` - Exception hierarchy
- `content/integrate/redis-data-integration/data-pipelines/_index.md` - Filesystem hierarchy

---

### 3. Decision Tree Render Hook

**Purpose**: Guide users through a series of questions to reach a recommendation using interactive SVG diagrams.

**Markdown Format**:
```markdown
```decision-tree {id="documents-tree"}
id: documents-tree
scope: documents
rootQuestion: root
questions:
    root:
        text: "Do you need nested data structures?"
        whyAsk: "JSON supports nested structures, hashes and strings don't"
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Use JSON"
                    id: jsonOutcome
            no:
                value: "No"
                nextQuestion: nextQuestion
```
```

**Features**:
- 🎯 Interactive decision trees with Yes/No branching
- 📦 Structured YAML format with explicit question and outcome IDs
- 💡 `whyAsk` field explains decision logic for AI agents
- 🤖 AI-friendly metadata embedding (id, scope) in static JSON
- 📊 SVG rendering with boxes, connecting lines, and answer labels
- 🔍 Discoverable by scope for AI agent filtering
- ♿ Accessible - raw YAML preserved for non-JS users

**Implementation Files**:
- `layouts/_default/_markup/render-codeblock-decision-tree.html` - Hugo render hook
- `static/js/decision-tree.js` - JavaScript for SVG rendering and YAML parsing
- Integrated into `layouts/_default/baseof.html` via page store pattern

**Real-World Examples**:
- `content/develop/data-types/compare-data-types.md` - Redis data type selection trees (Documents, Collections, Sequences)

---

## Documentation Files

### [AI_RENDER_HOOK_LESSONS.md](AI_RENDER_HOOK_LESSONS.md)

Comprehensive guide capturing lessons learned from implementing render hooks. Covers:

- **Lessons 1-12**: Foundational patterns from the checklist render hook
  - Progressive enhancement
  - Page store pattern for avoiding duplicate resources
  - Static files vs asset pipeline
  - Security (avoiding innerHTML)
  - Code block attributes
  - Data attributes
  - Markdown parsing
  - localStorage for state persistence
  - Template context
  - Testing multiple instances
  - Consistency across components
  - Accessibility

- **Lessons 13-20**: Advanced patterns from the hierarchy render hook
  - Custom parsing for structured data (YAML)
  - SVG generation for complex diagrams
  - Hugo attribute case sensitivity
  - Metadata parsing with line tracking
  - Dynamic dimension calculation
  - Type-specific features
  - String unescaping
  - Format documentation

**Quick Checklist**: A comprehensive checklist for implementing future render hooks.

### [HIERARCHY_FORMAT.md](HIERARCHY_FORMAT.md)

Complete specification for the hierarchy render hook format. Includes:

- Basic YAML syntax with examples
- Quoted names for special characters
- Metadata fields (description, ellipsis)
- Ellipsis pattern for omitted items
- Complete examples (exception and filesystem hierarchies)
- Code block attributes (type, noicons)
- Best practices for naming and organization
- Metadata reference table
- Rendering details for users and AI agents
- Real-world examples

---

## Key Principles

### Progressive Enhancement
Content is always accessible without JavaScript. JavaScript enhances the experience but isn't required.

### AI Agent Compatibility
Raw source content (Markdown, YAML) is preserved in `<pre>` elements so AI agents can parse it via `.html.md` URLs.

### Page Store Pattern
Use Hugo's `.Page.Store` to conditionally load resources only when needed on a page, avoiding duplicate script loading.

### Security First
Always use safe DOM methods (`createElement`, `textContent`) instead of `innerHTML` with dynamic content.

### Type-Specific Features
Use type attributes to enable features conditionally (e.g., icons only for filesystem hierarchies).

---

## Adding a New Render Hook

Follow these steps when implementing a new render hook:

1. **Create the render hook template** in `layouts/_default/_markup/render-codeblock-{name}.html`
2. **Preserve source content** in a `<pre>` element with appropriate class
3. **Set page store flag** to enable conditional resource loading
4. **Implement JavaScript** in `static/js/{name}.js`
5. **Update base template** to conditionally load the script
6. **Document the format** in a format specification file
7. **Test with multiple instances** on the same page
8. **Add real-world examples** to the documentation

See [AI_RENDER_HOOK_LESSONS.md](AI_RENDER_HOOK_LESSONS.md) for detailed guidance on each step.

---

## Related Files

### Base Template
- `layouts/_default/baseof.html` - Base template with conditional script loading for all render hooks

### Checklist Render Hook
- `layouts/_default/_markup/render-codeblock-checklist.html` - Hugo render hook
- `static/js/checklist.js` - JavaScript for interactivity

### Hierarchy Render Hook
- `layouts/_default/_markup/render-codeblock-hierarchy.html` - Hugo render hook
- `static/js/hierarchy.js` - JavaScript for SVG rendering

### Decision Tree Render Hook
- `layouts/_default/_markup/render-codeblock-decision-tree.html` - Hugo render hook
- `static/js/decision-tree.js` - JavaScript for SVG rendering and YAML parsing
