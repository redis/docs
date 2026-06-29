// Tiny shim that runs the demo server defined in the parent
// ``recommendationengine`` package. Build with:
//
//	go build -o demo_server ./cmd/demo_server
//
// Or run directly:
//
//	go run ./cmd/demo_server --port 8084
package main

import (
	"log"
	"os"

	rec "recommendationengine"
)

func main() {
	if err := rec.ParseDemoServerFlagsAndRun(os.Args[1:]); err != nil {
		log.Fatal(err)
	}
}
