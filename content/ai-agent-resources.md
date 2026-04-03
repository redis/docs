---
title: AI Agent Resources
description: Learn how to develop with Redis as an AI agent
linkTitle: AI Agent Resources
---

## `llms.txt` index of documentation

Redis provides a comprehensive index of all documentation in Markdown format at [llms.txt](https://redis.io/llms.txt). This index is specifically designed for AI agents to discover available documentation.

## Markdown documentation format

All documentation pages are available in Markdown format via the same URL as
the main doc page but with `index.html.md` added. For example, the Markdown version of
this page is available at
[ai-agent-resources/index.html.md](https://redis.io/docs/latest/ai-agent-resources/index.html.md).

## JSON documentation feeds

Redis documentation is available in structured JSON format optimized for RAG (Retrieval-Augmented Generation) systems.

### NDJSON feed (all pages)

A single file containing all documentation pages in [NDJSON](https://github.com/ndjson/ndjson-spec) format (one JSON object per line):

| Format | URL | Size |
|--------|-----|------|
| NDJSON | [docs.ndjson](https://redis.io/docs/latest/docs.ndjson) | ~30 MB |
| Gzipped | [docs.ndjson.gz](https://redis.io/docs/latest/docs.ndjson.gz) | ~5 MB |

Both files contain ~4,100 documents.

### Per-page JSON

Each documentation page has a corresponding JSON file at the same URL with `/index.json` appended. For example:

- Page: `https://redis.io/docs/latest/commands/set/`
- JSON: `https://redis.io/docs/latest/commands/set/index.json`

### JSON schema

Each document contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | URL slug identifier |
| `title` | string | Page title |
| `url` | string | Canonical URL |
| `summary` | string | Short description |
| `page_type` | string | `"content"` (has prose) or `"index"` (navigation only) |
| `content_hash` | string | SHA256 hash for cache invalidation (content pages only) |
| `sections` | array | Content split by headings with semantic roles |
| `examples` | array | Code blocks extracted from content |
| `children` | array | Child pages (index pages only) |

Each **section** contains:
- `id`: Slugified heading
- `title`: Original heading text
- `role`: Semantic role (`overview`, `syntax`, `example`, `parameters`, `returns`, etc.)
- `text`: Section content (code blocks replaced with `[code example]` placeholder)

Each **example** contains:
- `id`: Unique identifier (`{section_id}-ex{index}`)
- `language`: Language from code fence (`python`, `go`, `plaintext`, etc.)
- `code`: The code content
- `section_id`: Which section this example came from

### Verifying content_hash

The `content_hash` can be verified by computing:

```python
import hashlib

def verify_hash(page):
    parts = [page.get('summary', '')]
    for section in page.get('sections', []):
        parts.append(section['text'])
    for example in page.get('examples', []):
        parts.append(example['code'])

    content = '\n'.join(parts)
    return hashlib.sha256(content.encode('utf-8')).hexdigest() == page.get('content_hash')
```

## API references

API references are available for the following client libraries:

- [redis-py](https://redis.readthedocs.io/en/stable/commands.html)
- [jedis](https://javadoc.io/doc/redis.clients/jedis/latest/index.html)
- [lettuce](https://lettuce.io/core/release/reference/index.html)
- [go-redis](https://pkg.go.dev/github.com/redis/go-redis/v9)
- [redis-rs](https://docs.rs/redis/latest/redis/)


## Data type comparisons

See [Compare data types]({{< relref "/develop/data-types/compare-data-types" >}}) for advice
on which of the general-purpose data types is best for common tasks.

## Redis patterns for coding agents

Salvatore Sanfilippo (also known as *antirez*, the creator of Redis) has provided the Redis community with a resource containing very useful Redis-oriented design patterns. See [this page](https://redis.antirez.com/) for more information.

## Agent skills repository

The [redis/agent-skills](https://github.com/redis/agent-skills) repository provides reusable skills and tools for AI agents working with Redis. This repository contains:

- Pre-built MCP (Model Context Protocol) tools for Redis operations
- Common agent workflows and patterns as executable code
- Integration examples for popular agent frameworks
- Ready-to-use skills that agents can invoke directly

These skills enable AI coding assistants to interact with Redis more effectively by providing structured, tested implementations of common operations.

## Error handling

See [Error handling]({{< relref "/develop/clients/error-handling" >}}) for a guide to handling errors in client libraries.
