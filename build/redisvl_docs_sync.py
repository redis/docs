#!/usr/bin/env python3
"""Sync RedisVL upstream documentation into the Hugo content tree.

Pure-Python replacement for the bash blocks in
.github/workflows/redisvl_docs_sync.yaml. Drives the per-version pipeline
(clone -> install -> sphinx-build -> markdown massage -> copy into
content/develop/ai/redisvl). CI orchestration (matrix, PR creation) stays in
YAML.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from glob import glob
from pathlib import Path

from packaging.version import Version

REPO_URL = "https://github.com/redis/redis-vl-python"
DEFAULT_REPO_DIR = Path("redis-vl-python")
STAGING_DIR = Path("redis_vl_hugo")
CONTENT_BASE = Path("content/develop/ai/redisvl")
STATIC_BASE = Path("static/images/redisvl")
BUILD_HELPER_DIR = Path(__file__).resolve().parent

LINKTITLE_KEEP_CASE = {"RedisVL", "API", "CLI", "LLMs", "JSON"}
TITLE_WEIGHTS = {
    "Overview": 3, "Concepts": 3, "User Guides": 4, "Guides": 4,
    "RedisVL API": 5, "Installation": 1, "Getting Started": 2,
    "How-To Guides": 3, "Use Cases": 5,
}

# Per-version dependency pins. docs.redisvl.com built each release with the
# redis-py / pydantic that were current at release time, and a few docstrings
# (notably `Query.scorer`'s "Since Redis 8.0" line, introduced in redis-py
# 6.0.0b1) drift across the boundary. Each table is a list of
# (predicate, pin_spec) pairs evaluated in order; the first match wins. The
# trailing catch-all guards against a future redisvl release silently picking
# up an arbitrary host-resolved version.
REDIS_PY_PINS = [
    # v0.6.x: redis-py 5.x — Query.scorer docstring lacks the "Since Redis 8.0"
    # line (added in redis-py 6.0.0b1) and AggregateRequest.load takes
    # `*fields: List[str]`.
    (lambda v: v < Version("0.7.0"),   "redis>=5.3,<6"),
    # v0.7.0 – v0.10.x: redis-py 6.0 – 6.3 — has "Since Redis 8.0", but
    # AggregateRequest.load still takes `*fields: List[str]` (the signature
    # changed to `*fields: str` in redis-py 6.4.0).
    (lambda v: v < Version("0.11.0"),  "redis>=6.0,<6.4"),
    # v0.11.0 – v0.13.0: redis-py 6.4 – 6.x — `*fields: str`, but Query.expander
    # docstring still reads "Add a expander field" and Query.in_order uses
    # "i.e." (both wording fixes landed in redis-py 7.0.0b1).
    (lambda v: v < Version("0.13.2"),  "redis>=6.4,<7"),
    # v0.13.2+: redis-py 7.x — wording fixes ("Add an expander", "i.e.,") plus
    # the post-6.4 signature.
    (lambda v: True,                   "redis>=7,<8"),
]
PYDANTIC_PINS = [
    # Probe across v0.6.0 – v0.18.0 showed a single window matches what
    # docs.redisvl.com was generated with: pydantic>=2.10 hides `model_fields`
    # from sphinx-autodoc, >=2.8 produces the `model_post_init(context, /)`
    # positional-only signature, and <2.13 keeps the British "initialise"
    # docstring on `init_private_attributes`.
    (lambda v: True, "pydantic>=2.10,<2.13"),
]


def _resolve_pin(version: str, table: list) -> str:
    """Look up the first matching pin spec for `version` in `table`.

    Raises ValueError if no row matches (the table should always have a
    trailing catch-all)."""
    parsed = Version(version)
    for predicate, pin in table:
        if predicate(parsed):
            return pin
    raise ValueError(f"no pin matches redisvl version {version!r}")


def run(cmd, *, cwd=None, check=True, env=None, capture=False):
    """Thin wrapper around subprocess.run with consistent logging."""
    printable = " ".join(str(c) for c in cmd)
    where = f" (in {cwd})" if cwd else ""
    print(f"  $ {printable}{where}", flush=True)
    return subprocess.run(
        cmd, cwd=cwd, check=check, env=env,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        text=True,
    )


def ensure_repo(repo_dir: Path, version: str) -> None:
    """Clone the redis-vl-python repo if missing and check out the requested tag."""
    if not repo_dir.exists():
        run(["git", "clone", REPO_URL, str(repo_dir)])
    run(["git", "fetch", "--tags", "--force"], cwd=repo_dir)
    run(["git", "reset", "--hard"], cwd=repo_dir)
    run(["git", "clean", "-fdx"], cwd=repo_dir)
    for ref in (f"tags/{version}", f"tags/v{version}"):
        try:
            run(["git", "checkout", ref], cwd=repo_dir)
            return
        except subprocess.CalledProcessError:
            continue
    raise SystemExit(f"Could not check out {version} (tried tags/{version} and tags/v{version})")


def strip_empty_markdown_cells(repo_dir: Path) -> None:
    """Drop bare-heading markdown cells that crash sphinx_markdown_builder."""
    pattern = re.compile(r"^\s*#+\s*$")
    for nb_path in repo_dir.glob("docs/**/*.ipynb"):
        try:
            data = json.loads(nb_path.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue
        cells = data.get("cells")
        if not isinstance(cells, list):
            continue
        new_cells = []
        for cell in cells:
            if cell.get("cell_type") == "markdown":
                src = cell.get("source", "")
                joined = "".join(src) if isinstance(src, list) else str(src)
                if pattern.match(joined):
                    continue
            new_cells.append(cell)
        if len(new_cells) != len(cells):
            data["cells"] = new_cells
            nb_path.write_text(json.dumps(data), encoding="utf-8")


def sphinx_build(repo_dir: Path, build_dir: Path) -> None:
    if build_dir.exists():
        shutil.rmtree(build_dir)
    run(["sphinx-build", "-M", "markdown", str(repo_dir / "docs"), str(build_dir)])


def rsync_dir(src: Path, dest: Path, *, exclude=()) -> None:
    """Mirror rsync -a behaviour: copy file tree, optionally excluding names."""
    if not src.exists():
        return
    dest.mkdir(parents=True, exist_ok=True)
    for root, _, files in os.walk(src):
        rel = Path(root).relative_to(src)
        out_dir = dest / rel
        out_dir.mkdir(parents=True, exist_ok=True)
        for name in files:
            if name in exclude:
                continue
            shutil.copy2(Path(root) / name, out_dir / name)


def stage_markdown(repo_dir: Path, build_dir: Path, staging: Path) -> None:
    """Build the redis_vl_hugo staging tree out of the sphinx markdown output."""
    if staging.exists():
        shutil.rmtree(staging)
    (staging / "user_guide").mkdir(parents=True)
    (staging / "api").mkdir(parents=True)
    if (repo_dir / "docs/overview").exists():
        (staging / "overview").mkdir(parents=True)
    if (repo_dir / "docs/concepts").exists():
        (staging / "concepts").mkdir(parents=True)

    # Convert user_guide notebooks to markdown via jupyter nbconvert.
    nb_dir = build_dir / "jupyter_execute/user_guide"
    if nb_dir.is_dir():
        notebooks = sorted(nb_dir.glob("*.ipynb"))
        if notebooks:
            cmd = ["jupyter", "nbconvert", "--to", "markdown",
                   "--output-dir", str(staging / "user_guide")]
            cmd.extend(str(p) for p in notebooks)
            run(cmd, check=False)
    cli_nb = build_dir / "jupyter_execute/overview/cli.ipynb"
    if cli_nb.exists():
        run(["jupyter", "nbconvert", "--to", "markdown",
             "--output-dir", str(staging / "overview"), str(cli_nb)], check=False)

    md_root = build_dir / "markdown"
    rsync_dir(md_root / "api", staging / "api", exclude={"index.md"})
    overview_install = md_root / "overview/installation.md"
    if overview_install.exists():
        shutil.copy2(overview_install, staging / "overview/installation.md")
    ug_install = md_root / "user_guide/installation.md"
    if ug_install.exists():
        shutil.copy2(ug_install, staging / "user_guide/installation.md")
    if (md_root / "concepts").is_dir():
        rsync_dir(md_root / "concepts", staging / "concepts", exclude={"index.md"})
    if (md_root / "user_guide/how_to_guides").is_dir():
        rsync_dir(md_root / "user_guide/how_to_guides",
                  staging / "user_guide/how_to_guides", exclude={"index.md"})
    if (md_root / "user_guide/use_cases").is_dir():
        rsync_dir(md_root / "user_guide/use_cases",
                  staging / "user_guide/use_cases", exclude={"index.md"})




def move_numbered_user_guides(staging: Path, repo_dir: Path) -> list[str]:
    """Move 02_*.md, 03_*.md, ... from user_guide/ into user_guide/how_to_guides/.

    01_getting_started.md stays at the top level. Returns the list of moved
    slugs (without the numeric prefix) for later relref rewriting.

    No-op for legacy versions (v0.6.0 – v0.14.0) whose upstream layout has
    no `docs/user_guide/how_to_guides/` directory: those releases keep a
    flat `user_guide/` and `rename_strip_numbers()` strips the NN_ prefix
    in place.
    """
    if not (repo_dir / "docs/user_guide/how_to_guides").is_dir():
        return []
    user_guide = staging / "user_guide"
    how_to = user_guide / "how_to_guides"
    how_to.mkdir(parents=True, exist_ok=True)
    moved_slugs: list[str] = []
    for path in sorted(user_guide.glob("[0-9][0-9]_*.md")):
        if path.name == "01_getting_started.md":
            continue
        dest = how_to / path.name
        shutil.move(str(path), dest)
        # File moved one level deeper: bump '../' to '../../' in markdown links.
        text = dest.read_text(encoding="utf-8")
        dest.write_text(text.replace("](../", "](../../"), encoding="utf-8")
        slug = re.sub(r"^[0-9][0-9]_", "", path.name[:-3])
        moved_slugs.append(slug)
    return moved_slugs


def lowercase_link_title(title: str) -> str:
    """Return title with non-first words lowercased except for known acronyms."""
    parts = title.split()
    if len(parts) <= 1:
        return title
    out = [parts[0]]
    for word in parts[1:]:
        if word in LINKTITLE_KEEP_CASE:
            out.append(word)
        else:
            out.append(word.lower())
    return " ".join(out)


def compute_alias(src: Path) -> str:
    """Mirror bash: ./redis_vl_hugo/foo/bar.md -> /integrate/redisvl/foo/bar.

    _index suffix is stripped so /integrate/redisvl/foo (not /foo/_index).
    """
    rel = src.as_posix()
    rel = re.sub(r"^\.?/?redis_vl_hugo/", "/integrate/redisvl/", rel)
    rel = re.sub(r"\.md$", "", rel)
    rel = re.sub(r"/_index$", "", rel)
    return rel


def compute_weight(src: Path, title: str) -> str | None:
    """Apply title-based override; otherwise prefix-from-filename (NN_*)."""
    if title in TITLE_WEIGHTS:
        return str(TITLE_WEIGHTS[title])
    m = re.match(r"^([0-9][0-9])_(.+)", src.name)
    if m:
        return m.group(1)
    return None


def format_page(src: Path, *, is_latest: bool) -> None:
    """Inject Hugo frontmatter and rewrite the body the way the bash format() does."""
    text = src.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines:
        return
    title = lines[0].lstrip()
    if title.startswith("# "):
        title = title[2:]
    elif title.startswith("#"):
        title = title.lstrip("#").lstrip()
    link_title = lowercase_link_title(title)
    alias = compute_alias(src)
    is_index = src.name == "_index.md"

    fm = ["---", f"linkTitle: {link_title}", f"title: {title}"]
    if is_latest:
        fm.extend(["aliases:", f"- {alias}"])
    weight = compute_weight(src, title)
    if weight is not None:
        fm.append(f"weight: {weight}")
    if is_index:
        fm.append("hideListLinks: true")
    fm.append("---")
    fm.append("")

    body_lines = lines[1:]
    if is_index:
        # _index.md files: drop the title heading line. Bash uses sed without /g,
        # so only the first occurrence per line is removed.
        marker = f"# {title}"
        body_lines = [line.replace(marker, "", 1) for line in body_lines]
    src.write_text("\n".join(fm + body_lines) + "\n", encoding="utf-8")


_ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")
_BLOCKQUOTE_RE = re.compile(r"^> *", re.MULTILINE)
_DOCS_REDISVL_DEEP = re.compile(
    r"https://docs\.redisvl\.com/en/latest/.+/([^_]+).+\.html(#[^)]+)"
)
_DOCS_REDISVL_SHALLOW = re.compile(r"https://docs\.redisvl\.com/en/latest/(.+)\.html")
_LINK_WITH_PATH = re.compile(r"\]\(([^)]*/)([0-9]+_)?([^/)]+)\.(?:md|ipynb|rst)\)")
_LINK_BARE = re.compile(r"\]\((?:[0-9]+_)?([^/)]+)\.(?:md|ipynb|rst)\)")
_IMAGE_STATIC = re.compile(r"!\[([^]]*)\]\(_static/([^)]+)\)")
_BROKEN_API_CLI_LINK = re.compile(
    r'\[([^\]]+)\]\(\{\{<\s*relref\s+"(?:\.\./)?api/cli"\s*>\}\}\)'
)


def _docs_redisvl_deep_repl(m: re.Match) -> str:
    return f'{{{{< relref "{m.group(1)}{m.group(2)}" >}}}}'


def _rewrite_bare_relref_for_moved_layout(
    text: str, src: Path, staging: Path, moved_slugs: list[str]
) -> str:
    """Rewrite bare relrefs (no path component) so they point at the right
    sibling once numbered guides have been moved into how_to_guides/.

    Same-directory relrefs survive the sphinx → bash → relref pipeline as the
    bare slug only; once the source file moves but the target's slug doesn't
    update its prefix, the link breaks. This patches both directions:
    user_guide top-level pages reaching down into how_to_guides/, and pages
    in how_to_guides/ (or use_cases/) reaching back up to getting_started.
    """
    if not moved_slugs:
        return text
    try:
        rel_parts = src.relative_to(staging).parts
    except ValueError:
        return text
    if not rel_parts or rel_parts[0] != "user_guide":
        return text
    in_subdir = len(rel_parts) >= 3  # user_guide/<sub>/<file>
    moved = set(moved_slugs)

    def repl(m: re.Match) -> str:
        target = m.group(1)
        anchor = m.group(2) or ""
        if not in_subdir:
            if target in moved:
                return f'relref "how_to_guides/{target}{anchor}"'
            return m.group(0)
        if target == "getting_started":
            return f'relref "../{target}{anchor}"'
        if target in moved and rel_parts[1] != "how_to_guides":
            return f'relref "../how_to_guides/{target}{anchor}"'
        return m.group(0)

    return re.sub(r'relref "([^"/#]+)(#[^"]*)?"', repl, text)


def transform_page(src: Path, staging: Path, moved_slugs: list[str]) -> None:
    """Apply the per-page sed pipeline (every transform after format())."""
    text = src.read_text(encoding="utf-8")
    text = _BLOCKQUOTE_RE.sub("", text)
    text = _ANSI_RE.sub("", text)
    text = _DOCS_REDISVL_DEEP.sub(_docs_redisvl_deep_repl, text)
    text = _DOCS_REDISVL_SHALLOW.sub(
        lambda m: f"https://redis.io/docs/latest/develop/ai/redisvl/{m.group(1)}", text)
    text = _LINK_WITH_PATH.sub(
        lambda m: f']({{{{< relref "{m.group(1)}{m.group(3)}" >}}}})', text)
    text = _LINK_BARE.sub(
        lambda m: f']({{{{< relref "{m.group(1)}" >}}}})', text)
    if moved_slugs:
        slug_alt = "|".join(re.escape(s) for s in moved_slugs)
        moved_re = re.compile(
            rf'relref "((?:\.\./)*user_guide)/({slug_alt})"')
        text = moved_re.sub(r'relref "\1/how_to_guides/\2"', text)
        text = _rewrite_bare_relref_for_moved_layout(text, src, staging, moved_slugs)
    text = _IMAGE_STATIC.sub(
        lambda m: f'{{{{< image filename="/images/redisvl/{m.group(2)}" alt="{m.group(1)}" >}}}}',
        text,
    )
    # Upstream `user_guide/cli.ipynb` links to `../api/cli.rst`, but no such
    # page exists in the upstream API toctree (cli is hosted under user_guide
    # itself). The link survives the relref pipeline as `../api/cli` and breaks
    # validation. Drop the link, keep the visible text.
    text = _BROKEN_API_CLI_LINK.sub(r"\1", text)
    # Redis brand guidance: always use "Redis Software" instead of "Redis
    # Enterprise" in published docs, even though upstream redisvl source still
    # uses the legacy term.
    text = text.replace("Redis Enterprise", "Redis Software")
    src.write_text(text, encoding="utf-8")



_API_OTHER_PAGE = re.compile(r"\(([A-Za-z]+)\.md#(redisvl\.[a-zA-Z0-9_.]+)\)")
_API_SAME_PAGE = re.compile(r"\[[^][]+\]\(#(redisvl\.[^)]+)\)")
_HEADING_RE = re.compile(r"^####?(?!#)")
_HEADING_TYPED = re.compile(r"^#### `.+: .*\[.+\]\(#.+\)")


def _awk_join(fields: list[str]) -> str:
    """Reassemble a line the way awk does after a field is modified (OFS=' ')."""
    return " ".join(fields)


def _transform_api_heading(line: str) -> str:
    """Reproduce the gawk signature-formatting block for #### / ##### lines."""
    fields = line.split()
    if len(fields) < 2:
        return line
    f2 = fields[1]
    if f2.startswith("*"):
        f2 = f2.replace("*", "")
    f2 = "`" + f2
    fields[1] = f2
    line = _awk_join(fields)

    if _HEADING_TYPED.match(line):
        # Re-split after rebuild so $4 is the link's target.
        fields = line.split()
        if len(fields) >= 4:
            f4 = "`" + fields[3]
            f4 = re.sub(r"`$", "", f4)
            f4 = re.sub(r"\*$", "", f4)
            fields[3] = f4
            line = _awk_join(fields)
    else:
        line = line + "`"

    line = line.replace(r"\*\*", "**")
    line = line.replace(r"\_", "_")
    line = re.sub(r" ?\*:", ":", line)
    line = re.sub(r"\*`$", "`", line)
    line = line.replace("* *= {", " = {")
    line = line.replace(" *= ", " = ")
    if re.search(r"\[.+\]\(.+relref.+\)", line):
        line = line.replace("[", "`[`")
        line = line.replace("]", "`]")
        line = line.replace(")", ")` ")
    line = line.replace(r"\*", "*")
    return line


def transform_api_page(src: Path) -> None:
    """Reimplementation of the gawk pipeline for ./redis_vl_hugo/api/*.md."""
    out_lines = []
    for line in src.read_text(encoding="utf-8").splitlines():
        # Cross-page relrefs: (foo.md#redisvl.x.y.z) -> ({{< relref "foo/#z" >}}).
        if _API_OTHER_PAGE.search(line):
            def cross_repl(m: re.Match) -> str:
                page = m.group(1)
                last = m.group(2).split(".")[-1].lower()
                return f'({{{{< relref "{page}/#{last}" >}}}})'
            line = _API_OTHER_PAGE.sub(cross_repl, line)
        # Same-page relrefs: [Anything](#redisvl.x.y.z) -> [Anything](#z).
        if _API_SAME_PAGE.search(line):
            def same_repl(m: re.Match) -> str:
                visible = m.group(1).split(".")[-1]
                anchor = visible.lower()
                return f"[{visible}](#{anchor})"
            line = _API_SAME_PAGE.sub(same_repl, line)
        if _HEADING_RE.match(line):
            line = _transform_api_heading(line)
        line = line.replace(r"*[**", r"*[* *")
        line = line.replace(r"*(**", r"*(* *")
        out_lines.append(line)
    src.write_text("\n".join(out_lines) + "\n", encoding="utf-8")


def transform_index_page(src: Path) -> None:
    """Final fix-ups for _index.md pages: drop .md, drop NN_, collapse /index/."""
    text = src.read_text(encoding="utf-8")
    text = text.replace(".md", "/")
    text = re.sub(r"\(([^)]*/)?([0-9]{2}_)", r"(\1", text)
    text = text.replace("/index/", "/")
    src.write_text(text, encoding="utf-8")


def build_index_pages(repo_dir: Path, build_dir: Path, staging: Path) -> list[Path]:
    """Produce all _index.md pages, returning their destination paths."""
    md_root = build_dir / "markdown"
    pages: list[Path] = []

    api_index_src = md_root / "api/index.md"
    api_index_dst = staging / "api/_index.md"
    if api_index_src.exists():
        api_index_dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(api_index_src, api_index_dst)
        pages.append(api_index_dst)

    grid_script = BUILD_HELPER_DIR / "redisvl_grid_to_cards.py"
    # Match MyST grid fences like ":::{grid}", "::::{grid} 2",
    # ":::{grid-item-card}" (any number of >=3 colons, no space required).
    grid_marker = re.compile(r"^:{3,}\{grid(?:-item-card)?\}", re.MULTILINE)

    def landing(rel_path: str, hugo_dest: Path, context: str, fallback: Path | None) -> bool:
        upstream = repo_dir / "docs" / rel_path
        # Only run the grid -> cards converter when the upstream MyST source
        # actually uses the sphinx-design grid directives. Legacy versions
        # (v0.6.0 - v0.14.0) ship a plain `{toctree}` index and would otherwise
        # be emptied by the converter; for those, copy the sphinx-built
        # markdown index directly so the auto-TOC bullets survive.
        if upstream.exists() and grid_marker.search(upstream.read_text(encoding="utf-8")):
            hugo_dest.parent.mkdir(parents=True, exist_ok=True)
            run([sys.executable, str(grid_script), str(upstream),
                 str(hugo_dest), "--context", context])
            return True
        if fallback is not None and fallback.exists():
            hugo_dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(fallback, hugo_dest)
            return True
        return False

    targets = [
        ("user_guide/index.md", staging / "user_guide/_index.md", "user_guide",
         md_root / "user_guide/index.md"),
        ("overview/index.md", staging / "overview/_index.md", "user_guide",
         md_root / "overview/index.md"),
        ("concepts/index.md", staging / "concepts/_index.md", "concepts",
         md_root / "concepts/index.md"),
        ("user_guide/how_to_guides/index.md",
         staging / "user_guide/how_to_guides/_index.md", "how_to_guides",
         md_root / "user_guide/how_to_guides/index.md"),
        ("user_guide/use_cases/index.md",
         staging / "user_guide/use_cases/_index.md", "use_cases",
         md_root / "user_guide/use_cases/index.md"),
    ]
    for rel_path, hugo_dest, context, fallback in targets:
        # Only attempt overview/concepts when we actually staged that subtree.
        top = hugo_dest.parent.relative_to(staging).parts[0]
        if top in ("overview", "concepts") and not (staging / top).exists():
            continue
        if landing(rel_path, hugo_dest, context, fallback):
            pages.append(hugo_dest)
    return pages


def rename_strip_numbers(staging: Path) -> None:
    """Drop the leading NN_ from filenames in user_guide/** (skipping _index.md)."""
    for path in (staging / "user_guide").rglob("*.md"):
        if path.name == "_index.md":
            continue
        renamed = re.sub(r"/[0-9]+_", "/", path.as_posix())
        if renamed != path.as_posix():
            new_path = Path(renamed)
            new_path.parent.mkdir(parents=True, exist_ok=True)
            path.rename(new_path)



def copy_tree_into(src: Path, dst: Path) -> None:
    """Recursive copy of *contents* of src into dst (cp -r src/* dst/)."""
    dst.mkdir(parents=True, exist_ok=True)
    for entry in src.iterdir():
        target = dst / entry.name
        if entry.is_dir():
            shutil.copytree(entry, target, dirs_exist_ok=True)
        else:
            shutil.copy2(entry, target)


def write_to_destination(staging: Path, repo_dir: Path, version: str, *, is_latest: bool) -> None:
    """Final step 14 of the bash pipeline."""
    if is_latest:
        for sub in ("api", "user_guide", "overview", "concepts"):
            target = CONTENT_BASE / sub
            if target.exists():
                shutil.rmtree(target)
        copy_tree_into(staging, CONTENT_BASE)
        arch_svg = repo_dir / "docs/_static/redisvl-architecture.svg"
        if arch_svg.exists():
            STATIC_BASE.mkdir(parents=True, exist_ok=True)
            shutil.copy2(arch_svg, STATIC_BASE / "redisvl-architecture.svg")
        return

    versioned = CONTENT_BASE / version
    for sub in ("api", "user_guide", "overview", "concepts"):
        target = versioned / sub
        if target.exists():
            shutil.rmtree(target)
    versioned.mkdir(parents=True, exist_ok=True)
    copy_tree_into(staging, versioned)
    root_index = CONTENT_BASE / "_index.md"
    if root_index.exists():
        shutil.copy2(root_index, versioned / "_index.md")
    root_install = CONTENT_BASE / "install.md"
    if root_install.exists():
        shutil.copy2(root_install, versioned / "install.md")
    archiver = BUILD_HELPER_DIR / "version_archiver.py"
    run([sys.executable, str(archiver), "redisvl", version, "--skip-archive"])


_UNICODE_QUOTES = re.compile(r"[\u201C\u201D]")


def normalize_unicode_quotes(root: Path) -> None:
    # os.walk + onerror tolerates concurrent FS changes (transient missing
    # subdirs) that have been observed on macOS while this sync runs.
    for dirpath, _, filenames in os.walk(root, onerror=lambda _e: None):
        for name in filenames:
            path = Path(dirpath) / name
            try:
                text = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            new_text = _UNICODE_QUOTES.sub('"', text)
            if new_text != text:
                try:
                    path.write_text(new_text, encoding="utf-8")
                except OSError:
                    continue


def sync_version(version: str, *, is_latest: bool, repo_dir: Path,
                 build_dir: Path | None, skip_install: bool, keep_build: bool,
                 staging_dir: Path | None = None) -> None:
    if build_dir is None:
        build_dir = Path("build-latest" if is_latest else f"build-{version}")
    if staging_dir is None:
        staging_dir = STAGING_DIR
    print(f"\n=== redisvl {version} (latest={is_latest}) ===", flush=True)
    ensure_repo(repo_dir, version)
    if not skip_install:
        run([sys.executable, "-m", "pip", "install", "--quiet", "-e", str(repo_dir)])
        # Per-version dependency pins so sphinx-autodoc reproduces the
        # docstrings published on docs.redisvl.com for this release. See
        # REDIS_PY_PINS / PYDANTIC_PINS at the top of this module for the
        # rationale behind each row.
        redis_pin = _resolve_pin(version, REDIS_PY_PINS)
        run([sys.executable, "-m", "pip", "install", "--quiet", "--upgrade",
             redis_pin])
        # Pydantic install is fail-soft: a newer redisvl release may hard-pin
        # pydantic outside this window, in which case we accept the drift
        # rather than abort the sync.
        pydantic_pin = _resolve_pin(version, PYDANTIC_PINS)
        pin = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--quiet", pydantic_pin],
            check=False,
        )
        if pin.returncode != 0:
            print(f"  ! {pydantic_pin} pin failed (likely a newer "
                  "redisvl requirement); continuing with the resolved version",
                  flush=True)
    strip_empty_markdown_cells(repo_dir)
    sphinx_build(repo_dir, build_dir)
    stage_markdown(repo_dir, build_dir, staging_dir)
    moved_slugs = move_numbered_user_guides(staging_dir, repo_dir)

    # Step 9: format + transform every page in the staging tree.
    all_pages = sorted(staging_dir.rglob("*.md"))
    for page in all_pages:
        format_page(page, is_latest=is_latest)
        transform_page(page, staging_dir, moved_slugs)

    # Step 10: API page transforms.
    for api_page in sorted((staging_dir / "api").glob("*.md")):
        if api_page.name == "_index.md":
            continue
        transform_api_page(api_page)

    # Step 11-12: index pages.
    index_pages = build_index_pages(repo_dir, build_dir, staging_dir)
    for index_page in index_pages:
        format_page(index_page, is_latest=is_latest)
        transform_index_page(index_page)

    # Step 13: rename to drop NN_.
    rename_strip_numbers(staging_dir)

    # Step 14: write to destination tree.
    write_to_destination(staging_dir, repo_dir, version, is_latest=is_latest)

    # Step 15: normalize unicode quotes everywhere we may have written.
    normalize_unicode_quotes(CONTENT_BASE)

    if not keep_build and build_dir.exists():
        shutil.rmtree(build_dir, ignore_errors=True)
    if staging_dir.exists():
        shutil.rmtree(staging_dir, ignore_errors=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", required=True,
                        help="redisvl release semver, e.g. 0.18.0 (no v prefix)")
    parser.add_argument("--latest", action="store_true",
                        help="Treat this version as the latest (root content + SVG copy)")
    parser.add_argument("--repo", default=str(DEFAULT_REPO_DIR),
                        help="Path to a local clone of redis-vl-python (cloned if missing)")
    parser.add_argument("--build-dir", default=None,
                        help="Override sphinx output directory")
    parser.add_argument("--staging-dir", default=None,
                        help="Override the redis_vl_hugo staging directory "
                             "(use a per-version path when running in parallel)")
    parser.add_argument("--keep-build", action="store_true",
                        help="Keep the build-* and redis_vl_hugo dirs after sync")
    parser.add_argument("--skip-install", action="store_true",
                        help="Do not run 'pip install -e' on the upstream repo")
    args = parser.parse_args()

    sync_version(
        args.version,
        is_latest=args.latest,
        repo_dir=Path(args.repo),
        build_dir=Path(args.build_dir) if args.build_dir else None,
        staging_dir=Path(args.staging_dir) if args.staging_dir else None,
        skip_install=args.skip_install,
        keep_build=args.keep_build,
    )


if __name__ == "__main__":
    main()
