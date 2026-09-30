// Local text-embedding helper backed by Hugot.
//
// This is a thin wrapper around the sentence-transformers model
// `sentence-transformers/all-MiniLM-L6-v2`: a 384-dimensional encoder
// that runs in-process on CPU through Hugot's pure-Go inference
// backend (`hugot.NewGoSession`), needs no API key, and produces
// vectors numerically equivalent to the equivalent PyTorch model
// from sentence-transformers.
//
// Vectors are explicitly L2-normalised after extraction so cosine
// distance against another normalised vector reduces to `1 - dot
// product` — matching the behaviour of `sentence-transformers`'
// `normalize_embeddings=True` flag in the Python example and
// `@xenova/transformers`' `normalize: true` option in the Node.js
// example. The model is downloaded into the local `./models` cache
// on the first call; every later call runs offline.

package main

import (
	"context"
	"encoding/binary"
	"fmt"
	"math"
	"os"
	"path/filepath"

	"github.com/knights-analytics/hugot"
	"github.com/knights-analytics/hugot/pipelines"
)

const defaultEmbedModel = "sentence-transformers/all-MiniLM-L6-v2"

// LocalEmbedder wraps a Hugot feature-extraction pipeline.
//
// Use `NewLocalEmbedder` instead of constructing the struct directly
// because the pipeline load is asynchronous in spirit (it downloads
// the model on first call) and we want one place that owns the wait
// and the dimension probe.
type LocalEmbedder struct {
	ModelName string
	Dim       int
	session   *hugot.Session
	pipeline  *pipelines.FeatureExtractionPipeline
}

// NewLocalEmbedder loads the ONNX model (downloading on first run)
// and returns a ready-to-use embedder. The dimension is probed once
// from a synthetic input so we can fail loudly if a different model
// is wired up against the 384-dim Redis Search field.
func NewLocalEmbedder(ctx context.Context, modelName, modelsDir string) (*LocalEmbedder, error) {
	if modelName == "" {
		modelName = defaultEmbedModel
	}
	if modelsDir == "" {
		modelsDir = "./models"
	}
	if err := os.MkdirAll(modelsDir, 0o755); err != nil {
		return nil, fmt.Errorf("creating models dir %q: %w", modelsDir, err)
	}

	session, err := hugot.NewGoSession(ctx)
	if err != nil {
		return nil, fmt.Errorf("starting Hugot session: %w", err)
	}

	downloadOpts := hugot.NewDownloadOptions()
	downloadOpts.OnnxFilePath = "onnx/model.onnx"
	modelPath, err := hugot.DownloadModel(ctx, modelName, modelsDir, downloadOpts)
	if err != nil {
		_ = session.Destroy()
		return nil, fmt.Errorf("downloading model %q: %w", modelName, err)
	}

	cfg := hugot.FeatureExtractionConfig{
		ModelPath: modelPath,
		Name:      filepath.Base(modelPath),
	}
	pipe, err := hugot.NewPipeline(session, cfg)
	if err != nil {
		_ = session.Destroy()
		return nil, fmt.Errorf("creating feature-extraction pipeline: %w", err)
	}

	// Probe the output shape once so we can fail loudly if a different
	// model is wired up against the 384-dim Redis Search field.
	probe, err := pipe.RunPipeline(ctx, []string{"dimension probe"})
	if err != nil {
		_ = session.Destroy()
		return nil, fmt.Errorf("probing embedding pipeline: %w", err)
	}
	if len(probe.Embeddings) == 0 || len(probe.Embeddings[0]) == 0 {
		_ = session.Destroy()
		return nil, fmt.Errorf("embedding probe returned empty result")
	}

	return &LocalEmbedder{
		ModelName: modelName,
		Dim:       len(probe.Embeddings[0]),
		session:   session,
		pipeline:  pipe,
	}, nil
}

// Close tears down the underlying Hugot session. Safe to call more
// than once; subsequent calls are no-ops.
func (e *LocalEmbedder) Close() error {
	if e == nil || e.session == nil {
		return nil
	}
	err := e.session.Destroy()
	e.session = nil
	return err
}

// EncodeOne returns a 384-element float32 vector for the input string.
// The vector is L2-normalised so cosine distance against another
// normalised vector reduces to 1 - dot product.
//
// Hugot reuses the same backing slice across calls on a given
// pipeline, so the returned vector is copied before normalising —
// otherwise overlapping `/turn` handlers on the shared embedder
// would race on the same buffer and either corrupt the stored
// embedding or hand the recall path a vector that's already been
// overwritten by the next request.
func (e *LocalEmbedder) EncodeOne(ctx context.Context, text string) ([]float32, error) {
	out, err := e.pipeline.RunPipeline(ctx, []string{text})
	if err != nil {
		return nil, fmt.Errorf("encoding text: %w", err)
	}
	if len(out.Embeddings) == 0 {
		return nil, fmt.Errorf("pipeline returned no embeddings")
	}
	vec := append([]float32(nil), out.Embeddings[0]...)
	normalizeInPlace(vec)
	return vec, nil
}

// EncodeMany batches several strings in a single pipeline call so the
// model only pays the setup cost once. Returns one float32 slice per
// input, in the same order as the input.
func (e *LocalEmbedder) EncodeMany(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}
	out, err := e.pipeline.RunPipeline(ctx, texts)
	if err != nil {
		return nil, fmt.Errorf("encoding texts: %w", err)
	}
	// Hugot guarantees one vector per input on success, but defensive
	// callers (seed loaders, batch ingest) assume that contract;
	// surfacing it as an explicit check avoids an index-out-of-range
	// panic later if the backend ever returns a short batch.
	if len(out.Embeddings) != len(texts) {
		return nil, fmt.Errorf(
			"pipeline returned %d vectors for %d inputs",
			len(out.Embeddings), len(texts),
		)
	}
	// Copy each row off the pipeline's reusable backing slice — see
	// the comment on `EncodeOne` for why. The seed loader is the
	// usual caller here and doesn't itself race, but the contract
	// has to hold for any future caller that does.
	vecs := make([][]float32, len(out.Embeddings))
	for i := range out.Embeddings {
		vecs[i] = append([]float32(nil), out.Embeddings[i]...)
		normalizeInPlace(vecs[i])
	}
	return vecs, nil
}

// normalizeInPlace L2-normalises a vector so it has unit length.
// A zero vector is left untouched (its cosine distance to anything
// is undefined, but at least Redis won't reject the bytes).
func normalizeInPlace(v []float32) {
	var sumSq float64
	for _, x := range v {
		sumSq += float64(x) * float64(x)
	}
	if sumSq == 0 {
		return
	}
	inv := float32(1.0 / math.Sqrt(sumSq))
	for i := range v {
		v[i] *= inv
	}
}

// FloatsToBytes packs a []float32 into the raw little-endian byte
// sequence Redis Search expects for a FLOAT32 vector field. The
// `binary.LittleEndian` here matters: Redis Search reads the bytes
// in little-endian order regardless of the host architecture, so we
// can't use `binary.NativeEndian` if the docs example ever needs to
// run on a big-endian box. Every supported Go target is little-endian
// today, so the practical difference is zero — but explicit is
// cheaper than mysterious off-by-everything vector mismatches.
func FloatsToBytes(fs []float32) []byte {
	buf := make([]byte, len(fs)*4)
	for i, f := range fs {
		binary.LittleEndian.PutUint32(buf[i*4:], math.Float32bits(f))
	}
	return buf
}
