using System.Diagnostics;

namespace SemanticCacheDemo;

/// <summary>
/// Deterministic mock LLM for the semantic-cache demo.
/// </summary>
/// <remarks>
/// <para>The point of a semantic cache is to <em>skip</em> an LLM
/// call when a prior answer is reusable. To make that visible in a
/// docs demo we need an LLM stand-in that:</para>
/// <list type="bullet">
///   <item>takes long enough that the saved time on a cache hit is
///         obvious (real-world model calls are 500 ms to several
///         seconds);</item>
///   <item>responds deterministically so a given prompt always
///         produces the same answer, which keeps the demo
///         reproducible;</item>
///   <item>exposes an estimated token count so the demo can show
///         the saving in "tokens not spent" terms alongside
///         latency;</item>
///   <item>needs no API keys, no network, no extra dependencies.</item>
/// </list>
/// <para>It is keyword-matched against a small lookup table of FAQ
/// answers for a fictional online retailer. Anything that doesn't
/// match falls back to a generic templated reply. The
/// <see cref="LatencyMs"/> parameter is the simulated round trip; the
/// default (1500 ms) is in the neighbourhood of a real GPT-class
/// model on a moderately-sized prompt.</para>
/// </remarks>
public sealed class MockLLM
{
    /// <summary>One result row of a mock LLM call.</summary>
    public sealed record Response(
        string Text,
        string ModelVersion,
        double LatencyMs,
        int PromptTokens,
        int CompletionTokens)
    {
        public int TotalTokens => PromptTokens + CompletionTokens;
    }

    private sealed record KnowledgeRow(string[] Keywords, string Answer);

    private static readonly KnowledgeRow[] Knowledge = new[]
    {
        new KnowledgeRow(
            new[] { "return", "refund", "exchange" },
            "You can return any unworn item within 30 days of delivery for a " +
            "full refund. Start a return from your order page; we email a " +
            "prepaid label and refund the original payment method within " +
            "five business days of receiving the item."),
        new KnowledgeRow(
            new[] { "shipping", "delivery", "arrive", "ship" },
            "Standard shipping is free on orders over $50 and arrives in " +
            "three to five business days. Expedited two-day shipping is " +
            "$9.99 and is available at checkout for in-stock items."),
        new KnowledgeRow(
            new[] { "size", "sizing", "fit" },
            "We follow standard US sizing. For most styles we recommend " +
            "ordering your usual size; the product page includes a sizing " +
            "chart and customer fit notes for items that run small or large."),
        new KnowledgeRow(
            new[] { "warranty", "guarantee", "defect", "broken" },
            "All gear is covered by a one-year manufacturer warranty against " +
            "defects in materials or workmanship. Email support with your " +
            "order number and a photo of the issue and we will replace the " +
            "item or issue a refund."),
        new KnowledgeRow(
            new[] { "contact", "support", "help", "agent" },
            "You can reach our support team by email at help@example.com or " +
            "by live chat from the help centre, 9am to 9pm Eastern, seven " +
            "days a week. Most tickets get a first reply within two hours."),
        new KnowledgeRow(
            new[] { "track", "tracking", "order", "where" },
            "Your tracking number is on the order confirmation email and on " +
            "the order detail page once the package has been picked up by " +
            "the carrier - typically within 24 hours of order placement."),
        new KnowledgeRow(
            new[] { "cancel", "modify", "change" },
            "Orders can be cancelled or modified for up to one hour after " +
            "placement. After that the order has usually entered our " +
            "warehouse system; the fastest path is to accept delivery and " +
            "start a return for any unwanted items."),
        new KnowledgeRow(
            new[] { "discount", "coupon", "promo", "code" },
            "Active promotional codes are listed on the homepage banner. " +
            "Codes apply at checkout and cannot be combined; the system " +
            "automatically uses the larger of the two when more than one " +
            "would qualify."),
    };

    private const string FallbackAnswer =
        "Thanks for the question. Our team would normally answer this " +
        "individually; in the meantime please check the help centre or " +
        "contact support@example.com for a faster response.";

    public string ModelVersion { get; }
    public double LatencyMs { get; }
    private long _callCount;

    public MockLLM(string modelVersion = "gpt-4.5-2026", double latencyMs = 1500.0)
    {
        ModelVersion = modelVersion;
        LatencyMs = latencyMs;
    }

    public long CallCount => Interlocked.Read(ref _callCount);

    /// <summary>
    /// Pretend to call a model. Sleeps for the configured latency,
    /// then returns a templated answer.
    /// </summary>
    public Response Complete(string prompt)
    {
        Interlocked.Increment(ref _callCount);
        var sw = Stopwatch.StartNew();
        // Sleep first so the latency is realistic regardless of which
        // branch generates the text.
        int sleepMs = (int)Math.Max(0, Math.Round(LatencyMs));
        Thread.Sleep(sleepMs);
        string response = AnswerFor(prompt);
        sw.Stop();
        return new Response(
            response,
            ModelVersion,
            sw.Elapsed.TotalMilliseconds,
            EstimateTokens(prompt),
            EstimateTokens(response));
    }

    private static string AnswerFor(string prompt)
    {
        string lower = prompt.ToLowerInvariant();
        foreach (var row in Knowledge)
        {
            foreach (var kw in row.Keywords)
            {
                if (lower.Contains(kw)) return row.Answer;
            }
        }
        return FallbackAnswer;
    }

    /// <summary>
    /// Rough English token estimate: ~4 characters per token. Real
    /// tokenizers (BPE, SentencePiece) vary slightly but this is
    /// close enough for "look how many tokens you saved" demo
    /// signage.
    /// </summary>
    public static int EstimateTokens(string? text)
    {
        if (string.IsNullOrEmpty(text)) return 0;
        return Math.Max(1, text.Length / 4);
    }
}
