# Developer Tasks - Decision Tree

This document uses a **decision tree format** to help developers and AI agents quickly find the right documentation for their task. The format is designed to be both human-readable and machine-parseable.

## Quick Navigation

```decision-tree {id="developer-tasks-tree"}
id: developer-tasks-tree
scope: developer-tasks
rootQuestion: whatAreYouDoing
questions:
    whatAreYouDoing:
        text: "What are you trying to do?"
        whyAsk: "Different tasks require different documentation and understanding of different systems"
        answers:
            addRenderHook:
                value: "Add a new render hook"
                nextQuestion: renderHookType
            addMetadata:
                value: "Add page metadata"
                nextQuestion: metadataScope
            addCodeExamples:
                value: "Add code examples"
                outcome:
                    label: "See: for-ais-only/tcedocs/README.md"
                    id: tcedocsGuide
            understandSystem:
                value: "Understand the system"
                nextQuestion: whatSystem
    
    renderHookType:
        text: "What type of render hook?"
        whyAsk: "Different render hooks have different patterns and complexity levels"
        answers:
            simple:
                value: "Simple (like checklist)"
                outcome:
                    label: "Start: for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md (Lessons 1-12)"
                    id: simpleRenderHook
            complex:
                value: "Complex (like hierarchy/decision-tree)"
                outcome:
                    label: "Start: for-ais-only/render_hook_docs/AI_RENDER_HOOK_LESSONS.md (Lessons 13-20)"
                    id: complexRenderHook
    
    metadataScope:
        text: "What scope of metadata?"
        whyAsk: "Metadata can be added at different layers with different implications"
        answers:
            pageLevel:
                value: "Page-level metadata"
                outcome:
                    label: "See: for-ais-only/metadata_docs/PAGE_METADATA_FORMAT.md"
                    id: pageMetadata
            perCodeblock:
                value: "Per-codeblock metadata"
                outcome:
                    label: "See: for-ais-only/metadata_docs/IMPLEMENTATION_NOTES.md (Lesson 3)"
                    id: codeblockMetadata
    
    whatSystem:
        text: "What system?"
        whyAsk: "Different systems have different architecture and documentation"
        answers:
            buildSystem:
                value: "Build system"
                outcome:
                    label: "See: for-ais-only/BUILD_SYSTEM_ARCHITECTURE.md"
                    id: buildArch
            metadata:
                value: "Metadata system"
                outcome:
                    label: "See: for-ais-only/metadata_docs/ARCHITECTURE.md"
                    id: metadataArch
            renderHooks:
                value: "Render hooks"
                outcome:
                    label: "See: for-ais-only/render_hook_docs/ARCHITECTURE.md"
                    id: renderHookArch
            codeExamples:
                value: "Code examples"
                outcome:
                    label: "See: for-ais-only/tcedocs/SPECIFICATION.md"
                    id: codeExampleArch
```

## Documentation Map

| Task | Primary Doc | Secondary Docs |
|------|-------------|-----------------|
| **Add render hook** | `render_hook_docs/AI_RENDER_HOOK_LESSONS.md` | `render_hook_docs/README.md`, `render_hook_docs/ARCHITECTURE.md` |
| **Add metadata** | `metadata_docs/PAGE_METADATA_FORMAT.md` | `metadata_docs/IMPLEMENTATION_NOTES.md`, `metadata_docs/ARCHITECTURE.md` |
| **Add code examples** | `tcedocs/README.md` | `tcedocs/SPECIFICATION.md` |
| **Understand build** | `BUILD_SYSTEM_ARCHITECTURE.md` | `Makefile`, `build/make.py` |

## See Also

- [AI_AGENT_DEVELOPER_GUIDE.md](../AI_AGENT_DEVELOPER_GUIDE.md) - Overview of all AI-friendly documentation
- [REPOSITORY_MAP_FOR_AI_AGENTS.md](./REPOSITORY_MAP_FOR_AI_AGENTS.md) - File-by-file repository guide
- [GLOSSARY.md](./GLOSSARY.md) - Terminology reference

