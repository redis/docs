HUGO_CONTENT=./content
HUGO_DEBUG=--logLevel debug
HUGO_BUILD=--gc

# ndjson implicitly depends on json_transform -> hugo
all: clean deps components ndjson

# CI build: the workspace is a fresh checkout, so skip `clean` (which would
# delete the node_modules installed by the workflow's `make deps` step).
ci: components ndjson
serve: clean deps components serve_hugo
localserve: clean deps components_local serve_hugo

deps:
	@npm install
	@pip3 install -r requirements.txt


components:
	@python3 build/make.py

components_local:
	@python3 build/make.py --stack ./data/components_local/index.json

# Move dates live only in git history, which Hugo cannot read, so they are written
# into data/ before the build. Generated rather than committed, like the other
# derived files in data/, so a snapshot of history cannot go stale.
page_moves:
	@echo "Recording page move dates..."
	@python3 build/generate_page_moves.py

hugo: page_moves
	@hugo $(HUGO_DEBUG) $(HUGO_BUILD)

# json_transform requires hugo to have populated public/ with index.json files
json_transform: hugo
	@echo "Transforming JSON files for RAG..."
	@npx tsx build/transform_json_sections.ts

# Tombstones need public/redirects.json, which hugo renders, and must run before
# ndjson so that generate_ndjson.py can filter them back out of the feed. They are
# written after json_transform only for tidiness -- the transform skips a record
# that has a page_type and no content, so either order is safe.
redirect_tombstones: json_transform
	@echo "Writing redirect tombstones..."
	@python3 build/write_redirect_tombstones.py public

# ndjson requires json_transform to have processed the JSON files
ndjson: redirect_tombstones
	@echo "Generating NDJSON feed..."
	@python3 build/generate_ndjson.py
	@echo "Compressing NDJSON feed..."
	@gzip -kf public/docs.ndjson

serve_hugo: page_moves
	@hugo serve

# Passive post-build report of unusually large rendered pages (warn-only).
check_page_sizes:
	@python3 build/check_page_sizes.py public

# Downloadable archives for the download-documentation widget. Deliberately
# outside `all`: CI packages these from the finished site in its own step, and
# covering every product in every format takes a couple of minutes. Run after a
# build. Narrow it with e.g. BUNDLE_FORMATS=md for a quicker pass.
BUNDLE_SOURCE ?= public
BUNDLE_OUT ?= bundles
BUNDLE_FORMATS ?= md,md-single,html,json

bundles:
	@python3 build/make_doc_bundles.py \
		--source $(BUNDLE_SOURCE) --out $(BUNDLE_OUT) --formats $(BUNDLE_FORMATS)

# Serve the site with the download widget actually working, offline and with no
# extra server. The widget asks for /downloads/bundles/<archive>, and `hugo serve`
# mounts static/ at the site root -- so packaging into static/downloads/bundles
# puts the archives on the exact URL, origin, and content type they have in
# production. The site has to be built first, because the archives are made from
# the rendered output.
#
# --all-versions is what makes the version dropdowns work here: CI packages each
# archived version in its own matrix build, but a local build renders them all, so
# one pass can cover them. Without it every version except latest 404s.
#
#   make serve_downloads                    # every format (~95 MB, a minute or two)
#   make serve_downloads BUNDLE_FORMATS=md  # just Markdown, much quicker
# --cleanDestinationDir matters more than it looks. Hugo leaves orphans behind, so
# a public/ rebuilt in place still holds pages whose source was renamed or deleted,
# and the packager cannot tell them from real ones -- they end up in the archives,
# and archived-version directories that no longer exist produce whole phantom
# bundles. CI never sees this (fresh checkout, empty public/); local runs always do.
serve_downloads: page_moves
	@echo "Building the site to package from..."
	@hugo --cleanDestinationDir --quiet
	@echo "Packaging archives into static/downloads/bundles..."
	@python3 build/make_doc_bundles.py --all-versions \
		--source public --out static/downloads/bundles --formats $(BUNDLE_FORMATS)
	@echo "Serving. The download button is at the bottom of the docs sidebar."
	@hugo serve

# Report pages that moved without gaining an alias for their old URL, so the old
# URL now 404s. Reads git history, so it needs no build. Warn-only.
check_aliases:
	@python3 build/check_missing_aliases.py --all

# The same sweep, but writing the missing aliases into frontmatter.
check_aliases_fix:
	@python3 build/check_missing_aliases.py --all --fix

# Report internal links whose target page or heading anchor doesn't exist.
# Needs a built site: run `make hugo` (or the full `make all`) first. Unlike
# check_aliases this reads public/, because heading anchors come from Hugo's own
# output rather than from a reimplemented slug rule.
check_internal_anchors:
	@python3 build/check_internal_anchors.py

clean:
	@rm -Rf ./public/
	@rm -Rf ./resources/
	@rm -Rf ./node_modules/
	@rm -f ./package-lock.json
	@rm -f ./.hugo_build.lock
	@rm -Rf ./examples
	@rm -Rf ./public/tmp/*
