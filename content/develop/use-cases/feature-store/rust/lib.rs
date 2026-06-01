//! Redis online feature store backed by per-entity Hashes.
//!
//! Each entity (here, a user) lives at a deterministic key such as
//! `fs:user:{id}`. The hash holds every feature for that entity as
//! one field per feature — batch-materialized aggregates (refreshed
//! on a daily cycle) alongside streaming-updated signals (refreshed
//! every few seconds). One `HMGET` returns whichever subset the
//! model needs in one network round trip.
//!
//! Two TTL layers solve the *mixed staleness* problem:
//!
//! * A key-level `EXPIRE` aligned with the batch materialization
//!   cycle causes the whole entity to disappear if its batch
//!   refresher fails, so inference sees a missing entity (which the
//!   model handler can detect and fall back on) rather than silently
//!   outdated values.
//! * A per-field `HEXPIRE` on each streaming field gives that field
//!   its own shorter expiry, independent of the rest of the hash.
//!   When the streaming pipeline stops updating a field, the field
//!   self-cleans while the rest of the entity stays populated.
//!
//! `HEXPIRE` and `HTTL` require Redis 7.4 or later. The redis-rs
//! crate up to 0.27 doesn't ship typed bindings for the field-TTL
//! commands yet; the helper issues them with the generic
//! `redis::cmd("HEXPIRE")` builder, which sends the same wire bytes.

pub mod build_features;
pub mod feature_store;
pub mod streaming_worker;
