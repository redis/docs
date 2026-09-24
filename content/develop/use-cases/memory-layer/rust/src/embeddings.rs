//! Local text-embedding helper backed by Candle.
//!
//! This is a thin wrapper around the sentence-transformers model
//! `sentence-transformers/all-MiniLM-L6-v2`: a 384-dimensional BERT
//! encoder that runs in-process on CPU through Candle's pure-Rust
//! tensor backend, needs no API key, and produces vectors numerically
//! equivalent to the equivalent PyTorch model from
//! sentence-transformers.
//!
//! Two things matter for parity with the Python / Node / Go / Jedis
//! demos:
//!
//!   1. **Mean pooling with the attention mask.** sentence-transformers
//!      computes the sentence vector as the attention-mask-weighted
//!      average of the per-token last-hidden-state vectors, *not* the
//!      `[CLS]` vector. Doing CLS-only here would produce numerically
//!      different vectors and the published distance benchmarks (0.30
//!      for "How fast is delivery?", 0.49 for "How do I return an
//!      item?") would drift.
//!   2. **Explicit L2 normalisation.** With normalised vectors, cosine
//!      distance reduces to `1 - dot product`, which is what Redis
//!      Search reports for our `COSINE` HNSW field. Without
//!      normalisation, the distances would be in a different range and
//!      the 0.5 default threshold would be meaningless.
//!
//! The model weights are fetched from the Hugging Face Hub on first
//! run via `hf-hub`. Subsequent runs read from the local cache.

use std::path::PathBuf;

use candle_core::{DType, Device, Tensor};
use candle_nn::VarBuilder;
use candle_transformers::models::bert::{BertModel, Config, HiddenAct, DTYPE};
use hf_hub::api::sync::Api;
use tokenizers::{PaddingParams, PaddingStrategy, Tokenizer, TruncationParams, TruncationStrategy};

pub const DEFAULT_EMBED_MODEL: &str = "sentence-transformers/all-MiniLM-L6-v2";

#[derive(Debug)]
pub enum EmbedError {
    Hub(String),
    Io(std::io::Error),
    Candle(candle_core::Error),
    Tokenizer(String),
    BatchMismatch { expected: usize, got: usize },
    Empty,
}

impl std::fmt::Display for EmbedError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EmbedError::Hub(msg) => write!(f, "hugging face hub: {}", msg),
            EmbedError::Io(e) => write!(f, "io: {}", e),
            EmbedError::Candle(e) => write!(f, "candle: {}", e),
            EmbedError::Tokenizer(msg) => write!(f, "tokenizer: {}", msg),
            EmbedError::BatchMismatch { expected, got } => write!(
                f,
                "pipeline returned {} vectors for {} inputs",
                got, expected
            ),
            EmbedError::Empty => write!(f, "pipeline returned no embeddings"),
        }
    }
}

impl std::error::Error for EmbedError {}

impl From<candle_core::Error> for EmbedError {
    fn from(e: candle_core::Error) -> Self {
        EmbedError::Candle(e)
    }
}

impl From<std::io::Error> for EmbedError {
    fn from(e: std::io::Error) -> Self {
        EmbedError::Io(e)
    }
}

/// Wraps a Candle BertModel + a HuggingFace tokenizer for a sentence
/// transformer.
pub struct LocalEmbedder {
    pub model_name: String,
    // `dim` is exposed so callers can sanity-check the model output
    // against the Redis Search index dimension; the demo HTTP layer
    // doesn't read it (it's hard-coded against VECTOR_DIM_DEFAULT).
    #[allow(dead_code)]
    pub dim: usize,
    model: BertModel,
    tokenizer: Tokenizer,
    device: Device,
}

impl LocalEmbedder {
    /// Load the MiniLM model + tokenizer. Downloads them on first run
    /// from the Hugging Face Hub into the local hf cache; later runs
    /// load from disk only.
    pub fn new(model_name: Option<&str>) -> Result<Self, EmbedError> {
        let model_name = model_name.unwrap_or(DEFAULT_EMBED_MODEL).to_string();

        let api = Api::new().map_err(|e| EmbedError::Hub(e.to_string()))?;
        let repo = api.model(model_name.clone());

        // The sentence-transformers MiniLM repo ships pytorch_model.bin
        // + config.json + tokenizer.json. We deliberately use the
        // PyTorch weights via candle's pickle reader rather than the
        // safetensors mirror because (a) the canonical repo only
        // publishes .bin, and (b) staying on the canonical repo means
        // we hit the same weights as redis-py / nodejs / go / jedis
        // demos.
        let config_path: PathBuf = repo
            .get("config.json")
            .map_err(|e| EmbedError::Hub(e.to_string()))?;
        let tokenizer_path: PathBuf = repo
            .get("tokenizer.json")
            .map_err(|e| EmbedError::Hub(e.to_string()))?;
        let weights_path: PathBuf = repo
            .get("pytorch_model.bin")
            .map_err(|e| EmbedError::Hub(e.to_string()))?;

        let config_bytes = std::fs::read(&config_path)?;
        let mut config: Config =
            serde_json::from_slice(&config_bytes).map_err(|e| EmbedError::Hub(e.to_string()))?;
        // sentence-transformers configs sometimes ship with hidden_act
        // = "gelu" as a JSON string Candle parses as Gelu. MiniLM ships
        // hidden_act="gelu", which already matches; force it just in
        // case a downstream repo ships a non-standard value.
        config.hidden_act = HiddenAct::Gelu;

        let mut tokenizer = Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| EmbedError::Tokenizer(e.to_string()))?;
        // Match sentence-transformers' default: pad to the longest in
        // the batch, truncate to the model's max length. Without the
        // padding configuration set, single-example calls work fine
        // but multi-example batches fail because Candle needs a
        // rectangular tensor.
        let pad_id = tokenizer
            .get_padding()
            .map(|p| p.pad_id)
            .unwrap_or(0);
        tokenizer.with_padding(Some(PaddingParams {
            strategy: PaddingStrategy::BatchLongest,
            direction: tokenizers::PaddingDirection::Right,
            pad_to_multiple_of: None,
            pad_id,
            pad_type_id: 0,
            pad_token: "[PAD]".to_string(),
        }));
        tokenizer
            .with_truncation(Some(TruncationParams {
                max_length: 512,
                strategy: TruncationStrategy::LongestFirst,
                stride: 0,
                direction: tokenizers::TruncationDirection::Right,
            }))
            .map_err(|e| EmbedError::Tokenizer(e.to_string()))?;

        let device = Device::Cpu;
        let vb = VarBuilder::from_pth(&weights_path, DTYPE, &device)?;
        let model = BertModel::load(vb, &config)?;

        let dim = config.hidden_size;

        Ok(Self {
            model_name,
            dim,
            model,
            tokenizer,
            device,
        })
    }

    /// Returns a `dim`-element float32 vector for the input string,
    /// L2-normalised.
    pub fn encode_one(&self, text: &str) -> Result<Vec<f32>, EmbedError> {
        let mut out = self.encode_many(&[text])?;
        if out.is_empty() {
            return Err(EmbedError::Empty);
        }
        Ok(out.remove(0))
    }

    /// Batch-encodes several strings in one forward pass so the model
    /// pays the kernel-launch overhead once. Returns one vector per
    /// input in the same order. Each vector is L2-normalised.
    pub fn encode_many(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError> {
        if texts.is_empty() {
            return Ok(Vec::new());
        }

        let encodings = self
            .tokenizer
            .encode_batch(texts.to_vec(), true)
            .map_err(|e| EmbedError::Tokenizer(e.to_string()))?;
        if encodings.len() != texts.len() {
            return Err(EmbedError::BatchMismatch {
                expected: texts.len(),
                got: encodings.len(),
            });
        }

        let batch_size = encodings.len();
        let seq_len = encodings.iter().map(|e| e.get_ids().len()).max().unwrap_or(0);

        let mut input_ids = Vec::with_capacity(batch_size * seq_len);
        let mut attention_mask = Vec::with_capacity(batch_size * seq_len);
        let mut token_type_ids = Vec::with_capacity(batch_size * seq_len);
        for enc in &encodings {
            input_ids.extend_from_slice(enc.get_ids());
            attention_mask.extend_from_slice(enc.get_attention_mask());
            token_type_ids.extend_from_slice(enc.get_type_ids());
        }

        let input_ids_t = Tensor::from_vec(input_ids, (batch_size, seq_len), &self.device)?;
        let token_type_ids_t =
            Tensor::from_vec(token_type_ids, (batch_size, seq_len), &self.device)?;
        let attn_mask_u32 = attention_mask.clone();
        let attn_mask_t = Tensor::from_vec(attn_mask_u32, (batch_size, seq_len), &self.device)?;

        // Forward pass. Candle's BertModel takes input_ids,
        // token_type_ids, and an optional attention_mask. We pass the
        // mask so the encoder ignores padded positions.
        let hidden = self.model.forward(
            &input_ids_t,
            &token_type_ids_t,
            Some(&attn_mask_t),
        )?;

        // Mean-pool with the attention mask. sentence-transformers
        // computes the sentence vector as the mask-weighted average of
        // per-token last-hidden-state vectors. Pseudocode:
        //
        //   sum = (hidden * mask_expanded).sum(dim=1)
        //   counts = mask_expanded.sum(dim=1).clamp(min=1e-9)
        //   pooled = sum / counts
        //
        // The mask comes in as u32 / DTYPE-incompatible; convert to
        // the model's DType and broadcast it across the hidden dim.
        let mask_f = attn_mask_t.to_dtype(DTYPE)?; // (B, T)
        let mask_expanded = mask_f.unsqueeze(2)?; // (B, T, 1)
        let mask_expanded = mask_expanded.broadcast_as(hidden.shape())?; // (B, T, H)

        let masked = hidden.broadcast_mul(&mask_expanded)?; // (B, T, H)
        let summed = masked.sum(1)?; // (B, H)
        let counts = mask_f.sum(1)?; // (B,)
        // Clamp the counts so an all-pad row (shouldn't happen, but be
        // defensive) doesn't divide by zero.
        let counts = counts.maximum(&Tensor::new(1e-9f32, &self.device)?.broadcast_as(counts.shape())?)?;
        let counts = counts.unsqueeze(1)?; // (B, 1)
        let pooled = summed.broadcast_div(&counts)?; // (B, H)

        // Extract as Vec<Vec<f32>> and L2-normalise each row in
        // user-space so the demo's normalisation is explicit and
        // visible in source. (Candle's tensor normalize helpers also
        // exist but doing it by hand makes the docs example legible
        // without a Candle deep-dive.)
        let pooled_f32 = pooled.to_dtype(DType::F32)?;
        let rows: Vec<Vec<f32>> = pooled_f32.to_vec2::<f32>()?;
        if rows.len() != texts.len() {
            return Err(EmbedError::BatchMismatch {
                expected: texts.len(),
                got: rows.len(),
            });
        }

        let mut out = Vec::with_capacity(rows.len());
        for mut row in rows {
            normalize_in_place(&mut row);
            out.push(row);
        }
        Ok(out)
    }
}

/// L2-normalises a vector so it has unit length. A zero vector is left
/// untouched (its cosine distance to anything is undefined, but at
/// least Redis won't reject the bytes).
fn normalize_in_place(v: &mut [f32]) {
    let mut sum_sq: f64 = 0.0;
    for &x in v.iter() {
        sum_sq += (x as f64) * (x as f64);
    }
    if sum_sq == 0.0 {
        return;
    }
    let inv = (1.0 / sum_sq.sqrt()) as f32;
    for x in v.iter_mut() {
        *x *= inv;
    }
}

/// Packs a `&[f32]` into the raw little-endian byte sequence Redis
/// Search expects for a FLOAT32 vector field. We use
/// `byteorder::LittleEndian` (via `write_f32`) rather than relying on
/// `f32::to_le_bytes` so the encoding contract is visible in source
/// and consistent with the Go demo's `binary.LittleEndian.PutUint32`.
pub fn floats_to_bytes(fs: &[f32]) -> Vec<u8> {
    use byteorder::{LittleEndian, WriteBytesExt};
    let mut buf = Vec::with_capacity(fs.len() * 4);
    for &f in fs {
        buf.write_f32::<LittleEndian>(f).expect("Vec write never fails");
    }
    buf
}
