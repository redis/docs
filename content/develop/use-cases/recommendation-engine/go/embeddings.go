// Local text-embedding helper backed by Hugot's pure-Go ONNX backend.
//
// This is a thin wrapper around the ``sentence-transformers/all-MiniLM-L6-v2``
// model: a 384-dimensional encoder that runs in pure Go (no shared
// library to install), needs no API key, and has a small footprint
// (~80 MB). On the first call the model files are downloaded into the
// local ``models/`` directory; every later call runs locally.
//
// Vectors are L2-normalised on output so a Redis Search index declared
// with ``DISTANCE_METRIC COSINE`` returns scores that are already
// directly comparable across items. Hugot itself doesn't normalise,
// so we do it here.

package recommendationengine

import (
	"context"
	"fmt"
	"math"
	"sync"

	"github.com/knights-analytics/hugot"
	"github.com/knights-analytics/hugot/pipelines"
)

const (
	// DefaultEmbeddingModel is the Hugging Face hub ID of the model
	// the demo uses. Swap for any sentence-transformers model on the
	// hub; the index dim is read from the loaded pipeline.
	DefaultEmbeddingModel = "sentence-transformers/all-MiniLM-L6-v2"

	// DefaultModelDir is the local cache directory under which Hugot
	// puts downloaded model files.
	DefaultModelDir = "./models"
)

// LocalEmbedder encodes short strings into normalised float32 vectors.
//
// A single instance loads the model once and reuses it for every call.
// The demo server keeps one ``LocalEmbedder`` around for the lifetime
// of the process. The wrapper is goroutine-safe; underlying calls into
// Hugot are guarded by a mutex because the pipeline isn't safe to call
// concurrently.
type LocalEmbedder struct {
	ModelName string
	Dim       int

	session  *hugot.Session
	pipeline *pipelines.FeatureExtractionPipeline
	mu       sync.Mutex
}

// NewLocalEmbedder loads the model and prepares a pipeline. The
// returned embedder owns a Hugot session; ``Close`` must be called
// once at process shutdown to free the runtime.
func NewLocalEmbedder(ctx context.Context, modelName, modelDir string) (*LocalEmbedder, error) {
	if modelName == "" {
		modelName = DefaultEmbeddingModel
	}
	if modelDir == "" {
		modelDir = DefaultModelDir
	}

	session, err := hugot.NewGoSession(ctx)
	if err != nil {
		return nil, fmt.Errorf("hugot.NewGoSession: %w", err)
	}

	dl := hugot.NewDownloadOptions()
	dl.OnnxFilePath = "onnx/model.onnx"
	modelPath, err := hugot.DownloadModel(ctx, modelName, modelDir, dl)
	if err != nil {
		_ = session.Destroy()
		return nil, fmt.Errorf("hugot.DownloadModel: %w", err)
	}

	pipeline, err := hugot.NewPipeline(session, hugot.FeatureExtractionConfig{
		ModelPath: modelPath,
		Name:      "embed",
	})
	if err != nil {
		_ = session.Destroy()
		return nil, fmt.Errorf("hugot.NewPipeline: %w", err)
	}

	// Warm the pipeline once so the first real call doesn't pay
	// ONNX session-init latency on a user-facing request, and learn
	// the dimensionality at the same time.
	warm, err := pipeline.RunPipeline(ctx, []string{"warmup"})
	if err != nil {
		_ = session.Destroy()
		return nil, fmt.Errorf("warmup RunPipeline: %w", err)
	}
	if len(warm.Embeddings) == 0 || len(warm.Embeddings[0]) == 0 {
		_ = session.Destroy()
		return nil, fmt.Errorf("warmup produced empty embedding")
	}

	return &LocalEmbedder{
		ModelName: modelName,
		Dim:       len(warm.Embeddings[0]),
		session:   session,
		pipeline:  pipeline,
	}, nil
}

// Close releases the Hugot session. Safe to call multiple times.
func (e *LocalEmbedder) Close() error {
	if e == nil || e.session == nil {
		return nil
	}
	err := e.session.Destroy()
	e.session = nil
	return err
}

// EncodeOne encodes a single string. Returned vector is unit-normalised.
func (e *LocalEmbedder) EncodeOne(ctx context.Context, text string) ([]float32, error) {
	vectors, err := e.EncodeMany(ctx, []string{text})
	if err != nil {
		return nil, err
	}
	return vectors[0], nil
}

// EncodeMany encodes a batch of strings. Returned vectors are
// unit-normalised.
func (e *LocalEmbedder) EncodeMany(ctx context.Context, texts []string) ([][]float32, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	out, err := e.pipeline.RunPipeline(ctx, texts)
	if err != nil {
		return nil, err
	}
	for i, v := range out.Embeddings {
		out.Embeddings[i] = l2Normalise(v)
	}
	return out.Embeddings, nil
}

// l2Normalise scales a vector in place so its Euclidean norm is 1. A
// zero vector is returned unchanged.
func l2Normalise(v []float32) []float32 {
	var sq float64
	for _, x := range v {
		sq += float64(x) * float64(x)
	}
	norm := math.Sqrt(sq)
	if norm == 0 {
		return v
	}
	inv := float32(1.0 / norm)
	for i := range v {
		v[i] *= inv
	}
	return v
}

// FloatsToBytes packs a slice of float32 into the little-endian byte
// blob Redis Search expects for a FLOAT32 vector field. Exposed so
// callers (the build script, the recommender, tests) can share the
// same encoding without re-implementing it.
func FloatsToBytes(vec []float32) []byte {
	out := make([]byte, len(vec)*4)
	for i, x := range vec {
		bits := math.Float32bits(x)
		out[i*4+0] = byte(bits)
		out[i*4+1] = byte(bits >> 8)
		out[i*4+2] = byte(bits >> 16)
		out[i*4+3] = byte(bits >> 24)
	}
	return out
}

// BytesToFloats decodes a little-endian float32 blob written by
// ``FloatsToBytes``. Returns an error if the byte length isn't a
// multiple of four.
func BytesToFloats(buf []byte) ([]float32, error) {
	if len(buf)%4 != 0 {
		return nil, fmt.Errorf("expected float32 buffer (multiple of 4 bytes), got %d", len(buf))
	}
	out := make([]float32, len(buf)/4)
	for i := range out {
		bits := uint32(buf[i*4+0]) |
			uint32(buf[i*4+1])<<8 |
			uint32(buf[i*4+2])<<16 |
			uint32(buf[i*4+3])<<24
		out[i] = math.Float32frombits(bits)
	}
	return out, nil
}
