#!/usr/bin/env python3
"""Merge the latest and per-version sitemaps into the one published sitemap.xml.

No single build can produce a complete sitemap. The ``latest`` build deletes the
version directories before Hugo runs, so its sitemap lists ~2,700 URLs and no
versioned page. Each versioned build does render its own pages, but only its
versioned subdirectory is deployed, so the sitemap Hugo writes at the root of that
build never ships. The union is ~5,800 URLs and lives in neither place.

``generate_version_sitemap.py`` runs inside each versioned build and emits that
version's subtree sitemap. This script runs after all of them, in a job that
collects their (tiny) artifacts plus the latest build's sitemap, and concatenates
everything into one flat ``<urlset>`` that overwrites the published file.

Flat urlset rather than a sitemap index, deliberately: the SEO team's own file is
already a sitemap index, and the protocol does not allow one index to nest inside
another. Overwriting the address they already reference also means they need change
nothing. At ~5,800 URLs this is well inside the 50,000 URL / 50 MB ceiling.

Deduplicates on loc. Nothing should collide -- the latest build and each version
cover disjoint paths -- so a duplicate means two builds claimed the same URL, which
is worth knowing about and is logged.
"""

import argparse
import logging
import os
import sys
import xml.etree.ElementTree as ET

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML_NS = "http://www.w3.org/1999/xhtml"

logger = logging.getLogger("merge_sitemaps")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_dir",
                        help="directory holding the downloaded sitemap artifacts")
    parser.add_argument("--output", required=True,
                        help="where to write the merged sitemap")
    parser.add_argument("--expect", type=int, default=None,
                        help="number of sitemaps that must be present (versions plus "
                             "the latest build); fail if fewer")
    return parser.parse_args()


def find_sitemaps(input_dir: str) -> list[str]:
    """Every ``sitemap.xml`` under ``input_dir``, in a stable order."""
    found = []
    for root, _dirs, files in os.walk(input_dir):
        for name in files:
            if name == "sitemap.xml":
                found.append(os.path.join(root, name))
    return sorted(found)


def merge(paths: list[str]) -> tuple[str, int]:
    """Concatenate the ``<url>`` entries of every sitemap in ``paths``."""
    ET.register_namespace("", SITEMAP_NS)
    ET.register_namespace("xhtml", XHTML_NS)

    merged = ET.Element(f"{{{SITEMAP_NS}}}urlset")
    seen: set[str] = set()

    for path in paths:
        source = ET.parse(path).getroot()
        added = 0
        for url in source.findall(f"{{{SITEMAP_NS}}}url"):
            loc = url.find(f"{{{SITEMAP_NS}}}loc")
            if loc is None or not loc.text:
                continue
            if loc.text in seen:
                logger.warning("duplicate loc %s (from %s)", loc.text, path)
                continue
            seen.add(loc.text)
            merged.append(url)
            added += 1
        logger.info("%s contributed %d URLs", path, added)

    ET.indent(merged, space="  ")
    body = ET.tostring(merged, encoding="unicode")
    header = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n'
    return header + body + "\n", len(merged)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s")
    args = parse_args()

    paths = find_sitemaps(args.input_dir)
    if not paths:
        logger.error("no sitemap.xml found under %s", args.input_dir)
        return 1

    # Refuse to overwrite the published sitemap with a partial one. A missing
    # artifact means a build failed, and quietly dropping its pages out of the file
    # is the exact failure this whole change exists to fix.
    if args.expect is not None and len(paths) < args.expect:
        logger.error("found %d sitemaps but expected %d", len(paths), args.expect)
        logger.error("a build's sitemap is missing -- keeping the published "
                     "sitemap rather than shipping an incomplete one")
        return 1

    document, count = merge(paths)

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as handle:
        handle.write(document)

    logger.info("wrote %d URLs from %d sitemaps to %s",
                count, len(paths), args.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
