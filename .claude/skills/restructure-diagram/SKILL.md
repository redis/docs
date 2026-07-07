---
name: restructure-diagram
description: "Create a before/after restructuring diagram for a docs section. Use when planning how to reorganise a folder under content/ — produces a draw.io-editable .drawio.svg with two identical columns (current structure left, a copy on the right) joined by arrows, so you can drag the right-hand boxes into their proposed new layout. Reads Hugo weight/linkTitle frontmatter."
---

# Docs restructuring diagram

Generate a planning diagram that mirrors a docs section's folder/page tree as
two identical columns — **before** (left) and **after** (right) — with an arrow
joining each item to its copy. The after column starts as an exact duplicate;
the human then opens the file in [diagrams.net](https://app.diagrams.net) and
drags the after boxes into the proposed new structure, the arrows tracking
where each page moved.

This is the tool that drew the NRedisStack client-docs migration diagram and the
RDI `redis-data-integration` restructure. The output is an *editable* SVG: it
renders as an image anywhere, and opening it in draw.io gives back real boxes
and arrows because the model is embedded in the SVG `content` attribute.

## When to use

- Planning a reorganisation of any folder under `content/` (moving pages
  between sections, splitting/merging sections, reordering).
- Sharing a "here's the current shape, here's the proposed shape" picture with
  reviewers before doing the actual file moves.

## How it reads the docs

The generator (`build_diagram.py`) walks the section folder and builds the tree
automatically. It does **not** guess — it reads the source:

- **Order** follows each file's Hugo `weight` frontmatter (ties broken
  alphabetically by label), matching the live left-hand nav.
- **Box text** is the `linkTitle` frontmatter (falls back to `title`, then the
  filename) — generally more compact than the full title.
- **Folders/sections** (anything with an `_index.md`) are shaded yellow;
  individual pages are white.
- **Asset folders** with no `_index.md` (e.g. ones holding only `openapi.json`
  or dashboard JSON) are skipped — they aren't navigable doc sections.

## Workflow

1. **Pick the section root** — the folder to diagram, e.g.
   `content/integrate/redis-data-integration`.

2. **Decide which folders to collapse.** Some sections contain many similar
   child pages that aren't individually interesting for a restructure (a long
   list of CLI commands, per-database setup pages, every release note). Collapse
   those: the folder shows as one yellow box with a single indented `...`
   sub-box, instead of dozens of rows. Pass them via `--collapse` as paths
   **relative to the root**. Everything not collapsed is expanded in full.

3. **Run the generator** (from the repo root):
   ```bash
   python3 .claude/skills/restructure-diagram/build_diagram.py \
     content/integrate/redis-data-integration \
     --out RDI-docs-restructure.drawio.svg \
     --collapse data-pipelines/prepare-dbs data-pipelines/transform-examples \
                reference/cli reference/data-transformation release-notes
   ```
   It writes the `.drawio.svg`, validates that both the SVG and the embedded
   model parse, and prints the row count and the tree it produced. Read the
   printed tree back to the user to confirm it's what they expected.

   **zsh gotcha:** pass each `--collapse` path as its own literal token (as
   above). zsh does *not* word-split an unquoted variable, so
   `--collapse $PATHS` sends all the paths as one string that matches nothing
   and silently collapses nothing (you'll see a much larger row count). If the
   row count looks too big, this is the cause.

4. **Confirm placement.** The default output filename is
   `<section>-restructure.drawio.svg` in the current directory. These are
   planning artifacts — write them to the repo root (or wherever the user asks),
   **not** into `content/`, so they aren't published. Mention where you put it.

5. **Hand off.** Tell the user the after column is currently identical and is
   theirs to rearrange in draw.io.

## Arrow routing (`--edge-style`)

The arrows join each before box to its after copy. Default is `straight`.

- `straight` *(default)* — point-to-point diagonals. Each line has its own
  slope, so once after-column boxes are moved the lines cross but never stack.
  This is the routing that actually keeps a busy diagram legible.
- `curved` — draw.io's "Curved" preset (smooth orthogonal S-bends). Looks
  softer, but still routes through the shared central channel, so heavily-moved
  lines can still overlay. Use for aesthetics, not to fix overlap.
- `orthogonal` — right-angle rectilinear (draw.io's default). Tidy at rest;
  overlays badly after a rearrange.

Note: a true point-to-point *bezier* isn't offered — draw.io only curves edges
that have bends (orthogonal routing) or fixed waypoints, and baked-in waypoints
would break as soon as the user drags a box. `straight` is the closest thing to
"clean independent lines". The edge style can always be changed afterwards in
draw.io's Format panel.

## Cross-branch pages (`--add`)

The walk only sees the working tree. If a page exists on another branch (e.g. an
in-progress page on a feature branch you're not on) and should appear in the
diagram, inject it manually:

```
--add "data-pipelines/supported-types.md::Supported data types::80"
```

Format is `REL_PATH::LABEL::WEIGHT` (path relative to root). The page is placed
among its siblings in `weight` order, just as if it were on disk. Repeatable.
Prefer regenerating from the branch that has the page if you can; use `--add`
only when you can't.

## Guardrails

- **Check the branch first.** The diagram reflects the current working tree.
  Note the branch in your summary — a page missing from the diagram is usually a
  page that lives on a different branch, not an error. (This is easy to misread
  as data loss.)
- **Don't hand-edit the XML** for structural changes — change the inputs and
  rerun, so the diagram stays reproducible.
- The script needs no network and only reads the docs tree; it's safe to run in
  the sandbox.

## Files

- `build_diagram.py` — the generator. `--help` lists all options. Layout
  constants (box size, indent, colours, font) are near the top if you need to
  tweak the look; the default style matches the existing migration diagrams
  (Space Grotesk, yellow `#fff2cc` sections).
