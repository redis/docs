"""
Pre-seed the long-term memory store with sample memories.

In a real deployment the memory store fills up organically as the
agent reasons over user turns: each turn produces zero or more
memories (preferences, facts, episodic summaries) that flow into the
store with deduplication. To make the demo immediately useful — so
the first recall query lands on relevant results instead of an empty
list — we seed a small set of canonical memories for a default user
at startup.

The seed list mixes ``semantic`` memories (long-lived preferences
and facts) with ``episodic`` memories (snapshots of past sessions),
so the demo can show how the ``kind`` filter scopes recall.
"""

from __future__ import annotations

import numpy as np

from embeddings import LocalEmbedder
from long_term_memory import LongTermMemory


SEED_MEMORIES: list[dict] = [
    {
        "text": "The user prefers concise answers without filler phrases.",
        "kind": "semantic",
    },
    {
        "text": "The user is a Python developer working on a logistics platform.",
        "kind": "semantic",
    },
    {
        "text": "The user lives in Berlin and works in the Europe/Berlin time zone.",
        "kind": "semantic",
    },
    {
        "text":
            "The user dislikes dark mode and prefers a high-contrast light "
            "theme in editors and dashboards.",
        "kind": "semantic",
    },
    {
        "text":
            "The user is allergic to peanuts; any restaurant suggestion must "
            "avoid dishes that commonly contain them.",
        "kind": "semantic",
    },
    {
        "text":
            "Last Tuesday the user asked the agent to draft a postmortem for "
            "the order-routing outage. The agent produced a five-section "
            "draft and the user approved sections 1, 2, and 4 with minor "
            "edits.",
        "kind": "episodic",
    },
    {
        "text":
            "In a previous session the user asked for help debugging a flaky "
            "test in the inventory service. The fix turned out to be a race "
            "condition in the warehouse webhook handler.",
        "kind": "episodic",
    },
    {
        "text":
            "Two weeks ago the user mentioned they were planning to migrate "
            "the analytics warehouse from Snowflake to BigQuery in Q3.",
        "kind": "episodic",
    },
]


def seed(
    memory: LongTermMemory,
    embedder: LocalEmbedder,
    user: str = "default",
    namespace: str = "default",
    source_thread: str = "seed",
) -> int:
    """Embed and write the seed memories. Returns the count actually written."""
    prompts = [m["text"] for m in SEED_MEMORIES]
    vectors = embedder.encode_many(prompts)
    written = 0
    for entry, vec in zip(SEED_MEMORIES, vectors):
        result = memory.remember(
            text=entry["text"],
            embedding=np.asarray(vec, dtype=np.float32),
            user=user,
            namespace=namespace,
            kind=entry["kind"],
            source_thread=source_thread,
        )
        if not result.deduped:
            written += 1
    return written
