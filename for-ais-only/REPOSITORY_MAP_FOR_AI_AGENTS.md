# Redis Documentation Repository Map for AI Agents

## Directory Structure with AI Agent Guidance

```hierarchy {type="filesystem"}
"(root)":
    _meta:
        link: "../"
    "README.md":
        _meta:
            link: "../README.md"
            description: "General project info (not AI-focused)"
    "AI_AGENT_DEVELOPER_GUIDE.md":
        _meta:
            link: "../AI_AGENT_DEVELOPER_GUIDE.md"
            description: "⭐ START HERE (AI agents)"
    "for-ais-only":
        _meta:
            link: "./"
            description: "AI-FRIENDLY DOCUMENTATION"
        "BUILD_SYSTEM_ARCHITECTURE.md":
            _meta:
                link: "./BUILD_SYSTEM_ARCHITECTURE.md"
                description: "[RECOMMENDED] Build pipeline overview"
        "DEVELOPER_TASKS.md":
            _meta:
                link: "./DEVELOPER_TASKS.md"
                description: "[RECOMMENDED] Task decision tree"
        "REPOSITORY_MAP_FOR_AI_AGENTS.md":
            _meta:
                link: "./REPOSITORY_MAP_FOR_AI_AGENTS.md"
                description: "This file"
        "render_hook_docs":
            _meta:
                link: "./render_hook_docs/"
                description: "RENDER HOOKS (interactive components)"
            "README.md":
                _meta:
                    link: "./render_hook_docs/README.md"
                    description: "Overview of 3 render hooks"
            "AI_RENDER_HOOK_LESSONS.md":
                _meta:
                    link: "./render_hook_docs/AI_RENDER_HOOK_LESSONS.md"
                    description: "⭐ 12+ implementation lessons"
            "DECISION_TREE_FORMAT.md":
                _meta:
                    link: "./render_hook_docs/DECISION_TREE_FORMAT.md"
                    description: "YAML format specification"
            "HIERARCHY_FORMAT.md":
                _meta:
                    link: "./render_hook_docs/HIERARCHY_FORMAT.md"
                    description: "YAML format specification"
            "DECISION_TREE_IMPLEMENTATION_NOTES.md":
                _meta:
                    link: "./render_hook_docs/DECISION_TREE_IMPLEMENTATION_NOTES.md"
        "metadata_docs":
            _meta:
                link: "./metadata_docs/"
                description: "PAGE METADATA SYSTEM"
            "PAGE_METADATA_FORMAT.md":
                _meta:
                    link: "./metadata_docs/PAGE_METADATA_FORMAT.md"
                    description: "⭐ Complete metadata structure"
            "IMPLEMENTATION_NOTES.md":
                _meta:
                    link: "./metadata_docs/IMPLEMENTATION_NOTES.md"
                    description: "⭐ 10 key design lessons"
        "tcedocs":
            _meta:
                link: "./tcedocs/"
                description: "CODE EXAMPLES SYSTEM"
            "README.md":
                _meta:
                    link: "./tcedocs/README.md"
                    description: "User guide for code examples"
            "SPECIFICATION.md":
                _meta:
                    link: "./tcedocs/SPECIFICATION.md"
                    description: "1600-line technical spec"
    "content":
        _meta:
            link: "../content/"
            description: "DOCUMENTATION PAGES"
        "ai-agent-resources.md":
            _meta:
                link: "../content/ai-agent-resources.md"
                description: "AI-friendly resources index"
        "develop":
            _meta:
                link: "../content/develop/"
                description: "Development guides"
        "integrate":
            _meta:
                link: "../content/integrate/"
                description: "Integration guides"
        "operate":
            _meta:
                link: "../content/operate/"
                description: "Operations guides"
    "layouts":
        _meta:
            link: "../layouts/"
            description: "HUGO TEMPLATES"
        "partials":
            _meta:
                link: "../layouts/partials/"
                description: "Reusable components"
        "shortcodes":
            _meta:
                link: "../layouts/shortcodes/"
                description: "Markdown shortcodes"
        "_default":
            _meta:
                link: "../layouts/_default/"
                description: "Default page templates"
            "_markup":
                _meta:
                    link: "../layouts/_default/_markup/"
                    description: "Render hooks"
    "data":
        _meta:
            link: "../data/"
            description: "DATA FILES"
        "components":
            _meta:
                link: "../data/components/"
                description: "Language/client configurations"
        "examples.json":
            _meta:
                link: "../data/examples.json"
                description: "Generated code example metadata"
    "static":
        _meta:
            link: "../static/"
            description: "STATIC ASSETS"
        "js":
            _meta:
                link: "../static/js/"
                description: "JavaScript for interactive components"
        "schemas":
            _meta:
                link: "../static/schemas/"
                description: "JSON schemas for validation"
        "css":
            _meta:
                link: "../static/css/"
                description: "CSS files"
    "config.toml":
        _meta:
            link: "../config.toml"
            description: "⭐ Hugo configuration"
    "Makefile":
        _meta:
            link: "../Makefile"
            description: "Build commands"
    "package.json":
        _meta:
            link: "../package.json"
            description: "Node.js dependencies"
    "requirements.txt":
        _meta:
            link: "../requirements.txt"
            description: "Python dependencies"
    "public":
        _meta:
            description: "Generated HTML (gitignored)"
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

