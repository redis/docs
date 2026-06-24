#!/usr/bin/env bash
#
# Extract external (http/https) URLs from the built Hugo site for link checking.
#
# - Reads rendered HTML in public/ so that shortcode-generated links are included.
# - Pulls only real href/src attribute values (ignores code-block text that merely
#   looks like a URL).
# - Drops links that only live in archived version trees and release notes, so the
#   check covers the *current* docs only (see linkcheck scope decision).
# - Internal links (redis.io, localhost) and known false positives are excluded in
#   .lychee.toml, not here, so the exclude rules live in one place.
#
# Usage: build/extract_external_urls.sh [PUBLIC_DIR] [OUTPUT_FILE]
set -euo pipefail

PUBLIC_DIR="${1:-public}"
OUTPUT_FILE="${2:-external-urls.txt}"

if [[ ! -d "$PUBLIC_DIR" ]]; then
  echo "ERROR: '$PUBLIC_DIR' not found. Build the site first (e.g. 'make components && hugo')." >&2
  exit 1
fi

# Source-path patterns to skip: numbered version trees and release notes (frozen archives).
SKIP_SOURCE_PATHS='/(kubernetes|rs|rc|redis-data-integration|redisvl)/[0-9]|/release-notes/|/legacy-release-notes/'

grep -rHoE '(href|src)="https?://[^"]+"' "$PUBLIC_DIR" --include="*.html" \
  | grep -vE "$SKIP_SOURCE_PATHS" \
  | sed -E 's#^[^:]+:(href|src)="##; s#"$##' \
  | sort -u > "$OUTPUT_FILE"

echo "Extracted $(wc -l < "$OUTPUT_FILE") unique external URLs to $OUTPUT_FILE" >&2
