package com.redis.semcache;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Deterministic mock LLM for the semantic-cache demo.
 *
 * <p>The point of a semantic cache is to <em>skip</em> an LLM call
 * when a prior answer is reusable. To make that visible in a docs
 * demo we need an LLM stand-in that:
 *
 * <ul>
 *   <li>takes long enough that the saved time on a cache hit is
 *       obvious (real-world model calls are 500 ms to several
 *       seconds);</li>
 *   <li>responds deterministically so a given prompt always produces
 *       the same answer, which keeps the demo reproducible;</li>
 *   <li>exposes an estimated token count so the demo can show the
 *       saving in &quot;tokens not spent&quot; terms alongside
 *       latency;</li>
 *   <li>needs no API keys, no network, no extra dependencies.</li>
 * </ul>
 *
 * <p>It is keyword-matched against a small lookup table of FAQ-style
 * answers for a fictional online retailer. Anything that doesn't
 * match falls back to a generic templated reply. The
 * {@code latencyMs} parameter is the simulated round trip; the
 * default (1500 ms) is in the neighbourhood of a real GPT-class
 * model on a moderately-sized prompt.
 */
public final class MockLLM {

    private record KnowledgeRow(List<String> keywords, String answer) {}

    private static final List<KnowledgeRow> KNOWLEDGE = List.of(
            new KnowledgeRow(
                    List.of("return", "refund", "exchange"),
                    "You can return any unworn item within 30 days of delivery for a "
                            + "full refund. Start a return from your order page; we email a "
                            + "prepaid label and refund the original payment method within "
                            + "five business days of receiving the item."
            ),
            new KnowledgeRow(
                    List.of("shipping", "delivery", "arrive", "ship"),
                    "Standard shipping is free on orders over $50 and arrives in "
                            + "three to five business days. Expedited two-day shipping is "
                            + "$9.99 and is available at checkout for in-stock items."
            ),
            new KnowledgeRow(
                    List.of("size", "sizing", "fit"),
                    "We follow standard US sizing. For most styles we recommend "
                            + "ordering your usual size; the product page includes a sizing "
                            + "chart and customer fit notes for items that run small or large."
            ),
            new KnowledgeRow(
                    List.of("warranty", "guarantee", "defect", "broken"),
                    "All gear is covered by a one-year manufacturer warranty against "
                            + "defects in materials or workmanship. Email support with your "
                            + "order number and a photo of the issue and we will replace the "
                            + "item or issue a refund."
            ),
            new KnowledgeRow(
                    List.of("contact", "support", "help", "agent"),
                    "You can reach our support team by email at help@example.com or "
                            + "by live chat from the help centre, 9am to 9pm Eastern, seven "
                            + "days a week. Most tickets get a first reply within two hours."
            ),
            new KnowledgeRow(
                    List.of("track", "tracking", "order", "where"),
                    "Your tracking number is on the order confirmation email and on "
                            + "the order detail page once the package has been picked up by "
                            + "the carrier — typically within 24 hours of order placement."
            ),
            new KnowledgeRow(
                    List.of("cancel", "modify", "change"),
                    "Orders can be cancelled or modified for up to one hour after "
                            + "placement. After that the order has usually entered our "
                            + "warehouse system; the fastest path is to accept delivery and "
                            + "start a return for any unwanted items."
            ),
            new KnowledgeRow(
                    List.of("discount", "coupon", "promo", "code"),
                    "Active promotional codes are listed on the homepage banner. "
                            + "Codes apply at checkout and cannot be combined; the system "
                            + "automatically uses the larger of the two when more than one "
                            + "would qualify."
            )
    );

    private static final String FALLBACK_ANSWER =
            "Thanks for the question. Our team would normally answer this "
                    + "individually; in the meantime please check the help centre or "
                    + "contact support@example.com for a faster response.";

    /** Result of a mock LLM call. */
    public record Response(
            String response,
            String modelVersion,
            double latencyMs,
            int promptTokens,
            int completionTokens
    ) {
        public int totalTokens() {
            return promptTokens + completionTokens;
        }
    }

    private final String modelVersion;
    private final double latencyMs;
    private final AtomicLong callCount = new AtomicLong();

    public MockLLM() {
        this("gpt-4.5-2026", 1500.0);
    }

    public MockLLM(String modelVersion, double latencyMs) {
        this.modelVersion = modelVersion;
        this.latencyMs = latencyMs;
    }

    public String modelVersion() {
        return modelVersion;
    }

    public double latencyMs() {
        return latencyMs;
    }

    public long callCount() {
        return callCount.get();
    }

    /**
     * Pretend to call a model. Sleeps for the configured latency,
     * then returns a templated answer.
     */
    public Response complete(String prompt) {
        callCount.incrementAndGet();
        long start = System.nanoTime();
        try {
            // Sleep first so the latency is realistic regardless of
            // which branch generates the text.
            long ms = (long) latencyMs;
            int ns = (int) ((latencyMs - ms) * 1_000_000.0);
            Thread.sleep(ms, ns);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
        String response = answerFor(prompt);
        double elapsedMs = (System.nanoTime() - start) / 1_000_000.0;
        return new Response(
                response,
                modelVersion,
                elapsedMs,
                estimateTokens(prompt),
                estimateTokens(response)
        );
    }

    private static String answerFor(String prompt) {
        String lower = prompt.toLowerCase();
        for (KnowledgeRow row : KNOWLEDGE) {
            for (String kw : row.keywords()) {
                if (lower.contains(kw)) {
                    return row.answer();
                }
            }
        }
        return FALLBACK_ANSWER;
    }

    /** Rough English token estimate: ~4 characters per token. */
    public static int estimateTokens(String text) {
        if (text == null || text.isEmpty()) return 0;
        return Math.max(1, text.length() / 4);
    }
}
