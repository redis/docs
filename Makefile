HUGO_CONTENT=./content
HUGO_DEBUG=--logLevel debug
HUGO_BUILD=--gc

# ndjson implicitly depends on json_transform -> hugo
all: clean deps components ndjson
serve: clean deps components serve_hugo
localserve: clean deps components_local serve_hugo

deps:
	@npm install
	@pip3 install -r requirements.txt


components:
	@python3 build/make.py

components_local:
	@python3 build/make.py --stack ./data/components_local/index.json

# Validate that paths in data/rdi-reference/collections.json all resolve
# to nodes in config.json. Catches drift when the upstream schema changes.
validate_rdi:
	@python3 build/validate_rdi_collections.py

hugo: validate_rdi
	@hugo $(HUGO_DEBUG) $(HUGO_BUILD)

# json_transform requires hugo to have populated public/ with index.json files
json_transform: hugo
	@echo "Transforming JSON files for RAG..."
	@npx tsx build/transform_json_sections.ts

# ndjson requires json_transform to have processed the JSON files
ndjson: json_transform
	@echo "Generating NDJSON feed..."
	@python3 build/generate_ndjson.py
	@echo "Compressing NDJSON feed..."
	@gzip -kf public/docs.ndjson

serve_hugo: validate_rdi
	@hugo serve

clean:
	@rm -Rf ./public/
	@rm -Rf ./resources/
	@rm -Rf ./node_modules/
	@rm -f ./package-lock.json
	@rm -f ./.hugo_build.lock
	@rm -Rf ./examples
	@rm -Rf ./public/tmp/*
