# Hugo dependency assessment

Date assessed: 24 July 2026

## Executive summary

The documentation sources are heavily dependent on Hugo today, but most
content-level lock-in is concentrated in a few conventions that can be
replaced without changing the published experience.

The highest-value changes are:

1. Replace `relref` calls with ordinary Markdown links and resolve or validate
   them with a link render hook.
2. Replace note, warning, tip, and alert shortcodes with Markdown blockquote
   alerts and a blockquote render hook.
3. Replace the image shortcode with Markdown images and an image render hook.
4. Replace code-related shortcodes with fenced code blocks.
5. Use table render hooks for responsive Markdown tables.

These changes would move Hugo-specific behavior out of thousands of content
files and into a small rendering adapter. The equivalent adapter could later
be implemented for another site generator.

Some shortcodes are not merely presentational. Features such as generated
multi-client examples, content transclusion, child-page tables, and
data-driven command lists require preprocessing or an equivalent data and
page-model API. Render hooks are not an appropriate replacement for these.

## Scope and methodology

This assessment covers the current repository checkout and:

- 5,146 Markdown files under `content/`
- Hugo v0.143.1
- 41 shortcode templates
- 6 existing render hooks
- 153 layout files

Shortcode calls and affected files were counted across the Markdown sources.
Front matter, content organization, raw HTML, Hugo configuration, layout
templates, data access, alternate output formats, and build scripts were also
reviewed.

## Content-level dependency inventory

| Construct | Instances | Files affected | Assessment |
|---|---:|---:|---|
| `relref` | 26,856 | 3,524 | Largest dependency; readily replaceable |
| Note, warning, tip, info, and alert shortcodes | 2,960 | 1,290 | Readily replaceable with blockquote alerts |
| `image` | 1,648 | 445 | Mostly replaceable with Markdown images |
| `highlight`, `code`, and `redis-cli` | 749 | 340 | Mostly replaceable with fenced code blocks |
| `multitabs` | 624 | 585 | Needs a different progressive-enhancement design |
| `clients-example` | 564 | 109 | Data-generation feature |
| `embed-md` | 299 | 207 | Content transclusion; no standard Markdown equivalent |
| `embed-yaml` | 136 | 32 | Better handled by preprocessing |
| `table-children` | 94 | 89 | Depends on Hugo's page tree |
| Other specialized shortcodes | 409 | — | Mixed presentation and data-generation features |

Overall:

- 3,932 files, approximately 76%, contain at least one shortcode, including
  `relref`.
- 2,297 files, approximately 45%, contain at least one custom, non-built-in
  shortcode.
- Replacing links, callouts, images, and code wrappers would remove about 94%
  of all shortcode invocations.
- After those migrations, approximately 1,098 files and 2,126 genuinely custom
  shortcode calls would remain.

## Recommended source conventions

| Current convention | Preferred source form | Hugo implementation |
|---|---|---|
| `[text]({{< relref "…" >}})` | Ordinary Markdown link | Link render hook resolves and validates it |
| `{{< image … >}}` | `![alt](image-path)` | Image render hook adds lightbox and link behavior |
| `note`, `warning`, `tip`, `info`, `alert` | `> [!NOTE]`, `> [!WARNING]`, etc. | Blockquote render hook produces the existing alert markup |
| `highlight`, `code` | Fenced code block | Default renderer or code-block hook |
| `redis-cli` | A `redis-cli` fenced code block | Code-block hook adds terminal presentation |
| `table-scrollable` | Ordinary Markdown table | Table render hook adds a responsive wrapper |
| `definition` | Markdown definition list | Goldmark definition-list support |
| Diagrams and interactive checklists | Existing typed code fences | Retain the current render-hook pattern |

Hugo supports render hooks for links, images, blockquotes, code blocks,
headings, passthrough elements, and tables. These hooks are well suited to
presentation changes applied to otherwise meaningful Markdown.

See the [Hugo render-hook documentation](https://gohugo.io/render-hooks/introduction/).

## Links

Use ordinary source-relative Markdown links as the canonical form:

```markdown
[Transactions](../using-commands/transactions.md)
```

A Hugo link render hook can:

- resolve the source file to its published permalink;
- retain the current base-URL behavior;
- distinguish internal, external, and fragment-only links;
- report unresolved pages during the build.

An independent Markdown link checker should also run in CI so that link
correctness does not itself depend on Hugo.

Source-relative links are preferable to versioned site URLs because they work
in repository viewers and generic Markdown tooling without coupling the
source to a particular deployment prefix.

### Prototype findings

A link render hook was prototyped and tested (DOC-6909). It is committed at
[`layouts/_default/_markup/render-link.html`](layouts/_default/_markup/render-link.html).
The method: add the hook, convert every `relref` in `content/develop/clients/`
(1,072 calls across 110 files) to plain Markdown links, build, and diff
rendered link targets against a `relref` baseline.

**Parity is exact.** Across 125 client pages, every internal link resolved
byte-for-byte identically to `relref`, including anchors, mixed-case paths,
bare page-relative paths, and `.md` suffixes. The only remaining differences
were cosmetic percent-encoding of literal parentheses in external URLs
(`(` becomes `%28`), which Goldmark applies to the destination it hands the
hook.

**`relref` and plain links can coexist.** They do not have to be migrated in a
single pass. When a `relref` is still present its destination is Hugo's internal
shortcode placeholder at hook time; the shortcode expands afterwards and
substitutes the real URL back in — even inside the `href` the hook emitted. The
hook therefore includes a transition guard: if the destination still contains a
shortcode placeholder, it is passed through untouched and no warning is emitted.
Without that guard, an in-progress migration logs one spurious "unresolved"
warning per un-migrated `relref` (26,847 in this repository), which would bury
the genuine broken-link warnings. Remove the guard once every `relref` has been
migrated.

**Internal links are not only content pages.** The use-case demos link to
companion source files that ship in the page bundle, e.g. `[source](cache.rs)`.
These are page resources, not pages, so `GetPage` cannot see them; the hook
resolves them with `.Page.Resources.GetMatch` before reporting a link as
unresolved. With that in place the remaining build warnings are mostly genuine
signal — real dead links, alias/redirect targets that `GetPage` cannot resolve,
and static-directory files.

**Installing the hook is the atomic event, not the content migration.** The
hook is global, so on the day it lands it reprocesses every plain Markdown link
that already exists in the repository — for example the reply-type links in the
command reference pages, which are authored as `../../develop/...` relative
links, not `relref`. For those pre-existing links the hook applies harmless
normalisation (relative to absolute, `.md` stripped, trailing slash added); the
targets are unchanged. Content conversion can then proceed gradually, but the
hook itself must be parity-tested against the whole site, not only against the
pages being migrated.

**A hook must be as robust as Hugo's built-in renderer.** Testing surfaced four
defects that only appear at corpus scale, each of which silently dropped pages
or failed the build:

1. `.Page.File.Path` panics with a nil-pointer dereference on pages that have no
   backing file — content generated via `markdownify` (the command pages) and
   shortcode inner content (`note`, `alert`). Use `.Page.Path` instead.
2. `urls.Parse` hard-errors on a malformed destination (a pre-existing
   `[Authority]([Authority](https://...))` link) and fails the entire build.
   Detect external links with a `findRE` scheme match instead.
3. The unresolved-link fallback duplicated the fragment (`#cas#cas`) because it
   re-appended an anchor that the destination already contained.
4. `GetPage` cannot resolve alias (redirect-stub) targets, so links to aliased
   paths produce false "unresolved" warnings even though the output is correct.

Before a migration, run the hook site-wide and fix pre-existing malformed links,
which a hook converts from silently-wrong output into hard build failures.

### Scaling across diverse sections

To check that parity was not specific to one section, the conversion was
repeated across four structurally different areas at once — 825 files and about
5,000 `relref` calls — each chosen to exercise a distinct feature:

| Section | Feature exercised |
|---|---|
| `operate/rs/databases/active-active` | Content mounted under two URL paths |
| `operate/rc` | Image-heavy pages; the target of that mount |
| `operate/kubernetes` | Mixed-case paths and generated API-reference pages |
| `integrate` | Cross-tree links |

The build produced no errors, dropped no pages, and added no new warnings.
Every rendered-link difference against the `relref` baseline was benign
normalisation (relative to absolute, `.md` stripped, trailing slash added).

The mounted Active-Active tree is the most demanding case, because the same
source file is published under both `/operate/rs/…` and `/operate/rc/…`. The
hook resolves each relative link to the mount-appropriate permalink — for
example `develop/data-types` renders as
`/operate/rs/databases/active-active/develop/data-types/` under the Software
path and `/operate/rc/databases/active-active/develop/data-types/` under the
Cloud path — matching `relref` exactly on both. This relies on resolving with
`.PageInner`.

Versioned trees such as `operate/rs/<version>` were not included in this pass
and should be checked separately, because version-specific links also interact
with the archiving tool described below.

### Tooling that assumes `relref`

Several build and authoring tools treat `relref` as a literal string — they
parse or generate the shortcode directly. These must be updated or retired as
part of the migration, or they will silently produce wrong output:

- [`build/version_archiver.py`](build/version_archiver.py) rewrites
  `{{< relref "/…" >}}` with a regular expression to make links version-specific
  when a versioned documentation snapshot is created. Against plain Markdown
  links it matches nothing, so archived versions would keep unversioned links.
- [`build/redisvl_docs_sync.py`](build/redisvl_docs_sync.py) is an importer that
  *emits* `relref` syntax when converting upstream RedisVL documentation. It
  would need to emit plain Markdown links instead.
- [`.claude/hooks/check_shortcode_paths.py`](.claude/hooks/check_shortcode_paths.py)
  validates `relref` target paths on edit. Once links are plain Markdown, that
  validation moves to the render hook and an independent link checker.
- [`layouts/partials/process-markdown-content.html`](layouts/partials/process-markdown-content.html)
  regex-replaces `relref` when generating the Markdown and JSON outputs (see
  "Current alternate-output fragility" below); standard links would let the
  render hook handle this instead.

An audit for `relref` used as a literal string across `build/`, `layouts/`, and
`.claude/` should be part of migration planning.

## Callouts

Replace callout shortcodes with GitHub-style blockquote alerts:

```markdown
> [!WARNING]
> Back up the database before continuing.
```

Hugo v0.143.1 supports the necessary blockquote render hooks and alert
metadata. Unsupported Markdown processors still display the content as a
normal blockquote.

Migration should use a Markdown- or shortcode-aware parser rather than regular
expressions. At least 544 existing callouts contain nested shortcodes, and
some callout bodies are very large. Inner shortcodes should be migrated before
their enclosing callout where possible.

## Images

Approximately 1,093 of the 1,648 image calls use only a filename and optional
alt text. These can be converted directly:

```markdown
![Database update status](/images/rc/status.png)
```

An image render hook can retain:

- the link to the full image;
- lightbox behavior;
- URL normalization;
- the existing `#no-click` convention, if it is still required;
- optional titles and semantic styling.

The remaining image calls use `width` or `class`. The preferred options are:

1. Remove unnecessary per-image sizing through responsive CSS.
2. Replace arbitrary classes with a small set of semantic styles such as
   `inline-icon`, `small`, or `wide`.
3. Use Goldmark image attributes only for genuine exceptions.

Goldmark attributes are not CommonMark, but they degrade more gracefully than
Hugo shortcode calls. Arbitrary Tailwind class strings should not form part of
the long-term content schema.

There is also an accessibility opportunity: 418 image shortcode calls do not
currently specify alt text.

The current image shortcode declares a default width of 75%, but does not
apply it. Only explicitly provided widths appear in the rendered `img`
element. See [`layouts/shortcodes/image.html`](layouts/shortcodes/image.html).

## Code blocks and tables

Replace `highlight` and `code` shortcodes with normal fenced code blocks.
Replace `redis-cli` with a `redis-cli` fenced block and use a code-block render
hook to add the current terminal chrome.

A table render hook can wrap ordinary Markdown tables in a responsive
overflow container. This removes the need for the `table-scrollable`
shortcode without sacrificing the current HTML behavior.

The repository already follows this progressive-enhancement approach for
Mermaid diagrams, checklists, hierarchies, decision trees, and timelines. See
[`for-ais-only/render_hook_docs/README.md`](for-ais-only/render_hook_docs/README.md).

## Tabs

There is no standard Markdown representation for tabs. The best portable
source is ordinary titled sections:

```markdown
### RESP2

RESP2 return information.

### RESP3

RESP3 return information.
```

JavaScript can progressively enhance recognized groups into tabs. Other
renderers will show the sections sequentially, which is a useful and
accessible fallback.

Of the 624 `multitabs` calls, 534 are in command-reference pages. Their
generator should emit RESP headings directly instead of emitting shortcode
syntax. Arbitrary tab sets could use a generator-neutral marker, but such a
marker would still be a custom extension rather than standard Markdown.

## Dependencies that render hooks should not replace

The following features generate or transclude content rather than simply
altering Markdown presentation:

- `clients-example` joins generated example data, client configuration,
  source files, and command metadata.
- `jupyter-example` reads source content and configures interactive notebook
  behavior.
- `embed-md` transcludes another page through Hugo's page API.
- `embed-yaml`, `embed-code`, and `code-include` read files during rendering.
- `table-children` queries Hugo's page tree and child-page front matter.
- `command-group` generates command lists from data files.
- `rc-supported-regions`, `table-csv`, `external-json`, and similar
  shortcodes generate content from local or remote data.

These should be moved to a generator-neutral preprocessing stage:

```text
authored Markdown + manifests + shared fragments
                 |
                 v
       repository build tools
                 |
                 v
      fully expanded Markdown tree
                 |
                 v
      Hugo or another site generator
```

The expanded Markdown tree becomes a portable intermediate representation.
Hugo and any future generator can consume the same tree. The authoring layer
may retain a small project-specific directive or manifest schema, but it no
longer depends on Go templates or Hugo's page APIs.

## Page-model and build dependencies

Removing shortcodes would not by itself make the complete site
generator-independent. The repository also relies on:

- 992 `_index.md` files for section pages and hierarchy;
- front matter fields such as `weight`, `alwaysopen`, `hideListLinks`, `url`,
  `aliases`, `type`, `layout`, and `cascade`;
- 701 alias declarations;
- page-tree navigation and sorting;
- Hugo's data directory and site configuration;
- Hugo's asset pipeline;
- related-content, taxonomy, menu, and template APIs;
- alternate Markdown and JSON output formats;
- a Hugo module mount that exposes the same Active-Active source under both
  Redis Software and Redis Cloud paths.

YAML front matter is broadly supported by documentation generators, but the
project should define its own metadata schema. Generator adapters can then map
that schema to Hugo or a future system.

The content mount is configured in [`config.toml`](config.toml). A portable
replacement would materialize the duplicated tree during preprocessing or
model the shared content explicitly in a manifest.

## Raw HTML

An approximate scan found recognized raw HTML elements outside code fences in
1,819 Markdown files. Much of the volume is generated table and REST API
markup, including:

- tables and table cells;
- `details` and `summary`;
- `span`, `br`, and `nobr`;
- raw links and images;
- formatting elements.

Raw HTML is not Hugo-specific, and many Markdown systems support it, but its
security policy and styling vary between renderers. The current repository
explicitly enables unsafe Goldmark rendering in [`config.toml`](config.toml).

Raw HTML should therefore be treated as a secondary portability workstream.
Generated tables, `<br>`, `<span>`, `<nobr>`, and manually constructed
`<details>` blocks are the best initial targets.

## Current alternate-output fragility

The Markdown and JSON output pipeline already has to recreate Hugo shortcode
behavior through regular-expression replacements. It explicitly handles a
subset of constructs, repeatedly unescapes HTML entities, and finally removes
all remaining shortcode tags.

See
[`layouts/partials/process-markdown-content.html`](layouts/partials/process-markdown-content.html).

This is evidence of the maintenance cost of storing presentation macros in the
source. Standardizing source Markdown would simplify HTML rendering, AI-facing
Markdown, JSON generation, indexing, and future migrations at the same time.

## Recommended migration sequence

### Phase 1: establish conventions and adapters

1. Define canonical conventions for links, images, callouts, code blocks, and
   tables.
2. Add link, image, blockquote, and table render hooks.
3. Add generator-independent link and content linting to CI.
4. Prevent new uses of replaceable shortcodes.

### Phase 2: remove high-volume presentation shortcodes

1. Migrate `relref` calls to normal Markdown links.
2. Migrate callouts after converting their nested shortcodes.
3. Convert simple image calls and address missing alt text.
4. Convert code wrappers to fenced code blocks.
5. Remove `table-scrollable` through the table hook.
6. Update importers and generators so they emit the new conventions.

### Phase 3: improve progressive enhancement

1. Change generated RESP tabs to ordinary headings.
2. Progressively enhance appropriate heading groups into tabs.
3. Replace small presentational shortcodes with semantic Markdown or HTML.
4. Continue using typed code fences for diagrams and structured interactive
   content.

### Phase 4: isolate true generation features

1. Define a generator-neutral schema for includes and data-driven components.
2. Expand those components into a portable Markdown build tree before Hugo
   runs.
3. Move mounted or duplicated content into the same preprocessing layer.
4. Define and document the portable front matter schema.

### Phase 5: prove portability

1. Feed the expanded Markdown tree to a second renderer in CI.
2. Compare page counts, resolved links, headings, metadata, and essential
   semantic content.
3. Treat visual parity as an adapter concern rather than an authoring-format
   concern.

## Conclusion

The repository is strongly tied to Hugo as a complete publishing system, but
the authoring format can be made substantially more portable without replacing
Hugo.

The immediate goal should be:

> Store semantic, readable Markdown in `content/`, and use Hugo only as a
> rendering and publishing adapter.

Render hooks provide a practical route for links, images, callouts, code
blocks, tables, and structured fenced blocks. True content-generation
features should be isolated behind a preprocessing boundary. Together, these
changes would reduce the cost and risk of evaluating another documentation
platform while preserving the existing Hugo site.
