# AI Agent Developer Guide for Redis Documentation

This guide helps AI agents (like myself) work more effectively on the Redis documentation codebase.

## Quick Navigation for AI Agents

### 🎯 Start Here
- **Project Overview**: See `README.md` for general structure
- **Build System**: See `Makefile` and `build/make.py` for build pipeline
- **Hugo Configuration**: See `config.toml` for site settings and language mappings

### 📚 AI-Specific Documentation (Critical for AI Agents)

These files contain patterns, conventions, and implementation details that AI agents should reference:

#### Render Hooks & Interactive Components
- **`for-ais-only/render_hook_docs/README.md`** - Overview of all render hooks (checklists, hierarchies, decision trees)
- **`for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md`** - 12+ lessons on progressive enhancement, security, and patterns
- **`for-ais-only/render_hook_docs/DECISION_TREE_FORMAT.md`** - YAML format for decision trees
- **`for-ais-only/render_hook_docs/HIERARCHY_FORMAT.md`** - YAML format for hierarchies
- **`for-ais-only/render_hook_docs/DECISION_TREE_IMPLEMENTATION_NOTES.md`** - Implementation details and gotchas

#### Page Metadata System
- **`for-ais-only/metadata_docs/PAGE_METADATA_FORMAT.md`** - Complete metadata structure (TOC, code examples, command info)
- **`for-ais-only/metadata_docs/IMPLEMENTATION_NOTES.md`** - 10 key lessons on metadata design and implementation

#### Code Examples System
- **`for-ais-only/tcedocs/README.md`** - User guide for adding multi-language code examples
- **`for-ais-only/tcedocs/SPECIFICATION.md`** - Technical specification (1600+ lines of detailed architecture)

#### Jupyter Notebook Conversion
- **`build/jupyterize/README.md`** - Tool for converting code examples to Jupyter notebooks

### 🏗️ Project Architecture

```
/build/                          # Build scripts and utilities
├── components/                  # Code example processing
├── jupyterize/                  # Notebook conversion tool
├── make.py                       # Main build orchestrator
└── *.py                         # Build utilities

/for-ais-only/                   # AI-friendly documentation
├── render_hook_docs/            # Render hook patterns & lessons
├── metadata_docs/               # Page metadata documentation
└── tcedocs/                     # Code example system docs

/content/                        # Documentation pages
├── ai-agent-resources.md        # AI-friendly resources index
├── develop/                     # Development guides
├── integrate/                   # Integration guides
└── operate/                     # Operations guides

/layouts/                        # Hugo templates
├── partials/                    # Reusable template components
├── shortcodes/                  # Markdown shortcodes
└── _default/                    # Default page templates

/data/                           # Data files
├── components/                  # Language/client configurations
└── examples.json                # Generated code example metadata

/static/                         # Static assets
├── js/                          # JavaScript for interactive components
└── schemas/                     # JSON schemas for metadata validation
```

### 🔑 Key Concepts for AI Agents

1. **Progressive Enhancement**: Content works without JavaScript; JS enhances it
2. **Page Store Pattern**: Use Hugo's page store to avoid duplicate resources
3. **Metadata Layers**: Page-level (head/body), per-codetabs, per-panel
4. **Stable Identifiers**: Separate display names from stable IDs (langId vs. id)
5. **Configuration Centralization**: Use `config.toml` for mappings, not hardcoded values

### 📋 Common Tasks

**Adding a new render hook**: See `build/render_hook_docs/AI_RENDER_HOOK_LESSONS.md` (Lessons 1-12)

**Implementing metadata**: See `for-ais-only/metadata_docs/IMPLEMENTATION_NOTES.md` (Implementation Checklist)

**Adding code examples**: See `for-ais-only/tcedocs/README.md` (How to add multi-language examples)

**Understanding page structure**: See `for-ais-only/metadata_docs/PAGE_METADATA_FORMAT.md`

### 🔍 Discovery Strategy for AI Agents

When working on this project:

1. **Check `for-ais-only/` directory first** - Contains all meta-documentation for AI agents
2. **Read the README in the relevant subsystem** - Each has comprehensive docs
3. **Look for IMPLEMENTATION_NOTES or LESSONS files** - Capture hard-won knowledge
4. **Check `config.toml`** - Source of truth for language/client mappings
5. **Review existing render hooks** - In `layouts/_default/_markup/`

### ⚠️ Critical Patterns to Remember

- **Always preserve source content** in `<pre>` for non-JS users and AI agents
- **Use data attributes** for element-level metadata, not separate blocks
- **Include location markers** when duplicating metadata (head vs. body)
- **Centralize configuration** - Don't hardcode language/client mappings
- **Test multiple page types** - Metadata features must work across different content
- **Use Hugo's built-in functions** before building custom solutions

---

**Last Updated**: 2026-01-08
**Purpose**: Help AI agents discover and understand Redis documentation architecture

