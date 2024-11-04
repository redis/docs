#!/bin/bash
dir="$1"
pages="$(find $dir -name "*.md")"

for page in $pages; do
  if [[ "$page" =~ \/_index.md$ ]]; then
    url=$(sed "s/_index.md$/'/; s/^content/'/"<<< $page)
  else
    url=$(sed "s/.md$/\/'/; s/^content/'/"<<< $page)
  fi
  # skip if url property is already present
  if ! grep -q "$url" $page; then
    awk -v url="$url" '$1 == "---" {delim++; if (delim==2){printf "%s\n", "url: "url}} {print}' $page > tmp.md
    mv tmp.md $page 
  fi
done