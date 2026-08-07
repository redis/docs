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

- **Never overwrite an existing ``index.json``.** An alias whose path a real page
  occupies gets no tombstone; Hugo does not emit a stub there either, and
  clobbering a real record would be far worse than a 404.
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

    written = no_stub = occupied = 0
    for entry in entries:
        source = (entry.get("from") or "").strip()
        target = (entry.get("to") or "").strip()
        if not source or not target:
            continue

        rel = source.lstrip("/")
        directory = os.path.join(args.public_dir, *rel.split("/")) if rel else args.public_dir

        # Only where Hugo actually emitted a stub. A missing directory or missing
        # index.html means the alias was dropped -- the URL was already taken, or
        # it was declared on a draft -- and inventing a record there would publish
        # a JSON document at a URL that serves no page.
        if not os.path.isfile(os.path.join(directory, "index.html")):
            no_stub += 1
            continue

        tombstone_path = os.path.join(directory, "index.json")
        if os.path.exists(tombstone_path):
            # A real page lives here. Never clobber a real record.
            occupied += 1
            continue

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
        written += 1

    logger.info("write_redirect_tombstones: %d tombstone(s) %s from %d map entries.",
                written, "would be written" if args.dry_run else "written", len(entries))
    if no_stub:
        logger.info("  %d alias(es) had no stub, so were skipped -- the URL is taken "
                    "by a real page, or the alias is on a draft.", no_stub)
    if occupied:
        logger.info("  %d had an index.json already and were left alone.", occupied)
    return 0


if __name__ == "__main__":
    sys.exit(main())
