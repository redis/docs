#!/bin/bash
# example usage ./version_frontmatter_helper.bash "content/operate/kubernetes/7.4.6"
#
dir="$1"
pages="$(find $dir -name "*.md")"

# inject url frontmatter property in versioned folder
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

latest_dir="${dir%/*}"
pages="$(find "$latest_dir" -name "*.md" ! -path '*.*.*' ! -path '*release-notes*' | xargs -I {} grep -rl 'aliases:' {})"

# remove aliases from latest version
for page in $pages; do
  awk '$1 == "---" {delim++} /aliases/{f=1} {if(f==1 && delim!=2){}else {print}}' $page > tmp.md
  mv tmp.md $page
done