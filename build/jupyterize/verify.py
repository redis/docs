#!/usr/bin/env python3
"""
verify.py - PROTOTYPE notebook verification harness (Python only).

Takes a Redis docs code-example source file, builds a *test notebook* in which
the REMOVE_START/END blocks (containing the real asserts) are kept as tagged
cells, executes that notebook inside the real BinderHub base image against the
bundled Redis, and reports pass/fail. The asserts are the oracle.

It can also emit the *shipped* notebook (test cells stripped) so you can see
exactly what would land in binder-launchers.

Host requirements: Docker + python3 stdlib only (no nbformat needed locally).
The base image supplies the kernel, redis-py, and redis-server.

Usage:
    python build/jupyterize/verify.py <source.py> [--ship out/demo.ipynb] [--keep]

This is a prototype to validate the loop end-to-end; the parsing logic would
later fold into jupyterize proper as a "test mode".
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

# Source file extension -> language. Drives base-image selection.
EXT_LANGUAGE = {
    ".py": "python", ".js": "node.js", ".go": "go",
    ".java": "java", ".cs": "c#", ".php": "php", ".rb": "ruby", ".rs": "rust",
}

# Language -> BinderHub base image. Pin a digest here once confirmed against the
# real image. Only python is verified today; other languages must be passed via
# --image until their binder-<lang>-base digests are added here.
BASE_IMAGES = {
    # Current python base: redis-py 8.0.0 on Redis 8.2.2 (rebuilt 2026-06-19).
    "python": (
        "us-central1-docker.pkg.dev/redis-learning-378123/binderhub/"
        "binder-python-base@sha256:"
        "bbb6b1f137115974f938f74acfcc50203565899343efe1dcfa5a72e48383f346"
    ),
}


def detect_language(path):
    return EXT_LANGUAGE.get(os.path.splitext(path)[1].lower())


def resolve_image(path, override):
    """Pick the base image: explicit --image wins, else map from source language."""
    if override:
        return override
    lang = detect_language(path)
    image = BASE_IMAGES.get(lang)
    if not image:
        raise SystemExit(
            f"No base image known for language {lang!r} ({path}). "
            f"Pass --image, or add the digest to BASE_IMAGES."
        )
    return image

# Markers (Python comment prefix only, for this prototype).
P = "#"
EXAMPLE, BINDER_ID, KERNEL_NAME = "EXAMPLE:", "BINDER_ID", "KERNEL_NAME"
HIDE_START, HIDE_END = "HIDE_START", "HIDE_END"
REMOVE_START, REMOVE_END = "REMOVE_START", "REMOVE_END"
STEP_START, STEP_END = "STEP_START", "STEP_END"


def _is(line, marker):
    s = line.strip()
    return s == f"{P} {marker}" or s == f"{P}{marker}" or s.startswith(f"{P} {marker} ")


def read_markers(path):
    """Pull BINDER_ID / KERNEL_NAME from the source header (for reporting/targeting)."""
    info = {"binder_id": None, "kernel_name": None}
    with open(path, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if s.startswith(f"{P} {BINDER_ID} "):
                info["binder_id"] = s.split(BINDER_ID, 1)[1].strip()
            elif s.startswith(f"{P} {KERNEL_NAME} "):
                info["kernel_name"] = s.split(KERNEL_NAME, 1)[1].strip()
    return info


def parse_cells(path):
    """Parse a source file into ordered cells.

    Returns a list of dicts: {"source": str, "step": str|None, "test": bool}.
    - STEP blocks  -> a cell carrying step metadata
    - REMOVE blocks -> a cell tagged test=True (kept for verification, stripped on ship)
    - everything else (incl. HIDE content) -> context cells (e.g. setup)
    """
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()

    cells = []
    ctx, step_buf, rem_buf = [], [], []
    in_step, step_name, in_remove = False, None, False

    def flush_ctx():
        if any(ln.strip() for ln in ctx):
            cells.append({"source": "".join(ctx).strip("\n"),
                          "step": None, "test": False})
        ctx.clear()

    for line in lines:
        if _is(line, EXAMPLE) or _is(line, BINDER_ID) or _is(line, KERNEL_NAME):
            continue
        if _is(line, REMOVE_START):
            # Flush an open step first so the REMOVE test cell lands *after* the
            # step code that defines the variables its asserts reference.
            if in_step and any(ln.strip() for ln in step_buf):
                cells.append({"source": "".join(step_buf).strip("\n"),
                              "step": step_name, "test": False})
                step_buf = []
            else:
                flush_ctx()
            in_remove, rem_buf = True, []
            continue
        if _is(line, REMOVE_END):
            in_remove = False
            if any(ln.strip() for ln in rem_buf):
                cells.append({"source": "".join(rem_buf).strip("\n"),
                              "step": None, "test": True})
            continue
        if in_remove:
            rem_buf.append(line)
            continue
        if _is(line, HIDE_START) or _is(line, HIDE_END):
            continue
        if _is(line, STEP_START):
            flush_ctx()
            in_step, step_name, step_buf = True, line.split(STEP_START, 1)[1].strip(), []
            continue
        if _is(line, STEP_END):
            if any(ln.strip() for ln in step_buf):
                cells.append({"source": "".join(step_buf).strip("\n"),
                              "step": step_name, "test": False})
            in_step, step_name = False, None
            continue
        (step_buf if in_step else ctx).append(line)

    flush_ctx()
    return cells


def to_notebook(cells, include_tests):
    """Build an nbformat-4 notebook dict. If include_tests is False, drop test cells."""
    nb_cells = []
    for c in cells:
        if c["test"] and not include_tests:
            continue
        meta = {}
        if c["step"]:
            meta["step"] = c["step"]
        if c["test"]:
            meta["tags"] = ["test"]
        nb_cells.append({
            "id": f"cell{len(nb_cells)}",
            "cell_type": "code",
            "metadata": meta,
            "source": c["source"],
            "outputs": [],
            "execution_count": None,
        })
    return {
        "cells": nb_cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


# Kernel-less driver: exec each code cell in a shared namespace (same ordering
# and shared-state semantics a Jupyter kernel gives), capturing per-cell stdout
# and errors into the same executed-notebook shape report() expects. Used by
# --mode script, which avoids the Jupyter kernel entirely (the kernel's zmq
# handshake hangs under amd64 emulation on Apple Silicon; plain python is fine).
_DRIVER = r'''
import json, sys, io, contextlib, traceback
nb = json.load(open(sys.argv[1]))
ns = {}
for c in nb["cells"]:
    if c["cell_type"] != "code":
        continue
    src = c["source"]
    src = "".join(src) if isinstance(src, list) else src
    buf = io.StringIO(); c["outputs"] = []
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(src, "<cell>", "exec"), ns)
    except Exception as e:
        if buf.getvalue():
            c["outputs"].append({"output_type": "stream", "name": "stdout", "text": buf.getvalue()})
        c["outputs"].append({"output_type": "error", "ename": type(e).__name__,
                             "evalue": str(e), "traceback": traceback.format_exc().splitlines()})
        continue
    if buf.getvalue():
        c["outputs"].append({"output_type": "stream", "name": "stdout", "text": buf.getvalue()})
json.dump(nb, open(sys.argv[2], "w"))
'''

_KERNEL_CMD = (
    "jupyter nbconvert --to notebook --execute --allow-errors "
    "--ExecutePreprocessor.startup_timeout=300 --ExecutePreprocessor.timeout=300 "
    "--output executed.ipynb test.ipynb >/dev/null 2>&1"
)
_SCRIPT_CMD = "python /work/driver.py /work/test.ipynb /work/executed.ipynb"

_START_REDIS = (
    "cd /usr/src/redis-src && ./redis-server ./redis.conf --daemonize yes "
    ">/dev/null 2>&1 && sleep 1 && cd /work && "
)


def execute_in_image(notebook, image, mode):
    """Run the notebook inside the base image; return the executed notebook dict."""
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "test.ipynb"), "w", encoding="utf-8") as f:
            json.dump(notebook, f)
        if mode == "script":
            with open(os.path.join(d, "driver.py"), "w", encoding="utf-8") as f:
                f.write(_DRIVER)
        script = _START_REDIS + (_SCRIPT_CMD if mode == "script" else _KERNEL_CMD)
        cmd = [
            "docker", "run", "--rm", "--platform", "linux/amd64",
            "-v", f"{d}:/work", image, "bash", "-c", script,
        ]
        subprocess.run(cmd, check=True)
        with open(os.path.join(d, "executed.ipynb"), encoding="utf-8") as f:
            return json.load(f)


def report(executed):
    """Inspect executed cells; return (ok, failures). Print per-cell summary."""
    failures = []
    for i, c in enumerate(executed["cells"]):
        if c["cell_type"] != "code":
            continue
        tags = c["metadata"].get("tags", [])
        label = "TEST" if "test" in tags else (c["metadata"].get("step") or "setup")
        err = next((o for o in c.get("outputs", []) if o.get("output_type") == "error"), None)
        stdout = "".join(
            "".join(o.get("text", "")) for o in c.get("outputs", [])
            if o.get("output_type") == "stream"
        ).strip()
        if err:
            failures.append((i, label, err["ename"], err.get("evalue", "")))
            print(f"  ✗ cell {i:>2} [{label}] -> {err['ename']}: {err.get('evalue','')}")
        else:
            mark = "·" if "test" in tags else "✓"
            extra = f"  stdout: {stdout!r}" if stdout and "test" not in tags else ""
            print(f"  {mark} cell {i:>2} [{label}]{extra}")
    return (not failures), failures


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", nargs="?", help="example source .py")
    ap.add_argument("--notebook", metavar="PATH",
                    help="verify a prebuilt .ipynb directly (e.g. jupyterize's "
                         "output) instead of re-parsing a source file; needs "
                         "--image")
    ap.add_argument("--image", default=None,
                    help="base image (defaults to the source language's image)")
    ap.add_argument("--mode", choices=["kernel", "script"], default="kernel",
                    help="kernel: real nbconvert (CI/amd64). "
                         "script: kernel-less exec (local/Apple Silicon).")
    ap.add_argument("--ship", metavar="PATH",
                    help="also write the stripped (shipped) notebook here")
    args = ap.parse_args()

    # Notebook mode: execute a prebuilt notebook as-is (no re-parsing), so the
    # exact artifact that ships is what gets verified.
    if args.notebook:
        if not args.image:
            raise SystemExit("--image is required with --notebook")
        with open(args.notebook, encoding="utf-8") as f:
            test_nb = json.load(f)
        img_name = args.image.split('@')[0].split('/')[-1]
        print(f"Verifying {args.notebook} in {img_name} (mode={args.mode}) ...")
        executed = execute_in_image(test_nb, args.image, args.mode)
        ok, _ = report(executed)
        print()
        print("RESULT: PASS" if ok else "RESULT: FAIL")
        return 0 if ok else 1

    if not args.source:
        raise SystemExit("provide a source file, or --notebook PATH")
    image = resolve_image(args.source, args.image)
    markers = read_markers(args.source)
    cells = parse_cells(args.source)
    n_test = sum(c["test"] for c in cells)
    print(f"Source:   {args.source}")
    print(f"Language: {detect_language(args.source)}  |  "
          f"target branch: {markers['binder_id'] or '(no BINDER_ID)'}")
    print(f"Parsed {len(cells)} cells ({n_test} test, {len(cells)-n_test} shipped)")

    test_nb = to_notebook(cells, include_tests=True)
    img_name = image.split('@')[0].split('/')[-1]
    print(f"Executing test notebook in {img_name} (mode={args.mode}) ...")
    executed = execute_in_image(test_nb, image, args.mode)

    ok, failures = report(executed)

    if args.ship:
        os.makedirs(os.path.dirname(args.ship) or ".", exist_ok=True)
        with open(args.ship, "w", encoding="utf-8") as f:
            json.dump(to_notebook(cells, include_tests=False), f, indent=1)
        print(f"Wrote shipped notebook -> {args.ship}")

    print()
    if ok:
        print("RESULT: PASS — notebook executes clean and all asserts hold.")
        return 0
    print(f"RESULT: FAIL — {len(failures)} cell(s) errored.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
