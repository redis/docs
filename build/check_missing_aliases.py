"""Report content pages that moved without gaining an alias for their old URL.

Renaming a content file changes its published URL, and the old URL dies unless
the page declares an ``aliases:`` entry for it. That entry is author-declared
and therefore unreliable: measured over this repo's history, only 290 of 598
URL-changing moves carry a matching alias, and it fails inconsistently even
within a single commit (``155277839`` moved LangCache and Agent Memory together;
LangCache got an alias, Agent Memory did not, and its old URL 404s today).

This scans git history for renames, works out which ones actually changed a
published URL, and reports those with no alias. ``--fix`` writes the missing
aliases into frontmatter.

Seven things make a naive version of this worse than useless -- a first attempt
reported 961 missing aliases against a true 258, nearly three quarters of it
noise, and every false positive looked plausible in a list -- so each of the
seven is handled explicitly:

1. **Hugo bundles.** ``index.md`` (leaf) and ``_index.md`` (branch) both publish
   at the containing directory's URL, so neither name appears in the URL and
   renaming ``foo/index.md`` to ``foo.md`` changes nothing. 527 of this repo's
   renames are of that kind -- the single largest source of false positives.
2. **Non-published directories.** ``content/embeds/`` carries a
   ``build.render: never`` cascade, and the historical ``content/_embeds/``
   never reached the site either (240 renames between them). The rule is read
   off the tree, not hardcoded -- and most of those files have no frontmatter,
   so there would be nowhere to put an alias in any case.
3. **``url:`` frontmatter** overrides the path-derived URL. It is used on
   exactly the versioned trees and nowhere else, so those are skipped.
4. **Chains.** A page moved twice must resolve to its final home.
5. **Path reuse.** An old URL may be occupied by a different page today, and
   must never be redirected (22 cases).
6. **Declared-but-not-a-list aliases.** 88 files declare the key with no value
   (49 spelled ``null``, 39 bare) and 104 give it a bare scalar rather than a
   list, so a check that assumes a list silently under-reports. One more uses a
   folded multi-line scalar, which is valid YAML that silently folds two
   intended aliases into one string, so ``--fix`` declines that file.
7. **Collisions.** 28 of the gaps name a URL another page already claims as its
   own alias. Hugo resolves that by picking one arbitrarily and warning, so
   adding the alias unattended would make the redirect ambiguous rather than
   fix it. Those are reported for a human and never auto-fixed.

Warn-only by default (exit 0), like check_page_sizes; pass ``--fail`` to make CI
block on offenders.

See DOC-6951.
"""

# `X | None` annotations are 3.10+; local dev machines are still on 3.9.
from __future__ import annotations

import argparse
import json
import logging
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field

logger = logging.getLogger("check_missing_aliases")

CONTENT = "content"

# A path segment that looks like a semver version marks the versioned trees,
# which set `url:` in frontmatter and so cannot have their URL derived from
# their path. Matches two- and three-component versions (7.8, 0.10.0).
VERSIONED = re.compile(r"/[0-9]+\.[0-9]+(\.[0-9]+)?/")

# git's default rename-detection similarity. Measured on this repo: 20% finds
# 617 URL-changing moves, 50% finds 598, 90% finds 477 -- so the default is
# close to the ceiling, and the tail that reads as delete-plus-add rather than a
# rename (a file renamed and heavily rewritten at once) is about 3.5%.
DEFAULT_THRESHOLD = 50

# Leading slash is effectively universal in this repo (918 of 929 entries).
# Trailing slash is a genuine 54/46 split with no house convention, so --fix
# picks one and stays consistent rather than guessing per file.
ALIAS_TEMPLATE = "/{url}/"

# YAML spellings of "this key has no value". 49 files write `aliases: null` and
# 39 leave the key bare; both must be treated as empty, not as a one-item list
# containing the string "null".
NO_VALUE = ("", "null", "~")


@dataclass
class Move:
    """A rename that changed a page's published URL."""

    old_path: str
    new_path: str
    old_url: str
    new_url: str
    date: str
    commit: str
    aliased: bool = False
    occupied: bool = False
    collides_with: list[str] = field(default_factory=list)

    @property
    def actionable(self) -> bool:
        """True when the alias can be added safely and without a judgment call."""
        return not (self.aliased or self.occupied or self.collides_with)


@dataclass
class FileFix:
    """Aliases to add to one file."""

    path: str
    aliases: list[str] = field(default_factory=list)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument("--range", dest="rev_range", default="origin/main..HEAD",
                       help="revision range to scan (default: origin/main..HEAD)")
    scope.add_argument("--all", action="store_true",
                       help="scan the whole history instead of a range")
    parser.add_argument("--threshold", type=int, default=DEFAULT_THRESHOLD,
                        help=f"rename similarity %% (default: {DEFAULT_THRESHOLD})")
    parser.add_argument("--fix", action="store_true",
                        help="write the missing aliases into frontmatter")
    parser.add_argument("--json", dest="json_out", metavar="PATH",
                        help="also write the findings as JSON")
    parser.add_argument("--github", action="store_true",
                        help="emit GitHub Actions warning annotations")
    parser.add_argument("--fail", action="store_true",
                        help="exit non-zero if any move is missing an alias")
    return parser.parse_args()


def git(*args: str) -> str:
    return subprocess.run(["git", *args], capture_output=True, text=True,
                          check=True).stdout


# --------------------------------------------------------------------------- #
# path -> URL
# --------------------------------------------------------------------------- #

def to_url(path: str) -> str:
    """Derive a page's URL path from its content path.

    Hugo bundles are the trap here: ``_index.md`` (branch) and ``index.md``
    (leaf) both publish at the containing directory's URL, so neither name
    appears in the URL.
    """
    rel = path[len(CONTENT) + 1:]
    rel = re.sub(r"\.md$", "", rel)
    rel = re.sub(r"/_?index$", "", rel)
    return "" if rel in ("_index", "index") else rel


_render_never: set[str] | None = None


def render_never_roots() -> set[str]:
    """Content directories Hugo is told never to render.

    ``content/embeds/_index.md`` sets ``build.render: never`` with a ``cascade``,
    so none of the 119 fragment files beneath it is published -- they are pulled
    in by the ``embed-yaml`` shortcode instead, and most have no frontmatter at
    all, so there is nowhere to put an alias even if one were wanted. Derived
    from the tree rather than hardcoded, so a new one is picked up for free.
    """
    global _render_never
    if _render_never is not None:
        return _render_never

    import yaml

    roots: set[str] = set()
    try:
        candidates = git("grep", "-l", "render: never", "--", CONTENT).splitlines()
    except subprocess.CalledProcessError:
        candidates = []  # git grep exits 1 when nothing matches
    for path in candidates:
        if not path.endswith("_index.md"):
            continue
        try:
            lines = read_lines(path)
        except OSError:
            continue
        bounds = frontmatter_bounds(lines)
        if not bounds:
            continue
        try:
            data = yaml.safe_load("".join(lines[1:bounds[1]])) or {}
        except yaml.YAMLError:
            continue
        if not isinstance(data, dict):
            continue
        cascade = data.get("cascade") or {}
        build = cascade.get("build") if isinstance(cascade, dict) else None
        if isinstance(build, dict) and str(build.get("render")) == "never":
            roots.add(os.path.dirname(path)[len(CONTENT) + 1:] + "/")
    _render_never = roots
    return roots


def is_published(path: str) -> bool:
    """False for content Hugo never publishes as a page of its own."""
    rel = path[len(CONTENT) + 1:]
    if any(d.startswith("_") for d in rel.split("/")[:-1]):
        return False  # e.g. the historical content/_embeds/
    return not any(rel.startswith(root) for root in render_never_roots())


def is_versioned(path: str) -> bool:
    return bool(VERSIONED.search(path))


def eligible(path: str) -> bool:
    return (path.startswith(CONTENT + "/") and path.endswith(".md")
            and is_published(path) and not is_versioned(path))


def norm(url: str) -> str:
    return url.strip().strip("/").lower()


# --------------------------------------------------------------------------- #
# frontmatter
# --------------------------------------------------------------------------- #

def frontmatter_bounds(lines: list[str]) -> tuple[int, int] | None:
    """Return (first, last) line indices of the ``---`` fences, or None."""
    if not lines or lines[0].rstrip("\n") != "---":
        return None
    for i in range(1, len(lines)):
        if lines[i].rstrip("\n") == "---":
            return 0, i
    return None


def read_lines(path: str) -> list[str]:
    with open(path, encoding="utf-8") as handle:
        return handle.readlines()


def declared_aliases(path: str) -> set[str]:
    """Every alias the file declares, normalized for comparison.

    Parsed with PyYAML rather than by hand: the repo uses block lists,
    single-line inline lists, and multi-line inline lists, and a regex that
    misses one of them silently under-reports.
    """
    try:
        lines = read_lines(path)
    except OSError:
        return set()
    bounds = frontmatter_bounds(lines)
    if not bounds:
        return set()
    import yaml  # local import: only the alias path needs it

    try:
        data = yaml.safe_load("".join(lines[1:bounds[1]])) or {}
    except yaml.YAMLError:
        logger.warning("  ! %s: frontmatter is not valid YAML, skipping", path)
        return set()
    if not isinstance(data, dict):
        return set()
    # Hugo frontmatter keys are case-insensitive.
    values = next((v for k, v in data.items() if str(k).lower() == "aliases"), None)
    if values is None:
        return set()
    if isinstance(values, str):
        values = [values]
    if not isinstance(values, list):
        return set()
    return {norm(str(v)) for v in values if v is not None and str(v).strip()}


# --------------------------------------------------------------------------- #
# finding moves
# --------------------------------------------------------------------------- #

def find_moves(rev_range: str | None, threshold: int) -> list[Move]:
    """Renames in the given range, chained so each page resolves to its final home."""
    args = ["log", "--reverse", f"--find-renames={threshold}%", "--diff-filter=R",
            "--name-status", "--format=COMMIT\t%H\t%ad", "--date=short"]
    if rev_range:
        args.append(rev_range)
    args += ["--", CONTENT]
    try:
        out = git(*args)
    except subprocess.CalledProcessError as exc:
        logger.error("check_missing_aliases: git log failed for range %r.\n%s",
                     rev_range, exc.stderr.strip())
        raise

    # path-as-it-stands-now -> the (old_path, date, commit) records behind it
    history: dict[str, set[tuple[str, str, str]]] = {}
    commit = date = ""
    for line in out.splitlines():
        if line.startswith("COMMIT\t"):
            _, commit, date = line.split("\t")
            continue
        parts = line.split("\t")
        if len(parts) != 3 or not parts[0].startswith("R"):
            continue
        _, old, new = parts
        if not (eligible(old) and eligible(new)):
            continue
        # Merge rather than assign. If a second file later renames onto a path
        # that already carries a chain -- possible once the first occupant has
        # been deleted rather than moved -- assigning would drop the earlier
        # records silently. That happens once in this repo's history, and in a
        # degenerate form where the dropped record has the same old_path, so
        # merging changes nothing today. It is here because the loss would be
        # invisible, and any real ambiguity it surfaces is caught downstream by
        # the collision check rather than acted on.
        carried = history.pop(old, set())
        history.setdefault(new, set()).update(carried)
        history[new].add((old, date, commit))

    tracked = set(git("ls-files", CONTENT).splitlines())
    moves: list[Move] = []
    for new_path, records in history.items():
        if new_path not in tracked:
            continue  # moved, then later deleted -- nothing to redirect to
        new_url = to_url(new_path)
        for old_path, date, commit in records:
            old_url = to_url(old_path)
            if norm(old_url) == norm(new_url):
                continue  # a bundle rename, or otherwise URL-preserving
            moves.append(Move(old_path=old_path, new_path=new_path,
                              old_url=old_url, new_url=new_url,
                              date=date, commit=commit[:9]))

    # A redirect is identified by where it comes from and where it goes, so the
    # same pair reached by two routes -- a page moved away and back, or a
    # recurring rename like the monthly changelog -- is one redirect, not two.
    # 14 pairs in this repo's history arrive twice. Keep the earliest.
    moves.sort(key=lambda m: (m.date, m.old_url))
    seen: set[tuple[str, str]] = set()
    unique: list[Move] = []
    for move in moves:
        fingerprint = (norm(move.old_url), move.new_path)
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        unique.append(move)
    return unique


def published_urls() -> set[str]:
    """Normalized URLs of every page published today."""
    return {norm(to_url(p)) for p in git("ls-files", CONTENT).splitlines()
            if eligible(p)}


def alias_owners() -> dict[str, set[str]]:
    """Every alias currently declared anywhere in content, mapped to its owners."""
    owners: dict[str, set[str]] = {}
    try:
        candidates = git("grep", "-l", "-E", "^aliases:", "--", CONTENT).splitlines()
    except subprocess.CalledProcessError:
        return owners
    for path in candidates:
        for alias in declared_aliases(path):
            owners.setdefault(alias, set()).add(path)
    return owners


def classify(moves: list[Move]) -> None:
    """Mark each move as aliased, occupied by a live page, or colliding.

    A collision is the trap that has no safe automatic answer: Hugo resolves two
    pages claiming the same alias by picking one and emitting a warning, so
    adding the alias would quietly make the redirect ambiguous rather than fix
    it. 28 of this repo's gaps are collisions -- 24 where another page already
    claims the URL, and 4 where two moved pages both want it.
    """
    current = published_urls()
    owners = alias_owners()
    alias_cache: dict[str, set[str]] = {}

    for move in moves:
        if move.new_path not in alias_cache:
            alias_cache[move.new_path] = declared_aliases(move.new_path)
        move.aliased = norm(move.old_url) in alias_cache[move.new_path]
        move.occupied = norm(move.old_url) in current
        if not (move.aliased or move.occupied):
            claimed = owners.get(norm(move.old_url), set()) - {move.new_path}
            move.collides_with = sorted(claimed)

    # Two moved pages wanting the same alias collide with each other, which no
    # amount of looking at existing frontmatter would reveal.
    wanted: dict[str, set[str]] = {}
    for move in moves:
        if move.actionable:
            wanted.setdefault(norm(move.old_url), set()).add(move.new_path)
    for move in moves:
        rivals = wanted.get(norm(move.old_url), set()) - {move.new_path}
        if move.actionable and rivals:
            move.collides_with = sorted(rivals)


# --------------------------------------------------------------------------- #
# --fix
# --------------------------------------------------------------------------- #

def insert_aliases(lines: list[str], new_aliases: list[str]) -> list[str] | None:
    """Add aliases to a file's frontmatter, editing line by line.

    Deliberately not a YAML round-trip: ``yaml.safe_load`` followed by
    ``yaml.dump`` reorders keys alphabetically and renormalizes quoting, which
    would rewrite the frontmatter of every file it touched into an unreviewable
    diff. This preserves everything it does not need to change.
    """
    bounds = frontmatter_bounds(lines)
    if not bounds:
        return None
    _, close = bounds

    key = None
    for i in range(1, close):
        if re.match(r"(?i)aliases[ \t]*:", lines[i]):
            key = i
            break

    if key is None:
        # No aliases key at all: add one just above the closing fence.
        block = ["aliases:\n"] + [f"- {a}\n" for a in new_aliases]
        return lines[:close] + block + lines[close:]

    rest = lines[key].split(":", 1)[1].strip()
    indent = re.match(r"[ \t]*", lines[key]).group(0)

    if rest.startswith("[") and rest.endswith("]") and len(rest) > 1:
        # Single-line inline list: aliases: [/a/, /b/]
        inner = rest[1:-1].strip().rstrip(",").strip()
        items = ([inner] if inner else []) + new_aliases
        lines = list(lines)
        lines[key] = f"{indent}aliases: [{', '.join(items)}]\n"
        return lines

    if rest == "[":
        # Multi-line inline list: find its closing bracket.
        for j in range(key + 1, close):
            if lines[j].strip().startswith("]"):
                item_indent = (re.match(r"[ \t]*", lines[key + 1]).group(0)
                               if j > key + 1 else indent + "  ")
                block = [f"{item_indent}{a},\n" for a in new_aliases]
                return lines[:j] + block + lines[j:]
        return None

    # A YAML folded scalar continued on the next line:
    #
    #     aliases: /a/
    #              /b/
    #
    # This is valid YAML but reads as the single string "/a/ /b/", so the
    # author's second alias never worked. Editing only the first line would
    # leave the continuation dangling and break the frontmatter outright, so
    # refuse it and let a human fix the underlying content bug. One file today.
    following = lines[key + 1] if key + 1 < close else ""
    if (following[:1] in (" ", "\t")
            and not re.match(r"[ \t]*-[ \t]*\S", following)
            and not re.match(r"[ \t]*\S+[ \t]*:", following)):
        return None

    if rest.lower() in NO_VALUE:
        # A block list, or the key with no value. 49 files write `aliases: null`
        # and 39 leave it bare; YAML reads both as absent, so the placeholder is
        # dropped rather than carried into the list as a literal "null" entry.
        lines = list(lines)
        if rest:
            lines[key] = f"{indent}aliases:\n"
        last = key
        for j in range(key + 1, close):
            if re.match(r"[ \t]*-[ \t]*\S", lines[j]):
                last = j
            elif lines[j].strip() == "":
                continue
            else:
                break
        item_indent = (re.match(r"[ \t]*", lines[last]).group(0)
                       if last != key else indent)
        block = [f"{item_indent}- {a}\n" for a in new_aliases]
        return lines[:last + 1] + block + lines[last + 1:]

    # A scalar value (aliases: /a/) -- 104 files. Promote it to an inline list.
    # Some of those carry a stray trailing comma from an author writing a list
    # without brackets, which would otherwise become an empty list entry.
    existing = rest.rstrip(",").strip()
    items = ([existing] if existing else []) + new_aliases
    lines = list(lines)
    lines[key] = f"{indent}aliases: [{', '.join(items)}]\n"
    return lines


def apply_fixes(moves: list[Move]) -> tuple[int, int, list[str]]:
    """Write missing aliases into frontmatter.

    Returns (files changed, aliases added, files that still need a manual fix).
    The third value matters to callers: a sweep that reports success while some
    aliases could not be placed would claim a complete fix it did not make.
    """
    by_file: dict[str, FileFix] = {}
    for move in moves:
        if not move.actionable:
            continue
        fix = by_file.setdefault(move.new_path, FileFix(path=move.new_path))
        alias = ALIAS_TEMPLATE.format(url=norm(move.old_url))
        if alias not in fix.aliases:
            fix.aliases.append(alias)

    files = aliases = 0
    skipped: list[str] = []
    for fix in by_file.values():
        if not os.path.exists(fix.path):
            logger.warning("  ! %s no longer exists, skipping", fix.path)
            skipped.append(fix.path)
            continue
        existing = declared_aliases(fix.path)
        wanted = [a for a in fix.aliases if norm(a) not in existing]
        if not wanted:
            continue
        lines = read_lines(fix.path)
        updated = insert_aliases(lines, wanted)
        if updated is None:
            logger.warning("  ! %s: could not place aliases, skipping", fix.path)
            skipped.append(fix.path)
            continue
        with open(fix.path, "w", encoding="utf-8") as handle:
            handle.writelines(updated)
        files += 1
        aliases += len(wanted)
        logger.info("  + %s", fix.path)
        for alias in wanted:
            logger.info("      %s", alias)
    return files, aliases, skipped


# --------------------------------------------------------------------------- #
# reporting
# --------------------------------------------------------------------------- #

def report(moves: list[Move], github: bool, fix_hint: str) -> list[Move]:
    missing = [m for m in moves if m.actionable]
    occupied = [m for m in moves if not m.aliased and m.occupied]
    collisions = [m for m in moves
                  if not m.aliased and not m.occupied and m.collides_with]
    aliased = [m for m in moves if m.aliased]

    logger.info("check_missing_aliases: %d URL-changing move(s) found.", len(moves))
    if moves:
        logger.info("  %d already aliased, %d missing an alias, %d skipped "
                    "(old URL is a live page), %d need a decision (collision).",
                    len(aliased), len(missing), len(occupied), len(collisions))

    if occupied:
        logger.info("Skipped -- old URL currently resolves, so must not redirect:")
        for move in occupied:
            logger.info("  %s  %s", move.date, move.old_url)

    if collisions:
        logger.warning("Needs a human decision -- another page already claims "
                       "this URL, so Hugo would pick one arbitrarily:")
        for move in collisions:
            logger.warning("  %s  %s", move.date, move.old_url)
            logger.warning("      wanted by %s", move.new_path)
            for owner in move.collides_with:
                logger.warning("      claimed by %s", owner)

    if missing:
        logger.warning("Moved with no alias for the old URL:")
        for move in missing:
            logger.warning("  %s %s  %s", move.date, move.commit, move.old_url)
            logger.warning("      now at %s", move.new_url)
            logger.warning("      add to %s: %s", move.new_path,
                           ALIAS_TEMPLATE.format(url=norm(move.old_url)))
            if github:
                print(f"::warning file={move.new_path}::Page moved from "
                      f"/{norm(move.old_url)}/ with no alias. Add "
                      f"'{ALIAS_TEMPLATE.format(url=norm(move.old_url))}' to its "
                      f"aliases, or run: make check_aliases_fix")
        logger.warning("Fix them all with: %s", fix_hint)
    return missing


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    args = parse_args()

    rev_range = None if args.all else args.rev_range
    try:
        moves = find_moves(rev_range, args.threshold)
    except subprocess.CalledProcessError:
        return 1
    classify(moves)

    fix_hint = ("make check_aliases_fix" if args.all else
                "python3 build/check_missing_aliases.py "
                f"--range {args.rev_range} --fix")
    missing = report(moves, args.github, fix_hint)

    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as handle:
            json.dump([m.__dict__ for m in moves], handle, indent=1)
        logger.info("Wrote %s", args.json_out)

    if args.fix and missing:
        logger.info("Adding %d alias(es):", len(missing))
        files, aliases, skipped = apply_fixes(moves)
        logger.info("check_missing_aliases: added %d alias(es) across %d file(s).",
                    aliases, files)
        if skipped:
            logger.warning("check_missing_aliases: could not place aliases in %d "
                           "file(s), which still need fixing by hand:", len(skipped))
            for path in skipped:
                logger.warning("  %s", path)
        return 1 if (skipped and args.fail) else 0

    return 1 if (missing and args.fail) else 0


if __name__ == "__main__":
    sys.exit(main())
