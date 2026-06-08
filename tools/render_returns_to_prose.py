#!/usr/bin/env python3
"""Render `returns` JSON specs to the markdown `## Return information`
section format used by the docs site.

Demonstrates spec §12.1 in working form. Output should be at least as
clear as the hand-written prose currently in `public/commands/*/index.html.md`,
and follows the same protocol-spec link conventions.

Usage:
    python3 render_returns_to_prose.py data/commands_returns_core.json [--cmd HSET]
"""

import argparse
import json
import sys
from pathlib import Path


# Per-protocol link metadata. The link text and URL anchor differ between
# RESP2 and RESP3 for nulls (RESP2 carries them as "Nil bulk string", RESP3
# has a dedicated null type).
TYPE_LINKS = {
    "simple_string":   ("Simple string reply", "simple-strings"),
    "bulk_string":     ("Bulk string reply",   "bulk-strings"),
    "verbatim_string": ("Verbatim string reply", "verbatim-strings"),
    "integer":         ("Integer reply",       "integers"),
    "double":          ("Double reply",        "doubles"),
    "boolean":         ("Boolean reply",       "booleans"),
    "big_number":      ("Big number reply",    "big-numbers"),
    "array":           ("Array reply",         "arrays"),
    "map":             ("Map reply",           "maps"),
    "set":             ("Set reply",           "sets"),
    "push":            ("Push reply",          "pushes"),
    "simple_error":    ("Simple error reply",  "simple-errors"),
    "bulk_error":      ("Bulk error reply",    "bulk-errors"),
    "kv_array":        ("Array reply",         "arrays"),    # wire-type: array of alternating k,v
    "tuple":           ("Array reply",         "arrays"),    # wire-type: array with positional shape
}

# Null gets per-protocol link text.
NULL_LINKS = {
    2: ("Nil reply",  "bulk-strings"),
    3: ("Null reply", "nulls"),
}

LINK_BASE = "../../develop/reference/protocol-spec"


def type_link(t, proto):
    if t == "null":
        text, anchor = NULL_LINKS[proto]
    else:
        text, anchor = TYPE_LINKS.get(t, (t, ""))
    return f"[{text}]({LINK_BASE}#{anchor})"


def render_summary(node):
    s = node.get("summary")
    if not s:
        return ""
    return s if s.endswith(".") else s + "."


def render_when(node):
    when = node.get("when")
    if not when:
        return ""
    return f"_{when}_ — "


def render_spec(spec, proto, depth=0):
    """Return the rendered markdown lines for a ReplySpec at the given depth."""
    if spec is None:
        return [""]

    # oneof — render as a bulleted list of branches
    if "oneof" in spec:
        lines = ["One of the following:"]
        for branch in spec["oneof"]:
            lines.extend(render_branch(branch, proto))
        return lines

    return render_typed_node(spec, proto, depth=depth)


def render_branch(branch, proto):
    """Render one branch of a oneof — a bulleted list item, with
    nested structure expanded as sub-bullets when present.

    Style: type link first, then summary, then `when` as a trailing
    parenthetical in italics. Container types (array, tuple, map)
    expand their inner shape as indented sub-content.
    """
    t = branch.get("type")
    when_text = branch.get("when")
    suffix = f" _(when {when_text})_" if when_text and when_text not in ("default", "success") else ""
    summary = render_summary(branch)
    link = type_link(t, proto)

    if t == "simple_error":
        messages = branch.get("messages", [])
        msg_str = "; ".join(m["value"] if isinstance(m, dict) else m for m in messages)
        return [f"* {link} in these cases: {msg_str}."]
    if t == "simple_string" and "value" in branch:
        body = f"{link}: `{branch['value']}`."
        if summary:
            body += f" {summary}"
        return [f"* {body}{suffix}"]
    if t == "null":
        return [f"* {link}{suffix}."]

    # Header line
    if summary:
        out = [f"* {link}: {summary}{suffix}"]
    else:
        out = [f"* {link}{suffix}"]

    # Expand nested structure for containers
    if t == "array" and branch.get("items"):
        out.extend(_render_items_sub(branch["items"], proto, indent="  "))
    elif t == "tuple" and branch.get("prefixItems"):
        out.extend(_render_tuple_sub(branch, proto, indent="  "))
    elif t == "map" and branch.get("fields"):
        out.extend(_render_map_sub(branch, proto, indent="  "))
    elif t == "kv_array" and branch.get("fields"):
        out.extend(_render_map_sub(branch, proto, indent="  "))

    return out


def _render_items_sub(items_spec, proto, indent):
    """Render an array's `items` spec as a sub-bullet."""
    it = items_spec.get("type")
    isum = render_summary(items_spec)
    ilink = type_link(it, proto)
    head = f"{indent}- Each item: {ilink}"
    if isum:
        head += f" — {isum}"
    out = [head]
    if it == "tuple" and items_spec.get("prefixItems"):
        out.extend(_render_tuple_sub(items_spec, proto, indent + "  "))
    elif it == "array" and items_spec.get("items"):
        out.extend(_render_items_sub(items_spec["items"], proto, indent + "  "))
    elif it == "map" and items_spec.get("fields"):
        out.extend(_render_map_sub(items_spec, proto, indent + "  "))
    return out


def _render_tuple_sub(tup_spec, proto, indent):
    """Render tuple `prefixItems` and `rest` as sub-bullets."""
    out = []
    for i, item in enumerate(tup_spec.get("prefixItems", [])):
        iname = item.get("name") or f"[{i}]"
        iwhen = f" _(when {item['when']})_" if item.get("when") else ""
        ioptional = " _(optional)_" if item.get("optional") and not item.get("when") else ""
        if "oneof" in item:
            out.append(f"{indent}- `{iname}`{iwhen}{ioptional}: one of —")
            for branch in item["oneof"]:
                for line in render_branch(branch, proto):
                    out.append(f"{indent}  {line}")
            continue
        if "type" not in item:
            continue
        ilink = type_link(item["type"], proto)
        isum = render_summary(item)
        line = f"{indent}- `{iname}`: {ilink}{iwhen}{ioptional}"
        if isum:
            line += f" — {isum}"
        out.append(line)
        if item["type"] == "tuple" and item.get("prefixItems"):
            out.extend(_render_tuple_sub(item, proto, indent + "  "))
        elif item["type"] == "array" and item.get("items"):
            out.extend(_render_items_sub(item["items"], proto, indent + "  "))
        elif item["type"] == "map" and item.get("fields"):
            out.extend(_render_map_sub(item, proto, indent + "  "))
    if tup_spec.get("rest"):
        out.append(f"{indent}- Followed by repeating elements:")
        out.extend(_render_items_sub(tup_spec["rest"], proto, indent + "  "))
    return out


def _render_map_sub(map_spec, proto, indent):
    """Render map `fields` as sub-bullets."""
    out = []
    for f in map_spec.get("fields", []):
        fname = f["name"]
        fwhen = f" _(when {f['when']})_" if f.get("when") else ""
        foptional = " _(optional)_" if f.get("optional") and not f.get("when") else ""
        if "oneof" in f:
            out.append(f"{indent}- `{fname}`{fwhen}{foptional}: one of —")
            for branch in f["oneof"]:
                for line in render_branch(branch, proto):
                    out.append(f"{indent}  {line}")
            continue
        if "type" not in f:
            continue
        flink = type_link(f["type"], proto)
        fsum = render_summary(f)
        line = f"{indent}- `{fname}`: {flink}{fwhen}{foptional}"
        if fsum:
            line += f" — {fsum}"
        out.append(line)
        if f["type"] == "tuple" and f.get("prefixItems"):
            out.extend(_render_tuple_sub(f, proto, indent + "  "))
        elif f["type"] == "array" and f.get("items"):
            out.extend(_render_items_sub(f["items"], proto, indent + "  "))
        elif f["type"] == "map" and f.get("fields"):
            out.extend(_render_map_sub(f, proto, indent + "  "))
    return out


def render_typed_node(spec, proto, depth):
    """Render a non-oneof spec: a single typed leaf or container."""
    t = spec.get("type")
    if t is None:
        return [""]
    link = type_link(t, proto)
    summary = render_summary(spec)
    indent = "  " * depth

    # Scalar types
    if t in ("integer", "double", "boolean", "bulk_string", "simple_string",
            "verbatim_string", "big_number"):
        if t == "simple_string" and "value" in spec:
            line = f"{link}: `{spec['value']}`."
            if summary:
                line += f" {summary}"
        else:
            line = f"{link}: {summary}" if summary else link
        return [f"{indent}{line}".rstrip()]

    if t == "null":
        return [f"{indent}{link}."]

    # Array — emit summary, then describe items
    if t == "array":
        head = f"{link}: {summary}" if summary else f"{link}."
        out = [f"{indent}{head}".rstrip()]
        items = spec.get("items")
        if items:
            out.append(f"{indent}Each item is:")
            out.extend(render_typed_node(items, proto, depth + 1))
        return out

    # kv_array — flat alternating array of key/value; same field rendering as map
    if t == "kv_array":
        head = f"{link}: {summary}" if summary else f"{link}."
        out = [f"{indent}{head}".rstrip()]
        fields = spec.get("fields")
        if fields:
            out.append(f"{indent}Fields:")
            for f in fields:
                field_link = type_link(f["type"], proto)
                fwhen = f" _(when {f['when']})_" if f.get("when") else ""
                foptional = " _(optional)_" if f.get("optional") and not f.get("when") else ""
                fsum = render_summary(f)
                out.append(f"{indent}  - `{f['name']}`: {field_link}{fwhen}{foptional}"
                           + (f" — {fsum}" if fsum else ""))
        return out

    # Map — list named fields if any
    if t == "map":
        head = f"{link}: {summary}" if summary else f"{link}."
        out = [f"{indent}{head}".rstrip()]
        fields = spec.get("fields")
        if fields:
            out.append(f"{indent}Fields:")
            for f in fields:
                field_link = type_link(f["type"], proto)
                fwhen = f" _(when {f['when']})_" if f.get("when") else ""
                foptional = " _(optional)_" if f.get("optional") and not f.get("when") else ""
                fsum = render_summary(f)
                out.append(f"{indent}  - `{f['name']}`: {field_link}{fwhen}{foptional}"
                           + (f" — {fsum}" if fsum else ""))
        return out

    # Set
    if t == "set":
        head = f"{link}: {summary}" if summary else f"{link}."
        out = [f"{indent}{head}".rstrip()]
        items = spec.get("items")
        if items:
            out.append(f"{indent}Each item is:")
            out.extend(render_typed_node(items, proto, depth + 1))
        return out

    # Tuple — describe positional shape
    if t == "tuple":
        head = f"{link}: {summary}" if summary else f"{link}."
        out = [f"{indent}{head}".rstrip()]
        prefix = spec.get("prefixItems", [])
        for i, item in enumerate(prefix):
            iname = item.get("name") or f"[{i}]"
            iwhen = f" _(when {item['when']})_" if item.get("when") else ""
            ioptional = " _(optional)_" if item.get("optional") and not item.get("when") else ""
            ilink = type_link(item["type"], proto) if "type" in item else "_(varies)_"
            isum = render_summary(item)
            out.append(f"{indent}  - `{iname}`: {ilink}{iwhen}{ioptional}"
                       + (f" — {isum}" if isum else ""))
        if spec.get("rest"):
            out.append(f"{indent}Followed by repeating elements:")
            out.extend(render_typed_node(spec["rest"], proto, depth + 1))
        return out

    return [f"{indent}{link}"]


def render_examples(examples, cmd_name):
    """Render the `examples` block as a markdown sub-section."""
    if not examples:
        return []
    out = ["**Examples:**", ""]
    for ex in examples:
        args = " ".join(ex.get("args", []))
        label = ex.get("label", "")
        head = f"`{cmd_name} {args}`".rstrip()
        if label:
            head = f"{head} _({label})_"
        out.append(f"- {head}")
        # Compare via JSON serialisation: Python's `0 == False` and `1 == True`
        # would otherwise collapse genuine protocol divergence (the canonical
        # int-vs-bool case in modules like RedisBloom).
        resp2_json = json.dumps(ex.get("resp2"))
        resp3_json = json.dumps(ex.get("resp3")) if "resp3" in ex else None
        if resp3_json is not None and resp3_json != resp2_json:
            out.append(f"  - RESP2: `{resp2_json}`")
            out.append(f"  - RESP3: `{resp3_json}`")
        else:
            out.append(f"  - Reply: `{resp2_json}`")
        if ex.get("note"):
            out.append(f"  - Note: {ex['note']}")
    out.append("")
    return out


def render_returns(returns, cmd_name=""):
    """Render a full `returns` block to a markdown string with the two
    per-protocol sections wrapped in a multitabs shortcode for human
    rendering, plus an Examples section appended verbatim."""
    proto_sections = {}
    for proto in (2, 3):
        key = f"resp{proto}"
        spec = returns.get(key)
        if isinstance(spec, str) and spec.startswith("same_as_"):
            other = "resp2" if "resp2" in spec else "resp3"
            spec = returns.get(other)
        proto_sections[proto] = "\n".join(render_spec(spec, proto))

    slug = cmd_name.lower().replace(" ", "-").replace(".", "-")
    out = []
    out.append(f'{{{{< multitabs id="{slug}-return-info"')
    out.append('    tab1="RESP2"')
    out.append('    tab2="RESP3" >}}')
    out.append("")
    out.append(proto_sections[2])
    out.append("")
    out.append("-tab-sep-")
    out.append("")
    out.append(proto_sections[3])
    out.append("")
    out.append("{{< /multitabs >}}")
    out.append("")
    out.extend(render_examples(returns.get("examples", []), cmd_name))
    return "\n".join(out)


def slug_for(cmd):
    """Convert a command name to a filename slug (matches Hugo's URL-style)."""
    return cmd.lower().replace(" ", "-").replace(".", ".")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("specs", nargs="+", help="Paths to commands_returns_*.json files.")
    p.add_argument("--cmd", help="Render only this command (uppercased).")
    p.add_argument("--out-dir",
                   help="Write one .md file per command to this directory "
                        "(slug-based filename, no `## Return information` header).")
    args = p.parse_args()

    out_dir = Path(args.out_dir) if args.out_dir else None
    if out_dir:
        out_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    for spec_path in args.specs:
        data = json.loads(Path(spec_path).read_text())
        for cmd, entry in data.items():
            if cmd.startswith("_"):
                continue
            if args.cmd and cmd != args.cmd:
                continue
            body = render_returns(entry["returns"], cmd_name=cmd)
            if out_dir:
                f = out_dir / f"{slug_for(cmd)}.md"
                f.write_text(body)
                written += 1
            else:
                print(f"\n## {cmd}\n")
                print("## Return information\n")
                print(body)

    if out_dir:
        print(f"Wrote {written} files to {out_dir}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
