namespace SemanticCacheDemo;

/// <summary>
/// Pre-seed the semantic cache with a handful of FAQ answers.
/// </summary>
/// <remarks>
/// <para>In a real deployment the cache fills up organically as
/// users ask questions: a first-time question is a miss, the LLM
/// answers, and the response is written back. To make the demo
/// immediately useful — so the first query you type lands on a hit
/// instead of a cold miss — we seed a small set of canonical
/// prompts and their answers at startup.</para>
///
/// <para>The seed list mirrors the keyword table in
/// <see cref="MockLLM"/> but stores the <em>canonical phrasing</em>
/// of each question. Paraphrases of any of these prompts
/// ("How do I return an item?", "Can I get a refund?") embed close
/// to the canonical entry and the cache lookup serves the stored
/// response without ever calling the model.</para>
/// </remarks>
public static class SeedCache
{
    public sealed record SeedEntry(string Prompt, string Response);

    public static readonly IReadOnlyList<SeedEntry> SeedEntries = new[]
    {
        new SeedEntry(
            "What is your return policy?",
            "You can return any unworn item within 30 days of delivery for " +
            "a full refund. Start a return from your order page; we email " +
            "a prepaid label and refund the original payment method within " +
            "five business days of receiving the item."),
        new SeedEntry(
            "How long does shipping take?",
            "Standard shipping is free on orders over $50 and arrives in " +
            "three to five business days. Expedited two-day shipping is " +
            "$9.99 and is available at checkout for in-stock items."),
        new SeedEntry(
            "How do I find my size?",
            "We follow standard US sizing. For most styles we recommend " +
            "ordering your usual size; the product page includes a sizing " +
            "chart and customer fit notes for items that run small or " +
            "large."),
        new SeedEntry(
            "Is there a warranty on your products?",
            "All gear is covered by a one-year manufacturer warranty " +
            "against defects in materials or workmanship. Email support " +
            "with your order number and a photo of the issue and we will " +
            "replace the item or issue a refund."),
        new SeedEntry(
            "How can I contact customer support?",
            "You can reach our support team by email at help@example.com " +
            "or by live chat from the help centre, 9am to 9pm Eastern, " +
            "seven days a week. Most tickets get a first reply within two " +
            "hours."),
        new SeedEntry(
            "Where is my order?",
            "Your tracking number is on the order confirmation email and " +
            "on the order detail page once the package has been picked up " +
            "by the carrier - typically within 24 hours of order " +
            "placement."),
    };

    /// <summary>
    /// Embed and write every seed entry. Returns the number of
    /// entries that were written.
    /// </summary>
    public static int Seed(
        RedisSemanticCache cache,
        LocalEmbedder embedder,
        string tenant = "acme",
        string locale = "en",
        string modelVersion = "gpt-4.5-2026")
    {
        var prompts = SeedEntries.Select(e => e.Prompt).ToList();
        var vectors = embedder.EncodeMany(prompts);
        for (int i = 0; i < SeedEntries.Count; i++)
        {
            var entry = SeedEntries[i];
            cache.Put(
                prompt: entry.Prompt,
                response: entry.Response,
                embedding: vectors[i],
                tenant: tenant,
                locale: locale,
                modelVersion: modelVersion);
        }
        return SeedEntries.Count;
    }
}
