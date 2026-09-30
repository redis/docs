# Documentation downloads

Readers pick products, a version for each versioned product, and a file format, and get one
`.tar.gz`. It is a widget, not a page: a dialog on the documentation page itself, opened from a
button at the bottom of the docs sidebar or from "Download documentation" in the page-meta
column. There is deliberately no separate download page. This note covers how the pieces fit
together and what will break if you change one of them.

The page-meta entry replaced a "Download Markdown" link that fetched the current page's
`index.html.md`. That one-page shortcut now lives only in the URL convention (add `.md` to any
page), which `content/ai-agent-resources.md` documents alongside the direct archive URLs.

## The pieces

| File | Role |
|------|------|
| `data/doc_bundles.json` | The single source of truth: which products are offered, where their pages live, which are versioned, and which formats exist. |
| `build/make_doc_bundles.py` | Packages a finished Hugo build into `<product>-<version>-<format>.tar.gz`. |
| `layouts/partials/download-docs.html` | The widget: a `<dialog>` holding the format picker and the product/version table. Included once per page from `docs-nav.html` and `docs-nav-collapsed.html`. |
| `layouts/partials/download-docs-trigger.html` | The button that opens it. Each placement passes its own classes; the sidebar uses an icon, the meta column an icon and a label. |
| `layouts/partials/meta-links.html` | The second trigger, alongside "Edit this page". |
| `layouts/partials/doc-bundle-versions.html` | Version list for one product, newest first. |
| `static/js/download-docs.js` | Opens the dialog and turns a selection into a download, merging bundles when more than one is picked. Its browser entry point is guarded on `document`, not on `module` being undefined -- another script defining a `module` global would otherwise stop the whole file running. |
| `.github/workflows/main.yml` | Packages bundles in each build job and uploads them in each deploy job. |

Everything is included with `partialCached`, because none of this markup depends on the page it
appears on -- and it appears on every documentation page.

Triggers render visible; the script only attaches the click handler. Gating visibility on the
script means any unrelated JavaScript failure makes the feature vanish silently, which is much
harder to notice than a button that does not respond.

The meta column is `hidden xl:block`, so below 1280px the sidebar button is the only way in.
That is why there are two triggers rather than one.

### Errors have to be carried out by hand

The merge builds a `ReadableStream` and reads it back with `new Response(...).blob()`. When that
stream errors, the browser does not necessarily reject with the stream's own reason -- it
substitutes a generic one ("The operation was aborted."), throwing away the only useful sentence,
which is *which archive failed and why*. So `mergedBlob` keeps the reason in a closure and
rethrows it. Node preserves the reason either way, so no test would have caught this; there is
one now that fakes the substitution.

A single-product download is a plain link, which the browser streams to disk but which reports
nothing at all if the archive is missing. Hence the `HEAD` before it.

Because the packager and the picker both read `data/doc_bundles.json`, every choice the picker
offers maps to a file name the packager produced. Nothing else keeps them in step -- don't
hard-code product ids in either one.

## The current page

The dialog's first table offers the one page the reader is on, as a single published
file rather than an archive -- restoring what the old "Download Markdown" link did.

Its title and filename are filled in by the script from `location`, not rendered by
Hugo: the dialog is included with `partialCached`, so one copy of its markup serves
every page and nothing page-specific can be baked into it. `pageFileFor()` maps a URL
to the file Hugo published for it (`index.html.md`, `index.json`), and is unit-tested
because the edge cases are easy to get wrong -- a URL without its trailing slash, the
site root, and `md-single`, which collapses to Markdown since one page is already one
file.

Single-page HTML is declined rather than served. A page's stylesheet, fonts, and links
all live at the site root, so a lone `index.html` opens unstyled with dead links --
which is exactly why the html *format* ships a product together with its assets. The
row says so and disables its button instead of handing over a broken file.

Roughly 40 pages in Redis Software have no `index.html.md` at all (they use custom
layouts), so the button checks with a `HEAD` first and reports which format is missing.

## One bundle per product, version, and format

Bundle names are `<docset-id>-<version>-<format>.tar.gz`, served from
`/docs/<path>/downloads/bundles/`. Inside, everything sits under
`redis-docs/<docset-id>-<version>/`.

That prefix is what makes multi-product downloads work: two bundles never write to the same
path, so Redis Software 7.22 and 8.0 can be unpacked side by side. Each product directory also
carries a `README.md` and a `MANIFEST.json`.

Formats come from Hugo's per-page output files (see `[outputs]` in `config.toml`):

- `md` -- `index.html.md` per page, flattened to `<page>.md`
- `md-single` -- every page concatenated into one `.md`, each preceded by its URL
- `html` -- `index.html` per page, keeping the published directory layout
- `json` -- `index.json` per page, flattened to `<page>.json`

In `md`, `md-single`, and `json` bundles, links and images are absolute `redis.io` URLs exactly
as published: nothing is rewritten, because those URLs stay valid.

`html` is different, and is the one part of the packaging with real logic in it.

## Offline HTML

The site addresses everything from its root -- `/css/...`, `/images/...`, `/operate/...` -- and
under `file://` the root is the filesystem root, so an untouched copy opens unstyled with dead
links. So for `html`:

- Every URL in an `href`/`src`/`poster`/`action`/`data-src` attribute is resolved against the
  build. If the target travels in the bundle it becomes a path relative to *the page holding it*;
  if not, it becomes an absolute URL on the live site. Anything with a scheme, a fragment, or a
  `data:` URI is left alone. Prose is never touched -- only attribute values -- so a page that
  quotes a URL keeps quoting it.
- Relative URLs are resolved against the page's own directory *on the site*, then handled exactly
  like root-relative ones. This is not optional: a handful of pages hand-write
  `<img src="../../../../../images/x.png">`, which climbs to the site root from where the page
  sits on redis.io but overshoots in a bundle rooted at one product, three levels shallower.
  Left alone, those images are dead in every copy -- 43 of them in Redis Software alone.
- Referenced assets are collected and included: stylesheets, fonts, scripts, images. Only what
  the pages actually reference, and stylesheets are followed too, since they pull in fonts and
  background images of their own. Their `url()` values are rewritten relative to the stylesheet.
- The site header is emptied -- search, product menus, and sign-in all need the live site -- but
  the bar element itself is kept, so the page keeps its proportions.
- The sidebar is pruned to the product the bundle holds. The test is structural rather than
  configured: after rewriting, only what travels in the bundle has a relative link, so a list
  item whose every link is absolute leads somewhere this copy does not go. A Redis for Kubernetes
  copy therefore stops offering Redis Software and Redis Cloud, while a whole-section bundle like
  `develop` keeps all of its own areas -- the same rule gives the right answer for both.
  Watch out here: the nav templates never close their `<li>` elements. That is legal HTML, but it
  means an item ends at the next item, or at the end of its list, not at a `</li>`.
- In a versioned bundle the version's own nav node is lifted out and its children promoted, so the
  tree reads "Redis Software > Clusters" rather than "Redis Software > 8.0 > Clusters". The whole
  download is that version; the level only restates it. The node is found by where it points --
  at the bundle's root page -- not by its label. Latest bundles keep their product level, where
  the same node is the product itself.
- Anything a template marked `data-offline-hide` is removed, element and contents. That is how
  the page-tools column ("Edit this page", "Create an issue", "Download documentation", "Ask AI
  to explain this page") is dropped: each needs the live site or a repo round trip, so in a copy
  they would only mislead. Nesting is counted, so an element containing another of the same name
  is removed whole. **To drop something else from the offline copies, mark it in the template
  rather than teaching the packager to recognise its markup** -- `grep -r data-offline-hide
  layouts/` shows what is currently dropped.
- The notice saying this is a copy goes directly *after* that header, linking to the page's live
  URL. Position matters: above the header it is the first thing the sticky header scrolls over,
  which is how it was first written and why it was easy to miss. It is styled inline, because
  the situation it explains is one where the stylesheet is missing. Pages with no header at all
  fall back to placing it at the top of `<body>`.

The path the site is published under (`""` locally, `/docs/latest` in production) is read back
off one of the page's own asset URLs rather than configured, so this works in both.

A page link that leads to another product resolves on the live site, not in the bundle: a
Redis Software page linking into Develop stays absolute. Downloading both products does not
join them up either -- each is rewritten against its own contents.

## Bundles are reproducible on purpose

Fixed mtimes, sorted entries, and no build timestamp anywhere inside the archive. An unchanged
product therefore produces identical bytes, and `gsutil rsync -c` skips it instead of
re-uploading ~95 MB on every push. Anything that varies per build (sizes, checksums) goes in
the `_bundles-<scope>.json` index written next to the archives, never inside them.

If you add a timestamp, a hostname, or a commit sha to a bundle, you undo this.

## How CI assembles the set

The versioned products are built by separate matrix jobs, so no single job can see the whole
set. Each job packages what it has:

- `setup_and_build_latest` -> every unversioned product plus the current release of the
  versioned ones (its build has no versioned content), artifact `bundles-latest`
- `build_rs` / `build_kubernetes` / `build_rdi` / `build_redisvl` -> one product at one
  version, via `--only <docset-id> --version <version>`

Every deploy job then uploads its own archives into the same bucket directory. Two consequences:

1. `deploy_latest`'s destructive mirror excludes `^downloads/bundles/`. Without that, `-d`
   would delete every versioned archive, because that job does not have them locally.
2. Nothing prunes the directory. Archives for a version that has been removed from `content/`
   stay in the bucket; the picker stops offering them, so they are unreachable rather than
   wrong. Delete them by hand if it matters.

Version lists come from the `<product>-versions` files CI writes for the sidebar selector. A
versioned matrix build deletes every other version's content directory, so those files are the
only remaining record of the full list; the picker falls back to reading `content/` so it still
works in a local build.

### The Content-Encoding trap

`gsutil` guesses metadata from file extensions, and for `.tar.gz` it guesses
`Content-Encoding: gzip`. Browsers then inflate the archive in transit and save a plain tar
under a `.tar.gz` name -- which fails on extract with no clue why. The upload therefore pins
`Content-Type: application/gzip` (so there is nothing to guess) and clears any encoding that
slipped through. Don't let these archives go up through a plain `rsync`.

## Adding a product

Add an entry to `data/doc_bundles.json` with `id`, `title`, and `path` (relative to the site
root). Then:

- If the product is versioned, add `versions: "<key>"`, matching the `<key>-versions` file CI
  writes, and add a packaging step to that product's matrix build job plus a bundles artifact
  download to its deploy job.
- If its directory physically contains another product that is offered separately, list that
  child in `exclude` (paths relative to `path`). Otherwise the child ships twice, under two
  different versions, silently. Say so in `description` too, so the row explains itself.

## Testing

```bash
python3 build/test_make_doc_bundles.py   # packaging: layout, exclusions, reproducibility
node build/test_download_docs.cjs        # merging: real bundles, verified with system tar
make bundles                             # package a local build into ./bundles
```

The merge tests matter more than they look. A tar ends with zero blocks and every reader stops
at the first set it meets, so a bad seam does not raise an error -- it silently yields an
archive holding only the first product.

### Stale build output will end up in the archives

The packager reads `public/`, and Hugo does not remove what it no longer generates. A `public/`
rebuilt in place therefore still holds pages whose source was renamed or deleted, and nothing
distinguishes them from real ones: they ship in the archives, and an archived-version directory
that no longer exists produces a whole phantom bundle (`--all-versions` discovers versions from
the build output, not from `content/`). CI never sees this -- fresh checkout, empty `public/` --
so it is purely a local trap. `make serve_downloads` builds with `--cleanDestinationDir` for that
reason; a bare `hugo` does not.

Aliases are a different thing and are not stale. A renamed page leaves a meta-refresh stub at its
old URL, which Hugo writes as html only -- no Markdown, no JSON. Those are filtered out of html
bundles, or a product would ship the same page twice under two names and count both. It is why an
html bundle used to report hundreds more pages than the same product's md bundle.

### Driving the widget locally

```bash
make serve_downloads                     # every format, ~95 MB
make serve_downloads BUNDLE_FORMATS=md   # Markdown only, much quicker
```

This builds the site, packages the archives into `static/downloads/bundles`, and then runs
`hugo serve`. Because `hugo serve` mounts `static/` at the site root, the archives land on
exactly the URL the widget asks for (`/downloads/bundles/<archive>`), same-origin, and Hugo
serves them as `application/gzip` with no `Content-Encoding` -- the same conditions as
production. So the whole path is exercised for real: single-product downloads, multi-product
merging in the browser, and the resulting `.tar.gz` opening in `tar`.

No separate file server is involved on purpose. One would have to run on another port, which
makes the fetches cross-origin and needs CORS headers that production never sends -- testing a
different code path from the one that ships.

`static/downloads/` is gitignored; ~95 MB of archives must not end up in the repository.
