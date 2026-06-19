#!/usr/bin/env python3
"""
sync_notebook.py - generate notebook(s) from an example source and sync them to
the matching binder-launchers branch.

Deterministic glue for the docs -> binder-launchers pipeline:
  changed source file -> read BINDER_ID -> jupyterize ship + test notebooks
  -> create/update the binder-launchers branch -> (optionally) push.

Verification happens downstream in the binder-launchers verify gate; this script
ALSO runs a local pre-check (verify.py) and refuses to commit a notebook whose
asserts don't pass, so a broken example never gets synced.

For an EXISTING branch it updates demo.ipynb + demo.test.ipynb and upgrades the
workflow/.dockerignore to the verify-gated versions, but leaves the Dockerfile
(and its pinned base-image digest) untouched. For a NEW branch it scaffolds the
full set, pinning the base image from LANG_BASE_IMAGE.

Usage:
    python build/jupyterize/sync_notebook.py <source-file> [--repo PATH]
        [--push] [--dry-run] [--no-verify] [--mode script|kernel]
"""

import argparse
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
JUPYTERIZE = os.path.join(HERE, "jupyterize.py")
VERIFY = os.path.join(HERE, "verify.py")
# Default sibling clone: <Repos>/binder-launchers next to <Repos>/docs
DEFAULT_REPO = os.path.normpath(os.path.join(HERE, "..", "..", "..", "binder-launchers"))

EXT_LANGUAGE = {
    ".py": "python", ".js": "node.js", ".go": "go", ".java": "java",
    ".cs": "c#", ".php": "php", ".rb": "ruby", ".rs": "rust",
}

# Base image used only when SCAFFOLDING A NEW branch. Existing branches keep
# their own FROM line. Pin a digest here once confirmed for that language.
LANG_BASE_IMAGE = {
    "python": (
        "us-central1-docker.pkg.dev/redis-learning-378123/binderhub/"
        "binder-python-base@sha256:"
        "bbb6b1f137115974f938f74acfcc50203565899343efe1dcfa5a72e48383f346"
    ),
}

# Languages whose Jupyter kernel surfaces runtime errors as proper Jupyter
# errors, so the notebook verify gate (and the local pre-check) actually catch
# failing asserts. Compile-and-subprocess kernels (Go gonb, Node jslab) report
# runtime errors as stream output and can exit 0 - the gate only catches their
# compile/import errors, so verify those clients via a native harness.
GATING_LANGUAGES = {"python", "java", "c#"}

# verify.py's kernel-less --mode script driver executes Python; it is only valid
# for Python notebooks. Other languages must use --mode kernel.
SCRIPT_MODE_LANGUAGES = {"python"}

DOCKERIGNORE = "Dockerfile\ngha-creds*\ndemo.test.ipynb\n"

README = (
    "# Binder Launchers\n\n"
    "This branch contains a Jupyter notebook environment that builds on a\n"
    "pre-built Redis-enabled base image. The notebook is generated from the\n"
    "matching example source in the redis/docs repo - do not edit it by hand;\n"
    "regenerate it with build/jupyterize/sync_notebook.py.\n"
)

# Verify-before-deploy workflow (gates the reusable build-and-deploy on a
# successful execution of demo.test.ipynb against the branch's base image).
WORKFLOW = """name: Build and deploy binder images

on:
  push:
    branches-ignore:
      - main
    paths:
      - 'Dockerfile'
      - 'demo.ipynb'
      - 'demo.test.ipynb'
      - '.github/workflows/main.yml'

jobs:
  # Gate: execute the test notebook (which still contains the REMOVE-block
  # asserts) inside the exact base image this branch ships on, before deploy.
  # GitHub runners are amd64, so the Jupyter kernel runs natively.
  #
  # NOTE: this reliably gates failing asserts only for IN-PROCESS kernels
  # (Python/Java/C#), which surface errors as Jupyter error messages. Compile-
  # and-subprocess kernels (Go `gonb`, Node `jslab`) report runtime errors as
  # stream output and can still exit 0, so for those this catches compile/import
  # errors but NOT runtime assert failures - verify those with a native harness
  # (`go test`, `node script.js`). See build/jupyterize/js-notebook-findings.md.
  verify:
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'
    steps:
      - name: 'Checkout'
        uses: 'actions/checkout@v4'

      - name: 'Google auth'
        uses: 'google-github-actions/auth@v2'
        with:
          project_id: '${{ secrets.PROJECT_ID }}'
          service_account: '${{ secrets.SERVICE_ACCOUNT }}'
          workload_identity_provider: '${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}'

      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v2'
        with:
          project_id: '${{ secrets.PROJECT_ID }}'

      - name: 'Execute test notebook against the base image'
        run: |-
          set -euo pipefail
          gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
          BASE=$(awk '/^FROM/ {print $2; exit}' Dockerfile)
          echo "Verifying demo.test.ipynb against base image: ${BASE}"
          docker pull "${BASE}"
          docker run --rm -v "${PWD}:/work" "${BASE}" bash -c '
            cd /usr/src/redis-src && ./redis-server ./redis.conf --daemonize yes >/dev/null 2>&1 && sleep 1
            cd /work && jupyter nbconvert --to notebook --execute \\
              --ExecutePreprocessor.startup_timeout=120 \\
              --ExecutePreprocessor.timeout=120 \\
              --output /tmp/executed.ipynb demo.test.ipynb'

  call-reusable-workflow:
    needs: verify
    uses: redis/binder-launchers/.github/workflows/build-and-deploy.yml@main
    with:
      branch_name: ${{ github.ref_name }}
    secrets: inherit
"""


def fail(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def git(repo, *args, capture=True):
    return subprocess.run(
        ["git", "-C", repo, *args],
        check=True, text=True,
        capture_output=capture,
    )


def detect_language(path):
    return EXT_LANGUAGE.get(os.path.splitext(path)[1].lower())


def read_binder_id(path):
    """Read the BINDER_ID marker (works for # and // comment prefixes)."""
    with open(path, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            for pre in ("#", "//"):
                if s.startswith(f"{pre} BINDER_ID "):
                    return s.split("BINDER_ID", 1)[1].strip()
    return None


def remote_branch_exists(repo, branch):
    r = subprocess.run(
        ["git", "-C", repo, "ls-remote", "--heads", "origin", branch],
        capture_output=True, text=True,
    )
    return bool(r.stdout.strip())


def local_verify(notebook, mode, image):
    """Execute the generated notebook in the base image; True if it passes."""
    print(f"\n--- Local pre-check: verify.py --notebook --mode {mode} ---")
    cmd = [sys.executable, VERIFY, "--notebook", notebook, "--mode", mode]
    if image:
        cmd += ["--image", image]
    r = subprocess.run(cmd)
    return r.returncode == 0


def restore_clone(repo, orig_branch, target, is_new):
    """Return the binder-launchers clone to its pre-run clean state (used on
    non-committing exits so a dry-run/failed sync doesn't block the next run)."""
    git(repo, "reset", "--hard", "--quiet")
    subprocess.run(["git", "-C", repo, "clean", "-fdq"], check=False)
    if orig_branch and orig_branch != target:
        git(repo, "switch", "--quiet", orig_branch)
        if is_new:
            subprocess.run(["git", "-C", repo, "branch", "-D", target],
                           capture_output=True)


def read_from(dockerfile):
    """Return the image ref on the Dockerfile's FROM line."""
    with open(dockerfile, encoding="utf-8") as f:
        for line in f:
            if line.strip().startswith("FROM "):
                return line.strip().split(None, 1)[1].strip()
    return None


def jupyterize(source, out_path, with_tests=False):
    cmd = [sys.executable, JUPYTERIZE, source, "-o", out_path]
    if with_tests:
        cmd.append("--with-tests")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        fail("jupyterize failed (is nbformat installed in this env?):\n"
             + (r.stderr or r.stdout))


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument("source", help="example source file under local_examples/")
    ap.add_argument("--repo", default=DEFAULT_REPO,
                    help=f"binder-launchers clone (default: {DEFAULT_REPO})")
    ap.add_argument("--push", action="store_true",
                    help="push the branch to origin after committing")
    ap.add_argument("--dry-run", action="store_true",
                    help="generate + verify + write files, but do not commit/push")
    ap.add_argument("--no-verify", action="store_true",
                    help="skip the local verify.py pre-check")
    ap.add_argument("--mode", choices=["kernel", "script", "auto"],
                    default="auto",
                    help="verify mode for the local pre-check. 'auto' (default) "
                         "picks script for Python, kernel for other languages "
                         "(the script driver only runs Python).")
    args = ap.parse_args()

    source = os.path.abspath(args.source)
    repo = os.path.abspath(args.repo)
    if not os.path.isfile(source):
        fail(f"source not found: {source}")
    if not os.path.isdir(os.path.join(repo, ".git")):
        fail(f"not a git repo: {repo}")

    language = detect_language(source)
    branch = read_binder_id(source)
    if not branch:
        fail(f"no BINDER_ID marker in {source}; cannot determine target branch")
    print(f"Source:   {source}")
    print(f"Language: {language}   Target branch: {branch}")

    # Resolve the pre-check mode: the kernel-less script driver only runs Python.
    mode = args.mode
    if mode == "auto":
        mode = "script" if language in SCRIPT_MODE_LANGUAGES else "kernel"
    elif mode == "script" and language not in SCRIPT_MODE_LANGUAGES:
        fail(f"--mode script only works for Python; {language!r} needs "
             f"--mode kernel (the script driver executes Python).")

    # Warn when the kernel can't gate runtime errors (asserts won't fail CI).
    if language not in GATING_LANGUAGES:
        print(f"WARNING: {language}'s kernel reports runtime errors as stream "
              f"output, so neither this pre-check nor the CI gate catches "
              f"failing asserts (only compile/import errors). Verify {language} "
              f"examples with a native harness.")

    # Guard against clobbering work in the binder-launchers clone.
    status = git(repo, "status", "--porcelain").stdout.strip()
    if status:
        fail(f"binder-launchers working tree is dirty; commit/stash first:\n{status}")

    # Remember where the clone started so non-committing exits can restore it.
    orig_branch = git(repo, "rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    git(repo, "fetch", "--quiet", "origin")
    is_new = not remote_branch_exists(repo, branch)

    if is_new:
        print(f"Branch '{branch}' does not exist -> scaffolding a new one.")
        base_image = LANG_BASE_IMAGE.get(language)
        if not base_image:
            fail(f"no base image known for language {language!r}; "
                 f"add it to LANG_BASE_IMAGE to scaffold new {language} branches")
        git(repo, "switch", "--quiet", "-c", branch, "origin/main")
        write(os.path.join(repo, "Dockerfile"),
              f"FROM {base_image}\nADD demo.ipynb .\n")
        write(os.path.join(repo, "README.md"), README)
    else:
        print(f"Branch '{branch}' exists -> updating (Dockerfile preserved).")
        git(repo, "switch", "--quiet", branch)
        git(repo, "reset", "--hard", "--quiet", f"origin/{branch}")
        base_image = read_from(os.path.join(repo, "Dockerfile"))
        if not base_image:
            fail("could not read FROM line from the branch Dockerfile")

    # Generate notebooks straight into the branch working tree.
    test_nb_path = os.path.join(repo, "demo.test.ipynb")
    jupyterize(source, os.path.join(repo, "demo.ipynb"), with_tests=False)
    jupyterize(source, test_nb_path, with_tests=True)

    # Local pre-check against the branch's ACTUAL base image, run on the
    # GENERATED test notebook (not a re-parse), so the exact artifact that ships
    # is what gets verified. Refuse to sync if its asserts don't pass.
    if not args.no_verify:
        if not local_verify(test_nb_path, mode, base_image):
            restore_clone(repo, orig_branch, branch, is_new)
            fail("local verification failed - not syncing")
        print("--- Local pre-check PASSED ---")

    # Always (re)apply the verify gate + ignore rules so existing plain branches
    # get upgraded too. Dockerfile is left as-is for existing branches.
    write(os.path.join(repo, ".github", "workflows", "main.yml"), WORKFLOW)
    write(os.path.join(repo, ".dockerignore"), DOCKERIGNORE)

    git(repo, "add", "-A")
    diff = git(repo, "status", "--porcelain").stdout.strip()
    if not diff:
        print("\nNothing changed - branch already up to date.")
        restore_clone(repo, orig_branch, branch, is_new)
        return 0
    print(f"\nChanges staged on '{branch}':\n{diff}")

    if args.dry_run:
        restore_clone(repo, orig_branch, branch, is_new)
        print("\n[dry-run] not committing or pushing; clone restored.")
        return 0

    msg = (f"Sync {os.path.basename(source)} notebook via jupyterize\n\n"
           f"Generated demo.ipynb + demo.test.ipynb from the docs example "
           f"source and {'scaffolded' if is_new else 'updated'} this branch.")
    git(repo, "commit", "--quiet", "-m", msg)
    print(f"Committed to '{branch}'.")

    if args.push:
        git(repo, "push", "--quiet",
            *(["-u", "origin", branch] if is_new else []), capture=False)
        print(f"Pushed '{branch}' to origin.")
    else:
        print("Not pushed (use --push). Review the commit, then push when ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
