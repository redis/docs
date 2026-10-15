namespace AgentMemoryDemo;

/// <summary>
/// Pre-seed the long-term memory store with sample memories.
/// </summary>
/// <remarks>
/// <para>In a real deployment the memory store fills up organically
/// as the agent reasons over user turns: each turn produces zero or
/// more memories (preferences, facts, episodic summaries) that flow
/// into the store with deduplication. To make the demo immediately
/// useful — so the first recall query lands on relevant results
/// instead of an empty list — we seed a small set of canonical
/// memories for a default user at startup.</para>
///
/// <para>The seed list mixes <c>semantic</c> memories (long-lived
/// preferences and facts) with <c>episodic</c> memories (snapshots
/// of past sessions), matching what the Python and Node demos seed
/// so the three implementations behave identically.</para>
/// </remarks>
public static class SeedMemory
{
    public sealed record SeedEntry(string Text, string Kind);

    public static readonly IReadOnlyList<SeedEntry> SeedMemories = new[]
    {
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
            + "test in the inventory service. The fix turned out to be a race "
            + "condition in the warehouse webhook handler.",
            "episodic"),
        new SeedEntry(
            "Two weeks ago the user mentioned they were planning to migrate "
            + "the analytics warehouse from Snowflake to BigQuery in Q3.",
            "episodic"),
    };

    /// <summary>
    /// Embed and write the seed memories. Returns the count actually
    /// written (entries that dedup against existing memories don't
    /// count).
    /// </summary>
    public static int Seed(
        LongTermMemory memory,
        LocalEmbedder embedder,
        string user = "default",
        string @namespace = "default",
        string sourceThread = "seed")
    {
        var texts = SeedMemories.Select(m => m.Text).ToList();
        var vectors = embedder.EncodeMany(texts);
        int written = 0;
        for (int i = 0; i < SeedMemories.Count; i++)
        {
            var entry = SeedMemories[i];
            var result = memory.Remember(
                text: entry.Text,
                embedding: vectors[i],
                user: user,
                @namespace: @namespace,
                kind: entry.Kind,
                sourceThread: sourceThread);
            if (!result.Deduped) written++;
        }
        return written;
    }
}
