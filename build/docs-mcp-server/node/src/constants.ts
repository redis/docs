// Dependency-free shared constants. Kept separate from embed.ts so modules that
// only need the dimension (vector-store, the loader's seed path) don't
// transitively import fastembed and load the native ONNX runtime.

/** bge-small-en-v1.5 embedding dimension. */
export const EMBED_DIM = 384;
