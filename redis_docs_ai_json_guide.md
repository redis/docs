# Redis Docs AI Feed: JSON & NDJSON Structure Guide

## Overview

This document defines the recommended structure for:

-   Per-page JSON files (`<slug>.json`)
-   The global NDJSON feed (`docs.ndjson`)

These formats are designed to support:

-   RAG systems
-   AI agents
-   semantic search
-   code generation

------------------------------------------------------------------------

# 1. Per-page JSON (`<slug>.json`)

Each file should be a **complete, self-contained representation of a
single documentation page**.

It should contain everything needed for:

-   retrieval
-   chunking
-   reasoning
-   code understanding

------------------------------------------------------------------------

## Recommended structure

``` json
{
  "id": "strings-set-get",
  "title": "SET",
  "url": "https://redis.io/docs/latest/develop/data-types/strings/",
  "summary": "Set and retrieve string values using SET and GET (overwrites existing values).",

  "sections": [
    {
      "id": "overview",
      "title": "Overview",
      "role": "overview",
      "text": "SET stores a string value at a key..."
    },
    {
      "id": "syntax",
      "title": "Syntax",
      "role": "syntax",
      "text": "SET key value [EX seconds] [NX|XX]"
    }
  ],

  "examples": [
    {
      "id": "set_get",
      "description": "Store a value and retrieve it.",
      "code": "> SET bike:1 Deimos\nOK\n\n> GET bike:1\n\"Deimos\""
    }
  ],

  "related": [
    {
      "title": "GET",
      "url": "https://redis.io/docs/latest/commands/get/",
      "note": "Retrieve the value of a key"
    }
  ],

  "tags": ["command", "string"],
  "last_updated": "2026-03-01T00:00:00Z"
}
```

------------------------------------------------------------------------

## Key fields explained

### `summary`

-   1--2 sentence description
-   **Most important field for retrieval ranking**

------------------------------------------------------------------------

### `sections[]`

-   Derived from `tableOfContents`
-   Each section should:
    -   be self-contained
    -   ideally 200--500 words

Optional `role` values: - overview - syntax - example - notes

------------------------------------------------------------------------

### `examples[]`

Critical for AI performance.

Each example must include:

-   description
-   full input/output transcript

Preferred format:

    > COMMAND
    OUTPUT

------------------------------------------------------------------------

### `related[]`

Creates a **knowledge graph** between pages.

Useful for: - agent navigation - multi-step reasoning

------------------------------------------------------------------------

### Keep content clean

Exclude: - navigation - UI labels - styling artifacts

------------------------------------------------------------------------

# 2. Global feed (`docs.ndjson`)

## Definition

`docs.ndjson` contains **one JSON object per line**, where each line is
a complete page.

------------------------------------------------------------------------

## Example

``` ndjson
{"id":"strings-set-get", ...}
{"id":"strings-get", ...}
{"id":"strings-mget", ...}
```

------------------------------------------------------------------------

## Relationship to per-page JSON

`docs.ndjson` is simply:

> The concatenation of all `<slug>.json` objects

No transformation required.

------------------------------------------------------------------------

## Why NDJSON is preferred

### Streaming-friendly

-   Process line-by-line
-   No need to load full dataset

------------------------------------------------------------------------

### Incremental updates

-   Append or update individual pages easily

------------------------------------------------------------------------

### Widely supported

Used by: - OpenAI datasets - Elasticsearch - BigQuery - vector databases

------------------------------------------------------------------------

# 3. Optional: `docs.json`

You may also provide:

``` json
[
  {...},
  {...}
]
```

However:

-   less efficient for large datasets
-   harder to stream

Use only for convenience.

------------------------------------------------------------------------

# 4. Suggested endpoint layout

    /docs.ndjson         ← primary AI feed
    /docs/{slug}.json    ← per-page JSON
    /docs.json           ← optional array format

------------------------------------------------------------------------

# 5. Optional enhancement

Add a flattened content field:

``` json
"content": "full plain-text content of the page"
```

Useful for simpler ingestion pipelines.

------------------------------------------------------------------------

# 6. Mental model

    Markdown (authoring)
            ↓
    Structured JSON (source of truth)
            ↓
    HTML (presentation)
            ↓
    NDJSON (AI distribution)

------------------------------------------------------------------------

# Final takeaway

-   `<slug>.json` = full structured page
-   `docs.ndjson` = one page per line
-   NDJSON is the primary format for AI systems

Design documentation as a **collection of structured knowledge units**,
not just web pages.
