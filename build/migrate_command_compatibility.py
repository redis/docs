"""Move Redis Software and Redis Cloud compatibility out of command-page tables.

Every ``content/commands/*.md`` page carried a hand-written table under
``## Redis Software and Redis Cloud compatibility``, and the operate section kept
a second hand-written copy of the same facts. This one-off migration parses each
command page's table into ``compatibility:`` frontmatter, replaces the table with
the ``command-compatibility`` shortcode, and cross-checks the result against the
operate tables, so the frontmatter becomes the single source.

Tables are parsed by header name, not by column position. Four layouts exist:
core (``Standard`` / ``Active-Active`` stacked in one cell per product), module
(one ``Supported`` cell for Software, Cloud plans stacked), and both of those
with a ``Redis Software Flex`` column added.

Run without ``--write`` to print the census and the disagreement report only.
"""

import argparse
import glob
import os
import re
import sys

import yaml

HEADING = "## Redis Software and Redis Cloud compatibility"
SHORTCODE = "{{< command-compatibility >}}"

# (title attribute, icon entity) -> status. The icon is what separates a plain
# "Not supported" from one with a documented alternative (FT.CONFIG GET/SET).
STATUS = {
    ("Supported", "&#x2705;"): "supported",
    ("Not supported", "&#x274c;"): "unsupported",
    ("Limited", "&#x26A0;&#xFE0F;"): "limited",
    ("Not supported", "&#x26A0;&#xFE0F;"): "workaround",
}

# Header text (with <br /> collapsed to a space) -> (product, fixed variant or None).
# None means the variant comes from each stacked label in the cell.
COLUMNS = {
    "Redis Software": ("software", None),
    "Redis Software Flex": ("software", "flex"),
    "Redis Cloud": ("cloud", None),
    "Redis Cloud Flexible & Annual": ("cloud", "pro"),
    "Redis Cloud Free & Fixed": ("cloud", "essentials"),
}

# Stacked cell label -> variant. A status word as the label means the cell
# makes no per-variant claim.
LABELS = {
    "Standard": "standard",
    "Active-Active": "active_active",
    "Flexible & Annual": "pro",
    "Free & Fixed": "essentials",
    "Supported": "general",
    "Not supported": "general",
    "Limited": "general",
}

VARIANT_ORDER = ["general", "standard", "pro", "essentials", "active_active", "flex"]

PART = re.compile(
    r'^<span title="(?P<title>[^"]*)">\s*(?:<nobr>)?\s*'
    r'(?P<icon>&#x[0-9A-Fa-f]+;(?:&#xFE0F;)?)\s*'
    r'(?P<label>[^<\\*]*?)\s*(?P<mark>(?:\\?\*){1,2})?\s*'
    r'(?:</nobr>)?\s*</span>\s*(?:</nobr>)?\s*'
    r'(?:<sup>(?:\[)?(?P<sup>\d+)(?:\]\([^)]*\))?</sup>)?\s*$'
)
BR = re.compile(r"<br\s*/?>(?:</br>)?")
FOOTNOTE = re.compile(r"^(\d+)\.\s+(?:<a [^>]*>)?(?:</a>)?\s*(.*)$")


class ParseError(Exception):
    pass


def split_row(line):
    line = line.strip()
    if not (line.startswith("|") and line.endswith("|")):
        raise ParseError(f"row does not start and end with '|': {line[:60]}")
    return [c.strip() for c in line[1:-1].split("|")]


def header_name(cell):
    return re.sub(r"\s+", " ", BR.sub(" ", cell)).strip()


def mark_key(mark):
    return mark.replace("\\", "") if mark else None


def split_notes(cell):
    """Split the Notes cell into general notes and notes keyed by marker."""
    general, marked = [], {}
    for seg in BR.split(cell):
        seg = seg.strip()
        if not seg:
            continue
        m = re.match(r"^((?:\\\*){1,2})\s*(.*)$", seg)
        if m:
            marked[m.group(1).replace("\\", "")] = m.group(2).strip()
        else:
            general.append(seg)
    return general, marked


def parse_table(rows, footnote_lines):
    hdr = split_row(rows[0])
    cells = [c.replace("<span><br /></span>", "") for c in split_row(rows[2])]
    if len(cells) == len(hdr) - 1:
        cells.append("")  # ts.nrevrange: row has no Notes cell at all
    if len(cells) != len(hdr):
        raise ParseError(f"{len(cells)} cells under {len(hdr)} headers")
    if "Notes" not in hdr[-1]:
        raise ParseError(f"last column is not Notes: {hdr[-1]}")
    general_notes, marked = split_notes(cells[-1])
    footnotes = {}
    for line in footnote_lines:
        m = FOOTNOTE.match(line.strip())
        if not m:
            raise ParseError(f"unrecognized footnote: {line[:60]}")
        footnotes[m.group(1)] = m.group(2).strip()

    data, used_marks, used_sups = {}, set(), set()
    for h, cell in zip(hdr[:-1], cells[:-1]):
        name = header_name(h)
        if name not in COLUMNS:
            raise ParseError(f"unknown column: {name}")
        product, fixed = COLUMNS[name]
        parts = [p.strip() for p in BR.split(cell) if p.strip()]
        if not parts:
            raise ParseError(f"empty cell under {name}")
        for p in parts:
            m = PART.match(p)
            if not m:
                raise ParseError(f"unparsed cell: {p}")
            status = STATUS.get((m["title"], m["icon"]))
            if not status:
                raise ParseError(f"unknown status: {m['title']} {m['icon']}")
            label = m["label"].strip()
            if fixed:
                variant = fixed
                if LABELS.get(label) != "general":
                    raise ParseError(f"expected a status word under {name}, got {label}")
            else:
                variant = LABELS.get(label)
                if not variant:
                    raise ParseError(f"unknown label: {label}")
            note = None
            if m["mark"]:
                key = mark_key(m["mark"])
                if key not in marked:
                    raise ParseError(f"marker {key} has no note")
                note = marked[key]
                used_marks.add(key)
            if m["sup"]:
                if m["sup"] not in footnotes:
                    raise ParseError(f"footnote {m['sup']} missing")
                note = footnotes[m["sup"]]
                used_sups.add(m["sup"])
            if variant in data.get(product, {}):
                raise ParseError(f"{product}.{variant} set twice")
            data.setdefault(product, {})[variant] = (
                {"status": status, "note": note} if note else status
            )
    if set(marked) - used_marks:
        raise ParseError(f"unused note markers: {sorted(set(marked) - used_marks)}")
    if set(footnotes) - used_sups:
        raise ParseError(f"unused footnotes: {sorted(set(footnotes) - used_sups)}")

    out = {}
    for product in ("software", "cloud"):
        if product in data:
            out[product] = {v: data[product][v] for v in VARIANT_ORDER if v in data[product]}
    if general_notes:
        out["notes"] = general_notes
    return out


def find_section(text):
    """Return (start, end, rows, footnotes) for the table region under the heading.

    The region runs from the first table row to the end of any numbered footnote
    list directly under it. Prose after that stays in the page.
    """
    i = text.find(HEADING + "\n")
    if i < 0:
        return None
    pos = i + len(HEADING) + 1
    lines = text[pos:].split("\n")
    offs, o = [], pos
    for line in lines:
        offs.append(o)
        o += len(line) + 1
    j = 0
    while j < len(lines) and not lines[j].strip():
        j += 1
    start = offs[j]
    rows = []
    while j < len(lines) and lines[j].strip().startswith("|"):
        rows.append(lines[j])
        j += 1
    if len(rows) != 3:
        raise ParseError(f"expected 3 table rows, found {len(rows)}")
    end = offs[j] if j < len(lines) else len(text)
    k = j
    while k < len(lines) and not lines[k].strip():
        k += 1
    notes = []
    while k < len(lines) and FOOTNOTE.match(lines[k].strip()):
        notes.append(lines[k])
        k += 1
        while k < len(lines) and not lines[k].strip() and k + 1 < len(lines) \
                and FOOTNOTE.match(lines[k + 1].strip()):
            k += 1
    if notes:
        end = offs[k] if k < len(lines) else len(text)
    return start, end, rows, notes


def frontmatter_bounds(text):
    if not text.startswith("---\n"):
        raise ParseError("no YAML frontmatter")
    close = text.index("\n---\n", 4)
    return 4, close + 1


def insert_frontmatter(text, data):
    """Insert ``compatibility:`` at its sorted position without re-dumping the rest."""
    fm_start, fm_end = frontmatter_bounds(text)
    fm = text[fm_start:fm_end]
    if re.search(r"^compatibility:", fm, re.M):
        raise ParseError("frontmatter already has compatibility")
    block = yaml.safe_dump(
        {"compatibility": data}, sort_keys=False, allow_unicode=True,
        default_flow_style=False, width=1_000_000,
    )
    lines = fm.split("\n")
    at = len(lines) - 1
    for n, line in enumerate(lines):
        m = re.match(r"^([A-Za-z_][\w-]*):", line)
        if m and m.group(1).lower() > "compatibility":
            at = n
            break
    lines[at:at] = block.rstrip("\n").split("\n")
    return text[:fm_start] + "\n".join(lines) + text[fm_end:]


def migrate_page(path, write):
    text = open(path, encoding="utf-8").read()
    found = find_section(text)
    if not found:
        return None
    start, end, rows, notes = found
    data = parse_table(rows, notes)
    if write:
        rest = text[end:].lstrip("\n")
        new = text[:start] + SHORTCODE + ("\n\n" + rest if rest else "\n")
        new = insert_frontmatter(new, data)
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
    return data


# --- cross-check against the operate tables ---------------------------------

OPERATE = [
    "content/operate/rs/references/compatibility/commands/*.md",
    "content/operate/oss_and_stack/stack-with-enterprise/*/commands.md",
]
LINK = re.compile(r"\[[^\]]*\]\(/content/commands/([^)#]+)\.md\)")


def operate_rows(path):
    """Yield (command, parsed) for every command row of every table on the page."""
    lines = open(path, encoding="utf-8").read().split("\n")
    footnotes = {}
    for line in lines:
        m = re.match(r"^(\d+)\.\s+<a name=\"table-note-\d+\"[^>]*></a>(.*)$", line.strip())
        if m:
            footnotes[m.group(1)] = m.group(2).strip()
    hdr = None
    for line in lines:
        s = line.strip()
        if not s.startswith("|"):
            hdr = None if not s else hdr
            continue
        if hdr is None:
            hdr = split_row(s)
            continue
        if set(s) <= set("|:- "):
            continue
        try:
            cells = split_row(s)
        except ParseError:
            cells = [c.strip() for c in s.strip("|").split("|")]
        m = LINK.search(cells[0])
        if not m:
            continue
        last = header_name(hdr[-1])
        keep_last = "Notes" in hdr[-1]
        # Re-shape as a command-page table: drop the Command column, and a
        # trailing Description column becomes an empty Notes column.
        h2 = hdr[1:] if keep_last else hdr[1:-1] + ["Notes"]
        c2 = cells[1:] if keep_last else cells[1:-1] + [""]
        c2 += [""] * (len(h2) - len(c2))
        try:
            parsed = parse_table(["|" + "|".join(h2) + "|", "", "|" + "|".join(c2) + "|"],
                                 [f"{k}. {v}" for k, v in footnotes.items()
                                  if f"[{k}](#table-note-{k})" in "".join(c2)])
        except ParseError as e:
            parsed = {"error": str(e)}
        yield m.group(1), parsed, last


def statuses(data):
    flat = {}
    for product in ("software", "cloud"):
        for variant, cell in data.get(product, {}).items():
            flat[f"{product}.{variant}"] = cell if isinstance(cell, str) else cell["status"]
    return flat


def cross_check(pages):
    report = []
    seen = set()
    for pattern in OPERATE:
        for path in sorted(glob.glob(pattern)):
            for cmd, parsed, _ in operate_rows(path):
                seen.add(cmd)
                where = os.path.relpath(path)
                if "error" in parsed:
                    report.append(f"{cmd}: unparseable row in {where}: {parsed['error']}")
                    continue
                if cmd not in pages:
                    report.append(f"{cmd}: listed in {where} but has no section on its page")
                    continue
                a, b = statuses(pages[cmd]), statuses(parsed)
                if a != b:
                    report.append(f"{cmd}: page {a} != {where} {b}")
                elif pages[cmd].get("notes", []) != parsed.get("notes", []) and \
                        "Notes" in open(path, encoding="utf-8").read():
                    if parsed.get("notes") or "stack-with-enterprise" not in path:
                        report.append(f"{cmd}: notes differ from {where}: "
                                      f"{pages[cmd].get('notes')} vs {parsed.get('notes')}")
    for cmd in sorted(set(pages) - seen):
        report.append(f"{cmd}: on its page only (no operate table lists it)")
    return report


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--write", action="store_true", help="rewrite the command pages")
    ap.add_argument("--report", help="write the cross-check report to this file")
    args = ap.parse_args()

    pages, errors = {}, []
    for path in sorted(glob.glob("content/commands/*.md")):
        try:
            data = migrate_page(path, write=False)
        except ParseError as e:
            errors.append(f"{path}: {e}")
            continue
        if data is not None:
            pages[os.path.basename(path)[:-3]] = data
    report = cross_check(pages)

    print(f"parsed {len(pages)} command pages, {len(errors)} errors")
    for e in errors:
        print("  ERROR", e)
    print(f"{len(report)} cross-check findings")
    if args.report:
        with open(args.report, "w", encoding="utf-8") as f:
            f.write("\n".join(report) + "\n")
    else:
        for r in report:
            print("  ", r)

    if args.write:
        if errors:
            print("not writing: fix the parse errors first")
            return 1
        for name in pages:
            migrate_page(f"content/commands/{name}.md", write=True)
        print(f"rewrote {len(pages)} pages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
