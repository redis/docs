//! Build the demo product catalog: embed each item's text, write JSON.
//!
//! Run with:
//!
//!     cargo run --bin build_catalog
//!
//! It does three things:
//!
//! 1. Reads the inline catalog defined in `catalog_seed.rs`.
//! 2. Runs the `fastembed` feature-extraction pipeline over each
//!    product's `name. description` text to produce a 384-dimensional
//!    vector.
//! 3. Writes the result to `catalog.json` next to the binary.
//!
//! The demo server reads `catalog.json` at startup so it can seed
//! Redis quickly without re-running the embedding model on every boot.
//! Embeddings are stored as base64-encoded `float32` bytes so the file
//! stays compact and the loader can hand the raw bytes straight to
//! `HSET` without re-converting them.

mod catalog_seed;
mod embeddings;

use std::path::PathBuf;

use base64::Engine as _;

use catalog_seed::{catalog_seed, embed_text_for, CatalogFile, Product};
use embeddings::{floats_to_bytes, LocalEmbedder};

fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let seed = catalog_seed();
    let texts: Vec<String> = seed.iter().map(embed_text_for).collect();

    println!("Loading embedding model (first run downloads ~80 MB)...");
    let embedder = LocalEmbedder::new()?;

    println!(
        "Embedding {} products with {}...",
        texts.len(),
        embedder.model_name
    );
    let vectors = embedder.encode_many(texts)?;
    if vectors.is_empty() {
        return Err("embedder returned no vectors".into());
    }
    let dim = vectors[0].len();
    println!("Embeddings: shape=[{}, {}], dtype=float32", vectors.len(), dim);

    let mut products: Vec<Product> = Vec::with_capacity(seed.len());
    for (i, mut p) in seed.into_iter().enumerate() {
        let bytes = floats_to_bytes(&vectors[i]);
        p.embedding_b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
        products.push(p);
    }

    let out = CatalogFile {
        model: embedder.model_name.clone(),
        dim,
        products,
    };

    let out_path: PathBuf = std::env::args()
        .nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("catalog.json"));

    let body = serde_json::to_string_pretty(&out)?;
    std::fs::write(&out_path, body)?;
    println!(
        "Wrote {} products -> {}",
        out.products.len(),
        out_path.display()
    );

    Ok(())
}
