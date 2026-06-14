# Tabs

Some credits:

* Radio tabs: https://www.codeinwp.com/snippets/accessible-pure-css-tabs/
* Hugo scaffold: https://blog.jverkamp.com/2021/01/27/a-tabbed-view-for-hugo/

## Client-example code: slice + dedup

`clients-example` panels would otherwise embed the *entire* source file for
every step and every language, so a long tutorial (e.g. Streams) ballooned to
tens of MB of HTML. To keep pages small while preserving the eyeball ("show the
step in the context of the whole file") toggle:

* **Per-step range (`named_steps`):** `source.html` slices the file to the step's
  contiguous line range and renders only that as the default `.step-code-view`.
  The full highlighted file is emitted **once per page** in a hidden
  `<template id="tce-fullsrc-{key}">` (deduped by file path via `.Page.Store`).
  The panel carries `data-fullfile-key` and `data-hl-range`; the eyeball
  (`toggleVisibleLinesForCodetabs` in `static/js/codetabs.js`) clones that
  template on demand, re-tagging the range as `.hl`.
* **No per-step range (legacy):** the whole file is rendered inline **once per
  page** (`data-legacy-src`); repeat occurrences are emitted empty
  (`data-legacy-clone`) and hydrated client-side from that single copy.

Net effect: each source file is embedded once per page. (The rare exception is a
file used by *both* paths on one page — some steps with a range, some without —
which yields one template plus one legacy copy; harmless and uncommon.)
`build/check_page_sizes.py` (`make check_page_sizes`) guards against regrowth.
