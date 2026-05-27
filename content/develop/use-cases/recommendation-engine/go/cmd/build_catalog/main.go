// Tiny shim that drives the BuildCatalog flow from the parent
// ``recommendationengine`` package. Run with:
//
//	go run ./cmd/build_catalog
//
// Pass --model and --model-dir to swap the embedding model or move
// the local model cache.
package main

import (
	"context"
	"flag"
	"log"

	rec "recommendationengine"
)

func main() {
	model := flag.String("model", rec.DefaultEmbeddingModel, "Hugging Face hub model ID")
	modelDir := flag.String("model-dir", rec.DefaultModelDir, "Local directory to cache the model")
	out := flag.String("out", "catalog.json", "Output JSON path")
	flag.Parse()

	ctx := context.Background()
	embedder, err := rec.NewLocalEmbedder(ctx, *model, *modelDir)
	if err != nil {
		log.Fatalf("embedder: %v", err)
	}
	defer embedder.Close()

	if err := rec.BuildCatalog(ctx, embedder, *out); err != nil {
		log.Fatalf("BuildCatalog: %v", err)
	}
}
