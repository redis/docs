HUGO_CONTENT=./content
HUGO_DEBUG=--debug --log
HUGO_BUILD=--gc

all: clean deps components hugo
serve: clean deps components serve_hugo

deps:
	@npm install
	@pip3 install -r requirements.txt


components:
	@python3 build/make.py

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
	@mv ./data/meta.json ./data/components/meta.json
	@rm -f ./data/*.json
	@mv ./data/components/meta.json ./data/meta.json
	@rm -Rf ./examples
	@rm -Rf ./public/tmp/*
