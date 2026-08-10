"""Record when each page move happened, for the published redirect map.

The map in ``layouts/index.redirects.json`` is rendered from ``.Aliases``, which is
everything Hugo knows. It cannot say *when* a page moved, because frontmatter does
not record that -- only git does. This writes those dates into ``data/page-moves.json``
before the build, so the template can attach a ``moved_on`` to each redirect it
publishes.

Why a consumer wants it: a date separates "this redirect is years old, I have surely
seen it" from "this appeared last week, my index is stale". Without one, every entry
in a thousand-line map looks equally new.

Generated at build time and gitignored, matching ``data/examples.json`` and the other
derived data files in this repo. That keeps it from going stale, which a committed
snapshot of git history would do immediately.

Deliberately does **not** record deleted pages, though the redirect map would be a
natural home for them. git cannot reliably distinguish a deletion from a move it
failed to detect: of 195 apparent deletions in this repo's history, 83 have a
same-named page somewhere else today, so they almost certainly moved by a
delete-plus-add that fell below git's rename similarity threshold. Publishing those as
deleted would tell a consumer to discard a citation that still resolves, which is
worse than saying nothing at all. The remaining 112 are not safe either, since a page
can be renamed *and* relocated in one go, which no name-matching heuristic can see.
See DOC-6951.
"""

import json
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from check_missing_aliases import (  # noqa: E402
    DEFAULT_THRESHOLD, classify, find_moves, git, norm,
)

logger = logging.getLogger("generate_page_moves")

OUTPUT = os.path.join("data", "page-moves.json")


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    # A shallow clone has no rename records, so the scan below finds nothing and
    # reports zero moves perfectly happily -- which is how this shipped with no dates
    # at all while local full-clone builds showed hundreds. Say so loudly rather than
    # writing an empty file that looks like a corpus with no history.
    shallow = git("rev-parse", "--is-shallow-repository").strip() == "true"
    if shallow:
        logger.warning("::warning::generate_page_moves: this is a shallow clone, so "
                       "no move dates can be read. The redirect map will publish "
                       "none. Check out with fetch-depth: 0.")

    moves = find_moves(None, DEFAULT_THRESHOLD)
    classify(moves)

    # One record per redirect, keyed the way the map keys its entries so the template
    # can look a date up directly. Where a page moved more than once the earliest
    # date wins, because that is when the old URL stopped resolving -- which is what
    # a consumer holding a stale citation actually cares about.
    dates: dict[str, str] = {}
    for move in sorted(moves, key=lambda m: m.date):
        key = "/" + norm(move.old_url)
        dates.setdefault(key, move.date)

    try:
        head = git("rev-parse", "--short", "HEAD").strip()
    except Exception:  # noqa: BLE001 - a missing commit must not fail the build
        head = ""

    payload = {
        "generated_from": head,
        # Recorded so a consumer of this file, or anyone reading a build log, can tell
        # "this history has no moves" from "this clone could not see the history".
        "shallow_clone": shallow,
        "count": len(dates),
        "moved_on": dates,
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=1, sort_keys=True)
        handle.write("\n")

    logger.info("generate_page_moves: wrote %d move date(s) to %s.", len(dates), OUTPUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
