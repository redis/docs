HUGO_CONTENT=./content
HUGO_DEBUG=--debug --log
HUGO_BUILD=--gc

all: build

deps:
	@npm install

build:
	@hugo $(HUGO_DEBUG) $(HUGO_BUILD)
