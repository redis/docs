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

# Extract http(s) URLs from href/src (single or double quoted), strip the attribute
# wrapper, decode HTML entities, and de-duplicate. Files are streamed through xargs
# (rather than passed as one big argument list) so grep can't hit the shell's
# argument limit on a large public/ tree. The `|| true` tolerates the legitimate
# "this batch has no external links" case (grep exits 1). The guard against an empty
# array skips the pipeline when no files matched (an empty arg list would make xargs
# run grep with no files and hang on stdin); the emptiness check below then fails.
: > "$OUTPUT_FILE"
if (( ${#files[@]} > 0 )); then
  printf '%s\0' "${files[@]}" \
    | { xargs -0 grep -hoE "(href|src)=(\"https?://[^\"]+\"|'https?://[^']+')" || true; } \
    | sed -E "s/^(href|src)=[\"']//; s/[\"']$//" \
    | python3 -c 'import sys, html
for line in sys.stdin:
    sys.stdout.write(html.unescape(line))' \
    | sort -u > "$OUTPUT_FILE"
fi

# A completed docs build always yields in-scope pages that carry external links, so
# an empty result here — whether from no in-scope files or no extracted URLs — means
# the build or the path scoping failed, not that there is genuinely nothing to check.
# Fail loudly rather than let lychee "pass" an empty input and hide broken links.
count=$(wc -l < "$OUTPUT_FILE")
if (( count == 0 )); then
  echo "ERROR: extracted 0 external URLs from '$PUBLIC_DIR' (${#files[@]} in-scope HTML files);" \
       "the site build or path scoping likely failed. Refusing to pass an empty link check." >&2
  exit 1
fi

echo "Extracted $count unique external URLs to $OUTPUT_FILE" >&2
