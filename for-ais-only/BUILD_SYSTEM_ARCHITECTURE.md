# Build System Architecture

## Overview

The Redis documentation build system is a **multi-stage pipeline** that transforms Markdown source files into a static Hugo site with enhanced features like code examples, metadata, and interactive render hooks.

## High-Level Pipeline

```
Source Markdown Files
    ↓
[1] Metadata Extraction & Validation
    ↓
[2] Code Example Processing
    ↓
[3] Hugo Build
    ↓
[4] Render Hook Processing
    ↓
Static HTML Site
```

## Stage 1: Metadata Extraction & Validation

**Purpose**: Extract and validate page-level metadata from Markdown frontmatter

**Key Files**:
- `build/local_examples.py` - Extracts metadata from page frontmatter
- `for-ais-only/metadata_docs/PAGE_METADATA_FORMAT.md` - Metadata format specification

**What it does**:
- Parses YAML frontmatter from `.md` files
- Validates metadata against schema
- Stores metadata for later stages
- Supports 4-layer metadata architecture (page-level head, page-level body, per-codeblock, per-panel)

**Output**: Validated metadata available to Hugo templates

## Stage 2: Code Example Processing

**Purpose**: Extract, validate, and prepare code examples for rendering

**Key Files**:
- `build/components/example.py` - Core example processing logic
- `build/local_examples.py` - Local example file handling
- `for-ais-only/tcedocs/SPECIFICATION.md` - Complete technical specification
- `for-ais-only/tcedocs/README.md` - User-facing guide

**What it does**:
- Detects code examples in Markdown (via `exid` markers)
- Extracts example ranges from source files
- Validates example syntax
- Generates metadata (language, client, example ID)
- Prepares examples for Hugo rendering

**Output**: Processed examples with metadata ready for Hugo

## Stage 3: Hugo Build

**Purpose**: Generate static HTML from Markdown using Hugo templates

**Key Files**:
- `Makefile` - Build orchestration
- `build/make.py` - Python build utilities
- `layouts/` - Hugo templates and render hooks
- `content/` - Markdown source files

**What it does**:
- Runs Hugo with custom configuration
- Applies templates to Markdown files
- Processes code blocks with render hooks
- Generates static HTML output

**Output**: Static HTML files with render hooks applied

## Stage 4: Render Hook Processing

**Purpose**: Transform specific Markdown elements into interactive components

**Key Files**:
- `layouts/_default/_markup/render-codeblock-*.html` - Render hook templates
- `static/js/*.js` - JavaScript for interactivity
- `for-ais-only/render_hook_docs/` - Render hook documentation

**Implemented Hooks**:
1. **Checklist** - Interactive task lists with state persistence
2. **Hierarchy** - Tree diagrams for class/filesystem structures
3. **Decision Tree** - Interactive decision guides

**What it does**:
- Intercepts specific Markdown code blocks
- Transforms them into interactive SVG/HTML components
- Preserves raw source for AI agents (via `.html.md` URLs)
- Implements progressive enhancement (works without JavaScript)

**Output**: Enhanced HTML with interactive components

## Key Concepts

### Progressive Enhancement
All content is accessible without JavaScript. JavaScript enhances the experience but isn't required. Raw Markdown is always preserved in `<pre>` elements.

### Page Store Pattern
Hugo's `.Page.Store` is used to conditionally load JavaScript resources only when needed on a page, avoiding duplicate script loading.

### Metadata Layers
- **Layer 1**: Page-level metadata in frontmatter (head)
- **Layer 2**: Page-level metadata in body (fallback)
- **Layer 3**: Per-codeblock metadata (code block attributes)
- **Layer 4**: Per-panel attributes (within code blocks)

### AI Agent Compatibility
- Raw source content (Markdown, YAML) preserved in `<pre>` elements
- Metadata embedded as `<script type="application/json">` for static access
- `.html.md` URLs provide Markdown view of rendered pages

## Build Commands

```bash
make build          # Full build
make dev            # Development build with watch
make clean          # Clean build artifacts
make test           # Run tests
```

See `Makefile` for complete list of commands.

## File Organization

```
build/
├── components/          # Python code for example processing
│   ├── example.py      # Core example logic
│   ├── component.py    # Component base class
│   └── ...
├── jupyterize/         # Notebook conversion tool
├── make.py             # Build utilities
├── local_examples.py   # Local example handling
└── *.py                # Other build scripts

layouts/
├── _default/
│   ├── baseof.html     # Base template with conditional script loading
│   └── _markup/
│       ├── render-codeblock-checklist.html
│       ├── render-codeblock-hierarchy.html
│       └── render-codeblock-decision-tree.html
└── ...

static/js/
├── checklist.js
├── hierarchy.js
└── decision-tree.js

content/               # Markdown source files
```

## See Also

- [DEVELOPER_TASKS.md](./DEVELOPER_TASKS.md) - Task decision tree
- [for-ais-only/render_hook_docs/](./render_hook_docs/) - Render hook documentation
- [for-ais-only/metadata_docs/](./metadata_docs/) - Metadata documentation
- [for-ais-only/tcedocs/](./tcedocs/) - Code examples documentation
- `Makefile` - Build commands
- `build/make.py` - Build utilities

