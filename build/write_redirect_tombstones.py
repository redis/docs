"""Write a JSON tombstone beside every alias stub Hugo emitted.

Hugo generates alias stubs for the **HTML output format only**. So a moved page's
old URL serves a 200 meta-refresh page, while its ``/index.json`` and
``/index.html.md`` both 404 -- verified on three independent correctly-aliased
moves and reproduced against Hugo 0.143.1.

That matters because ``content/ai-agent-resources.md`` tells consumers to find a
page's JSON by appending ``/index.json`` to its URL. Following that instruction on
a page that moved returns 404, so the move is indistinguishable from a deletion --
and this happens for *every* move, including the ones we alias correctly. Fixing
alias coverage does not fix it; this does.

At each of those URLs we now publish a minimal record:

    {"schema_version": 2, "page_type": "moved",
     "id": "develop/ai/agent-memory",
     "url": "https://redis.io/docs/latest/develop/ai/agent-memory/",
     "moved_to": "https://redis.io/docs/latest/develop/ai/context-engine/agent-memory/"}

``page_type: "moved"`` is a new value in that vocabulary and ``moved_to`` a new
field, so this is a record-shape change and bumps ``aiSchemaVersion`` to 2. A
consumer must switch on ``page_type`` before assuming the documented content shape:
a tombstone deliberately has no ``sections``, ``examples`` or ``content_hash``.

Reads ``public/redirects.json`` -- the map Hugo renders from the same ``.Aliases``
data it uses for the stubs -- rather than parsing stub HTML, so the tombstones
cannot disagree with the map or with the site.

Two things it will not do, both load-bearing:

- **Never overwrite a real page's ``index.json``.** An alias whose path a real page
  occupies gets no tombstone; Hugo does not emit a stub there either, and clobbering
  a real record would be far worse than a 404. A file that is recognisably one of
  our own tombstones *is* rewritten, so an incremental build cannot keep serving a
  ``moved_to`` that has since changed, and one the map no longer names is removed.
- **Only write where a stub exists.** An alias declared on a draft, or one Hugo
  dropped because the URL was taken, produces no stub and so gets no tombstone.

See DOC-6951.
"""

import argparse
import json
import logging
import os
import sys

logger = logging.getLogger("write_redirect_tombstones")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("public_dir", nargs="?", default="public",
                        help="path to the rendered site (default: public)")
    parser.add_argument("--dry-run", action="store_true",
                        help="report what would be written without writing it")
    return parser.parse_args()


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    args = parse_args()

    map_path = os.path.join(args.public_dir, "redirects.json")
    if not os.path.isfile(map_path):
        logger.error("write_redirect_tombstones: %s not found. Run hugo first; the "
                     "map is rendered by layouts/index.redirects.json.", map_path)
        return 1

    with open(map_path, encoding="utf-8") as handle:
        redirect_map = json.load(handle)

    schema_version = redirect_map.get("schema_version")
    base_url = (redirect_map.get("base_url") or "").rstrip("/")
    entries = redirect_map.get("redirects") or []

    def is_tombstone(path: str) -> bool:
        """True if this index.json is one of ours rather than a real page record."""
        try:
            with open(path, encoding="utf-8") as existing:
                return json.load(existing).get("page_type") == "moved"
        except (OSError, json.JSONDecodeError):
            return False

    written = refreshed = no_stub = occupied = 0
    expected: set[str] = set()
    for entry in entries:
        source = (entry.get("from") or "").strip()
        target = (entry.get("to") or "").strip()
        if not source or not target:
            continue

        rel = source.lstrip("/")
        directory = (os.path.join(args.public_dir, *rel.split("/")) if rel
                     else args.public_dir)

        # Only where Hugo actually emitted a stub. A missing directory or missing
        # index.html means the alias was dropped -- the URL was already taken, or
        # it was declared on a draft -- and inventing a record there would publish
        # a JSON document at a URL that serves no page.
        if not os.path.isfile(os.path.join(directory, "index.html")):
            no_stub += 1
            continue

        tombstone_path = os.path.join(directory, "index.json")
        already = os.path.exists(tombstone_path)
        if already and not is_tombstone(tombstone_path):
            # A real page lives here. Never clobber a real record.
            occupied += 1
            continue
        expected.add(os.path.realpath(tombstone_path))

        record = {
            "schema_version": schema_version,
            "id": rel.rstrip("/"),
            "title": "Moved",
            "url": f"{base_url}/{rel}/" if rel else f"{base_url}/",
            "page_type": "moved",
            "moved_to": target,
        }
        if not args.dry_run:
            with open(tombstone_path, "w", encoding="utf-8") as handle:
                json.dump(record, handle, indent=2)
                handle.write("\n")
        if already:
            # One of ours from a previous run. Rewritten rather than left alone, or
            # an incremental build would keep serving a moved_to that has since
            # changed. CI always builds into a fresh tree, so this only shows up
            # locally -- but "correct because CI starts clean" is not correct.
            refreshed += 1
        else:
            written += 1

    # Sweep tombstones that no longer belong: the alias was removed, or it became
    # ambiguous and is now published as a candidate list instead. Only files that
    # are recognisably ours are ever removed, and only when the map no longer names
    # them, so a real page record can never be caught by this.
    removed = 0
    for root, _dirs, files in os.walk(args.public_dir):
        if "index.json" not in files:
            continue
        path = os.path.join(root, "index.json")
        if os.path.realpath(path) in expected:
            continue
        if not is_tombstone(path):
            continue
        if not args.dry_run:
            os.remove(path)
        removed += 1

    verb = "would be written" if args.dry_run else "written"
    logger.info("write_redirect_tombstones: %d tombstone(s) %s from %d map entries.",
                written, verb, len(entries))
    if refreshed:
        logger.info("  %d existing tombstone(s) %s.", refreshed,
                    "would be refreshed" if args.dry_run else "refreshed")
    if removed:
        logger.info("  %d obsolete tombstone(s) %s -- no longer in the map.", removed,
                    "would be removed" if args.dry_run else "removed")
    if no_stub:
        logger.info("  %d alias(es) had no stub, so were skipped -- the URL is taken "
                    "by a real page, or the alias is on a draft.", no_stub)
    if occupied:
        logger.info("  %d had an index.json already and were left alone.", occupied)
    return 0


if __name__ == "__main__":
    sys.exit(main())
