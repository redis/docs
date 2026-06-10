//! Tiny shim that runs the batch materializer in the
//! ``feature_store_demo`` library. Run with:
//!
//!     cargo run --release --bin build_features -- --count 500 --ttl-seconds 3600
fn main() {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("tokio runtime");
    if let Err(e) = rt.block_on(feature_store_demo::build_features::cli_main()) {
        eprintln!("build_features failed: {e}");
        std::process::exit(1);
    }
}
