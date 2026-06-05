#!/usr/bin/env python3
"""Batch-verify `returns` specs against a live Redis server.

For each command in the fixtures file:
  1. Run setup commands.
  2. For each permutation, execute the command in RESP2 and RESP3,
     capture the raw reply, and compare its structural shape to the
     stored spec.
  3. Run cleanup commands.
  4. Emit a diff report.

Usage:
    python3 verify_returns_from_server.py \
        --specs   tools/corpus_returns_extracted.json \
        --fixtures tools/verification_fixtures.json \
        [--cmd FT.SEARCH] \
        [--report tools/verification_report.json]

By design the verifier is conservative: it flags definite mismatches
(e.g. spec says `integer` but got bytes), and it warns on structural
gaps (e.g. spec is a `map` with enumerated fields but the reply has
keys not in the spec). It does not attempt to verify `when` predicates
or conditional shapes — those remain prose-level.
"""

import argparse
import json
import sys
from pathlib import Path

from redis.connection import Connection
from redis.exceptions import RedisError


REPO_ROOT = Path(__file__).resolve().parent.parent


# ---- raw RESP execution ---------------------------------------------------

def execute(host, port, protocol, command_args):
    """Connect, run a single command, return raw reply (no decoding)."""
    conn = Connection(host=host, port=port, protocol=protocol)
    conn.connect()
    try:
        conn.send_command(*command_args)
        return conn.read_response(disable_decoding=True)
    finally:
        conn.disconnect()


# ---- structural comparison ------------------------------------------------

# Map a Python value to a coarse RESP-style shape category.
def value_shape(v):
    if isinstance(v, bool):     return "boolean"
    if isinstance(v, int):      return "integer"
    if isinstance(v, float):    return "double"
    if v is None:               return "null"
    if isinstance(v, (bytes, str)):
        return "string"
    if isinstance(v, dict):     return "map"
    if isinstance(v, set):      return "set"
    if isinstance(v, list):     return "array"
    return "unknown"


# Which spec types are compatible with which value shapes.
COMPATIBLE = {
    "simple_string":   {"string"},
    "bulk_string":     {"string", "null"},   # nullable bulk string is common
    "verbatim_string": {"string"},
    "integer":         {"integer"},
    "double":          {"double", "string"}, # RESP2 encodes doubles as strings
    "boolean":         {"boolean", "integer"}, # RESP2 encodes booleans as 0/1
    "null":            {"null"},
    "big_number":      {"integer", "string"},
    "array":           {"array"},
    "tuple":           {"array"},
    "kv_array":        {"array"},
    "map":             {"map", "array"},     # RESP2 may flatten a map to an array
    "set":             {"set", "array"},     # RESP2 lacks set type
    "push":            {"array"},
}


def compatible(spec_type, value):
    shape = value_shape(value)
    return shape in COMPATIBLE.get(spec_type, set())


def compare(spec, value, path="$"):
    """Recursively compare a ReplySpec to a Python value (the captured
    reply). Yields {path, severity, message} dicts for each finding."""
    if spec is None:
        return
    if isinstance(spec, str):
        # "same_as_resp2" / "same_as_resp3" — handled at the protocol
        # level, not here. Shouldn't reach this with a string.
        yield {"path": path, "severity": "warn",
               "message": f"unresolved spec reference: {spec}"}
        return
    if "oneof" in spec:
        # Try each branch; pass if any branch matches with no `error`-level
        # findings. Warns are tolerated — they flag inferred-but-unverified
        # shape detail, not a definite mismatch.
        branch_findings = []
        for i, branch in enumerate(spec["oneof"]):
            findings = list(compare(branch, value, f"{path}|oneof[{i}]"))
            errors = [f for f in findings if f["severity"] == "error"]
            if not errors:
                # Surface this branch's warns, then we're done.
                for f in findings:
                    yield f
                return
            branch_findings.append(findings)
        # No branch matched — emit the shortest-conflict branch's findings
        branch_findings.sort(key=len)
        for f in branch_findings[0][:3]:
            yield f
        yield {"path": path, "severity": "error",
               "message": f"value matches none of {len(spec['oneof'])} oneof branches"}
        return
    if "$ref" in spec:
        # Cross-file refs not resolved here (would need the full schema
        # registry). Skip with a note.
        yield {"path": path, "severity": "info",
               "message": f"$ref {spec['$ref']} not resolved by verifier"}
        return

    spec_type = spec.get("type")
    if spec_type is None:
        return

    if not compatible(spec_type, value):
        yield {"path": path, "severity": "error",
               "message": f"spec type `{spec_type}` not compatible with reply shape `{value_shape(value)}`"}
        return

    if spec_type == "simple_string" and "value" in spec:
        # Sentinel — should match exactly.
        observed = value.decode("utf-8") if isinstance(value, bytes) else value
        if observed != spec["value"]:
            yield {"path": path, "severity": "error",
                   "message": f"sentinel mismatch: spec says `{spec['value']}`, got `{observed}`"}

    elif spec_type == "array":
        items_spec = spec.get("items")
        if items_spec is None:
            yield {"path": path, "severity": "warn",
                   "message": "spec has no `items` for array — cannot verify item shape"}
        else:
            for i, item in enumerate(value[:5]):    # cap at 5 to limit noise
                yield from compare(items_spec, item, f"{path}[{i}]")

    elif spec_type == "tuple":
        prefix = spec.get("prefixItems", [])
        for i, sub_spec in enumerate(prefix):
            if i >= len(value):
                if not sub_spec.get("optional"):
                    yield {"path": path, "severity": "error",
                           "message": f"missing required tuple element [{i}] ({sub_spec.get('name','?')})"}
                continue
            yield from compare(sub_spec, value[i], f"{path}[{i}]")
        rest = spec.get("rest")
        if rest is not None and len(value) > len(prefix):
            for i, item in enumerate(value[len(prefix):len(prefix)+3]):
                yield from compare(rest, item, f"{path}[{len(prefix)+i}/rest]")

    elif spec_type == "map":
        if not isinstance(value, dict):
            yield {"path": path, "severity": "info",
                   "message": f"spec is map; got array (likely RESP2 flattening — verify the RESP3 reply)"}
            return
        fields = spec.get("fields") or []
        named = {f["name"]: f for f in fields}
        observed_keys = set()
        for k, v in value.items():
            kname = k.decode("utf-8") if isinstance(k, bytes) else k
            observed_keys.add(kname)
            if kname in named:
                yield from compare(named[kname], v, f"{path}.{kname}")
        for fname, fspec in named.items():
            if fname not in observed_keys and not fspec.get("optional"):
                yield {"path": path, "severity": "warn",
                       "message": f"required field `{fname}` not present in reply"}
        if fields:
            extras = observed_keys - set(named)
            if extras:
                yield {"path": path, "severity": "warn",
                       "message": f"reply has keys not in spec: {sorted(extras)}"}

    elif spec_type == "kv_array":
        if len(value) % 2 != 0:
            yield {"path": path, "severity": "error",
                   "message": f"kv_array must have even length; got {len(value)}"}


# ---- per-command pipeline -------------------------------------------------

def verify_command(host, port, cmd_name, spec_entry, fixture):
    """Run setup, execute each permutation in both protocols, compare to
    spec, run cleanup. Return a per-command report dict."""
    report = {"command": cmd_name, "permutations": [],
              "setup_errors": [], "cleanup_errors": []}

    spec = spec_entry.get("returns")
    if spec is None:
        report["error"] = "no `returns` in spec entry"
        return report

    # Skip strict verification of stubs — by definition they don't claim
    # to be shape-complete. We still execute the command to confirm it
    # doesn't error, but report any spec/reply gaps as `info` not `error`.
    is_stub = spec_entry.get("returns_status") == "stub"
    report["stub"] = is_stub

    def run_setup():
        for setup_cmd in fixture.get("setup", []):
            try:
                execute(host, port, 2, setup_cmd)
            except RedisError as e:
                report["setup_errors"].append(f"{setup_cmd[0]}: {e}")

    def run_cleanup():
        for cleanup_cmd in fixture.get("cleanup", []):
            try:
                execute(host, port, 2, cleanup_cmd)
            except RedisError:
                pass    # cleanup errors are non-fatal; common when keys were already removed

    for perm in fixture.get("permutations", []):
        perm_report = {"label": perm["label"], "args": perm["args"], "protocols": {}}
        full_cmd = cmd_name.split() + perm["args"]

        for proto in (2, 3):
            # Re-run setup before each protocol invocation. Some commands
            # mutate state (RENAME, DEL) and would otherwise see different
            # preconditions in their second protocol run.
            run_cleanup()
            run_setup()

            proto_report = {"reply_shape": None, "findings": []}
            try:
                reply = execute(host, port, proto, full_cmd)
                proto_report["reply_shape"] = value_shape(reply)
                proto_spec = spec.get(f"resp{proto}")
                # Resolve same_as
                if proto_spec == "same_as_resp2":
                    proto_spec = spec.get("resp2")
                elif proto_spec == "same_as_resp3":
                    proto_spec = spec.get("resp3")
                findings = list(compare(proto_spec, reply))
                # Demote findings to info for stub specs.
                if is_stub:
                    findings = [{**f, "severity": "info"} for f in findings]
                proto_report["findings"] = findings
            except RedisError as e:
                # Server-side errors aren't spec mismatches — they're
                # environmental (CLUSTER on non-cluster, missing module, etc.).
                proto_report["server_error"] = f"{type(e).__name__}: {e}"
            except Exception as e:
                proto_report["error"] = f"{type(e).__name__}: {e}"
            perm_report["protocols"][f"resp{proto}"] = proto_report

        report["permutations"].append(perm_report)

    run_cleanup()

    return report


# ---- summary -------------------------------------------------------------

def summarise(reports):
    """Produce a human-readable summary from a list of per-command reports."""
    lines = []
    error_count = 0
    warn_count = 0
    clean_count = 0
    skipped_count = 0
    for r in reports:
        cmd = r["command"]
        lines.append(f"\n===== {cmd} ====={' (stub)' if r.get('stub') else ''}")
        if r.get("setup_errors"):
            for se in r["setup_errors"]:
                lines.append(f"  ! setup error: {se}")
        for perm in r["permutations"]:
            lines.append(f"  [{perm['label']}]  args={perm['args']}")
            for proto, pr in perm["protocols"].items():
                if pr.get("server_error"):
                    lines.append(f"    {proto}: SKIP (server: {pr['server_error']})")
                    skipped_count += 1
                    continue
                if pr.get("error"):
                    lines.append(f"    {proto}: ERROR {pr['error']}")
                    error_count += 1
                    continue
                findings = pr.get("findings", [])
                shape = pr.get("reply_shape")
                if not findings:
                    lines.append(f"    {proto}: ok (reply is {shape})")
                    clean_count += 1
                else:
                    severities = {f["severity"] for f in findings}
                    if "error" in severities:
                        error_count += 1
                    elif "warn" in severities:
                        warn_count += 1
                    else:
                        clean_count += 1
                    for f in findings:
                        marker = {"error": "✗", "warn": "?", "info": "·"}.get(
                            f["severity"], "·")
                        lines.append(f"    {proto}: {marker} {f['path']}: {f['message']}")
    total = clean_count + warn_count + error_count + skipped_count
    lines.append(f"\nTotals: {total} checks — clean={clean_count} warn={warn_count} error={error_count} skipped={skipped_count}")
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--specs", required=True)
    p.add_argument("--fixtures", required=True)
    p.add_argument("--host", default="localhost")
    p.add_argument("--port", type=int, default=6379)
    p.add_argument("--cmd", help="Verify only this command (uppercased name).")
    p.add_argument("--report", help="Write JSON report to this path.")
    args = p.parse_args()

    specs = json.loads(Path(args.specs).read_text())
    fixtures = json.loads(Path(args.fixtures).read_text())

    cmd_filter = args.cmd
    reports = []
    for cmd_name, fixture in fixtures.items():
        if cmd_name.startswith("_"):
            continue
        if cmd_filter and cmd_name != cmd_filter:
            continue
        spec_entry = specs.get(cmd_name)
        if spec_entry is None:
            reports.append({"command": cmd_name,
                            "permutations": [], "setup_errors": [],
                            "cleanup_errors": [],
                            "error": "no spec entry"})
            continue
        reports.append(verify_command(args.host, args.port,
                                      cmd_name, spec_entry, fixture))

    print(summarise(reports))

    if args.report:
        Path(args.report).write_text(json.dumps(reports, indent=2) + "\n")
        print(f"\nWrote JSON report to {args.report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
