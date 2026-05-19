//! Local text-embedding helper backed by the `fastembed` crate.
//!
//! This is a thin wrapper around the `sentence-transformers/all-MiniLM-L6-v2`
//! model: a 384-dimensional encoder that runs locally via the `ort`
//! ONNX runtime under the hood (no API key, no shared library to
//! install separately). On the first call the model files are
//! downloaded into the local Hugging Face cache; every later call runs
//! locally.
//!
//! `fastembed` normalises output vectors for sentence-transformers
//! models by default, so a Redis Search index declared with
//! `DISTANCE_METRIC COSINE` returns scores that are already directly
//! comparable across items. We surface the unit-norm vectors as plain
//! `Vec<f32>` so the rest of the pipeline stays library-agnostic.

#![allow(dead_code)]

use std::sync::Mutex;

use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};

/// Hugging Face hub ID the demo uses. Swap for any sentence-transformers
/// model on the hub; the index dim is read from the loaded pipeline.
pub const DEFAULT_EMBEDDING_MODEL_NAME: &str = "sentence-transformers/all-MiniLM-L6-v2";

/// Encoder for short product / query strings.
///
/// A single instance loads the model once and reuses it for every call.
/// The demo server keeps one `LocalEmbedder` around for the lifetime of
/// the process. The underlying `TextEmbedding` is not `Sync`, so we
/// guard it with a `Mutex` and let `tokio::task::spawn_blocking` move
/// the inference off the async runtime when called from a handler.
pub struct LocalEmbedder {
    pub model_name: String,
    pub dim: usize,
    inner: Mutex<TextEmbedding>,
}

impl LocalEmbedder {
    /// Load the default model (`all-MiniLM-L6-v2`) and warm it once so
    /// the first real call doesn't pay ONNX session-init latency on a
    /// user-facing request, and learns the dimensionality at the same
    /// time.
    pub fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let model = TextEmbedding::try_new(
            InitOptions::new(EmbeddingModel::AllMiniLML6V2)
                .with_show_download_progress(true),
        )?;
        // Warm the pipeline so the first real call doesn't pay ONNX
        // session-init latency on a user-facing request.
        let warm = model.embed(vec!["warmup"], None)?;
        if warm.is_empty() || warm[0].is_empty() {
            return Err("warmup produced empty embedding".into());
        }
        let dim = warm[0].len();
        Ok(Self {
            model_name: DEFAULT_EMBEDDING_MODEL_NAME.to_string(),
            dim,
            inner: Mutex::new(model),
        })
    }

    /// Encode a single string. Returned vector is unit-normalised.
    pub fn encode_one(
        &self,
        text: &str,
    ) -> Result<Vec<f32>, Box<dyn std::error::Error + Send + Sync>> {
        let mut vectors = self.encode_many(vec![text.to_string()])?;
        if vectors.is_empty() {
            return Err("embedder returned no vectors".into());
        }
        Ok(vectors.remove(0))
    }

    /// Encode a batch of strings. Returned vectors are unit-normalised.
    pub fn encode_many(
        &self,
        texts: Vec<String>,
    ) -> Result<Vec<Vec<f32>>, Box<dyn std::error::Error + Send + Sync>> {
        let guard = self
            .inner
            .lock()
            .map_err(|_| "embedder mutex poisoned")?;
        let refs: Vec<&str> = texts.iter().map(|s| s.as_str()).collect();
        let out = guard.embed(refs, None)?;
        Ok(out)
    }
}

/// Pack a slice of `f32` into the little-endian byte blob Redis Search
/// expects for a `FLOAT32` vector field. Exposed so callers (the build
/// script, the recommender) can share the same encoding without
/// re-implementing it.
pub fn floats_to_bytes(vec: &[f32]) -> Vec<u8> {
    let mut out = Vec::with_capacity(vec.len() * 4);
    for x in vec {
        out.extend_from_slice(&x.to_le_bytes());
    }
    out
}

/// Decode a little-endian `float32` blob written by `floats_to_bytes`.
/// Returns an error if the byte length isn't a multiple of four.
pub fn bytes_to_floats(buf: &[u8]) -> Result<Vec<f32>, String> {
    if buf.len() % 4 != 0 {
        return Err(format!(
            "expected float32 buffer (multiple of 4 bytes), got {}",
            buf.len()
        ));
    }
    let mut out = Vec::with_capacity(buf.len() / 4);
    for i in 0..(buf.len() / 4) {
        let mut bytes = [0u8; 4];
        bytes.copy_from_slice(&buf[i * 4..i * 4 + 4]);
        out.push(f32::from_le_bytes(bytes));
    }
    Ok(out)
}

/// L2-normalise a vector in place. A zero vector is left unchanged.
pub fn l2_normalise(v: &mut [f32]) {
    let mut sq: f64 = 0.0;
    for x in v.iter() {
        sq += (*x as f64) * (*x as f64);
    }
    let norm = sq.sqrt();
    if norm == 0.0 {
        return;
    }
    let inv = (1.0 / norm) as f32;
    for x in v.iter_mut() {
        *x *= inv;
    }
}
