package com.redis.agentmem;

import java.util.ArrayList;
import java.util.List;

/**
 * Pre-seed the long-term memory store with sample memories.
 *
 * <p>In a real deployment the memory store fills up organically as
 * the agent reasons over user turns: each turn produces zero or more
 * memories (preferences, facts, episodic summaries) that flow into
 * the store with deduplication. To make the demo immediately useful
 * — so the first recall query lands on relevant results instead of
 * an empty list — we seed a small set of canonical memories for a
 * default user at startup.
 *
 * <p>The seed list mixes {@code semantic} memories (long-lived
 * preferences and facts) with {@code episodic} memories (snapshots
 * of past sessions), matching what the Python, Node, .NET, Rust, and
 * Go demos seed so all six implementations behave identically.
 */
public final class SeedMemory {

    private SeedMemory() {}

    public record SeedEntry(String text, String kind) {}

    public static final List<SeedEntry> SEED_MEMORIES = List.of(
            new SeedEntry(
                    "The user prefers concise answers without filler phrases.",
                    "semantic"),
            new SeedEntry(
                    "The user is a Python developer working on a logistics platform.",
                    "semantic"),
            new SeedEntry(
                    "The user lives in Berlin and works in the Europe/Berlin time zone.",
                    "semantic"),
            new SeedEntry(
                    "The user dislikes dark mode and prefers a high-contrast light "
                            + "theme in editors and dashboards.",
                    "semantic"),
            new SeedEntry(
                    "The user is allergic to peanuts; any restaurant suggestion must "
                            + "avoid dishes that commonly contain them.",
                    "semantic"),
            new SeedEntry(
                    "Last Tuesday the user asked the agent to draft a postmortem for "
                            + "the order-routing outage. The agent produced a five-section "
                            + "draft and the user approved sections 1, 2, and 4 with minor "
                            + "edits.",
                    "episodic"),
            new SeedEntry(
                    "In a previous session the user asked for help debugging a flaky "
                            + "test in the inventory service. The fix turned out to be a "
                            + "race condition in the warehouse webhook handler.",
                    "episodic"),
            new SeedEntry(
                    "Two weeks ago the user mentioned they were planning to migrate "
                            + "the analytics warehouse from Snowflake to BigQuery in Q3.",
                    "episodic")
    );

    /**
     * Embed and write the seed memories. Returns the count actually
     * written (entries that dedup against existing memories don't
     * count).
     */
    public static int seed(
            LongTermMemory memory,
            LocalEmbedder embedder,
            String user,
            String namespace,
            String sourceThread) throws Exception {
        List<String> texts = new ArrayList<>(SEED_MEMORIES.size());
        for (SeedEntry s : SEED_MEMORIES) {
            texts.add(s.text());
        }
        List<float[]> vectors = embedder.encodeMany(texts);
        int written = 0;
        for (int i = 0; i < SEED_MEMORIES.size(); i++) {
            SeedEntry entry = SEED_MEMORIES.get(i);
            WriteResult result = memory.remember(
                    entry.text(),
                    vectors.get(i),
                    user,
                    namespace,
                    entry.kind(),
                    sourceThread,
                    null);
            if (!result.deduped()) {
                written++;
            }
        }
        return written;
    }
}
