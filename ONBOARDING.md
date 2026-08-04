# Docs contributor guide — Claude Code

This guide is for engineers adding or updating documentation in this repo. It covers the workflow, product map, and ready-to-use prompts for common tasks.

---

## How the repo is organized

Every product has its own directory under `content/`:

| Product | Directory | Covers |
|---|---|---|
| **Redis Cloud** | `content/operate/rc/` | Managed cloud service — databases, subscriptions, billing, security |
| **Redis Software** | `content/operate/rs/` | Self-managed enterprise Redis — clusters, databases, CLI tools |
| **Redis Data Integration (RDI)** | `content/operate/rdi/` | Data pipelines and CDC connectors |
| **Kubernetes** | `content/operate/kubernetes/` | Redis on Kubernetes / Redis Enterprise operator |
| **Open Source / Stack** | `content/operate/oss_and_stack/` | Redis Open Source and Redis Stack modules |
| **Developer docs** | `content/develop/` | Client libraries, data types, AI, tools, use cases |
| **AI / Context Engine** | `content/develop/ai/` | Agent memory, context retrieval, semantic caching, agent builder |
| **Redis Iris (Context Engine)** | `content/develop/ai/context-engine/` | Managed AI services — agent memory, LangCache, context retriever, data integration |
| **Redis Iris (self-hosted)** | `content/operate/iris/` | Self-hosted Agent Memory and Context Retriever on your own infrastructure |
| **Redis Feature Form** | `content/develop/ai/featureform/` | ML feature engineering on Redis (preview) |
| **Redis Feature Form (operate)** | `content/operate/featureform/` | Deploy and configure Feature Form — quickstart, providers, authentication |
| **Redis Search** | `content/develop/ai/search-and-query/` | Full-text search, vector search, indexing, and query reference |
| **RedisVL** | `content/develop/ai/redisvl/` and `content/integrate/redisvl/` | Python vector library — versioned docs (source lives in a separate repo, see below) |
| **Redis Insight** | `content/develop/tools/insight/` | Desktop/browser GUI client — key browser, CLI, streams, search workspace, RDI connector |
| **Redis for VS Code** | `content/develop/tools/redis-for-vscode/` | VS Code extension for Redis |
| **Command reference** | `content/commands/` | One page per Redis command — syntax, options, return values, examples |
| **Integrations** | `content/integrate/` | Third-party library and tool integrations (see below) |

If your change spans multiple products (for example, a CLI that works with both Cloud and Software), update the relevant file in each product's directory.

---

## Workflow

Every change follows the same four steps:

1. **Analyze** — figure out what to document and where it lives
2. **Write** — make the changes on a feature branch
3. **Submit** — commit, push, and open a PR for review
4. **Review** — address reviewer comments until the PR is approved and merged

**Note:** pushing a branch and opening a PR submits your changes for review — it does not publish them. Content is only published when the PR is merged into `main`.

The prompts below are organized by step.

---

## Step 1 — Analyze: figure out what needs to change and where

Use these prompts before writing anything. Paste in your ticket, spec, or release notes and Claude will map it to the right files.

### Prompt: Map a ticket to affected docs

```
I have a new feature to document. Here's the ticket / spec:

[paste your ticket, release notes, or feature description here]

Please:
1. Identify which product(s) this affects (Redis Cloud, Redis Software, RDI, OSS, Kubernetes, developer docs)
2. Find the existing page(s) in the repo that are most relevant
3. Tell me whether this needs a new page or an update to an existing one
4. Summarize what changes are needed and where
```

### Prompt: Find the right page for a specific topic

```
I need to document [topic]. It's related to [product — e.g. Redis Cloud / Redis Software / RDI].

Find the existing page in this repo that's the best fit for this content. If there's no good fit, suggest where a new page should go.
```

### Prompt: Understand a page before editing it

```
Before I make changes, help me understand the page at [file path or URL].

What is this page for? What's its structure? What conventions does it use (shortcodes, tables, callouts)?
```

---

## Step 2 — Write: make the changes

### Prompt: Create a branch and make edits

Always start from `main`:

```
Go to main and create a new branch called [branch-name].

I need to [describe what you're adding/changing] on the [page name] page at [file path or URL].

Here's the information to document:
[paste your ticket details, feature description, or spec]
```

**Branch naming convention:** use the ticket number when you have one (`DOC-1234`), otherwise use a short descriptive name (`redis-hashing-smooth-scaling`).

### Prompt: Add a new section to an existing page

```
On branch [branch-name], add a new section to [file path] covering [topic].

Here's the content to include:
[paste the information — feature behavior, prerequisites, examples, limitations, etc.]

Follow the existing style and formatting on the page.
```

### Prompt: Create a new page

```
Create a new documentation page for [topic] under [content/operate/rc/ or other product directory].

The page should cover:
- [main concept or feature]
- [prerequisites or requirements]
- [steps or configuration]
- [limitations or caveats]

Here's the source material:
[paste ticket / spec / release notes]
```

### Prompt: Add a product to an index or navigation page

```
Add [feature or tool name] to the index page at [file path].

It should appear under the [section name] section. Here's a one-line description:
[description]

Link to [target page or URL].
```

---

## Step 3 — Submit: commit, push, and open a PR

Before pushing, preview your changes locally to verify formatting and that the page renders correctly.

From the root of the repo, run:

```
make serve
```

Then open [http://localhost:1313](http://localhost:1313) in your browser and navigate to the page you changed. Check that headings, code blocks, tables, and callouts look right. Stop the server with `Ctrl+C` when you're done.

Once you're happy with how it looks, say:

```
Commit and push this branch.
```

Claude will write a descriptive commit message and push to origin. Then open a PR from the branch on GitHub for review.

Your changes are not live until a reviewer approves the PR and it is merged into `main`.

---

## Step 4 — Review: handle PR comments

When a reviewer leaves comments on your PR, run:

```
/docs:assess-comments
```

This reads every comment on the PR (human reviewers, Cursor Bugbot, CI) and produces a reconciliation report: what each comment raises, which ones agree, which ones contradict, and what action to take on each.

If the only open comments are from Cursor Bugbot and they look safe, you can also run:

```
/docs:bugbot
```

This will address Bugbot's findings directly.

After you've applied fixes, commit and push again. Re-run `/docs:assess-comments` after the next round of bot/reviewer comments.

---

## Client library guides

**Location:** `content/develop/clients/`

The client library guides cover how to connect to and use Redis from each supported language. Each library has its own subfolder:

| Library | Directory | Language |
|---|---|---|
| redis-py | `clients/redis-py/` | Python |
| node-redis | `clients/nodejs/` | JavaScript (Node.js) |
| ioredis | `clients/ioredis/` | JavaScript (Node.js) |
| Jedis | `clients/jedis/` | Java |
| Lettuce | `clients/lettuce/` | Java |
| go-redis | `clients/go/` | Go |
| NRedisStack / StackExchange | `clients/dotnet/` | C# / .NET |
| Predis | `clients/php/` | PHP |
| redis-rs | `clients/rust/` | Rust |

Each guide typically covers: connecting to the server, error handling, connection pooling, failover, observability, and any library-specific features (for example, JSON support or vector search).

### Updating a client guide

```
On branch [branch-name], update content/develop/clients/[library]/[page].md to document [feature or change].

Here's what changed:
[paste the relevant details]
```

### Adding a new page to a client guide

```
On branch [branch-name], add a new page to content/develop/clients/[library]/ covering [topic].

Use an existing page in that guide as a template for frontmatter and structure. Here's the content:
[paste details]
```

---

## Code examples

Code examples on the docs site are multi-language, tabbed snippets showing the same operation in every supported client library. They appear in data type tutorials, command pages, and client guides using the `{{< clients-example >}}` shortcode.

### Where examples live

Examples live in **two places**:

1. **External client library repos** — the primary home. Each library's repo has a `doctests/` (or similar) folder where the real example source files live. The build pulls these files at build time:

| Language | Repo | Path |
|---|---|---|
| Python | [redis/redis-py](https://github.com/redis/redis-py) | `doctests/` |
| Node.js | [redis/node-redis](https://github.com/redis/node-redis) | `doctests/` |
| Java (Jedis) | [redis/jedis](https://github.com/redis/jedis) | `src/test/java/io/redis/examples/` |
| Java (Lettuce) | [redis/lettuce](https://github.com/redis/lettuce) | `src/test/java/io/redis/examples/sync|async|reactive/` |
| Go | [redis/go-redis](https://github.com/redis/go-redis) | `doctests/` |
| C# | [redis/NRedisStack](https://github.com/redis/NRedisStack) | `tests/Doc/` |
| C | [redis/hiredis](https://github.com/redis/hiredis) | `examples/` |
| RedisVL | [redis/redis-vl-python](https://github.com/redis/redis-vl-python) | `doctests/` |
| PHP | local_examples (temporary) | — |

2. **`local_examples/` in this repo** — a temporary holding area while a PR to the client library is in review. Place files here if you need examples on the docs site immediately and can't wait for the client library PR to merge. Once the upstream PR merges, remove the local copy.

**Do not edit files in `examples/`** (the auto-generated output directory). That folder is populated at build time and changes there are overwritten.

### How the shortcode works

Use `{{</* clients-example */>}}` to embed a multi-language example in any doc page:

```
{{< clients-example set="hash_tutorial" step="hmget" description="Retrieve multiple hash fields with HMGET to reduce round trips" difficulty="intermediate" buildsUpon="set_get_all" >}}
> HGET bike:1 model
"Deimos"
{{</* /clients-example */>}}
```

Key parameters:

| Parameter | Required | What it does |
|---|---|---|
| `set` | Yes | The example group (maps to a folder in `examples/`, e.g., `hash_tutorial`) |
| `step` | Yes | The specific named step within that set |
| `description` | Recommended | Shown in the UI — describe what the example demonstrates and when to use it |
| `difficulty` | Optional | `beginner` (default), `intermediate`, or `advanced` |
| `buildsUpon` | When needed | Comma-separated step IDs this example depends on (see below) |
| `lang_filter` | Optional | Show only specific language tabs, e.g., `"Python,Node.js"` — must match exact names from `config.toml` |
| `max_lines` | Optional | Cap the number of visible lines |

The body of the shortcode is the Redis CLI output shown in the CLI tab. The other language tabs are populated automatically from the source files.

### `buildsUpon` — interactive dependencies

Examples on the docs site can be run interactively in the browser. When a reader runs a sequence of examples on the same page, **later examples depend on earlier ones having run first** — for example, an `HMGET` example depends on `HSET` having run to create the hash first.

The `buildsUpon` parameter declares those dependencies:

```
{{</* clients-example set="hash_tutorial" step="hmget" buildsUpon="set_get_all" */>}}
```

**Always set `buildsUpon` when your example relies on data or state that a previous example creates.** Without it, an interactive user who runs your example first will hit errors because the required data isn't there.

Multiple dependencies:

```
{{</* clients-example set="list_tutorial" step="advanced_ops" buildsUpon="lpush_rpush, lpop_rpop" */>}}
```

### Markers in example source files

Source files in the client repos (and in `local_examples/`) use special comments that the build interprets:

| Marker | What it does |
|---|---|
| `EXAMPLE: id` | Identifies the file — `id` becomes the `set` name |
| `STEP_START name` / `STEP_END` | Marks a named step — `name` becomes the `step` param |
| `REMOVE_START` / `REMOVE_END` | Strips this block from the rendered output (used for test imports, assertions, etc.) |
| `HIDE_START` / `HIDE_END` | Hides this block by default — visible if the reader clicks "unhide" |

### Writing descriptions

Good descriptions follow this pattern: **[Category]: [what it does] [when/why to use it]**

- `"Foundational: Set and retrieve hash fields using HSET and HGET"`
- `"Query by score range: Retrieve members within a score range using ZRANGEBYSCORE when you need to filter by numeric values"`
- `"Practical pattern: Use ZADD to set scores and ZINCRBY to increment them for leaderboards with atomic operations"`

Include specific command names, and add a "when/why" clause so readers understand the decision context, not just the syntax.

### Adding a new example

If the example already exists in the client repos (there's already a `STEP_START` block in each library's source), reference it directly:

```
On branch [branch-name], add a clients-example shortcode to [file path] showing [operation].
The set name is [set] and the step is [step].
```

If the example doesn't exist in the client repos yet, add it to `local_examples/` in this repo as a temporary measure, then open PRs to each client library to add it there permanently.

---

## Redis command reference pages

Command reference pages live under `content/commands/` — one file per command (for example, `content/commands/set.md`). There are ~560 of them.

### Updating an existing command page

For changes to an existing command — new options, changed behavior, deprecations — edit the file directly:

```
On branch [branch-name], update content/commands/set.md to document the new EX option. Here are the details:
[paste the relevant PR or spec content]
```

### Adding a new command page

For new commands, use the skill instead of editing by hand. It reads the upstream source and drafts the full page for you:

```
/docs:new-command-page SET https://github.com/redis/redis/pull/1234 https://redislabs.atlassian.net/browse/DOC-1234
```

Pass the command name(s) and a link to the GitHub PR in `redis/redis`. A Jira ticket URL is optional but helps. You can pass multiple commands at once:

```
/docs:new-command-page LMPOP ZMPOP https://github.com/redis/redis/pull/1234
```

The skill reads the PR and command definition, shows you a plan, and waits for your approval before writing anything.

---

## Release notes

Each product has its own release notes structure. Follow the pattern for the specific product below.

### Redis Cloud — monthly changelog

**Location:** `content/operate/rc/changelog/`

Redis Cloud uses a monthly changelog file, one per month (for example, `july-2026.md`). To add entries for the current month, edit the existing file. To start a new month, copy the most recent file, rename it, and clear the content:

```
On branch [branch-name], add the following to the Redis Cloud changelog for [Month Year] at content/operate/rc/changelog/[month-year].md:

[paste new features, enhancements, or fixes]
```

Frontmatter fields to update: `Title`, `description`, `highlights`, `linktitle`, `weight` (increment by 1 from the previous month's file).

When a new Redis DB version becomes available on Cloud (for example, Redis 8.8), also add a version-specific page under `content/operate/rc/changelog/version-release-notes/` (for example, `8-8.md`).

---

### Redis Software — versioned release notes

**Location:** `content/operate/rs/release-notes/`

Organized by major version series (for example, `rs-8-0-releases/`), with one file per maintenance release (for example, `rs-8-0-20-68.md`).

**Adding a maintenance release** in an existing version series:

```
On branch [branch-name], create a new release notes file for Redis Software [version] at content/operate/rs/release-notes/rs-8-0-releases/rs-[version].md.

Use the most recent file in that folder as a template. Here are the highlights and bug fixes:
[paste release notes content]
```

File naming: `rs-<major>-<minor>-<patch>-<build>.md` (for example, `rs-8-0-20-68.md`).

**Adding a new major version series** (for example, 8.2): create a new folder (for example, `rs-8-2-releases/`) and add an `_index.md` following the structure of an existing one.

Key frontmatter: `Title`, `linkTitle` (shown in the nav), `weight` (lower = higher in the list), `compatibleOSSVersion`.

---

### Redis Enterprise for Kubernetes — versioned release notes

**Location:** `content/operate/kubernetes/release-notes/`

Same folder-per-version-series pattern as Redis Software (for example, `8-0-20-releases/`), with one file per release (for example, `8-0-20-25-july2026.md`).

**Adding a release:**

```
On branch [branch-name], create a new Kubernetes release notes file at content/operate/kubernetes/release-notes/8-0-20-releases/8-0-20-[build]-[monthyear].md.

Use the most recent file in the folder as a template. Here are the release details:
[paste operator version, image tags, supported distributions, and changes]
```

File naming: `<operator-version>-<monthyear>.md` (for example, `8-0-20-25-july2026.md`).

Also update the folder's `_index.md` to reference the latest release in the series description.

---

### RDI — flat release files

**Location:** `content/integrate/redis-data-integration/release-notes/`

One file per release:

```
On branch [branch-name], create a new RDI release notes file at content/integrate/redis-data-integration/release-notes/rdi-[version].md.

Here are the release details:
[paste new features, fixes, and any deprecations]
```

File naming: `rdi-<major>-<minor>-<patch>.md` (for example, `rdi-1-8-0.md`).

If the release changes RDI's current version, also update `rdi_current_version` in `config.toml` at the root of the repo.

---

### Redis Insight and Redis for VS Code

**Locations:**
- `content/develop/tools/insight/release-notes/`
- `content/develop/tools/redis-for-vscode/release-notes/`

Both use flat per-release files. Copy the most recent file as a template:

```
On branch [branch-name], create a new release notes file for [Redis Insight / Redis for VS Code] [version] at content/develop/tools/[insight or redis-for-vscode]/release-notes/[version].md.
```

---

## What's new

**Location:** `content/develop/whats-new/`

The What's new section has two parts:

1. **Version pages** — one file per Redis version (for example, `8-6.md`). When a new Redis version ships, create a new version page covering the new commands, capabilities, and performance improvements.

2. **Index** — `_index.md` aggregates recent updates across all products by quarter. When major features, new integrations, or version releases land, add a one-line entry with a link to the relevant page.

```
On branch [branch-name], update content/develop/whats-new/_index.md to add an entry for [feature or release] under the [Q1/Q2/Q3/Q4 Year] section.

Here's a brief description and the target page link:
[paste the update]
```

For a new Redis version page:

```
On branch [branch-name], create content/develop/whats-new/[version].md covering the new features in Redis [version].

Here's the source material:
[paste release highlights, new commands, and capability changes]
```

---

## Redis Iris (Context Engine)

**Location:** `content/develop/ai/context-engine/`

Redis Iris is the brand name for the suite of fully-managed AI context services on Redis Cloud. The section covers four services, each with its own subsection:

| Subsection | Directory | What it covers |
|---|---|---|
| Agent Memory | `context-engine/agent-memory/` | Session memory, long-term memory, stores, API |
| LangCache | `context-engine/langcache/` | Semantic caching for LLM responses |
| Context Retriever | `context-engine/context-retriever/` | Structured data access for agents |
| Data Integration | `context-engine/data-integration/` | Live data sync into the context layer |

The landing page (`_index.md`) uses `{{</* image-card */>}}` shortcodes to render navigation tiles — one per service. If you add a new service, add a tile to that landing page.

```
On branch [branch-name], update content/develop/ai/context-engine/[subsection]/ to document [feature or change].

Here's the source material:
[paste spec or ticket details]
```

---

## Redis Feature Form

**Location:** `content/develop/ai/featureform/`

Redis Feature Form is currently in preview. The section has its own landing page with image-card tiles and subsections for quickstart, concepts, providers, datasets, features, and streaming.

The landing page includes a banner (`bannerText` in frontmatter) flagging the preview status. Don't remove this until Feature Form is GA.

```
On branch [branch-name], update content/develop/ai/featureform/[subsection].md to document [feature or change].

Here's the source material:
[paste spec or ticket details]
```

---

## Redis Search

**Location:** `content/develop/ai/search-and-query/`

Redis Search is a large, structured section covering indexing, querying, vector search, and administration. It has several subsections:

- `indexing/` — how to create and manage indexes
- `query/` — query syntax, filters, aggregation
- `vectors/` — vector search and embeddings
- `advanced-concepts/` — scoring, highlighting, pagination
- `best-practices/` — performance and design guidance
- `administration/` — configuration and management

When updating Redis Search docs, find the right subsection before editing:

```
I need to document [Redis Search feature or change]. Find the right page under content/develop/ai/search-and-query/ for this content.
```

---

## RedisVL

**Location:** `content/develop/ai/redisvl/` (versioned docs) and `content/integrate/redisvl/` (integration tile)

RedisVL docs are **versioned** — each release has its own folder (for example, `0.22.0/`). The folder structure inside each version is consistent: `_index.md`, `api/`, `concepts/`, `install.md`, `user_guide/`.

**Important:** RedisVL's source documentation lives in a separate repository — [redis/redis-vl-python](https://github.com/redis/redis-vl-python). When a new version ships, the docs are pulled from that repo. **Don't manually copy content from the source repo** — coordinate with the team on the sync process.

### Adding a new version

When a new RedisVL version ships and the docs have been synced into the repo:

```
On branch [branch-name], the docs for RedisVL [version] have been added to content/develop/ai/redisvl/[version]/. Please:
1. Check that the _index.md for the new version has correct frontmatter (title, version, weight)
2. Update content/develop/ai/redisvl/_index.md to point to the new latest version
3. Update content/integrate/redisvl/_index.md summary if needed
```

### Updating existing version docs

For corrections or additions to an existing version:

```
On branch [branch-name], update content/develop/ai/redisvl/[version]/[file] to [describe the change].
```

---

## Redis Insight

**Location:** `content/develop/tools/insight/`

Redis Insight is a desktop and browser-based GUI client for Redis. It lets you visualize keys, run commands, explore streams, connect to RDI, and more. The section covers installation, feature guides, and release notes.

| Page | File | What it covers |
|---|---|---|
| Landing page | `_index.md` | Overview, image-card tiles for install/download/release notes |
| RDI connector | `rdi-connector.md` | Connecting Redis Insight to an RDI pipeline |
| Stream consumer | `insight-stream-consumer.md` | Exploring streams in Redis Insight |
| Search workspace | `search-workspace.md` | Using the Search/query workspace |
| Debugging | `debugging.md` | Debugging Redis commands and profiling |
| Copilot FAQ | `copilot-faq.md` | Redis Insight Copilot questions and answers |
| Release notes | `release-notes/` | One file per release (see [release notes section](#redis-insight-and-redis-for-vs-code)) |

The landing page uses `{{</* image-card */>}}` shortcodes to link to installation guides, the download page, and release notes. If you add a new major feature guide, add a tile to the landing page as well.

### Updating Redis Insight docs

```
On branch [branch-name], update content/develop/tools/insight/[file].md to document [feature or change].

Here's the source material:
[paste spec or ticket details]
```

### Adding a new Redis Insight feature page

```
On branch [branch-name], create a new page at content/develop/tools/insight/[name].md for [feature].

Use an existing page in the same folder (for example, search-workspace.md) as a template for frontmatter. Here's the content:
[paste feature description and steps]
```

If the new page should be discoverable from the landing page, also add an image card to `_index.md`.

---

## Redis Open Source releases

Redis Open Source releases follow a two-stage documentation process: **RC1 first, then final**. We publish docs for RC1 (release candidate 1) before the final release is available to developers, so the documentation is ready when the GA release ships.

### RC1 documentation

When RC1 is available, create the what's new page for the new version and mark it as RC1:

```
On branch [branch-name], create content/develop/whats-new/[version].md for Redis [version] RC1.

Here are the new features, commands, and changes in this release:
[paste RC1 changelog or release notes]

Mark this as RC1 in the page content — note that APIs and behaviors may change before GA.
```

In the frontmatter, add an alias for the RC1 URL so the page is discoverable under both paths:

```yaml
aliases:
- /develop/whats-new/[version]-rc-1/
```

For new data types or commands in RC1 that are not yet final, add `bannerText` to the frontmatter of the affected pages:

```yaml
bannerText: [Feature name] is currently in preview and subject to change.
bannerChildren: true
```

### GA release

When the final release ships:

1. **Update the what's new page** — remove the RC1 designation from the content and description. Keep the alias so existing links stay valid.
2. **Remove preview banners** — delete `bannerText` from the frontmatter of any pages that were marked preview/RC.
3. **Update the what's new index** — add an entry to `content/develop/whats-new/_index.md` noting the update (for example: "Updated documentation (removed RC1 designation)").

---

## Analyzing the impact of a new Redis release on `/develop`

A new Redis version doesn't only affect the what's new page and release notes — it can touch many areas under `/develop`. Scope the work first:

```
A new Redis [version] is shipping. Here are the changes:

[paste the full release notes or changelog]

Please analyze the full impact on docs under /develop and produce a list of every page that needs to be created or updated, organized by type of change (new data type, new commands, changed behavior, deprecations).
```

Here's what typically needs attention for each type of change:

### New data type

- Create the data type page under `content/develop/data-types/` (see [Data types pages](#data-types-pages) below)
- Add the data type to `content/develop/data-types/_index.md`
- Create command pages for all commands in the new group (`/docs:new-command-page`)
- Add a section to the version's what's new page
- If the data type is in preview/beta, add `bannerText` to the new page

### New commands on an existing data type

- Create command pages for each new command (`/docs:new-command-page`)
- Update the data type's tutorial page to cover the new commands with `clients-example` shortcodes
- Verify the data type page's `{{</* command-group */>}}` shortcode still reflects the correct group

### Modified command behavior

- Update the affected command page(s) under `content/commands/`
- Check if any data type tutorial pages reference the old behavior and update them
- Check `content/develop/using-commands/` for cross-cutting pages (pipelining, transactions, keyspace) that may be affected

### Deprecations

- Add deprecation notices to the affected command pages
- Update data type or guide pages that recommend the deprecated command as a pattern

### Performance improvements / internal changes

- Update the what's new page
- Check `content/develop/reference/` pages for anything that needs updating

---

## Data types pages

**Location:** `content/develop/data-types/`

Data type pages are more than reference — they're comprehensive guides that combine tutorial, use-case explanation, and command reference in one place. They have specific conventions that differ from other doc pages.

### Required structure

Every data type page follows this structure:

1. **Frontmatter** — `weight` (controls nav order), `categories`, `linkTitle`, `title`, `description`, and `bannerText` for preview data types
2. **`{{</* command-group */>}}` shortcode** — generates a summary table of all commands for that data type. Place this immediately after frontmatter, before any text:
   ```
   {{</* command-group group="hash" title="Hash command summary" show_link=true */>}}
   ```
3. **Overview** — what this data type is and when to use it
4. **Tutorial sections** — each covering a key operation or concept, with a `clients-example` shortcode for each
5. **Use cases and performance notes** — practical guidance
6. **Limits and restrictions** — capacity, encoding thresholds, edge cases

### `{{< command-group >}}` shortcode

This shortcode auto-generates a command summary table from the command pages. The `group` value must exactly match the group name set in the command page frontmatter. For module-based or non-core data types (like vector sets), use `url_group` to override the URL used in the "see all commands" link:

```
{{</* command-group group="module" url_group="vector_set" title="Vector set command summary" show_link=true */>}}
```

### Adding a new data type page

```
On branch [branch-name], create a new data type page at content/develop/data-types/[name].md for the Redis [name] data type.

Here are the commands and behavior:
[paste the command list and key behaviors]

Follow the standard structure: command-group shortcode first, then overview, then tutorial sections using clients-example shortcodes for each key operation. Use existing pages like hashes.md or sets.md as a reference.
```

After creating the page, add it to `content/develop/data-types/_index.md` in the right position in the list.

### Preview / beta data types

If the data type is not yet GA, add a banner:

```yaml
bannerText: [Name] is a new data type that is currently in preview and may be subject to change.
bannerChildren: true
```

`bannerChildren: true` propagates the banner to all sub-pages of the data type automatically.

### `buildsUpon` is especially important in data type tutorials

Data type pages present a progressive tutorial — each example builds on the data the previous example created. Always set `buildsUpon` on any example that depends on prior state, so readers who run examples interactively in the browser don't hit errors because required keys don't exist yet.

### Data types index

When adding a new data type, update `content/develop/data-types/_index.md`:

1. Add it to the top-level list under `## Data types`
2. Add a short description section following the existing format (overview sentence + links to the page and command reference)

---

## Integrations (`/integrate`)

**Location:** `content/integrate/`

The integrations section lists third-party libraries, tools, and platforms that work with Redis. Each integration has its own folder with an `_index.md`. The page is automatically rendered as a **tile** (card) on the integrations index — no manual registration is needed. The tile content comes from the frontmatter.

### How tiles work

The tile display is driven by these frontmatter fields in the integration's `_index.md`:

```yaml
type: integration       # required — makes the page appear as a tile
group: ai               # controls which category tab the tile appears under
summary: One-sentence description shown on the tile card.
stack: true             # optional — shows a "Stack" badge on the tile
```

**Groups** (tile categories):

| Group | What it covers |
|---|---|
| `ai` | AI frameworks and vector libraries (LangChain, RedisVL, etc.) |
| `library` | Client libraries (redis-py, node-redis, Jedis, etc.) |
| `framework` | Application frameworks (Spring, FastAPI, etc.) |
| `cloud` | Cloud platform integrations (AWS, GCP, Azure) |
| `cloud-service` | Cloud service integrations (Heroku, Vercel, Railway) |
| `di` | Data integration tools (RDI, RIOT) |
| `observability` | Monitoring and observability (Prometheus, Datadog, etc.) |
| `provisioning` | Infrastructure and provisioning (Terraform, Pulumi) |
| `service` | Service integrations (MCP, n8n, etc.) |
| `tool` | Standalone tools |

### Adding a new integration

```
On branch [branch-name], create a new integration page for [tool or library name] at content/integrate/[folder-name]/_index.md.

It belongs in the [group] category. Here's what it does and how it works with Redis:
[paste the description, key features, and any getting started content]

Use an existing integration page in the same group as a template for structure and frontmatter.
```

### Updating an existing integration

```
On branch [branch-name], update content/integrate/[folder-name]/_index.md to reflect [what changed — new version, new capabilities, updated examples].
```

---

## Available `/docs:` skills

These slash commands are built into this repo and handle the most common docs workflows. Run any of them at any point — they read the current branch and PR automatically.

| Skill | When to use |
|---|---|
| `/docs:new-command-page` | New Redis command reference page — reads the upstream `redis/redis` PR and drafts the full page |
| `/docs:make-plan-from-jira-ticket` | Before writing anything — reads the Jira ticket from your `DOC-XXXX` branch name and produces a doc plan for your approval |
| `/docs:assess-comments` | When PR review comments arrive — full reconciliation report across all reviewers and bots |
| `/docs:bugbot` | When Cursor Bugbot has left comments — triages findings and applies fixes for the valid ones |

### `/docs:make-plan-from-jira-ticket`

The fastest path from ticket to PR. Run it right after creating a `DOC-XXXX` branch, before writing anything:

```
/docs:make-plan-from-jira-ticket
```

It reads the Jira ticket, finds the right pages to change, and presents a plan for your approval. Then it makes the changes.

### `/docs:new-command-page`

For new command pages only — not updates to existing ones. Pass the command name and upstream GitHub PR link:

```
/docs:new-command-page <COMMAND-NAME> <github-pr-url> [jira-ticket-url]
```

The skill will not write anything until you approve the plan.

### `/docs:assess-comments`

Run after reviewers leave comments on your PR:

```
/docs:assess-comments
```

Produces a reconciliation report: what each comment raises, where reviewers and bots agree, where they contradict, and the recommended action for each. **Report only — no edits.** After reviewing, apply the safe fixes (or ask Claude to apply them) and push.

Scope to one reviewer:

```
/docs:assess-comments theirGitHubUsername
```

### `/docs:bugbot`

Run when Cursor Bugbot has left inline comments:

```
/docs:bugbot
```

Triages Bugbot's findings, dismisses false positives with an explanation, and applies fixes for genuine issues. Best run *after* `/docs:assess-comments` when Bugbot is among the commenters — the assess report tells you which findings are worth acting on.

---

## Hugo shortcodes cheat sheet

The docs use Hugo shortcodes for formatting. Claude knows all of these — just describe what you want and it will use the right one. For reference:

| What you want | Shortcode |
|---|---|
| Internal link | `{{</* relref "/operate/rc/page-name" */>}}` |
| Info callout | `{{</* note */>}} ... {{</* /note */>}}` |
| Warning callout | `{{</* warning */>}} ... {{</* /warning */>}}` |
| Tabbed content | `{{</* multitabs id="..." tab1="..." tab2="..." */>}}` |
| Embed a shared partial | `{{</* embed-md "filename.md" */>}}` |
| Image card / tile link | `{{</* image-card */>}}` |

---

## Documentation maturity levels

Every feature or product on the docs site has a documentation maturity level. The level tells contributors what documentation is required and how to treat incomplete or unstable content. Match your docs effort to the level — don't under-document a GA.

---

### Preview

The feature is stabilizing. It's on the public site and customers may be using it. Documentation must be **complete enough to use the feature** — every task a user needs to accomplish must be covered.

**Required:**
- All tasks documented (setup, configuration, key workflows)
- All conceptual documentation — what it is, how it works, when to use it, key architectural concepts
- A preview banner on every affected page:
  ```yaml
  bannerText: [Feature name] is currently in preview and subject to change.
  bannerChildren: true
  ```

**Not required yet:** best practices, troubleshooting, or reference docs — but these are good to start building.

---

### GA (General Availability)

The feature is fully released and stable. Documentation must be **complete** and should **actively welcome readers**. This is the full set on top of what Preview required.

**Required (everything in Preview, plus):**
- Best practices
- Troubleshooting guide
- Full reference documentation (configuration options, API reference, CLI reference as applicable)
- Release notes
- What's new entry or equivalent changelog entry
- Updates to any supported versions or compatibility docs that reference this feature
- Preview banners **removed** from all pages
- Added to core docs navigation and any relevant index or overview pages
- A formal **landing page** with `{{</* image-card */>}}` tiles following the current design pattern — see Redis Iris (`content/develop/ai/context-engine/_index.md`) and Redis Feature Form (`content/develop/ai/featureform/_index.md`) as examples
- The landing page should be **welcoming** — lead with the value proposition and what the reader can do, not just what the feature is
- All sub-sections linked from the landing page via image cards
- Cross-links from related product and feature pages so the feature is discoverable from multiple entry points
- Integrated into top-level navigation and any relevant hub or category pages

**Landing page pattern:**

```
On branch [branch-name], create a GA landing page for [feature] at [path]/_index.md.

The page should open with an exciting, welcoming introduction that leads with what users can build or accomplish. Then add image-card tiles for each key sub-section. Use content/develop/ai/context-engine/_index.md as the structural template.
```

---

### Quick reference

| | Preview | GA |
|---|---|---|
| Banner | Preview banner | None |
| All tasks documented | **Yes** | Yes |
| Conceptual docs | **Yes** | Yes |
| Best practices | No | **Yes** |
| Troubleshooting | No | **Yes** |
| Reference docs | No | **Yes** |
| Release notes / what's new | No | **Yes** |
| Supported versions updated | No | **Yes** |
| Formal landing page with image cards | No | **Yes** |
| Welcoming, excitement-generating tone | No | **Yes** |
| Cross-linked from related pages | No | **Yes** |

---

## Before you submit a PR

Do these three things before requesting review:

### 1. Review for technical accuracy

Before opening your PR, ask Claude to check the content for technical accuracy:

```
Review the changes on this branch for technical accuracy. Check that commands, parameters, version numbers, prerequisites, and behavioral descriptions are correct. Flag anything that looks wrong or uncertain.
```

Address any issues before submitting. It's much faster to fix problems before a reviewer sees them.

### 2. Check the writing against Google technical style

This docs site follows the [Google developer documentation style guide](https://developers.google.com/style). Ask Claude to check your writing before you submit:

```
Review the changes on this branch against Google developer documentation style. Check for second-person voice (you/your, not "the user" or "customers"), active voice, present tense, clear and concise phrasing, and correct heading capitalization. Suggest fixes for anything that doesn't follow the style.
```

Key rules to remember:
- Use **you** and **your** — never "the user", "customers", or "developers" when addressing the reader
- Use **active voice** and **present tense** wherever possible
- Use **sentence case** for headings (capitalize only the first word and proper nouns)
- Avoid unnecessary words — cut filler phrases like "in order to", "it is important to note that"

### 3. Add a reviewer

When you open your PR, request a review from someone on your team who can speak to the technical accuracy of the content. If you don't add a reviewer, the Docs team will pick it up in queue order — but adding someone who knows the feature speeds up the review significantly.

To add a reviewer: on the GitHub PR page, click **Reviewers** in the right sidebar and add the relevant person.

---

## Getting help

If you get stuck or aren't sure about something — the right page to edit, how a shortcode works, what level of docs a feature needs, anything — reach out in the **#docs** Slack channel. We'll assign you a docs buddy who's familiar with that area of the docs and can get you unblocked quickly.

---

## Tips

- **Don't write first, analyze first.** Use the Step 1 prompts to find the right file before making any changes. Editing the wrong page is the most common mistake.
- **Use `/docs:make-plan-from-jira-ticket` for any `DOC-XXXX` ticket.** It reads the ticket and tells you exactly what to change before touching a single file.
- **One branch per ticket.** Keep changes scoped — it makes PRs easier to review and easier to revert if needed.
- **Paste the full ticket.** The more context you give Claude, the better it can match product framing, terminology, and structure to what already exists in the repo.
- **Use "we call it X, not Y" corrections freely.** If Claude uses the wrong product name or outdated terminology, just correct it inline. It will update all instances.
- **Check the staging link.** CI posts a staging URL in every PR. Use it to verify formatting before requesting review.
- **"Customers" → "you".** This docs site uses second-person voice throughout. If Claude writes "customers should" or "users can", correct it to "you".
