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

hugo:
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

serve_hugo:
	@hugo serve

# Passive post-build report of unusually large rendered pages (warn-only).
check_page_sizes:
	@python3 build/check_page_sizes.py public

# Report pages that moved without gaining an alias for their old URL, so the old
# URL now 404s. Reads git history, so it needs no build. Warn-only.
check_aliases:
	@python3 build/check_missing_aliases.py --all

# The same sweep, but writing the missing aliases into frontmatter.
check_aliases_fix:
	@python3 build/check_missing_aliases.py --all --fix

clean:
	@rm -Rf ./public/
	@rm -Rf ./resources/
	@rm -Rf ./node_modules/
	@rm -f ./package-lock.json
	@rm -f ./.hugo_build.lock
	@rm -Rf ./examples
	@rm -Rf ./public/tmp/*
