# Redis Documentation Repository Map for AI Agents

## Directory Structure with AI Agent Guidance

```
docs/
│
├── 📖 [README.md](../README.md)                           ← General project info (not AI-focused)
├── 📖 [AI_AGENT_DEVELOPER_GUIDE.md](../AI_AGENT_DEVELOPER_GUIDE.md)         ← ⭐ START HERE (AI agents)
│
├── 🏗️ [for-ais-only/](../)                              ← AI-FRIENDLY DOCUMENTATION
│   ├── 📖 [BUILD_SYSTEM_ARCHITECTURE.md](./BUILD_SYSTEM_ARCHITECTURE.md)    ← [RECOMMENDED] Build pipeline overview
│   ├── 📖 [DEVELOPER_TASKS.md](./DEVELOPER_TASKS.md)              ← [RECOMMENDED] Task decision tree
│   ├── 📖 [REPOSITORY_MAP_FOR_AI_AGENTS.md](./REPOSITORY_MAP_FOR_AI_AGENTS.md)  ← This file
│   │
│   ├── [render_hook_docs/](./render_hook_docs/)                  ← RENDER HOOKS (interactive components)
│   │   ├── 📖 [README.md](./render_hook_docs/README.md)                   ← Overview of 3 render hooks
│   │   ├── 📖 [AI_RENDER_HOOK_LESSONS.md](./render_hook_docs/AI_RENDER_HOOK_LESSONS.md)   ← ⭐ 12+ implementation lessons
│   │   ├── 📖 [DECISION_TREE_FORMAT.md](./render_hook_docs/DECISION_TREE_FORMAT.md)     ← YAML format specification
│   │   ├── 📖 [HIERARCHY_FORMAT.md](./render_hook_docs/HIERARCHY_FORMAT.md)         ← YAML format specification
│   │   └── 📖 [DECISION_TREE_IMPLEMENTATION_NOTES.md](./render_hook_docs/DECISION_TREE_IMPLEMENTATION_NOTES.md)
│   │
│   ├── [metadata_docs/](./metadata_docs/)                     ← PAGE METADATA SYSTEM
│   │   ├── 📖 [PAGE_METADATA_FORMAT.md](./metadata_docs/PAGE_METADATA_FORMAT.md)     ← ⭐ Complete metadata structure
│   │   └── 📖 [IMPLEMENTATION_NOTES.md](./metadata_docs/IMPLEMENTATION_NOTES.md)     ← ⭐ 10 key design lessons
│   │
│   └── [tcedocs/](./tcedocs/)                           ← CODE EXAMPLES SYSTEM
│       ├── 📖 [README.md](./tcedocs/README.md)                   ← User guide for code examples
│       └── 📖 [SPECIFICATION.md](./tcedocs/SPECIFICATION.md)            ← 1600-line technical spec
│
├── 📝 [content/](../content/)                            ← DOCUMENTATION PAGES
│   ├── [ai-agent-resources.md](../content/ai-agent-resources.md)              ← AI-friendly resources index
│   ├── [develop/](../content/develop/)                           ← Development guides
│   ├── [integrate/](../content/integrate/)                         ← Integration guides
│   └── [operate/](../content/operate/)                           ← Operations guides
│
├── 🎨 [layouts/](../layouts/)                            ← HUGO TEMPLATES
│   ├── [partials/](../layouts/partials/)                          ← Reusable components
│   │   ├── docs-nav.html                  ← Navigation sidebar
│   │   ├── toc-json-regex.html            ← TOC metadata generation
│   │   └── code-examples-json.html        ← Code examples metadata
│   ├── [shortcodes/](../layouts/shortcodes/)                        ← Markdown shortcodes
│   │   └── clients-example.html           ← Multi-language code examples
│   ├── [_default/](../layouts/_default/)                          ← Default page templates
│   │   └── [_markup/](../layouts/_default/_markup/)                       ← Render hooks
│   │       ├── render-codeblock-checklist.html
│   │       ├── render-codeblock-hierarchy.html
│   │       └── render-codeblock-decision-tree.html
│   └── *.html                             ← Page-specific templates
│
├── 📊 [data/](../data/)                               ← DATA FILES
│   ├── [components/](../data/components/)                        ← Language/client configurations
│   │   ├── index.json                     ← Component registry
│   │   ├── redis_py.json                  ← Python client config
│   │   ├── node_redis.json                ← Node.js client config
│   │   └── *.json                         ← Other client configs
│   └── examples.json                      ← Generated code example metadata
│
├── 🎯 [static/](../static/)                             ← STATIC ASSETS
│   ├── [js/](../static/js/)                                ← JavaScript for interactive components
│   │   ├── checklist.js                   ← Checklist functionality
│   │   ├── hierarchy.js                   ← Hierarchy rendering
│   │   ├── decision-tree.js               ← Decision tree rendering
│   │   └── *.js                           ← Other scripts
│   ├── [schemas/](../static/schemas/)                           ← JSON schemas for validation
│   │   └── page-metadata.json             ← Page metadata schema
│   └── css/                               ← CSS files
│
├── ⚙️ [config.toml](../config.toml)                         ← ⭐ Hugo configuration
│   │                                      ← Language/client mappings
│   │                                      ← Site parameters
│   └── clientsConfig section              ← Display name → ID mappings
│
├── 📋 [Makefile](../Makefile)                            ← Build commands
│   ├── make all                           ← Full build
│   ├── make serve                         ← Development server
│   └── make components                    ← Process code examples
│
├── 📦 [package.json](../package.json)                        ← Node.js dependencies
├── 📦 [requirements.txt](../requirements.txt)                    ← Python dependencies
└── 📁 public/                             ← Generated HTML (gitignored)
```

## Navigation Guide for AI Agents

### 🎯 By Task

**"I want to understand the project"**
→ Start: [AI_AGENT_DEVELOPER_GUIDE.md](../AI_AGENT_DEVELOPER_GUIDE.md)

**"I want to add a render hook"**
→ Start: [for-ais-only/render_hook_docs/README.md](./render_hook_docs/README.md)
→ Then: [for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md](./render_hook_docs/AI_RENDER_HOOK_LESSONS.md)
→ Reference: [layouts/_default/_markup/render-codeblock-*.html](../layouts/_default/_markup/)

**"I want to add page metadata"**
→ Start: [for-ais-only/metadata_docs/PAGE_METADATA_FORMAT.md](./metadata_docs/PAGE_METADATA_FORMAT.md)
→ Then: [for-ais-only/metadata_docs/IMPLEMENTATION_NOTES.md](./metadata_docs/IMPLEMENTATION_NOTES.md)
→ Reference: [layouts/partials/toc-json-regex.html](../layouts/partials/toc-json-regex.html)

**"I want to add code examples"**
→ Start: [for-ais-only/tcedocs/README.md](./tcedocs/README.md)
→ Then: [for-ais-only/tcedocs/SPECIFICATION.md](./tcedocs/SPECIFICATION.md)
→ Reference: [build/components/example.py](../build/components/example.py)

**"I want to understand the build system"**
→ Start: [Makefile](../Makefile)
→ Then: [build/make.py](../build/make.py)
→ Reference: [for-ais-only/BUILD_SYSTEM_ARCHITECTURE.md](./BUILD_SYSTEM_ARCHITECTURE.md) [RECOMMENDED]

### 🔍 By Concept

**Progressive Enhancement**
→ [for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md](./render_hook_docs/AI_RENDER_HOOK_LESSONS.md) (Lesson 1)

**Page Store Pattern**
→ [for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md](./render_hook_docs/AI_RENDER_HOOK_LESSONS.md) (Lesson 2)

**Metadata Architecture**
→ [for-ais-only/metadata_docs/IMPLEMENTATION_NOTES.md](./metadata_docs/IMPLEMENTATION_NOTES.md) (Complete Metadata Architecture)

**Configuration Centralization**
→ [for-ais-only/metadata_docs/IMPLEMENTATION_NOTES.md](./metadata_docs/IMPLEMENTATION_NOTES.md) (Lesson 6)
→ [config.toml](../config.toml) (clientsConfig section)

**Security Best Practices**
→ [for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md](./render_hook_docs/AI_RENDER_HOOK_LESSONS.md) (Lesson 4)

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

