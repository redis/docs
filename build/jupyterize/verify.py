#!/usr/bin/env python3
"""
verify.py - notebook verification harness.

Executes a prebuilt Jupyter notebook (e.g. jupyterize's --with-tests output, in
which the REMOVE-block asserts are kept as 'test'-tagged cells) inside the real
BinderHub base image against the bundled Redis, and reports pass/fail. The
asserts are the oracle.

verify.py does NOT parse source files - jupyterize is the single source of truth
for source -> notebook. Generate the notebook with jupyterize, then verify it
here, so what gets verified is exactly what ships.

Host requirements: Docker + python3 stdlib only. The base image supplies the
kernel, redis-py, and redis-server.

Usage:
    python build/jupyterize/verify.py --notebook demo.test.ipynb --image <ref>
                                       [--mode kernel|script]
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

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
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--notebook", metavar="PATH", required=True,
                    help="the .ipynb to execute and verify (e.g. jupyterize's "
                         "--with-tests output)")
    ap.add_argument("--image", required=True,
                    help="base image to run the notebook in (the launcher "
                         "branch's Dockerfile FROM)")
    ap.add_argument("--mode", choices=["kernel", "script"], default="kernel",
                    help="kernel: real nbconvert (CI/amd64). script: kernel-less "
                         "Python exec (local/Apple Silicon; Python notebooks only).")
    args = ap.parse_args()

    with open(args.notebook, encoding="utf-8") as f:
        test_nb = json.load(f)
    img_name = args.image.split('@')[0].split('/')[-1]
    print(f"Verifying {args.notebook} in {img_name} (mode={args.mode}) ...")
    executed = execute_in_image(test_nb, args.image, args.mode)
    ok, _ = report(executed)
    print()
    print("RESULT: PASS" if ok else "RESULT: FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
