// Tiny shim that runs the demo server defined in the parent
// ``featurestore`` package. Build with:
//
//	go build -o demo_server ./cmd/demo_server
//
// Or run directly:
//
//	go run ./cmd/demo_server --port 8087
package main

import (
	"log"
	"os"

	fs "featurestore"
)

func main() {
	if err := fs.RunDemoServer(os.Args[1:]); err != nil {
		log.Fatal(err)
	}
}
