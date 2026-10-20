# Develop with Redis docs — conventions for AI-assisted editing

These pages document building applications on Redis: data types, client libraries and
their code examples, Redis Search, use cases, programmability, and the protocol and
module references. Server installation and operations are under
`content/operate/oss_and_stack/`, and each command is under `content/commands/`.

Three subdirectories have their own conventions file: `ai/featureform/` (Redis Feature
Form), `ai/context-engine/` (Redis Iris), and `tools/insight/` (Redis Insight). This file
loads for their pages too. **Where a subdirectory's file says otherwise, it wins.** In
particular, the Feature Form and Iris source is private, so the root file's carve-out that
lets these pages link to source code does not apply there.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
structure, terminology, and code-example rules for this directory, and wins where the two
conflict.

Many pages here came over from the old redis.io docs and keep its conventions. New pages
and sections follow the recently written pages this file names, not the majority. Leave
legacy pages as they are unless updating them is the task.

## Generated content — fix it at the source

- **`ai/redisvl/` is synced daily from `redis/redis-vl-python`** by
  `build/redisvl_docs_sync.py`. Each run replaces `api/`, `user_guide/`, `overview/`, and
  `concepts/`, at the root and in the recent version folders, so fix those pages
  upstream. `_index.md`, `install.md`, and `interactive-demo.md` are written by hand.
- **`reference/modules/modules-api-ref.md` is generated from the Redis source.** Do not
  edit its body.
- **`data/examples.json` is built by `build/make.py`**, and `data/command-api-mapping.json`
  is merged from the files in `data/command-api-mapping/`. Edit the inputs, never the output.

## Where content goes

- **Directory names and sidebar labels differ.** `setup/` is "Get started" and
  `get-started/` is "Quick starts". Go by the section index's `linkTitle`.
- **A client topic** gets a page in each client's directory under `clients/`. A topic that
  spans several clients also gets a shared page in `clients/` that links to each client's
  page, as `error-handling.md` does. `clients/dotnet/` covers
  StackExchange.Redis; pages that need NRedisStack go in `clients/dotnet/nredisstack/`.
- **A use case** is `use-cases/<use-case>/`: an overview `_index.md`, plus one directory
  per client holding a guide `_index.md` and its runnable source files.
- **A Redis release** adds `whats-new/<major>-<minor>.md` and an entry under the current
  quarter in `whats-new/_index.md`. The newest release page has the lowest `weight`.
- **A community client library** is a row in the community table in `clients/_index.md`,
  added after it is scored with `.claude/skills/vet-redis-client/`.
- **Indexes that set `hideListLinks: true` list their children by hand**, including
  `clients/_index.md`, `data-types/_index.md`, `use-cases/_index.md`, and every use-case
  overview. A new page under one still appears in the sidebar, but not in the index's own
  list until you add it there.

## Product and capability names

| Use | For | Not |
| --- | --- | --- |
| Redis Search | The search and query capability. A proper noun with no article: "Redis Search has...". "The Redis Search index" is fine. | Redis Query Engine, Query Engine, RQE |
| Redis hashes, Redis JSON, Redis time series | Data types in prose. Take the type's casing from its page title. | RedisJSON, RedisTimeSeries, RedisBloom as names for what the reader uses |
| Redis Open Source | The distribution: "available in Redis Open Source, Redis Software, and Redis Cloud". | open-source Redis, Redis OSS, Redis Stack, Redis Community Edition |
| Redis Software | The self-managed commercial product. | Redis Enterprise |
| Redis 8.10 | A server version. | Redis v8.10 |

**Legacy names stay where they name something real**: a module version ("RedisJSON v2.0
introduced JSONPath"), a GitHub repository, the module build steps in
`data-types/json/developer.md`, and literals such as package names and URL slugs.

**Some recent pages still carry old names**, such as "Query Engine", "Redis Enterprise",
"Redis Stack", and "Redis TimeSeries". Do not copy them, and do not rename them while
editing for another reason.
_Delete this paragraph once none remain._

**Client library names follow the table in `clients/_index.md`, including case.**
Lowercase names stay lowercase at the start of a sentence ("go-redis supports..."). Do
not write "Node-Redis", though a few pages do. Code formatting of a client name in prose
varies; match the page. Landing-page `linkTitle` values read `<client> (<Language>)`, such
as "redis-rb (Ruby)".

**A use case names the pattern, never a product.** The do-it-yourself agent memory example
is the "memory layer" use case so it doesn't read as Redis Agent Memory. Its overview, like
the feature-store overview, points to the matching Redis product under `## Ecosystem`.

## Primary and replica — not the operate convention

Recently written client pages say "primary" and "replica": "the name of the primary that
the Sentinels monitor". In new prose, keep "master" and "slave" to literals, such as
`MasterName`, `SentinelServerType::Master`, `mymaster`, and `slave_for()`. The Redis Open
Source operate pages say "master"; do not carry that here. Some develop pages still say
"master", including `clients/connection-urls.md` and `reference/sentinel-clients.md`. Do
not convert them in passing.

## Versions, status, and availability

- **A server version boundary goes in the sentence that introduces the behavior**:
  "Beginning with Redis 8.10, the JSON data type supports...". In a table cell, "(since
  Redis 8.6)". The client index-and-query pages say "From Redis Open Source 8.10, you can
  also...". Both forms are current; do not convert one to the other.
- **A client version requirement is a `> [!NOTE]`**: "Client-side caching requires
  `node-redis` v5.1.0 or later." Client versions take a `v`; Redis versions don't.
- **Preview or experimental status goes in `bannerText`**: "This feature is currently in
  preview and may be subject to change."
- **Where Redis Cloud or Redis Software lacks a feature, say so flatly**: "Redis Cloud and
  Redis Software don't support `HIMPORT`." Do not forecast support. The "planned for a
  future release" line in `clients/sch.md` is not a model.

## Client library pages

- **Client directories share most page names, but not a fixed set**, and `hiredis` has its
  own set for the C API. A new page for one client copies the filename, `title`, and
  `linkTitle` of the same page in another client's directory, where one exists. Weights
  differ between directories; place a new page among its siblings and do not renumber.
- **A capability added for every client goes on each client's page under the same heading,
  in the same position.** Connect pages run: basic connection, cluster, Sentinel, TLS, then
  client-specific options. Jedis nests the middle three as H3 sections.
- **The code form depends on the page.** Connect, production usage, failover, and error
  handling pages use fenced blocks. Pages that run commands on data, such as JSON,
  probabilistic, query, vector, and pipeline pages, are mixed: shared-set
  `clients-example` blocks with a `lang_filter`, client-specific sets with none, and some
  fenced blocks. For a new data page, copy `ruby/transpipe.md` or `ruby/vecsearch.md`,
  which use a shared set with `lang_filter` and an empty body.
- **Some landing pages use `jupyter-example`**, a cell the reader can run. It needs a
  notebook environment for the language, so do not convert a landing page in passing.

## Tabbed code examples

The code in a `clients-example` tab is not in the page. The page names a `set` and a
`step`, and the build pulls each language's code from that step's `STEP_START`/`STEP_END`
block in an example file. Read `.claude/skills/tce-examples/SKILL.md` before you add or
change one. These are the mistakes that break a page:

- **Editing the wrong copy.** Example files live under `local_examples/` or in the client's
  repository, and the `local_examples/` copy wins when both exist. The set comes from the
  file's `EXAMPLE:` line, not its folder. Never edit `data/examples.json`, and never write
  examples in `tmp/clients/`, the test harness's working copy.
- **Guessing a client's identity.** `build/example-test-harness/clients.tsv` lists each
  client's directory names, filenames, and the exact tab name `lang_filter` must match.
- **Publishing scaffolding.** A file starts with `EXAMPLE: <set>`. `HIDE_START`/`HIDE_END`
  folds setup away, and `REMOVE_START`/`REMOVE_END` strips assertions and cleanup. Apart
  from step and test markers, comments outside those blocks are published. See
  `for-ais-only/tcedocs/SPECIFICATION.md`.
- **Drifting step names.** Step names are lowercase and identical in every client's file.
- **Positional parameters.** Use named ones: `set`, `step`, `description`, `difficulty`,
  `buildsUpon`. Every current page does, despite what `for-ais-only/tcedocs/README.md`
  says; its guidance on descriptions and difficulty is current.
- **Invented method names.** Take each method from `data/command-api-mapping/<COMMAND>.json`.
  If it isn't there, add it with `.claude/skills/command-api-mapping/` or omit that client.
- **A transcript that isn't real output.** The shortcode body is the redis-cli tab: each
  command after a `> ` prompt, then its reply exactly as redis-cli prints it. Readers run
  it with **Try it**. A `prereq="true"` block becomes page setup that every Try it on the
  page runs first; `needs_prereq` is the older model. A blocking command such as `BRPOP`
  gets `runnable="false"`. `build/check_tryit_output.py --page <glob>` checks the replies.

## Data type pages

- **A page that introduces a data type opens with its command summary**, directly after the
  frontmatter: `{{< command-group group="<group>" title="<Type> command summary" show_link=true >}}`.
- **A new data type page follows `data-types/arrays.md`**, whose headings name what the
  reader does ("Reading ranges"). Legacy pages with one catch-all `## Examples` section are
  not the model.

## Use-case pages

`.agents/skills/redis-use-case-ports/assets/redis-conventions.md` describes the use-case
layout, but only partly matches current pages: it says to link with `relref`, which the
root file replaces with `.md` paths, and several use cases skip its weight table and its
guide outline. Copy `use-cases/job-queue/`, and where the conventions file and the pages
disagree, follow the pages.

- **Overviews share one outline**: the same six H2 sections in the same order, from "When
  to use..." to "Code examples to build your own...", which lists one guide per client.
- **Guide frontmatter**: `linkTitle: <client> example (<Language>)` and
  `title: Redis <use case> with <client>`. Older guides use other forms, such as "Go rate
  limiter"; they are not the model.
- **Guide snippets draw on the source files beside them.** When you change one, check the
  other. Link a source file by its `https://github.com/redis/docs/blob/main/...` URL, never
  a relative path, which returns 404 on the published site for most file types. The
  cache-aside guides still use relative paths.
- **Only the guide is Markdown.** Hugo publishes every `.md` file under `content/`, so a
  `README.md` beside the code becomes a page.
- **Each guide has an alias for its client's other name**, such as `.../python` on a
  `redis-py` guide. Copy the aliases from the same client's guide in another use case.

## Callouts, code, and command links

- Callouts are `> [!NOTE]`, `> [!WARNING]`, and `> [!TIP]`. The `{{< note >}}` shortcode
  family was retired here in October 2026; do not copy it from history or an old branch.
- Code outside a tabbed example is a fenced block with a language tag. Many older blocks
  have no tag; add one to any block you write. Do not introduce the `highlight` shortcode.
- A command name in link text is code-formatted:
  ``[`CLIENT TRACKING`](/content/commands/client-tracking.md)``. In a multi-word command's
  filename, a hyphen joins the words.

## Flag rather than decide

- **A method name, client version, or expected reply can't be confirmed** from
  `data/command-api-mapping/`, a client release, or a test run. Never infer one.
- **A client doesn't appear to support a command its siblings demonstrate.** An empty or
  wrong tab is worse than none; name the client.
- **A version boundary is unclear**, or a feature's support on Redis Cloud or Redis
  Software can't be confirmed.
- **A generated page looks wrong.** Name the upstream source; do not edit the page.
- **A term appears that this file does not cover.**
