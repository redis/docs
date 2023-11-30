HUGO_CONTENT=./content
HUGO_DEBUG=--debug --log
HUGO_BUILD=--gc

all: clean deps build serve

deps:
	@npm install

build:
	@hugo $(HUGO_DEBUG) $(HUGO_BUILD)

serve:
	@hugo serve

clean:
	@rm -Rf ./public/
	@rm -Rf ./resources/
	@rm -Rf ./node_modules/
	@rm ./package-lock.json
	@rm ./.hugo_build.lock