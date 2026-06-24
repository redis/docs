#!/usr/bin/env bash
#
# Extract external (http/https) URLs from the built Hugo site for link checking.
#
# - Reads rendered HTML in public/ so that shortcode-generated links are included.
# - Pulls only real href/src attribute values (ignores code-block text that merely
#   looks like a URL); matches both single- and double-quoted attributes.
# - Decodes HTML entities (e.g. &amp; -> &) so the checked URL matches the browser's.
# - Skips archived version trees and release notes by *source path* (not URL content),
#   so the check covers the *current* docs only (see linkcheck scope decision).
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

# Select in-scope HTML files first, filtering on the file path only (so a URL that
# happens to contain e.g. "/release-notes/" doesn't drop an in-scope page's links).
# (Plain read loop rather than mapfile, for portability with bash 3.2 on macOS.)
files=()
while IFS= read -r f; do
  files+=("$f")
done < <(find "$PUBLIC_DIR" -type f -name '*.html' | grep -vE "$SKIP_SOURCE_PATHS" || true)

if (( ${#files[@]} == 0 )); then
  : > "$OUTPUT_FILE"
  echo "No in-scope HTML files found under '$PUBLIC_DIR'." >&2
  exit 0
fi

# Extract http(s) URLs from href/src (single or double quoted), strip the attribute
# wrapper, decode HTML entities, and de-duplicate. The `|| true` tolerates the
# legitimate "no external links" case without masking it as a pipeline failure.
{ grep -hoE "(href|src)=(\"https?://[^\"]+\"|'https?://[^']+')" "${files[@]}" || true; } \
  | sed -E "s/^(href|src)=[\"']//; s/[\"']$//" \
  | python3 -c 'import sys, html
for line in sys.stdin:
    sys.stdout.write(html.unescape(line))' \
  | sort -u > "$OUTPUT_FILE"

echo "Extracted $(wc -l < "$OUTPUT_FILE") unique external URLs to $OUTPUT_FILE" >&2
