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

Both files contain one record per documentation page, currently more than 2,600.

### Per-page JSON

Each documentation page has a corresponding JSON file at the same URL with `/index.json` appended. For example:

- Page: `https://redis.io/docs/latest/commands/set/`
- JSON: `https://redis.io/docs/latest/commands/set/index.json`

### What the feeds cover

The feeds contain one record for every documentation page. They deliberately do **not**
contain the taxonomy pages that appear in
[sitemap.xml](https://redis.io/docs/latest/sitemap.xml), so a straight comparison of the two
shows the sitemap with more URLs.

The excluded pages are:

- the `categories/` listing and each `categories/<name>` page
- the `tags/` listing and each `tags/<name>` page
- the documentation home page

These are generated index pages that list other pages. They carry no documentation prose of
their own, so a record for them would add navigation noise without adding content. The
exclusion is a consequence of how the output formats are configured rather than a filter
applied afterwards: JSON and Markdown are produced for Hugo's `section` and `page` kinds
only, and taxonomy, term and home pages are none of those.

Two consequences worth knowing if you diff the feed against the sitemap:

- Pages excluded from Hugo's page lists with `_build.list: never` are **absent from the
  sitemap but present in the feeds**, because they are still built and rendered. They are
  real documentation pages, usually reference material reached by direct link rather than by
  browsing.
- Both figures move. The feed is rebuilt at least daily and the corpus grows, so treat any
  page count as a snapshot.

### JSON schema

Each document contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, the page's path without a file extension (for example `develop/clients/redis-py`) |
| `title` | string | Page title |
| `url` | string | Canonical URL |
| `summary` | string | Short description |
| `page_type` | string | `"content"` (has prose) or `"index"` (navigation only) |
| `content_hash` | string | SHA256 hash for cache invalidation (content pages only) |
| `sections` | array | Content split by headings with semantic roles |
| `examples` | array | Code blocks extracted from content |
| `children` | array | Child pages (index pages only) |

Each **section** contains:
- `id`: Slugified heading, matching the heading's anchor on the rendered page, so
  `<url>#<section id>` links to that section
- `title`: Original heading text
- `role`: Semantic role, assigned from the heading text. See
  [Section roles](#section-roles) for the current values.
- `text`: Section content (code blocks replaced with `[code example]` placeholder)

Each **example** contains:
- `id`: Unique identifier (`{section_id}-ex{index}`)
- `language`: Language from code fence (`python`, `go`, `plaintext`, etc.)
- `code`: The code content
- `section_id`: Which section this example came from

### Section roles

Each section carries a `role`, derived from its heading text. These are the values currently
in use:

| Role | Assigned when the heading begins with |
|------|----------------------------------------|
| `overview` | `overview`, `introduction`, `about`, `description` |
| `syntax` | `syntax`, `usage`, `command`, `signature` |
| `example` | `example`, `demo`, `sample`, `code example` |
| `parameters` | `option`, `parameter`, `argument`, `flag` |
| `returns` | `return`, `response`, `output`, `result` |
| `errors` | `error`, `exception`, `troubleshoot` |
| `performance` | `performance`, `complexity`, `benchmark` |
| `limits` | `limit`, `constraint`, `restriction` |
| `related` | `see also`, `related`, `learn more`, `reference` |
| `setup` | `install`, `setup`, `getting started`, `quickstart` |
| `configuration` | `configur`, `setting` |
| `security` | `security`, `auth`, `permission`, `acl` |
| `history` | `history`, `changelog`, `version history` |
| `compatibility` | `compatib`, `support`, `version` |
| `content` | none of the above |

The table is in priority order and the first match wins, which matters where the patterns
overlap: a heading of "Version history" is `history` rather than `compatibility`, because
`history` is tested first.

A page's introductory text, before its first heading, is also given the `overview` role.

{{< note >}}This vocabulary is descriptive, not a contract. It reflects the values produced
today and may gain entries, or change how a heading maps to a role, without notice. If you
filter or rank on `role`, treat an unrecognized value as `content` rather than discarding the
section, and do not assume a value you rely on will keep its current name.{{< /note >}}

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

The [redis/agent-skills](https://github.com/redis/agent-skills) repository provides reusable skills and tools for AI agents working with Redis. 

## Error handling

See [Error handling]({{< relref "/develop/clients/error-handling" >}}) for a guide to handling errors in client libraries.
