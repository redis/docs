"""Report rendered HTML pages that are unusually large.

Client code examples are pulled from external client-library repos on every
build, so a page's weight can grow silently when an upstream example file gets
bigger. This is a passive, post-build check: it scans the rendered ``public/``
tree and warns about pages over a size threshold. It never mutates anything and,
by default, never fails the build (exit 0) -- pass ``--fail`` to make CI block
on offenders instead.
"""

import argparse
import logging
import os
import sys

logger = logging.getLogger("check_page_sizes")

DEFAULT_WARN_MB = 5.0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("public_dir", nargs="?", default="public",
                        help="path to the rendered site (default: public)")
    parser.add_argument("--warn-mb", type=float, default=DEFAULT_WARN_MB,
                        help=f"warn above this size in MB (default: {DEFAULT_WARN_MB})")
    parser.add_argument("--fail", action="store_true",
                        help="exit non-zero if any page exceeds the threshold")
    parser.add_argument("--top", type=int, default=25,
                        help="how many of the largest pages to list (default: 25)")
    return parser.parse_args()


def page_sizes(public_dir: str) -> list[tuple[int, str]]:
    sizes: list[tuple[int, str]] = []
    for root, _dirs, files in os.walk(public_dir):
        for name in files:
            if name == "index.html":
                path = os.path.join(root, name)
                sizes.append((os.path.getsize(path), os.path.relpath(path, public_dir)))
    sizes.sort(reverse=True)
    return sizes


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    args = parse_args()

    if not os.path.isdir(args.public_dir):
        logger.error("check_page_sizes: %r is not a directory", args.public_dir)
        return 1

    threshold = int(args.warn_mb * 1024 * 1024)
    sizes = page_sizes(args.public_dir)
    offenders = [(size, rel) for size, rel in sizes if size > threshold]

    if not offenders:
        logger.info("check_page_sizes: no pages over %.1f MB (%d pages scanned).",
                    args.warn_mb, len(sizes))
        return 0

    logger.warning("check_page_sizes: %d page(s) over %.1f MB:",
                   len(offenders), args.warn_mb)
    for size, rel in offenders[:args.top]:
        logger.warning("  %6.1f MB  %s", size / 1024 / 1024, rel)
    if len(offenders) > args.top:
        logger.warning("  ... and %d more", len(offenders) - args.top)

    return 1 if args.fail else 0


if __name__ == "__main__":
    sys.exit(main())
