# Redis command reference — conventions for AI-assisted editing

These pages are the command reference: one page per Redis command or subcommand, for core
commands and for the Redis Search, JSON, time series, and probabilistic commands (`FT.*`,
`JSON.*`, `TS.*`, `BF.*`, `CF.*`, `CMS.*`, `TDIGEST.*`, `TOPK.*`). The
`redis-<major>-<minor>-commands.md` files are per-release lists generated from the pages.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
the structure, data, and naming rules for this directory, and wins where the two conflict.

Many pages still carry conventions from the original redis.io docs. New pages and
rewritten sections follow the recently written pages named here, not the majority. Leave
legacy pages as they are unless updating them is the task.

## Frontmatter comes from upstream — never compose it

Most frontmatter comes from the command's upstream JSON definition:
`src/commands/<command>.json` in `redis/redis` for core commands, and the module
repository's `commands.json` for module commands. Never invent or "correct" these keys:
`arguments` (including any per-argument `since`), `arity`, `complexity`, `since`, `group`,
`acl_categories`, `command_flags`, `key_specs`, `hints`, `history`, `deprecated_since`,
`replaced_by`, and `doc_flags`. Some pages also carry upstream keys such as `function`,
`reply_schema`, and `container`. Leave them. **The values are converted, not pasted.**
Upstream's `"SORTEDSET"` and `"sorted_set"` are `@sortedset` and `sorted-set` on the page,
`"READONLY"` is `readonly`, and upstream `command_tips` is `hints`. Take the values from
upstream, and write them in the form a sibling page in the same group uses.

- **`syntax_fmt` and the railroad diagram are generated from `arguments`** by
  `build/cmd_tools.py`. When `arguments` changes, regenerate both. Never hand-edit
  `syntax_fmt`; its `\_` sequences are generated non-breaking spaces.
- **`cmd_tools.py add <json-file> --output-dir <dir>`** writes a page skeleton and its SVG
  for a new command, from a file shaped like `data/commands.json`. Output lands in
  `<dir>/commands/` and `<dir>/images/railroad/`; move it to `content/commands/` and
  `static/images/railroad/`, and replace every `TODO:` placeholder.
- **Never run `cmd_tools.py update-all`.** It merges `data/commands.json` into every page's
  frontmatter. The two have drifted apart, so it rewrites hundreds of pages, including
  `module` values, `since` values, and argument names.
- **Hand-set keys.** `title` and `linkTitle` are the command name in capitals, with a space
  before a subcommand: `BACKUP START`. `summary` is the text on the commands index card,
  and `description` starts as a copy of it. `categories` is the same list on nearly every
  page, duplicate `oss` included; copy it unchanged from a sibling. HELP subcommand pages set
  `hidden: true`, which drops them from the index, the sidebar, and the version pages.
  Preview data types set `bannerText`, as the array commands do.
- **`railroad_diagram` does not control the diagram.** The layout shows
  `static/images/railroad/<filename>.svg` whenever it exists. Leave the key as it is.

## Files outside the page

- **`data/commands.json` needs an entry for every command.** The command-group lists on
  `content/develop/` pages and the client API foldouts read it, not the page. Its sync
  workflows were removed in September 2026, so the file is edited by hand. Add the entry
  from upstream, in the form the file's other entries use.
- **`data/command-api-mapping/<COMMAND>.json` fills the API methods tab.** It is optional.
  `.claude/skills/command-api-mapping/` documents the schema and the merge step.
- **Version pages are generated once per release** by
  `build/generate_version_commands_page.py <version>`, then adjusted by hand. Do not add
  a command to one by hand, and do not regenerate an earlier release's page.
- **Filenames are the lowercase command name, with a hyphen for each space**:
  `backup-start.md`, `json.numpowby.md`. The layout derives the diagram path from `title`
  the same way. No page here has `aliases`, so never rename a command file.

## The layout renders the header — do not repeat it in the body

`layouts/commands/single.html` builds these from frontmatter: the syntax tabs, "Available
since" (or "Available in" for module commands), time complexity, ACL categories, the
History list from `history`, the Deprecated badge from `doc_flags`, and the deprecation
notice from `deprecated_since` and `replaced_by`. Writing any of them in the body shows it
twice. The header's compatibility link appears only when the page has a heading reading
exactly `## Redis Software and Redis Cloud compatibility`.

## Core command pages

Copy `sdiffcard.md` or `lmovem.md`. Sections appear in this order, and an empty one is
left out:

1. **Cluster note**, for a command that takes more than one key, before anything else.
   Copy the `> [!NOTE]` and multi-key operations link from `sdiffcard.md` verbatim.
2. **Intro**, no heading. One or two sentences on what the command does. Argument
   mechanics go in the arguments; everything else goes in Details.
3. **`## Required arguments`** and **`## Optional arguments`**. One
   `<details open><summary><code>…</code></summary>` block per argument, its summary in
   syntax form: `LIMIT limit`, `key [key ...]`. A repeating group such as
   `field value [field value ...]` is one block. Never put `<` or `>` inside the summary;
   write `LEFT | RIGHT`. Descriptions are full sentences.
4. **`## Examples`**.
5. **`## Details`** holds all other prose, and most `###` subsections. Examples can have
   them too, as on `xadd.md`.
6. **`## Redis Software and Redis Cloud compatibility`**.
7. **`## Return information`**.
8. **`## See also`**: other command pages, pipe-separated:
   ``[`SDIFF`](/content/commands/sdiff.md) | [`SDIFFSTORE`](/content/commands/sdiffstore.md)``.
9. **`## Related topics`**: a bulleted list of guide and data type pages.

A container command page (`backup.md`, `himport.md`) has only an intro, its subcommands
or a pointer to its HELP subcommand, and optional Details. It has no argument,
compatibility, or return sections.

Claude Code users can run `/docs:new-command-page`, which also covers reading the
upstream pull request. Where it differs from the pages, the pages win.

## Module command pages follow their family

Module pages use the same section order, but each family keeps its own conventions.
`ts.read.md` and `json.numpowby.md` are recent pages that follow theirs. Copy a page from
the same family, and do not convert a module page to the core style or the reverse.
`ft.aliaslist.md` and `ts.querylabels.md` are recent but not models: both have a lowercase
`module` value, which renders wrongly, and `ts.querylabels.md` has a core-style table.

- Argument descriptions are mostly lowercase fragments that continue the summary: "is the
  key name for the time series." `CMS.*` pages use full sentences, and `BF.*` and `CF.*`
  pages mix both. Match the page.
- Most `FT.*`, `JSON.*`, and `TS.*` pages put an `[Examples](#examples)` line after the
  intro. `FT.*` and `TS.*` pages group examples in
  `<details open><summary><b>Title</b></summary>` blocks, each with a sentence of context.
- `module` is the family's display value, which the layout prints after "Redis Open
  Source": `Search`, `JSON`, `TimeSeries`, or `Bloom`. Never the lowercase upstream ID.
- `since` is a module version for commands that predate Redis 8 (`2.0.0`) and a Redis
  version for commands added since (`8.10.0`). Upstream supplies it.

## Examples

- **Runnable transcripts go in `{{% redis-cli %}}`**, with a `redis>` prompt on each
  command and output exactly as `redis-cli` prints it: `(integer) 1`, `(nil)`, `1) "a"`. The
  block feeds the page's Try it button, which runs the commands on redis.io/cli.
- **Try it and the output checker run blocks differently.** The checker runs a page's
  blocks in one session, in document order. Try it runs only the block the reader clicks,
  plus any `prereq="true"` setup, in whatever order the reader clicks. Write each block so
  it works on its own or after that setup, and never reuse a key name for a different type.
- **A command the redis.io/cli sandbox does not run yet goes in a plain code fence.** Move
  it into `{{% redis-cli %}}` once the sandbox runs that release, as several 8.10 pages
  were.
- **On core pages, `{{< highlight bash >}}` blocks and `127.0.0.1:6379>` prompts are
  legacy.** Leave them; converting one means re-running it so the output still matches.
  Most `FT.*`, `JSON.*`, and `TDIGEST.*` pages still use `highlight bash` as their current
  form, so follow the family there.
- **`{{< clients-example >}}` blocks** render client-library tabs from example files under
  `local_examples/`, in sets such as `cmds_hash`. Do not add one without the files. The
  `tce-examples` skill covers writing them.

## Return information

- One `{{< multitabs >}}` block, RESP2 tab first, then `-tab-sep-` and RESP3, both present
  even when they match. Most pages use `id="<command>-return-info"` (`ts-read-return-info`);
  the generator writes `id="return-info"`, and some recent pages kept it. Do not change an
  existing `id`, and do not copy a sibling's unchanged.
- Most replies start with their type as a link, then a colon and what it holds. Where
  there are several, write "One of the following:" and a bullet for each. A `JSON.*` reply
  that depends on the path form starts with the form instead, as on `json.numpowby.md`.
- RESP2 null is `[Nil reply](…#bulk-strings)` and RESP3 null is `[Null reply](…#nulls)`.
- **Reply links are the one exception to the root file's link form.** Core pages use the
  generator's relative `../../develop/reference/protocol-spec#integers`; module pages use
  `/content/develop/reference/protocol-spec.md#integers`. Use one form per page and do not
  convert. The anchor is an H3 slug on the protocol page: `#integers`, `#bulk-strings`.

## Compatibility table

- Copy the table from a page in the same group. The shape differs by family: core pages
  list Standard and Active-Active for both products, and most module pages list Redis
  Cloud plans.
- A new command ships with every cell "Not supported"; a later update changes them.

## Versions, history, and deprecation

- In prose, a version is "Redis 8.10". The layout adds "Redis Open Source".
- A new argument or reply field on an existing command gets an upstream `since` on the
  argument, a `history` entry, and a description starting "Added in Redis 8.10." Follow
  `xread.md`.
- Keep module-version markers such as "(since RedisTimeSeries 1.8)".
- A deprecated command carries `deprecated_since`, `replaced_by`, and `doc_flags:
  [deprecated]`. `replaced_by` is Markdown: ``'`ZRANGE` with the `REV` argument'``. Most
  core pages also put "Deprecated as of Redis v6.2.0." in the compatibility Notes cell.

## Names and links

- Command names in prose are capitals in backticks. Link text for another command page
  is code-formatted, and a page does not link to itself.
- New prose uses Redis Search, JSON, time series, probabilistic data structures, and
  vector sets. Module names stay in module-version references and in source URLs.
- **The family Related topics link still reads `[RedisTimeSeries]`, `[RedisJSON]`, or
  `[RediSearch]`**, on new pages too. Match the family's siblings until it changes
  everywhere. _Delete this item once no page in the directory uses those link texts._
- Data type concepts live under `content/develop/`. Link to them; do not restate them.

## Checks

- Pull request CI only builds the site, an unresolved link only warns, and the weekly
  external-link check does not gate pull requests. Check links yourself.
- Before submitting a `{{% redis-cli %}}` example, run
  `python3 build/check_tryit_output.py --page 'commands/<file>.md'`. It runs the block on
  redis.io/cli; an ERROR is a broken example. `build/check_tryit_payloads.py` checks the
  Try it URL length. Neither runs in CI.

## Flag rather than decide

- **Frontmatter disagrees with upstream or with `data/commands.json`**, or `syntax_fmt`
  disagrees with `arguments`, as on `increx.md`. Say which; do not pick one.
- **A compatibility cell or Notes entry would change.** It is a product claim.
- **A version boundary cannot be confirmed** from the upstream definition or release.
- **An example's documented output cannot be reproduced.**
- **A term appears that this file does not cover.**
