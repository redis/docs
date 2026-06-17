// Tiny shim that drives the batch materialization flow from the
// parent ``featurestore`` package. Run with:
//
//	go run ./cmd/build_features --count 500 --ttl-seconds 3600
package main

import (
	"log"
	"os"

	fs "featurestore"
)

func main() {
	if err := fs.BuildFeaturesCLI(os.Args[1:]); err != nil {
		log.Fatal(err)
	}
}
