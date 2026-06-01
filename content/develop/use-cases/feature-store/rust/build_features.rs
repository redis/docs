//! Synthesize a small batch of users with realistic-looking features
//! and bulk-load them into Redis with a 24-hour key-level TTL.
//!
//! Stands in for the nightly Spark / Feast materialization job in a
//! real deployment. In production the equivalent of this script lives
//! in an offline pipeline that reads from the offline store and
//! writes the serving-time hashes into Redis via `HSET` + `EXPIRE`.

use std::collections::BTreeMap;

use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};

use crate::feature_store::{FeatureMap, FeatureValue};

const COUNTRY_CHOICES: &[&str] = &[
    "US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL",
];
const RISK_SEGMENTS: &[&str] = &["low", "medium", "high"];
const RISK_WEIGHTS: &[u32] = &[70, 25, 5];
const CHARGEBACK_BUCKETS: &[i64] = &[0, 1, 2, 3];
const CHARGEBACK_WEIGHTS: &[u32] = &[85, 10, 4, 1];

/// Generate `count` synthetic user feature rows. The shape mirrors a
/// small fraud-scoring feature set: country and risk segment as
/// TAG-like categorical features, plus a few numeric aggregates over
/// recent windows.
pub fn synthesize_users(count: usize, seed: u64) -> Vec<(String, FeatureMap)> {
    let mut rng = StdRng::seed_from_u64(seed);
    let mut users = Vec::with_capacity(count);
    for i in 1..=count {
        let uid = format!("u{:04}", i);
        let mut row: FeatureMap = BTreeMap::new();
        row.insert("country_iso".into(), FeatureValue::Str(
            COUNTRY_CHOICES[rng.gen_range(0..COUNTRY_CHOICES.len())].into()));
        row.insert("risk_segment".into(), FeatureValue::Str(
            weighted_str(&mut rng, RISK_SEGMENTS, RISK_WEIGHTS).into()));
        row.insert("account_age_days".into(), FeatureValue::Int(rng.gen_range(7..=2400)));
        row.insert("tx_count_7d".into(), FeatureValue::Int(rng.gen_range(0..=80)));
        let avg = (rng.gen_range(5.0..350.0_f64) * 100.0).round() / 100.0;
        row.insert("avg_amount_30d".into(), FeatureValue::Float(avg));
        row.insert(
            "chargeback_count_180d".into(),
            FeatureValue::Int(weighted_int(&mut rng, CHARGEBACK_BUCKETS, CHARGEBACK_WEIGHTS)),
        );
        users.push((uid, row));
    }
    users
}

fn weighted_str<R: Rng + ?Sized>(rng: &mut R, items: &[&'static str], weights: &[u32]) -> &'static str {
    let total: u32 = weights.iter().sum();
    let mut r = rng.gen_range(0..total);
    for (i, w) in weights.iter().enumerate() {
        if r < *w { return items[i]; }
        r -= w;
    }
    items[items.len() - 1]
}

fn weighted_int<R: Rng + ?Sized>(rng: &mut R, items: &[i64], weights: &[u32]) -> i64 {
    let total: u32 = weights.iter().sum();
    let mut r = rng.gen_range(0..total);
    for (i, w) in weights.iter().enumerate() {
        if r < *w { return items[i]; }
        r -= w;
    }
    items[items.len() - 1]
}

/// CLI entry point invoked by `build_features_bin.rs`. Parses flags,
/// opens a one-shot `ConnectionManager`, and calls `bulk_load`.
pub async fn cli_main() -> redis::RedisResult<()> {
    let mut redis_url = "redis://127.0.0.1/".to_string();
    let mut count: usize = 200;
    let mut ttl_seconds: u64 = 24 * 60 * 60;
    let mut key_prefix = "fs:user:".to_string();
    let mut seed: u64 = 42;

    let args: Vec<String> = std::env::args().skip(1).collect();
    let mut i = 0usize;
    while i < args.len() {
        match args[i].as_str() {
            "--redis-url" => { redis_url = args[i + 1].clone(); i += 2; }
            "--count" => { count = args[i + 1].parse().unwrap_or(count); i += 2; }
            "--ttl-seconds" => { ttl_seconds = args[i + 1].parse().unwrap_or(ttl_seconds); i += 2; }
            "--key-prefix" => { key_prefix = args[i + 1].clone(); i += 2; }
            "--seed" => { seed = args[i + 1].parse().unwrap_or(seed); i += 2; }
            "-h" | "--help" => {
                println!("Usage: build_features [--redis-url URL] [--count N] [--ttl-seconds S] [--key-prefix PREFIX] [--seed N]");
                return Ok(());
            }
            other => {
                eprintln!("Unknown argument: {other}");
                std::process::exit(2);
            }
        }
    }

    let client = redis::Client::open(redis_url.as_str())?;
    let conn = redis::aio::ConnectionManager::new(client).await?;
    let store = crate::feature_store::FeatureStore::new(
        conn,
        &key_prefix,
        ttl_seconds,
        crate::feature_store::DEFAULT_STREAMING_TTL_SECONDS,
    );

    let rows = synthesize_users(count, seed);
    let loaded = store.bulk_load(&rows, ttl_seconds).await?;
    println!(
        "Materialized {} users at {}* with a {}s key-level TTL.",
        loaded, key_prefix, ttl_seconds
    );
    Ok(())
}
