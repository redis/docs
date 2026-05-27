// Build the demo product catalog: embed each item's text, write JSON.
//
// Run the ``build_catalog`` command once before starting the demo
// server (or any time you want to regenerate the catalog or swap the
// embedding model):
//
//	go run ./cmd/build_catalog
//
// It does three things:
//
//  1. Reads the inline catalog defined in ``catalog_seed.go``.
//  2. Runs the Hugot feature-extraction pipeline over each product's
//     ``Name + Description`` text to produce a 384-dimensional vector.
//  3. Writes the result to ``catalog.json`` next to the binary.
//
// The demo server reads ``catalog.json`` at startup so it can seed
// Redis quickly without re-running the embedding model on every boot.
// Embeddings are stored as base64-encoded ``float32`` bytes so the
// file stays compact and loads without any extra parsing on the
// demo's side.

package recommendationengine

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
)

// CatalogFile is the on-disk form of the embedded catalog. It's
// shared across the Python / Node.js / Go ports so the same file can
// in principle be re-used between them.
type CatalogFile struct {
	Model    string    `json:"model"`
	Dim      int       `json:"dim"`
	Products []Product `json:"products"`
}

// BuildCatalog embeds the inline ``CatalogSeed`` with the supplied
// embedder and writes a ``CatalogFile`` to ``outPath``. If outPath is
// empty, defaults to ``catalog.json`` in the current working directory.
func BuildCatalog(ctx context.Context, embedder *LocalEmbedder, outPath string) error {
	if outPath == "" {
		outPath = "catalog.json"
	}

	texts := make([]string, len(CatalogSeed))
	for i, p := range CatalogSeed {
		texts[i] = EmbedTextFor(p)
	}

	fmt.Printf("Embedding %d products with %s...\n", len(texts), embedder.ModelName)
	vectors, err := embedder.EncodeMany(ctx, texts)
	if err != nil {
		return fmt.Errorf("embed: %w", err)
	}
	if len(vectors) == 0 {
		return fmt.Errorf("embedder returned no vectors")
	}
	dim := len(vectors[0])
	fmt.Printf("Embeddings: shape=[%d, %d], dtype=float32\n", len(vectors), dim)

	products := make([]Product, len(CatalogSeed))
	for i, p := range CatalogSeed {
		p.EmbeddingB64 = base64.StdEncoding.EncodeToString(FloatsToBytes(vectors[i]))
		products[i] = p
	}

	out := CatalogFile{
		Model:    embedder.ModelName,
		Dim:      dim,
		Products: products,
	}
	body, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(outPath, body, 0o644); err != nil {
		return err
	}
	fmt.Printf("Wrote %d products -> %s\n", len(out.Products), outPath)
	return nil
}

// LoadCatalog reads a previously-built catalog file. Returns an error
// if the file is missing or malformed.
func LoadCatalog(path string) (CatalogFile, error) {
	var out CatalogFile
	body, err := os.ReadFile(path)
	if err != nil {
		return out, err
	}
	if err := json.Unmarshal(body, &out); err != nil {
		return out, err
	}
	return out, nil
}
