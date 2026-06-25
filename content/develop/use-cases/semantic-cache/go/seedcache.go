// Pre-seed the semantic cache with a handful of FAQ answers.
//
// In a real deployment the cache fills up organically as users ask
// questions: a first-time question is a miss, the LLM answers, and
// the response is written back. To make the demo immediately useful
// — so the first query you type lands on a hit instead of a cold
// miss — we seed a small set of canonical prompts and their answers
// at startup.
//
// The seed list mirrors the keyword table in `mockllm.go` but stores
// the *canonical phrasing* of each question. Paraphrases of any of
// these prompts ("How do I return an item?", "Can I get a refund?")
// embed close to the canonical entry and the cache lookup serves the
// stored response without ever calling the model.

package main

import "context"

// SeedEntry is one canonical prompt + response pair.
type SeedEntry struct {
	Prompt   string
	Response string
}

// SeedEntries is the canonical FAQ list. It is exported so the docs
// page can link to it as a single source of truth for the demo
// transcript.
var SeedEntries = []SeedEntry{
	{
		Prompt: "What is your return policy?",
		Response: "You can return any unworn item within 30 days of delivery for " +
			"a full refund. Start a return from your order page; we email " +
			"a prepaid label and refund the original payment method within " +
			"five business days of receiving the item.",
	},
	{
		Prompt: "How long does shipping take?",
		Response: "Standard shipping is free on orders over $50 and arrives in " +
			"three to five business days. Expedited two-day shipping is " +
			"$9.99 and is available at checkout for in-stock items.",
	},
	{
		Prompt: "How do I find my size?",
		Response: "We follow standard US sizing. For most styles we recommend " +
			"ordering your usual size; the product page includes a sizing " +
			"chart and customer fit notes for items that run small or " +
			"large.",
	},
	{
		Prompt: "Is there a warranty on your products?",
		Response: "All gear is covered by a one-year manufacturer warranty " +
			"against defects in materials or workmanship. Email support " +
			"with your order number and a photo of the issue and we will " +
			"replace the item or issue a refund.",
	},
	{
		Prompt: "How can I contact customer support?",
		Response: "You can reach our support team by email at help@example.com " +
			"or by live chat from the help centre, 9am to 9pm Eastern, " +
			"seven days a week. Most tickets get a first reply within two " +
			"hours.",
	},
	{
		Prompt: "Where is my order?",
		Response: "Your tracking number is on the order confirmation email and " +
			"on the order detail page once the package has been picked up " +
			"by the carrier — typically within 24 hours of order " +
			"placement.",
	},
}

// SeedOptions captures the metadata scope every seed entry shares.
type SeedOptions struct {
	Tenant       string
	Locale       string
	ModelVersion string
}

// Seed writes every entry in `SeedEntries` to the cache under the
// supplied metadata scope. Embeddings are produced in one batched
// `EncodeMany` call so the encoder only pays the setup cost once.
// Returns the number of entries that were written.
func Seed(ctx context.Context, cache *RedisSemanticCache, embedder *LocalEmbedder, opts SeedOptions) (int, error) {
	tenant := opts.Tenant
	if tenant == "" {
		tenant = "acme"
	}
	locale := opts.Locale
	if locale == "" {
		locale = "en"
	}
	modelVersion := opts.ModelVersion
	if modelVersion == "" {
		modelVersion = "gpt-4.5-2026"
	}

	prompts := make([]string, len(SeedEntries))
	for i, e := range SeedEntries {
		prompts[i] = e.Prompt
	}
	vectors, err := embedder.EncodeMany(ctx, prompts)
	if err != nil {
		return 0, err
	}
	for i, entry := range SeedEntries {
		if _, err := cache.Put(ctx, PutParams{
			Prompt:       entry.Prompt,
			Response:     entry.Response,
			Embedding:    vectors[i],
			Tenant:       tenant,
			Locale:       locale,
			ModelVersion: modelVersion,
		}); err != nil {
			return 0, err
		}
	}
	return len(SeedEntries), nil
}
