#!/usr/bin/env python3
"""Build a "before/after" restructuring diagram for a docs section.

Walks a Hugo docs folder, renders its page/section tree as two identical
columns (before = left, after = right) joined by arrows, and writes a
draw.io-editable SVG. The "after" column is a starting point: open the file in
diagrams.net and drag the after-column boxes into their new positions.

Conventions baked in:
  * Order follows the Hugo `weight` frontmatter (ties broken by label).
  * Box text is the `linkTitle` frontmatter (falls back to `title`, then name).
  * Folders/sections (anything with an `_index.md`) are shaded yellow;
    individual pages are white.
  * Asset folders (no `_index.md`, e.g. holding only JSON) are skipped.
  * `--collapse` folders are shown as a single box with one indented "..."
    sub-box, hiding their many similar children.

See SKILL.md for usage guidance.
"""

import argparse
import html
import os
import re
import sys
import xml.etree.ElementTree as ET

FONT = "Space Grotesk"
W, H_BOX, PITCH = 190, 24, 32
INDENT = 30
START_Y = 30
LBASE = 40
GAP = 130  # constant horizontal gap between the two columns

YELLOW_FILL, YELLOW_STROKE = "#fff2cc", "#d6b656"

# Edge routing presets. Every arrow exits the right side of the left box and
# enters the left side of the right box.
#
#   straight    point-to-point diagonal (edgeStyle=none). Each line has its own
#               slope, so they cross but never stack. This is what actually
#               cures the overlap once after-column boxes are moved -> default.
#   curved      draw.io's "Curved" preset (orthogonalEdgeStyle + curved=1):
#               smooth S-bends. Prettier, but still routes through the shared
#               central channel, so heavily-moved lines can still overlay.
#   orthogonal  right-angle rectilinear routing (the draw.io default); tidy at
#               rest but overlays badly after a rearrange.
#
# A genuine point-to-point bezier isn't available without per-edge waypoints,
# which would break when the user drags boxes around -- so it's deliberately
# not offered.
_EXIT_ENTRY = ("exitX=1;exitY=0.5;exitDx=0;exitDy=0;"
               "entryX=0;entryY=0.5;entryDx=0;entryDy=0;")
EDGE_STYLES = {
    "straight": "edgeStyle=none;rounded=0;" + _EXIT_ENTRY,
    "curved": ("edgeStyle=orthogonalEdgeStyle;curved=1;orthogonalLoop=1;"
               "jettySize=auto;") + _EXIT_ENTRY,
    "orthogonal": ("edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;"
                   "jettySize=auto;") + _EXIT_ENTRY,
}


def front(path):
    """Parse the YAML/TOML frontmatter of a markdown file into a flat dict."""
    try:
        txt = open(path, encoding="utf-8").read()
    except OSError:
        return {}
    m = (re.match(r'^﻿?---\n(.*?)\n---', txt, re.S)
         or re.match(r'^﻿?\+\+\+\n(.*?)\n\+\+\+', txt, re.S))
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        mm = re.match(r'\s*([A-Za-z_]+)\s*[:=]\s*(.*)', line)
        if mm:
            fm[mm.group(1).lower()] = mm.group(2).strip().strip('"').strip("'")
    return fm


def weight(fm):
    try:
        return int(fm.get("weight", "999999"))
    except ValueError:
        return 999999


def label(fm, fallback):
    return fm.get("linktitle") or fm.get("title") or fallback


def walk(d, depth, root, collapse, virtual, expanded):
    """Return [(depth, label, kind)] rows for directory `d`.

    kind is "folder", "page", or "ellipsis". `virtual` maps an absolute
    directory path to extra (weight, label) page entries to merge in (used for
    pages that exist on another branch but not the working tree). `expanded`
    is a set this records each visited dir into, so build_rows can tell which
    `virtual` entries actually got merged vs silently dropped.
    """
    expanded.add(os.path.abspath(d))
    entries = []
    for name in os.listdir(d):
        p = os.path.join(d, name)
        # Normalise to forward slashes: os.path.relpath uses "\" on Windows,
        # but --collapse args (and the SKILL examples) use "/", so an un-
        # normalised compare in `rel in collapse` would never match there.
        rel = os.path.relpath(p, root).replace(os.sep, "/")
        if os.path.isdir(p):
            idx = os.path.join(p, "_index.md")
            if not os.path.exists(idx):
                continue  # asset folder, not a Hugo section
            fm = front(idx)
            entries.append((weight(fm), label(fm, name), p, True, rel))
        elif name.endswith(".md") and name != "_index.md":
            fm = front(p)
            entries.append((weight(fm), label(fm, name[:-3]), p, False, rel))
    for w, lab in virtual.get(os.path.abspath(d), []):
        entries.append((w, lab, None, False, None))
    entries.sort(key=lambda e: (e[0], e[1].lower()))

    rows = []
    for w, lab, p, isdir, rel in entries:
        rows.append((depth, lab, "folder" if isdir else "page"))
        if isdir:
            if rel in collapse:
                rows.append((depth + 1, "...", "ellipsis"))
            else:
                rows.extend(walk(p, depth + 1, root, collapse, virtual,
                                 expanded))
    return rows


def fill_for(kind):
    if kind in ("root", "folder"):
        return YELLOW_FILL, YELLOW_STROKE
    return None, None


def esc(s):
    return html.escape(s, quote=True)


def build_rows(root, collapse, adds):
    collapse = set(collapse)
    # Queue every --add as a virtual page keyed on its parent dir. We do NOT try
    # to predict whether walk() will render it -- a virtual page shows up iff
    # walk() expands its parent dir, and the conditions for that (dir exists, has
    # an _index.md, is in-tree, isn't collapsed) are exactly walk()'s own logic.
    # Re-deriving them here is what kept leaking edge cases. Instead, let walk
    # record the dirs it expanded and reconcile against that ground truth below.
    # The one thing we still check up front is the on-disk case: there walk emits
    # the page itself, so a virtual copy would duplicate rather than drop.
    virtual = {}
    queued = []  # (parent_abs, rel) for post-walk reconciliation
    for rel, lab, w in adds:
        if os.path.exists(os.path.join(root, rel)):
            print("note: --add %r is already in the working tree; using the "
                  "on-disk page (not duplicating)" % rel, file=sys.stderr)
            continue
        rel_norm = rel.replace(os.sep, "/")
        parent_rel = rel_norm.rsplit("/", 1)[0] if "/" in rel_norm else ""
        parent_abs = os.path.abspath(os.path.join(root, parent_rel))
        virtual.setdefault(parent_abs, []).append((w, lab))
        queued.append((parent_abs, rel))

    rootfm = front(os.path.join(root, "_index.md"))
    rows = [(0, label(rootfm, os.path.basename(os.path.normpath(root))), "root")]
    expanded = set()
    rows.extend(walk(root, 1, root, collapse, virtual, expanded))

    # Reconcile: warn for any --add whose parent walk never expanded -- one check
    # that covers missing, collapsed, asset-folder, and out-of-tree parents.
    for parent_abs, rel in queued:
        if parent_abs not in expanded:
            print("warning: --add %r not shown: its folder %r is not an "
                  "expanded section (missing, collapsed, an asset folder "
                  "without _index.md, or outside the tree)"
                  % (rel, os.path.relpath(parent_abs, root)), file=sys.stderr)
    return rows


def build_svg(rows, edge_style="straight"):
    max_depth = max(d for d, _, _ in rows)
    page_w = LBASE + W + GAP + max_depth * INDENT + W + 40
    rbase = LBASE + W + GAP
    page_h = START_Y + len(rows) * PITCH + 20

    cells = []

    def vcell(cid, value, x, y, fill, stroke, bold):
        style = "rounded=1;whiteSpace=wrap;html=1;fontFamily=%s;" % FONT
        if bold:
            style += "fontStyle=1;"
        if fill:
            style += "fillColor=%s;strokeColor=%s;" % (fill, stroke)
        cells.append(
            '<mxCell id="%s" value="%s" style="%s" vertex="1" parent="1">'
            '<mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/>'
            '</mxCell>' % (cid, esc(value), style, x, y, W, H_BOX))

    edge_base = EDGE_STYLES[edge_style]

    def ecell(cid, src, tgt):
        style = "%shtml=1;strokeColor=#999999;fontFamily=%s;" % (edge_base, FONT)
        cells.append(
            '<mxCell id="%s" style="%s" edge="1" parent="1" source="%s" '
            'target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>'
            % (cid, style, src, tgt))

    geom = []
    for i, (depth, lab, kind) in enumerate(rows):
        y = START_Y + i * PITCH
        lx = LBASE + depth * INDENT
        rx = rbase + depth * INDENT
        fill, stroke = fill_for(kind)
        vcell("L%d" % i, lab, lx, y, fill, stroke, kind == "root")
        vcell("R%d" % i, lab, rx, y, fill, stroke, kind == "root")
        if kind not in ("root", "ellipsis"):
            ecell("e%d" % i, "L%d" % i, "R%d" % i)
        geom.append((lx, rx, y, lab, kind))

    model = (
        '<mxGraphModel dx="960" dy="640" grid="1" gridSize="10" guides="1" '
        'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
        'pageWidth="%d" pageHeight="%d" math="0" shadow="0">\n'
        '      <root>\n'
        '        <mxCell id="0"/>\n'
        '        <mxCell id="1" parent="0"/>\n'
        '        %s\n'
        '      </root>\n'
        '    </mxGraphModel>' % (page_w, page_h, "\n        ".join(cells)))

    mxfile = (
        '<mxfile host="app.diagrams.net" agent="Claude Code" '
        'version="27.0.8" scale="1" border="0">\n'
        '  <diagram name="Page-1" id="docs-restructure">\n'
        '    %s\n  </diagram>\n</mxfile>' % model)

    svg = ['<?xml version="1.0" encoding="UTF-8"?>']
    svg.append(
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" '
        'width="%dpx" height="%dpx" viewBox="-0.5 -0.5 %d %d" content="%s">'
        % (page_w, page_h, page_w, page_h, esc(mxfile)))
    svg.append('<rect x="0" y="0" width="%d" height="%d" fill="#ffffff"/>'
               % (page_w, page_h))

    def box(x, y, lab, kind):
        f, s = fill_for(kind)
        svg.append('<rect x="%d" y="%d" width="%d" height="%d" rx="5" ry="5" '
                   'fill="%s" stroke="%s"/>'
                   % (x, y, W, H_BOX, f or "#ffffff", s or "#000000"))
        fw = 'font-weight:bold;' if kind == "root" else ''
        svg.append('<text x="%.1f" y="%.1f" text-anchor="middle" '
                   'dominant-baseline="middle" style="font-family:%s;'
                   'font-size:11px;fill:#000000;%s">%s</text>'
                   % (x + W / 2, y + H_BOX / 2, FONT, fw, html.escape(lab)))

    def arrow(x1, y, x2):
        svg.append('<path d="M %d %d L %d %d" stroke="#999999" fill="none"/>'
                   % (x1, y, x2 - 8, y))
        svg.append('<path d="M %d %d L %d %d L %d %d Z" fill="#999999" '
                   'stroke="#999999"/>'
                   % (x2, y, x2 - 9, y - 4, x2 - 9, y + 4))

    for lx, rx, y, lab, kind in geom:
        if kind not in ("root", "ellipsis"):
            arrow(lx + W, y + H_BOX / 2, rx)
        box(lx, y, lab, kind)
        box(rx, y, lab, kind)
    svg.append('</svg>')
    return "\n".join(svg), page_w, page_h


def parse_add(spec):
    parts = spec.split("::")
    if len(parts) != 3:
        raise argparse.ArgumentTypeError(
            "--add must be REL_PATH::LABEL::WEIGHT, got %r" % spec)
    rel, lab, w = parts
    return (rel, lab, int(w))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("root", help="docs section folder (the diagram root)")
    ap.add_argument("--out", help="output .drawio.svg path "
                    "(default: <section>-restructure.drawio.svg)")
    ap.add_argument("--collapse", nargs="*", default=[], metavar="REL",
                    help="folder paths (relative to root) to show collapsed "
                    "as a single box with a '...' sub-box")
    ap.add_argument("--add", action="append", default=[], type=parse_add,
                    metavar="REL::LABEL::WEIGHT",
                    help="manually inject a page that is not in the working "
                    "tree (e.g. exists only on another branch); repeatable")
    ap.add_argument("--edge-style", choices=sorted(EDGE_STYLES),
                    default="straight",
                    help="arrow routing (default: straight). 'straight' = "
                    "point-to-point diagonals (best for avoiding overlap when "
                    "boxes move); 'curved' = smooth orthogonal S-bends "
                    "(prettier but still centre-routed); 'orthogonal' = "
                    "right-angle rectilinear.")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        sys.exit("error: not a directory: %s" % root)
    out = args.out or (os.path.basename(os.path.normpath(root))
                       + "-restructure.drawio.svg")

    rows = build_rows(root, args.collapse, args.add)
    svg, pw, ph = build_svg(rows, args.edge_style)
    print("Edge style: %s" % args.edge_style)

    # Validate *before* writing, so a parse failure never leaves an invalid
    # file at --out (the skill promises validated output): both the outer SVG
    # and the embedded editable model must parse.
    r = ET.fromstring(svg)
    model = ET.fromstring(r.get("content"))
    nv = sum(1 for c in model.iter("mxCell") if c.get("vertex") == "1")
    ne = sum(1 for c in model.iter("mxCell") if c.get("edge") == "1")

    open(out, "w", encoding="utf-8").write(svg)

    print("Wrote %s  (%dx%d, %d rows, %d boxes, %d arrows)"
          % (out, pw, ph, len(rows), nv, ne))
    print("\nTree (before == after):")
    for depth, lab, kind in rows:
        print("  " * depth + lab + ("/" if kind in ("root", "folder") else ""))


if __name__ == "__main__":
    main()
