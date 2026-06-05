#!/usr/bin/env python3
"""Validate a `commands_returns_<module>.json` file against the format spec.

Checks the structural rules in spec §14, plus the new `examples` rules from
§3.1. Reports issues with file paths and JSON paths so authors can locate
problems quickly.

Usage:
    python3 validate_returns.py data/commands_returns_core.json
    python3 validate_returns.py data/commands_returns_*.json
"""

import argparse
import json
import sys
from pathlib import Path


VALID_PRIMITIVES = {
    "simple_string", "bulk_string", "verbatim_string",
    "integer", "double", "boolean", "big_number", "null",
    "simple_error", "bulk_error",
}
VALID_CONTAINERS = {"array", "tuple", "map", "kv_array", "set", "push"}
VALID_TYPES = VALID_PRIMITIVES | VALID_CONTAINERS

VALID_STATUS = {"verified", "auto", "stub"}

# Common keys permitted on any ReplySpec node.
COMMON_KEYS = {
    "summary", "name", "when", "optional", "since", "nullable", "note",
    "type", "oneof", "$ref",
}
PER_TYPE_KEYS = {
    "simple_string":   {"value"},
    "verbatim_string": {"encoding"},
    "array":           {"items", "length", "length_expr"},
    "tuple":           {"prefixItems", "rest"},
    "map":             {"fields", "key_type", "value_type"},
    "kv_array":        {"fields", "key_type", "value_type"},
    "set":             {"items"},
    "push":            {"items"},
    "simple_error":    {"messages"},
    "bulk_error":      {"messages"},
}

VALID_META_KEYS = {
    "module", "returns_format_version", "scope_note", "universal_errors",
    "note", "extracted_at", "command_count", "tier_distribution",
    "schema", "naming",  # used by fixtures-style files; benign on data files
}


class Validator:
    def __init__(self, filename, data):
        self.filename = filename
        self.data = data
        self.findings = []
        # Collect refs for ref-resolution check
        self.schemas = data.get("_schemas", {})
        self.refs_used = set()

    def err(self, path, msg):
        self.findings.append({"severity": "error", "path": path, "message": msg})

    def warn(self, path, msg):
        self.findings.append({"severity": "warn", "path": path, "message": msg})

    # ---- top-level ----------------------------------------------------

    def validate(self):
        if not isinstance(self.data, dict):
            self.err("$", "top-level must be a JSON object")
            return self.findings

        # _meta validation
        meta = self.data.get("_meta")
        if meta is not None:
            self._validate_meta(meta)

        # Validate each command entry
        for key, entry in self.data.items():
            if key.startswith("_"):
                continue
            self._validate_command(key, entry)

        # Check ref resolution
        for ref_path, ref_target in self.refs_used:
            if ref_target.startswith("#/_schemas/"):
                name = ref_target[len("#/_schemas/"):]
                if name not in self.schemas:
                    self.err(ref_path, f"$ref `{ref_target}` does not resolve in this file")
            elif ".json#/" in ref_target:
                pass    # cross-file refs not validated here
            else:
                self.warn(ref_path, f"$ref `{ref_target}` has unrecognised syntax")

        # Orphan schemas
        for schema_name in self.schemas:
            qualified = f"#/_schemas/{schema_name}"
            if not any(t == qualified for _, t in self.refs_used):
                self.warn(f"$._schemas.{schema_name}",
                          "schema is not referenced by any command")

        return self.findings

    def _validate_meta(self, meta):
        if not isinstance(meta, dict):
            self.err("$._meta", "_meta must be an object")
            return
        for k in meta:
            if k not in VALID_META_KEYS:
                self.warn(f"$._meta.{k}", f"unrecognised _meta key `{k}`")
        ver = meta.get("returns_format_version", "1")
        if ver not in ("1",):
            self.err("$._meta.returns_format_version",
                     f"unsupported format version `{ver}`")

    # ---- command entry -----------------------------------------------

    def _validate_command(self, name, entry):
        path = f"$.{name}"
        if not isinstance(entry, dict):
            self.err(path, "command entry must be an object")
            return
        # Required: returns, returns_status
        if "returns" not in entry:
            self.err(path, "missing `returns`")
        if "returns_status" not in entry:
            self.err(path, "missing `returns_status`")
        else:
            status = entry["returns_status"]
            if status not in VALID_STATUS:
                self.err(f"{path}.returns_status",
                         f"must be one of {sorted(VALID_STATUS)}, got `{status}`")
        # No `description` allowed
        if "description" in entry:
            self.err(path, "use `summary` (inside `returns`), not `description`")
        # Permitted extra keys
        for k in entry:
            if k not in {"returns", "returns_status"}:
                self.warn(f"{path}.{k}", f"unrecognised command-level key `{k}`")
        # Recurse into returns
        if "returns" in entry:
            self._validate_returns(f"{path}.returns", entry["returns"])

    def _validate_returns(self, path, returns):
        if not isinstance(returns, dict):
            self.err(path, "`returns` must be an object")
            return
        # Required protocols
        for proto in ("resp2", "resp3"):
            if proto not in returns:
                self.err(f"{path}.{proto}", f"missing `{proto}`")

        # Validate per-protocol
        for proto in ("resp2", "resp3"):
            spec = returns.get(proto)
            if spec is None:
                continue
            if isinstance(spec, str):
                if spec not in ("same_as_resp2", "same_as_resp3"):
                    self.err(f"{path}.{proto}",
                             f"string value must be `same_as_resp2` or `same_as_resp3`, got `{spec}`")
            else:
                self._validate_spec(f"{path}.{proto}", spec)

        # Validate examples
        examples = returns.get("examples")
        if examples is not None:
            self._validate_examples(f"{path}.examples", examples, returns)

        # Permitted keys
        allowed = {"summary", "resp2", "resp3", "examples"}
        for k in returns:
            if k not in allowed:
                self.warn(f"{path}.{k}", f"unrecognised key in `returns`: `{k}`")

    # ---- ReplySpec -----------------------------------------------------

    def _validate_spec(self, path, spec):
        if not isinstance(spec, dict):
            self.err(path, "ReplySpec must be an object")
            return

        # $ref
        if "$ref" in spec:
            self.refs_used.add((path, spec["$ref"]))
            return

        # oneof
        if "oneof" in spec:
            if not isinstance(spec["oneof"], list) or not spec["oneof"]:
                self.err(path, "`oneof` must be a non-empty array")
                return
            for i, branch in enumerate(spec["oneof"]):
                bpath = f"{path}.oneof[{i}]"
                if not isinstance(branch, dict):
                    self.err(bpath, "branch must be an object")
                    continue
                if "when" not in branch:
                    self.err(bpath, "every `oneof` branch must carry `when`")
                self._validate_spec(bpath, branch)
            return

        # Typed node
        t = spec.get("type")
        if t is None:
            self.err(path, "ReplySpec must have `type`, `oneof`, or `$ref`")
            return
        if t not in VALID_TYPES:
            self.err(f"{path}.type", f"unknown type `{t}`")
            return

        # Permitted keys = common + per-type
        permitted = COMMON_KEYS | PER_TYPE_KEYS.get(t, set())
        for k in spec:
            if k not in permitted:
                self.warn(f"{path}.{k}",
                          f"unrecognised key `{k}` for type `{t}`")

        # Per-type checks
        if t in ("array", "set", "push"):
            self._check_items(path, spec)
        elif t == "tuple":
            self._check_tuple(path, spec)
        elif t in ("map", "kv_array"):
            self._check_map(path, spec)
        elif t in ("simple_error", "bulk_error"):
            self._check_error(path, spec)
        elif t == "simple_string" and "value" in spec:
            if not isinstance(spec["value"], str):
                self.err(f"{path}.value", "simple_string.value must be a string")

    def _check_items(self, path, spec):
        items = spec.get("items")
        if items is None:
            self.warn(f"{path}.items",
                      "container type emitted without `items` — verifier cannot check item shape")
        else:
            self._validate_spec(f"{path}.items", items)

    def _check_tuple(self, path, spec):
        prefix = spec.get("prefixItems")
        if not prefix:
            self.warn(f"{path}.prefixItems",
                      "tuple without `prefixItems` — collapses to an unstructured array")
        else:
            for i, sub in enumerate(prefix):
                self._validate_spec(f"{path}.prefixItems[{i}]", sub)
        if spec.get("rest"):
            self._validate_spec(f"{path}.rest", spec["rest"])

    def _check_map(self, path, spec):
        fields = spec.get("fields")
        if fields:
            for i, f in enumerate(fields):
                fp = f"{path}.fields[{i}]"
                if not isinstance(f, dict):
                    self.err(fp, "field must be an object")
                    continue
                if "name" not in f:
                    self.err(fp, "map/kv_array field must have `name`")
                if "summary" not in f and "oneof" not in f and not f.get("note"):
                    self.warn(fp, "map/kv_array field should have `summary` "
                                  "(or `note` if shape is uncertain)")
                self._validate_spec(fp, f)
        # value_type validation
        vt = spec.get("value_type")
        if vt is not None and isinstance(vt, dict):
            self._validate_spec(f"{path}.value_type", vt)

    def _check_error(self, path, spec):
        messages = spec.get("messages", [])
        for i, m in enumerate(messages):
            mp = f"{path}.messages[{i}]"
            if isinstance(m, str):
                if not m.strip():
                    self.err(mp, "error message must be non-empty")
            elif isinstance(m, dict):
                if not m.get("value"):
                    self.err(mp + ".value", "error message must have non-empty `value`")
            else:
                self.err(mp, "error message must be a string or object")

    # ---- examples ------------------------------------------------------

    def _validate_examples(self, path, examples, returns):
        if not isinstance(examples, list):
            self.err(path, "`examples` must be an array")
            return
        for i, ex in enumerate(examples):
            ep = f"{path}[{i}]"
            if not isinstance(ex, dict):
                self.err(ep, "example must be an object")
                continue
            if not ex.get("label"):
                self.err(f"{ep}.label", "example must have non-empty `label`")
            args = ex.get("args")
            if not isinstance(args, list):
                self.err(f"{ep}.args", "example must have `args` array")
            elif not all(isinstance(a, str) for a in args):
                self.err(f"{ep}.args", "every arg must be a string")
            if "resp2" not in ex:
                self.err(f"{ep}.resp2", "example must include `resp2` value")
            # Permitted keys
            for k in ex:
                if k not in {"label", "args", "resp2", "resp3", "note"}:
                    self.warn(f"{ep}.{k}", f"unrecognised key in example: `{k}`")
            # Type-compat check against the spec
            for proto_key in ("resp2", "resp3"):
                if proto_key not in ex:
                    continue
                spec_for_proto = returns.get(proto_key)
                if isinstance(spec_for_proto, str) and spec_for_proto.startswith("same_as_"):
                    other = "resp3" if "resp3" in spec_for_proto else "resp2"
                    spec_for_proto = returns.get(other)
                self._check_example_value(f"{ep}.{proto_key}",
                                          spec_for_proto, ex[proto_key])

    def _check_example_value(self, path, spec, value):
        """Confirm an example value is structurally compatible with the spec."""
        if spec is None or not isinstance(spec, dict):
            return
        if "oneof" in spec:
            # If any branch is compatible, OK
            for branch in spec["oneof"]:
                if self._json_compatible(branch, value):
                    return
            self.err(path, f"example value `{json.dumps(value)[:60]}` "
                           f"does not match any `oneof` branch")
            return
        if not self._json_compatible(spec, value):
            t = spec.get("type", "?")
            shown = json.dumps(value)[:80]
            self.err(path, f"example value {shown} not compatible with `type: {t}`")

    def _json_compatible(self, spec, value):
        """Approximate the verifier's compatibility check, but against
        JSON-typed values (strings vs bytes, ints, etc.)."""
        if "oneof" in spec:
            return any(self._json_compatible(b, value) for b in spec["oneof"])
        t = spec.get("type")
        if t is None:
            return True   # $ref or empty — accept
        v = value
        if t == "null":               return v is None
        if t in ("integer",):         return isinstance(v, int) and not isinstance(v, bool)
        if t in ("double", "big_number"):
            return isinstance(v, (int, float)) and not isinstance(v, bool)
        if t == "boolean":            return isinstance(v, bool)
        if t in ("simple_string", "bulk_string", "verbatim_string"):
            return v is None or isinstance(v, str)
        if t in ("array", "tuple", "kv_array", "set", "push"):
            return isinstance(v, list)
        if t == "map":
            return isinstance(v, dict)
        if t in ("simple_error", "bulk_error"):
            return isinstance(v, str)
        return True


def validate_file(path):
    text = Path(path).read_text()
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        return [{"severity": "error", "path": "$",
                 "message": f"invalid JSON: {e}"}]
    v = Validator(path, data)
    return v.validate()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("files", nargs="+", help="commands_returns_<module>.json paths")
    args = p.parse_args()

    total_err = 0
    total_warn = 0
    for f in args.files:
        findings = validate_file(f)
        errs = [x for x in findings if x["severity"] == "error"]
        warns = [x for x in findings if x["severity"] == "warn"]
        total_err += len(errs)
        total_warn += len(warns)
        print(f"\n=== {f} ===")
        if not findings:
            print("  no issues")
            continue
        for x in findings:
            marker = "✗" if x["severity"] == "error" else "?"
            print(f"  {marker} {x['path']}: {x['message']}")

    print(f"\nTotal: {total_err} error(s), {total_warn} warn(s)")
    return 1 if total_err > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
