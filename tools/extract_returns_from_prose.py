#!/usr/bin/env python3
"""Extract `returns` specs from the prose `## Return information` section
of each command page.

Usage:
    python3 extract_returns_from_prose.py [--cmd <name>] [--out <path>]

Without --cmd, walks every `public/commands/*/index.html.md` and emits a
single JSON document keyed by uppercased command name. With --cmd, emits
just that command's entry to stdout for inspection.

The extractor is heuristic. It produces `returns_status: "auto"` when it
believes it captured the shape, and `"stub"` when it knows it didn't.
The `note` field flags inferences the heuristic isn't fully confident
about. See returns-metadata-spec.md §15.1 for the downgrade and `note`
rules this implements.
"""

import argparse
import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
COMMANDS_DIR = REPO_ROOT / "public" / "commands"


# ---- type detection from a prose link "[X reply](...)" ---------------------

RESP_TYPE_MAP = [
    # Order matters — longer phrases first to avoid premature matches.
    ("Null bulk string reply",   "null"),
    ("Null reply",               "null"),
    ("Nil reply",                "null"),
    ("Simple string reply",      "simple_string"),
    ("Bulk string reply",        "bulk_string"),
    ("Verbatim string reply",    "verbatim_string"),
    ("Integer reply",            "integer"),
    ("Double reply",             "double"),
    ("Boolean reply",            "boolean"),
    ("Big number reply",         "big_number"),
    ("Map reply",                "map"),
    ("Array reply",              "array"),
    ("Set reply",                "set"),
    ("Simple error reply",       "simple_error"),
    ("Bulk error reply",         "bulk_error"),
    # Bare forms used by some module pages
    ("Array",                    "array"),
    ("Map",                      "map"),
    ("Set",                      "set"),
    ("Simple string",            "simple_string"),
    ("Integer",                  "integer"),
    ("Bulk string",              "bulk_string"),
    ("Boolean",                  "boolean"),
    ("Double",                   "double"),
]

LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")


def detect_type(text):
    """Return RESP type-tag for the first protocol-spec link in `text`,
    or None if none found. Matches case-insensitively (prose sometimes
    drops a leading capital, e.g. `[maps](...)`)."""
    for m in LINK_RE.finditer(text):
        label = m.group(1).strip().lower()
        for prose_name, tag in RESP_TYPE_MAP:
            if label.startswith(prose_name.lower()):
                return tag, label
    return None, None


# ---- section extraction ----------------------------------------------------

def split_protocols(section):
    """Return (resp2_text, resp3_text) from the Return information body."""
    parts = re.split(r"\*\*RESP3:?\*\*\s*", section, maxsplit=1)
    if len(parts) != 2:
        return section, None
    resp2_part = re.sub(r"\*\*RESP2:?\*\*\s*", "", parts[0]).strip()
    resp3_part = parts[1].strip()
    return resp2_part, resp3_part


def get_return_section(md_path):
    """Return the prose of the `## Return information` section as a single
    string, or None if absent."""
    text = md_path.read_text(encoding="utf-8")
    m = re.search(r"^## Return information\s*\n(.*?)(?=^## |\Z)",
                  text, flags=re.MULTILINE | re.DOTALL)
    if not m:
        return None
    return m.group(1).strip()


# ---- top-level pattern matching -------------------------------------------

PROSE_VALUE_RE = re.compile(r"`([^`]+)`")
SENTINEL_VALUE_RE = re.compile(r":\s*`([^`]+)`")  # ": `OK`"

# Recognise "One of the following:" / "Any of the following:" preambles
ONEOF_PREAMBLE_RE = re.compile(
    r"^(?:One|Any) of the following:?\s*$",
    flags=re.MULTILINE | re.IGNORECASE,
)

# Top-level bullet at column 0
TOP_BULLET_RE = re.compile(r"^\*\s+(.*?)(?=^\*\s|\Z)",
                           flags=re.MULTILINE | re.DOTALL)

# Indented `- \`name\`: [Type](...) - description` for map-fields blocks
FIELD_BULLET_RE = re.compile(
    r"^\s*-\s+`([^`]+)`\s*:\s*(\[[^\]]+\]\([^)]+\))(?:\s+of\s+(\[[^\]]+\]\([^)]+\)))?([^\n]*)",
    flags=re.MULTILINE,
)


def extract_when(text):
    """Pull a `when X` predicate out of a bullet's trailing prose.

    Does not match "in these cases:" — that's the error-list marker,
    handled separately by extract_error_messages.
    """
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    # "when X" / "if X" / "in case X"
    m = re.search(r"(?:^|[:\s])(?:when|if|in case)\s+([^.]+?)(?:[.]|$)",
                  text, flags=re.IGNORECASE)
    if m:
        return m.group(1).strip().rstrip(".,")
    return None


def extract_sentinel(text):
    """Pull a backticked sentinel value out of a bullet, e.g. `OK`."""
    m = SENTINEL_VALUE_RE.search(text)
    if m:
        return m.group(1)
    return None


def clean_summary(text):
    """Strip leading colon/whitespace and trailing whitespace; convert to
    period-terminated sentence."""
    text = text.strip()
    text = re.sub(r"^[:\s\-]+", "", text)
    text = re.sub(r"\s+", " ", text)
    if text and not text.endswith("."):
        text = text + "."
    # Capitalise first letter
    if text:
        text = text[0].upper() + text[1:]
    return text


def extract_error_messages(text):
    """Pull enumerated error sentinel messages out of an error bullet's
    prose."""
    # "in these cases: X, Y, Z." — comma-separated
    m = re.search(r"in these cases?:\s*(.+?)\.?\s*$",
                  text, flags=re.IGNORECASE | re.DOTALL)
    if not m:
        return None
    rest = m.group(1)
    parts = [p.strip() for p in re.split(r",|\bor\b", rest) if p.strip()]
    return [{"value": p.rstrip(".")} for p in parts]


# ---- per-bullet → spec ----------------------------------------------------

def bullet_to_spec(bullet_text):
    """Translate a single top-level bullet into a ReplySpec node."""
    tag, _ = detect_type(bullet_text)
    if tag is None:
        return {"type": "bulk_string",
                "note": "Type could not be detected from prose."}

    when = extract_when(bullet_text)
    summary = bullet_text
    summary = LINK_RE.sub("", summary)        # strip the [X reply](...)
    # Strip "in these cases: ..." trail from the summary if we'll capture
    # messages from it below.
    if tag in ("simple_error", "bulk_error"):
        summary = re.sub(r"in these cases?:.*$", "",
                         summary, flags=re.IGNORECASE | re.DOTALL)
    summary = clean_summary(summary)

    node = {}
    if tag == "null":
        node["type"] = "null"
    elif tag in ("simple_error", "bulk_error"):
        node["type"] = tag
        msgs = extract_error_messages(bullet_text)
        if msgs:
            node["messages"] = msgs
        # Error bullets don't take a `when` from "in these cases:"
        when = None
    elif tag == "simple_string":
        node["type"] = "simple_string"
        sentinel = extract_sentinel(bullet_text)
        if sentinel:
            node["value"] = sentinel
    elif tag == "map":
        node["type"] = "map"
        fields = parse_map_fields(bullet_text)
        if fields:
            node["fields"] = fields
            # Once we've decomposed into fields, drop the catch-all summary —
            # the prose summary is "with the following fields: ..." which is
            # noise once fields are extracted.
            summary = None
        else:
            node["key_type"] = "bulk_string"
            node["value_type"] = {"type": "bulk_string"}
            node["note"] = "Field set not enumerated; verify."
    else:
        node["type"] = tag

    if summary and tag not in ("null",):
        node["summary"] = summary
    if when:
        node["when"] = when
    return node


def parse_oneof(text):
    """Match a `One of the following:` preamble followed by top-level
    bullets. Return list of ReplySpec branches, or None."""
    if not ONEOF_PREAMBLE_RE.search(text):
        return None
    bullets = TOP_BULLET_RE.findall(text)
    bullets = [b for b in bullets if b.strip()]
    if not bullets:
        return None
    return [bullet_to_spec(b) for b in bullets]


def parse_map_fields(text):
    """For RESP3 'Map with the following fields:' patterns, extract the
    enumerated fields."""
    if "with the following fields" not in text.lower():
        return None
    fields = []
    for m in FIELD_BULLET_RE.finditer(text):
        name = m.group(1)
        type_link = m.group(2)
        item_link = m.group(3)   # Optional inner type for "Array of Maps"
        tail = m.group(4) or ""
        # Get the type tag from the link
        tag, _ = detect_type(type_link)
        if tag is None:
            tag = "bulk_string"
        # Description after the link
        tail_line = re.sub(r"\s+", " ", tail).strip()
        tail_line = re.sub(r"^[-:]\s*", "", tail_line)
        # Strip the "of X" prefix where X is conceptually the items type.
        # This applies whether or not item_link captured anything.
        tail_line = re.sub(r"^(?:of|containing)\s+", "", tail_line,
                           flags=re.IGNORECASE)
        field = {"name": name, "type": tag}
        if tail_line:
            field["summary"] = clean_summary(tail_line)
        if tag == "array":
            inner_tag = None
            if item_link:
                inner_tag, _ = detect_type(item_link)
            field["items"] = {"type": inner_tag or "bulk_string"}
            if inner_tag == "map":
                field["items"]["key_type"] = "bulk_string"
                field["items"]["value_type"] = {"type": "bulk_string"}
                field["items"]["note"] = "Field set within nested maps not enumerated; verify."
            elif not inner_tag:
                field["note"] = "Items inferred as bulk_string; verify."
        elif tag == "map":
            field["key_type"] = "bulk_string"
            field["value_type"] = {"type": "bulk_string"}
            field["note"] = "Field set within this nested map not enumerated by prose; verify."
        fields.append(field)
    if not fields:
        return None
    return fields


def has_nested_conditional_structure(text):
    """Detect prose that the flat heuristic cannot faithfully encode.

    True when:
    - "If X was/is specified" appears more than once (SET-style branching)
    - Sub-bulleted lists appear under top-level bullets (deep nesting)
    - "In the following two cases" / "in the following N cases" appears
    """
    if len(re.findall(r"If\s+`?[A-Z]+`?\s+was\s+(?:not\s+)?specified",
                      text, flags=re.IGNORECASE)) >= 2:
        return True
    if re.search(r"in the following (?:two|three|four|\d+) cases?",
                 text, flags=re.IGNORECASE):
        return True
    return False


def parse_protocol_section(text):
    """Translate the prose for one protocol into a ReplySpec.

    Returns (spec, downgrade_to_stub) — boolean indicates whether the
    extractor judges this entry shape-incomplete.
    """
    if text is None:
        return None, False
    text = text.strip()

    nested = has_nested_conditional_structure(text)

    # 1. Try `oneof` form (multiple top-level bullets after "One of the following:")
    branches = parse_oneof(text)
    if branches is not None:
        return ({"oneof": branches}, nested)

    # 2. Map fields enumerated explicitly
    fields = parse_map_fields(text)
    if fields:
        return ({"type": "map", "fields": fields}, False)

    # 3. Single declarative line "[X reply](...): summary"
    tag, _ = detect_type(text)
    if tag is None:
        return ({"type": "bulk_string",
                 "note": "Could not detect type from prose."}, True)

    # If the prose has nested-conditional structure that didn't trigger
    # the oneof path (no "One of the following:" preamble), the flat
    # single-leaf result is misleading. Downgrade to stub.
    if nested:
        return ({"type": tag,
                 "note": "Prose has nested-conditional structure (e.g. `If X was specified`) that the flat heuristic cannot encode. Full shape requires hand-authoring."},
                True)

    summary_text = LINK_RE.sub("", text)
    summary_text = clean_summary(summary_text)

    spec = {"type": tag}
    if summary_text:
        spec["summary"] = summary_text

    # Container types need items / fields — flag if missing
    downgrade = False
    if tag == "array":
        # Try to infer items from prose patterns
        lower = text.lower()
        if "list of fields" in lower or "list of field names" in lower:
            spec["items"] = {"type": "bulk_string", "summary": "Field name."}
        elif "list of values" in lower:
            spec["items"] = {"type": "bulk_string", "summary": "Field value."}
        elif "list of members" in lower:
            spec["items"] = {"type": "bulk_string", "summary": "Member."}
        elif "two-element array" in lower:
            spec["type"] = "tuple"
            spec["prefixItems"] = [
                {"type": "bulk_string"}, {"type": "bulk_string"}
            ]
            spec["note"] = "Two-element tuple inferred from prose; element types/names not enumerated."
        elif "pairs" in lower and "(" in text and ")" in text:
            # "Array reply of (Integer, Double) pairs" pattern
            tup_m = re.search(r"\(([^)]+)\)\s*pairs", text)
            if tup_m:
                inner_types = []
                for raw in tup_m.group(1).split(","):
                    sub_tag, _ = detect_type(raw)
                    inner_types.append({"type": sub_tag or "bulk_string"})
                spec["items"] = {
                    "type": "tuple",
                    "prefixItems": inner_types,
                    "note": "Tuple shape inferred from `(Type1, Type2) pairs` pattern.",
                }
            else:
                spec["items"] = {"type": "bulk_string",
                                 "note": "Item shape not described in prose; verify."}
                downgrade = True
        else:
            spec["items"] = {"type": "bulk_string",
                             "note": "Item shape not described in prose; verify."}
            downgrade = True
    elif tag == "map":
        # No fields enumerated — try the kv-array/map duality hint
        lower = text.lower()
        if "fields and their values" in lower or "field-value pairs" in lower \
                or "key-value pairs" in lower:
            spec["key_type"] = "bulk_string"
            spec["value_type"] = {"type": "bulk_string"}
        else:
            spec["key_type"] = "bulk_string"
            spec["value_type"] = {"type": "bulk_string"}
            spec["note"] = "Field set not enumerated by prose; verify."
            downgrade = True
    elif tag == "simple_string":
        sentinel = extract_sentinel(text)
        if sentinel:
            spec["value"] = sentinel

    return spec, downgrade


# ---- RESP2/RESP3 pairing rule (kv_array <-> map) --------------------------

def apply_kvarray_pairing(resp2_spec, resp3_spec):
    """If RESP2 says 'array of fields and their values' and RESP3 says
    'map of fields and their values', rewrite RESP2 to use kv_array."""
    if not isinstance(resp2_spec, dict) or not isinstance(resp3_spec, dict):
        return resp2_spec, resp3_spec
    if resp2_spec.get("type") == "array" and resp3_spec.get("type") == "map":
        s2 = (resp2_spec.get("summary") or "").lower()
        s3 = (resp3_spec.get("summary") or "").lower()
        if any(k in s2 + " " + s3 for k in
               ("fields and their values", "field-value pairs",
                "key-value pairs", "parameters matching")):
            resp2_spec = {
                "type": "kv_array",
                "summary": resp2_spec.get("summary"),
                "key_type": resp3_spec.get("key_type", "bulk_string"),
                "value_type": resp3_spec.get("value_type", {"type": "bulk_string"}),
            }
    return resp2_spec, resp3_spec


def merge_protocols(resp2_spec, resp3_spec):
    """Return a `returns` block with same_as_resp2 collapsing where appropriate."""
    if resp3_spec is None:
        return {"resp2": resp2_spec, "resp3": "same_as_resp2"}
    if json.dumps(resp2_spec, sort_keys=True) == json.dumps(resp3_spec, sort_keys=True):
        return {"resp2": resp2_spec, "resp3": "same_as_resp2"}
    return {"resp2": resp2_spec, "resp3": resp3_spec}


# ---- per-command pipeline -------------------------------------------------

def extract_for_command(md_path):
    """Return (returns_block, returns_status) for one command page, or
    (None, "missing") if the page has no Return information section."""
    section = get_return_section(md_path)
    if section is None:
        return None, "missing"

    resp2_text, resp3_text = split_protocols(section)
    resp2_spec, downgrade2 = parse_protocol_section(resp2_text)
    if resp3_text:
        resp3_spec, downgrade3 = parse_protocol_section(resp3_text)
    else:
        resp3_spec, downgrade3 = None, False

    if resp2_spec and resp3_spec:
        resp2_spec, resp3_spec = apply_kvarray_pairing(resp2_spec, resp3_spec)

    block = merge_protocols(resp2_spec, resp3_spec)
    block["summary"] = (resp2_spec.get("summary") if isinstance(resp2_spec, dict) else None) or ""
    # Move summary first key by reconstructing
    ordered = {"summary": block["summary"], "resp2": block["resp2"], "resp3": block["resp3"]}
    if not ordered["summary"]:
        del ordered["summary"]

    status = "stub" if (downgrade2 or downgrade3) else "auto"
    return ordered, status


def slug_to_command_name(slug):
    """Map directory slug to canonical uppercase command name."""
    # e.g. "client-list" -> "CLIENT LIST", "ft.search" -> "FT.SEARCH"
    if "." in slug:
        return slug.upper()
    return slug.replace("-", " ").upper()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--cmd", help="Single command slug to extract (e.g. 'get').")
    p.add_argument("--out", help="Write JSON output to this path (default: stdout).")
    args = p.parse_args()

    if args.cmd:
        md = COMMANDS_DIR / args.cmd / "index.html.md"
        if not md.exists():
            print(f"No page at {md}", file=sys.stderr)
            return 1
        block, status = extract_for_command(md)
        out = {slug_to_command_name(args.cmd): {"returns": block, "returns_status": status}}
        print(json.dumps(out, indent=2))
        return 0

    out = {}
    stats = {"auto": 0, "stub": 0, "missing": 0}
    for sub in sorted(COMMANDS_DIR.iterdir()):
        if not sub.is_dir():
            continue
        md = sub / "index.html.md"
        if not md.exists():
            continue
        block, status = extract_for_command(md)
        stats[status] += 1
        if block is None:
            continue
        out[slug_to_command_name(sub.name)] = {
            "returns": block, "returns_status": status,
        }
    payload = {
        "_meta": {
            "command_count": sum(stats.values()),
            "extracted_count": stats["auto"] + stats["stub"],
            "tier_distribution": stats,
        },
        **out,
    }
    text = json.dumps(payload, indent=2)
    if args.out:
        Path(args.out).write_text(text + "\n")
        print(f"Wrote {len(out)} commands to {args.out}", file=sys.stderr)
        print(f"Distribution: {stats}", file=sys.stderr)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
