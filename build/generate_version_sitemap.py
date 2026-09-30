#!/usr/bin/env python3
"""Write a sitemap for one versioned subtree, inside the directory that ships.

Every versioned matrix build in ``.github/workflows/main.yml`` renders a *whole*
site: the version's content rsynced up to the unversioned content path, plus the
rest of the docs. Hugo therefore writes one ``sitemap.xml`` at the root of the
build output, listing all ~5,800 pages.

But the deploy step for a versioned build uploads only the versioned
subdirectory::

    gsutil -m rsync -r -c -j html -d \\
      "output/operate/rs/${version}" \\
      "gs://${BUCKET}/docs/${bucket_path}/operate/rs/${version}"

``output/sitemap.xml`` sits one or more levels *above* that directory, so it is
never uploaded by any job. The ``latest`` build deletes the version directories
before building, so its sitemap cannot list those pages either. The result is
that no sitemap anywhere lists a versioned page -- 3,134 live URLs as of this
writing, measured against a local unrestricted build.

This script closes that gap without touching the deploy commands: it filters the
rendered sitemap down to the pages under one versioned subtree and writes the
result *into* the directory that already ships, so the existing rsync picks it up.
``merge_sitemaps.py`` then folds every version's file, plus the latest build's, into
the single published ``sitemap.xml``.

The locs need no rewriting. Every page under a version directory carries explicit
``url:`` frontmatter pinning its versioned path (all 435 files under
``content/operate/rs/7.8`` do), so Hugo already computes the correct public
permalink -- ``https://redis.io/docs/latest/operate/rs/7.8/...`` -- even though
the content was rsynced to the unversioned path before the build. We copy whole
``<url>`` elements, so ``lastmod`` comes through as Hugo computed it from git.

Exits non-zero when the subtree matches nothing. That is the regression guard: if
a future change stops those pages being emitted at their versioned URLs, this
fails the build rather than silently shipping an empty sitemap.

Run with ``pytest build/test_sitemaps.py`` for the tests.
"""

import argparse
import logging
import os
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML_NS = "http://www.w3.org/1999/xhtml"

logger = logging.getLogger("generate_version_sitemap")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sitemap", default="output/sitemap.xml",
                        help="sitemap Hugo rendered at the build root")
    parser.add_argument("--subtree", required=True,
                        help="versioned path to keep, e.g. operate/rs/7.8")
    parser.add_argument("--output", required=True,
                        help="where to write the filtered sitemap")
    parser.add_argument("--allow-empty", action="store_true",
                        help="warn instead of failing when nothing matches")
    return parser.parse_args()


def in_subtree(loc: str, subtree: str) -> bool:
    """Is ``loc`` the subtree root or a page beneath it?

    Compared on the URL *path* so that a baseURL which itself contains the
    subtree string cannot widen the match, and segment-anchored so that
    ``operate/rs/7.8`` does not swallow a future ``operate/rs/7.8-rc1``.
    """
    path = urlparse(loc).path
    marker = "/" + subtree.strip("/")
    return path.rstrip("/").endswith(marker) or (marker + "/") in path


def filter_sitemap(xml_text: str, subtree: str) -> tuple[str, int]:
    """Return a sitemap holding only the ``<url>`` entries under ``subtree``."""
    ET.register_namespace("", SITEMAP_NS)
    ET.register_namespace("xhtml", XHTML_NS)

    source = ET.fromstring(xml_text)
    kept = ET.Element(f"{{{SITEMAP_NS}}}urlset")

    for url in source.findall(f"{{{SITEMAP_NS}}}url"):
        loc = url.find(f"{{{SITEMAP_NS}}}loc")
        if loc is not None and loc.text and in_subtree(loc.text, subtree):
            kept.append(url)

    ET.indent(kept, space="  ")
    body = ET.tostring(kept, encoding="unicode")
    header = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n'
    return header + body + "\n", len(kept)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s")
    args = parse_args()

    if not os.path.isfile(args.sitemap):
        logger.error("no sitemap at %s -- did hugo run?", args.sitemap)
        return 1

    with open(args.sitemap, encoding="utf-8") as handle:
        xml_text = handle.read()

    document, count = filter_sitemap(xml_text, args.subtree)

    if not count:
        message = "%s matched no URLs in %s"
        if not args.allow_empty:
            logger.error(message, args.subtree, args.sitemap)
            logger.error("versioned pages are not being emitted at their "
                         "versioned URLs -- check the url: frontmatter")
            return 1
        logger.warning(message, args.subtree, args.sitemap)

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as handle:
        handle.write(document)

    logger.info("wrote %d URLs for %s to %s", count, args.subtree, args.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
