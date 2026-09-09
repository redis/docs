//! Pre-seed the long-term memory store with sample memories.
//!
//! In a real deployment the memory store fills up organically as the
//! agent reasons over user turns: each turn produces zero or more
//! memories (preferences, facts, episodic summaries) that flow into
//! the store with deduplication. To make the demo immediately useful
//! — so the first recall query lands on relevant results instead of
//! an empty list — we seed a small set of canonical memories for a
//! default user at startup.
//!
//! The seed list mixes `semantic` memories (long-lived preferences
//! and facts) with `episodic` memories (snapshots of past sessions),
//! matching what the Python, Node, and .NET demos seed so all four
//! implementations behave identically.

use crate::embeddings::LocalEmbedder;
use crate::long_term_memory::{LongTermMemory, MemoryError};

pub struct SeedEntry {
    pub text: &'static str,
    pub kind: &'static str,
}

pub const SEED_MEMORIES: &[SeedEntry] = &[
    SeedEntry {
        text: "The user prefers concise answers without filler phrases.",
        kind: "semantic",
    },
    SeedEntry {
        text: "The user is a Python developer working on a logistics platform.",
        kind: "semantic",
    },
    SeedEntry {
        text: "The user lives in Berlin and works in the Europe/Berlin time zone.",
        kind: "semantic",
    },
    SeedEntry {
        text: "The user dislikes dark mode and prefers a high-contrast light \
               theme in editors and dashboards.",
        kind: "semantic",
    },
    SeedEntry {
        text: "The user is allergic to peanuts; any restaurant suggestion must \
               avoid dishes that commonly contain them.",
        kind: "semantic",
    },
    SeedEntry {
        text: "Last Tuesday the user asked the agent to draft a postmortem for \
               the order-routing outage. The agent produced a five-section \
               draft and the user approved sections 1, 2, and 4 with minor \
               edits.",
        kind: "episodic",
    },
    SeedEntry {
        text: "In a previous session the user asked for help debugging a flaky \
               test in the inventory service. The fix turned out to be a race \
               condition in the warehouse webhook handler.",
        kind: "episodic",
    },
    SeedEntry {
        text: "Two weeks ago the user mentioned they were planning to migrate \
               the analytics warehouse from Snowflake to BigQuery in Q3.",
        kind: "episodic",
    },
];

/// Embed and write the seed memories. Returns the count actually
/// written (entries that dedup against existing memories don't
/// count).
pub fn seed(
    memory: &LongTermMemory,
    embedder: &LocalEmbedder,
    user: &str,
    namespace: &str,
    source_thread: &str,
) -> Result<usize, MemoryError> {
    let texts: Vec<&str> = SEED_MEMORIES.iter().map(|e| e.text).collect();
    let vectors = embedder
        .encode_many(&texts)
        .map_err(|e| MemoryError::Parse(e.to_string()))?;
    let mut written = 0usize;
    for (entry, vec) in SEED_MEMORIES.iter().zip(vectors.iter()) {
        let result = memory.remember(
            entry.text,
            vec,
            user,
            namespace,
            entry.kind,
            source_thread,
            None,
        )?;
        if !result.deduped {
            written += 1;
        }
    }
    Ok(written)
}
