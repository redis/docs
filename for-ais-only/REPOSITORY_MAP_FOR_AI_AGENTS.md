# Redis Documentation Repository Map for AI Agents

## Directory Structure with AI Agent Guidance

```
docs/
│
├── 📖 README.md                           ← General project info (not AI-focused)
├── 📖 AI_AGENT_DEVELOPER_GUIDE.md         ← ⭐ START HERE (AI agents)
├── 📖 ANALYSIS_AI_AGENT_IMPROVEMENTS.md   ← Detailed analysis
├── 📖 RECOMMENDATIONS_SUMMARY.md          ← Executive summary
│
├── 🏗️ build/                              ← BUILD SYSTEM & META-DOCS
│   ├── 📖 BUILD_SYSTEM_ARCHITECTURE.md    ← [RECOMMENDED] Build pipeline overview
│   ├── 📖 DEVELOPER_TASKS.md              ← [RECOMMENDED] Task decision tree
│   ├── 📖 GLOSSARY.md                     ← [RECOMMENDED] Project terminology
│   │
│   ├── render_hook_docs/                  ← RENDER HOOKS (interactive components)
│   │   ├── 📖 README.md                   ← Overview of 3 render hooks
│   │   ├── 📖 AI_RENDER_HOOK_LESSONS.md   ← ⭐ 12+ implementation lessons
│   │   ├── 📖 ARCHITECTURE.md             ← [RECOMMENDED] High-level overview
│   │   ├── 📖 DECISION_TREE_FORMAT.md     ← YAML format specification
│   │   ├── 📖 HIERARCHY_FORMAT.md         ← YAML format specification
│   │   └── 📖 DECISION_TREE_IMPLEMENTATION_NOTES.md
│   │
│   ├── metadata_docs/                     ← PAGE METADATA SYSTEM
│   │   ├── 📖 PAGE_METADATA_FORMAT.md     ← ⭐ Complete metadata structure
│   │   ├── 📖 IMPLEMENTATION_NOTES.md     ← ⭐ 10 key design lessons
│   │   └── 📖 ARCHITECTURE.md             ← [RECOMMENDED] 4-layer overview
│   │
│   ├── tcedocs/                           ← CODE EXAMPLES SYSTEM
│   │   ├── 📖 README.md                   ← User guide for code examples
│   │   └── 📖 SPECIFICATION.md            ← 1600-line technical spec
│   │
│   ├── jupyterize/                        ← JUPYTER NOTEBOOK CONVERSION
│   │   ├── 📖 README.md                   ← Tool documentation
│   │   ├── 📖 SPECIFICATION.md            ← Technical details
│   │   └── 📖 QUICKSTART.md               ← Quick start guide
│   │
│   ├── components/                        ← CODE EXAMPLE PROCESSING
│   │   ├── component.py                   ← Main component processor
│   │   ├── example.py                     ← Example file parser
│   │   ├── markdown.py                    ← Markdown handling
│   │   └── *.py                           ← Utility modules
│   │
│   ├── make.py                            ← ⭐ Main build orchestrator
│   ├── local_examples.py                  ← Local example processor
│   └── *.py                               ← Other build utilities
│
├── 📝 content/                            ← DOCUMENTATION PAGES
│   ├── ai-agent-resources.md              ← AI-friendly resources index
│   ├── develop/                           ← Development guides
│   ├── integrate/                         ← Integration guides
│   └── operate/                           ← Operations guides
│
├── 🎨 layouts/                            ← HUGO TEMPLATES
│   ├── partials/                          ← Reusable components
│   │   ├── docs-nav.html                  ← Navigation sidebar
│   │   ├── toc-json-regex.html            ← TOC metadata generation
│   │   └── code-examples-json.html        ← Code examples metadata
│   ├── shortcodes/                        ← Markdown shortcodes
│   │   └── clients-example.html           ← Multi-language code examples
│   ├── _default/                          ← Default page templates
│   │   └── _markup/                       ← Render hooks
│   │       ├── render-codeblock-checklist.html
│   │       ├── render-codeblock-hierarchy.html
│   │       └── render-codeblock-decision-tree.html
│   └── *.html                             ← Page-specific templates
│
├── 📊 data/                               ← DATA FILES
│   ├── components/                        ← Language/client configurations
│   │   ├── index.json                     ← Component registry
│   │   ├── redis_py.json                  ← Python client config
│   │   ├── node_redis.json                ← Node.js client config
│   │   └── *.json                         ← Other client configs
│   └── examples.json                      ← Generated code example metadata
│
├── 🎯 static/                             ← STATIC ASSETS
│   ├── js/                                ← JavaScript for interactive components
│   │   ├── checklist.js                   ← Checklist functionality
│   │   ├── hierarchy.js                   ← Hierarchy rendering
│   │   ├── decision-tree.js               ← Decision tree rendering
│   │   └── *.js                           ← Other scripts
│   ├── schemas/                           ← JSON schemas for validation
│   │   └── page-metadata.json             ← Page metadata schema
│   └── css/                               ← CSS files
│
├── ⚙️ config.toml                         ← ⭐ Hugo configuration
│   │                                      ← Language/client mappings
│   │                                      ← Site parameters
│   └── clientsConfig section              ← Display name → ID mappings
│
├── 📋 Makefile                            ← Build commands
│   ├── make all                           ← Full build
│   ├── make serve                         ← Development server
│   └── make components                    ← Process code examples
│
├── 📦 package.json                        ← Node.js dependencies
├── 📦 requirements.txt                    ← Python dependencies
└── 📁 public/                             ← Generated HTML (gitignored)
```

## Navigation Guide for AI Agents

### 🎯 By Task

**"I want to understand the project"**
→ Start: `AI_AGENT_DEVELOPER_GUIDE.md`
→ Then: `ANALYSIS_AI_AGENT_IMPROVEMENTS.md`

**"I want to add a render hook"**
→ Start: `for-ais-only/render_hook_docs/README.md`
→ Then: `for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md`
→ Reference: `layouts/_default/_markup/render-codeblock-*.html`

**"I want to add page metadata"**
→ Start: `for-ais-only/metadata_docs/PAGE_METADATA_FORMAT.md`
→ Then: `for-ais-only/metadata_docs/IMPLEMENTATION_NOTES.md`
→ Reference: `layouts/partials/toc-json-regex.html`

**"I want to add code examples"**
→ Start: `for-ais-only/tcedocs/README.md`
→ Then: `for-ais-only/tcedocs/SPECIFICATION.md`
→ Reference: `build/components/example.py`

**"I want to understand the build system"**
→ Start: `Makefile`
→ Then: `build/make.py`
→ Reference: `build/BUILD_SYSTEM_ARCHITECTURE.md` [RECOMMENDED]

### 🔍 By Concept

**Progressive Enhancement**
→ `for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md` (Lesson 1)

**Page Store Pattern**
→ `for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md` (Lesson 2)

**Metadata Architecture**
→ `build/metadata_docs/IMPLEMENTATION_NOTES.md` (Complete Metadata Architecture)

**Configuration Centralization**
→ `build/metadata_docs/IMPLEMENTATION_NOTES.md` (Lesson 6)
→ `config.toml` (clientsConfig section)

**Security Best Practices**
→ `build/render_hook_docs/AI_RENDER_HOOK_LESSONS.md` (Lesson 4)

---

**Legend**:
- ⭐ = Critical for AI agents
- 📖 = Documentation file
- 🏗️ = Build system
- 📝 = Content
- 🎨 = Templates
- 📊 = Data
- 🎯 = Static assets
- ⚙️ = Configuration
- 📋 = Build commands
- 📦 = Dependencies
- 📁 = Generated output

**Last Updated**: 2026-01-08

