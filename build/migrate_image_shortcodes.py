#!/usr/bin/env python3
"""Convert standalone `{{< image >}}` shortcodes to Markdown images rendered by
layouts/_default/_markup/render-image.html.

    {{< image filename="/images/x.png" alt="Alt" width="300px" class="inline" >}}
becomes
    ![Alt](/images/x.png)
    {width="300px" class="inline"}

Only an image that is its own paragraph converts: Goldmark attaches an
attribute line to a standalone image and to nothing else, so an image inside a
sentence, a table cell, or a tight list item would silently lose its width and
class. Those are left as shortcodes and reported. A missed rewrite is fine, a
wrong one is not.

Every path is rewritten to site-root form (`/images/...`); the bare
(`images/...`) and dot-relative (`../images/...`) forms the shortcode tolerated
are normalized. A path is converted only if the file exists under static/.

Usage:
  build/migrate_image_shortcodes.py [--dry-run] <file>...

Prints one line per skipped shortcode and a summary. Idempotent.
"""

import collections
import os
import re
import sys

REPO = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SHORTCODE_RX = re.compile(r'\{\{[<%]\s*image\s+(.*?)\s*[%>]\}\}', re.S)
# Hugo also accepts unquoted values (`width=80%`, ~130 in the corpus). A value
# with a stray quote (`width=50%"`) is left unparsed and so skipped.
ATTR_RX = re.compile(r'(\w+)\s*=\s*(?:"([^"]*)"|([^\s"]+)(?=\s|$))')
KNOWN_KEYS = {"filename", "alt", "width", "class"}
# Characters that would need Markdown escaping in `![...]`. The hook reads
# .PlainText, which keeps backslash escapes verbatim, so escaping would leak
# backslashes into the alt attribute -- skip instead.
UNSAFE_ALT_RX = re.compile(r'[\[\]\\`]')
UNSAFE_PATH_RX = re.compile(r'[\s()<>]')
# Prefix a standalone image line may carry: indentation and blockquote markers.
PREFIX_RX = re.compile(r'^((?:[ \t]*>)*[ \t]*)')


def is_boundary(line):
    """A line that can't share a paragraph with the image: blank (apart from
    blockquote markers), a thematic break or frontmatter fence, or an ATX
    heading."""
    s = line.rstrip("\r")
    return (re.fullmatch(r'[ \t>]*', s) is not None or s.strip() == "---"
            or re.match(r'[ \t>]*#{1,6}(\s|$)', s) is not None)


def convert_file(path, dry_run, skips, counts):
    # newline="" keeps any \r\n intact; the default would silently convert it.
    text = open(path, encoding="utf-8", newline="").read()
    lines = text.split("\n")
    changed = False
    fence = None
    out = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        fm = re.match(r'(?:[ \t>]*)(`{3,}|~{3,})', line)
        if fm:
            marker = fm.group(1)
            if fence is None:
                fence = marker[0]
            elif marker[0] == fence:
                fence = None
            out.append(line)
            continue
        if fence or "image" not in line or not SHORTCODE_RX.search(line):
            out.append(line)
            continue

        where = f"{os.path.relpath(path, REPO)}:{i + 1}"
        m = SHORTCODE_RX.search(line)
        prefix = PREFIX_RX.match(line).group(1)
        rest_before = line[len(prefix):m.start()]
        rest_after = line[m.end():]

        def skip(reason):
            skips.append(f"{where}: {reason}: {stripped[:140]}")
            counts["skipped:" + reason] += 1

        if len(SHORTCODE_RX.findall(line)) > 1:
            skip("several images on one line"); out.append(line); continue
        if rest_before.strip() or rest_after.strip():
            ctx = "table cell" if "|" in rest_before and "|" in rest_after else "inline in text"
            skip(ctx); out.append(line); continue
        prev_blank = i == 0 or is_boundary(lines[i - 1])
        next_blank = i == len(lines) - 1 or is_boundary(lines[i + 1])
        if not (prev_blank and next_blank):
            skip("shares a paragraph with adjacent text"); out.append(line); continue

        attrs = {k: q if q or not u else u for k, q, u in ATTR_RX.findall(m.group(1))}
        leftover = ATTR_RX.sub("", m.group(1)).strip()
        unknown = set(attrs) - KNOWN_KEYS
        if leftover or unknown:
            skip(f"unparsed attributes {sorted(unknown) or leftover!r}"); out.append(line); continue
        fname = attrs.get("filename", "")
        alt = attrs.get("alt", "")
        if not fname:
            skip("no filename"); out.append(line); continue
        if UNSAFE_ALT_RX.search(alt):
            skip("alt text needs escaping"); out.append(line); continue
        if UNSAFE_PATH_RX.search(fname):
            skip("path needs escaping"); out.append(line); continue

        rel = re.sub(r'^(?:\.{1,2}/|/)+', "", fname)
        if not os.path.isfile(os.path.join(REPO, "static", rel.split("#")[0])):
            skip("file not in static/"); out.append(line); continue
        if fname.startswith("../") or fname.startswith("./"):
            counts["path: dot-relative -> root"] += 1
        elif not fname.startswith("/"):
            counts["path: bare -> root"] += 1

        eol = "\r" if line.endswith("\r") else ""
        new = [f"{prefix}![{alt}](/{rel}){eol}"]
        attr_line = " ".join(f'{k}="{attrs[k]}"' for k in ("width", "class") if k in attrs)
        if attr_line:
            new.append(f"{prefix}{{{attr_line}}}{eol}")
        out.extend(new)
        counts["converted"] += 1
        changed = True

    if changed:
        counts["files changed"] += 1
        if not dry_run:
            open(path, "w", encoding="utf-8", newline="").write("\n".join(out))


def main(argv):
    dry_run = "--dry-run" in argv
    files = [a for a in argv if a != "--dry-run"]
    if not files:
        sys.exit(__doc__)
    skips, counts = [], collections.Counter()
    for f in files:
        convert_file(f, dry_run, skips, counts)
    for s in skips:
        print("SKIP", s)
    for k, v in sorted(counts.items()):
        print(f"{v:6d}  {k}")


if __name__ == "__main__":
    main(sys.argv[1:])
