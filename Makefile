HUGO_CONTENT=./content
HUGO_DEBUG=--logLevel debug
HUGO_BUILD=--gc

all: clean deps components hugo
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

serve_hugo:
	@hugo serve

clean:
	@rm -Rf ./public/
	@rm -Rf ./resources/
	@rm -Rf ./node_modules/
	@rm -f ./package-lock.json
	@rm -f ./.hugo_build.lock
	@rm -Rf ./examples
	@rm -Rf ./public/tmp/*
