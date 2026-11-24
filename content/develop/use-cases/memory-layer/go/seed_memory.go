// Pre-seed the long-term memory store with sample memories.
//
// In a real deployment the memory store fills up organically as the
// agent reasons over user turns: each turn produces zero or more
// memories (preferences, facts, episodic summaries) that flow into
// the store with deduplication. To make the demo immediately useful
// — so the first recall query lands on relevant results instead of
// an empty list — we seed a small set of canonical memories for a
// default user at startup.
//
// The seed list mixes `semantic` memories (long-lived preferences
// and facts) with `episodic` memories (snapshots of past sessions),
// matching what the Python, Node, .NET, and Rust demos seed so all
// five implementations behave identically.

package main

import (
	"context"
	"fmt"
)

// SeedEntry is one row of the seed list.
type SeedEntry struct {
	Text string
	Kind string
}

// SeedMemories is the canonical mixed list. Order matters only for
// the demo's "first eight memories" display; the dedup KNN means a
// re-seed against an existing store will report zero new writes.
var SeedMemories = []SeedEntry{
	{
		Text: "The user prefers concise answers without filler phrases.",
		Kind: "semantic",
	},
	{
		Text: "The user is a Python developer working on a logistics platform.",
		Kind: "semantic",
	},
	{
		Text: "The user lives in Berlin and works in the Europe/Berlin time zone.",
		Kind: "semantic",
	},
	{
		Text: "The user dislikes dark mode and prefers a high-contrast light " +
			"theme in editors and dashboards.",
		Kind: "semantic",
	},
	{
		Text: "The user is allergic to peanuts; any restaurant suggestion must " +
			"avoid dishes that commonly contain them.",
		Kind: "semantic",
	},
	{
		Text: "Last Tuesday the user asked the agent to draft a postmortem for " +
			"the order-routing outage. The agent produced a five-section " +
			"draft and the user approved sections 1, 2, and 4 with minor " +
			"edits.",
		Kind: "episodic",
	},
	{
		Text: "In a previous session the user asked for help debugging a flaky " +
			"test in the inventory service. The fix turned out to be a race " +
			"condition in the warehouse webhook handler.",
		Kind: "episodic",
	},
	{
		Text: "Two weeks ago the user mentioned they were planning to migrate " +
			"the analytics warehouse from Snowflake to BigQuery in Q3.",
		Kind: "episodic",
	},
}

// Seed embeds and writes the seed memories. Returns the count
// actually written (entries that dedup against existing memories
// don't count).
func Seed(
	ctx context.Context,
	memory *LongTermMemory,
	embedder *LocalEmbedder,
	user, namespace, sourceThread string,
) (int, error) {
	texts := make([]string, len(SeedMemories))
	for i, s := range SeedMemories {
		texts[i] = s.Text
	}
	vectors, err := embedder.EncodeMany(ctx, texts)
	if err != nil {
		return 0, fmt.Errorf("encoding seed batch: %w", err)
	}
	written := 0
	for i, entry := range SeedMemories {
		res, err := memory.Remember(ctx, RememberParams{
			Text:         entry.Text,
			Embedding:    vectors[i],
			User:         user,
			Namespace:    namespace,
			Kind:         entry.Kind,
			SourceThread: sourceThread,
		})
		if err != nil {
			return written, fmt.Errorf("remembering seed %d: %w", i, err)
		}
		if !res.Deduped {
			written++
		}
	}
	return written, nil
}
