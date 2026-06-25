// Deterministic mock LLM for the semantic-cache demo.
//
// The point of a semantic cache is to *skip* an LLM call when a prior
// answer is reusable. To make that visible in a docs demo we need an
// LLM stand-in that:
//
// * takes long enough that the saved time on a cache hit is obvious
//   (real-world model calls are 500 ms to several seconds);
// * responds deterministically so a given prompt always produces the
//   same answer, which keeps the demo reproducible;
// * exposes an estimated token count so the demo can show the saving
//   in "tokens not spent" terms alongside latency;
// * needs no API keys, no network, no extra dependencies.
//
// It is keyword-matched against a small lookup table of FAQ-style
// answers for a fictional online retailer. Anything that doesn't
// match falls back to a generic templated reply. The `latencyMs`
// parameter is the simulated round trip; the default (1500 ms) is in
// the neighbourhood of a real GPT-class model on a moderately-sized
// prompt.

const KNOWLEDGE = [
  {
    keywords: ['return', 'refund', 'exchange'],
    answer:
      'You can return any unworn item within 30 days of delivery for a '
      + 'full refund. Start a return from your order page; we email a '
      + 'prepaid label and refund the original payment method within '
      + 'five business days of receiving the item.',
  },
  {
    keywords: ['shipping', 'delivery', 'arrive', 'ship'],
    answer:
      'Standard shipping is free on orders over $50 and arrives in '
      + 'three to five business days. Expedited two-day shipping is '
      + '$9.99 and is available at checkout for in-stock items.',
  },
  {
    keywords: ['size', 'sizing', 'fit'],
    answer:
      'We follow standard US sizing. For most styles we recommend '
      + 'ordering your usual size; the product page includes a sizing '
      + 'chart and customer fit notes for items that run small or large.',
  },
  {
    keywords: ['warranty', 'guarantee', 'defect', 'broken'],
    answer:
      'All gear is covered by a one-year manufacturer warranty against '
      + 'defects in materials or workmanship. Email support with your '
      + 'order number and a photo of the issue and we will replace the '
      + 'item or issue a refund.',
  },
  {
    keywords: ['contact', 'support', 'help', 'agent'],
    answer:
      'You can reach our support team by email at help@example.com or '
      + 'by live chat from the help centre, 9am to 9pm Eastern, seven '
      + 'days a week. Most tickets get a first reply within two hours.',
  },
  {
    keywords: ['track', 'tracking', 'order', 'where'],
    answer:
      'Your tracking number is on the order confirmation email and on '
      + 'the order detail page once the package has been picked up by '
      + 'the carrier — typically within 24 hours of order placement.',
  },
  {
    keywords: ['cancel', 'modify', 'change'],
    answer:
      'Orders can be cancelled or modified for up to one hour after '
      + 'placement. After that the order has usually entered our '
      + 'warehouse system; the fastest path is to accept delivery and '
      + 'start a return for any unwanted items.',
  },
  {
    keywords: ['discount', 'coupon', 'promo', 'code'],
    answer:
      'Active promotional codes are listed on the homepage banner. '
      + 'Codes apply at checkout and cannot be combined; the system '
      + 'automatically uses the larger of the two when more than one '
      + 'would qualify.',
  },
];

// Rough English token estimate: ~4 characters per token. Real
// tokenizers (BPE, SentencePiece) vary slightly but this is close
// enough for "look how many tokens you saved" demo signage.
function estimateTokens(text) {
  if (!text) return 0;
  return Math.max(1, Math.floor(text.length / 4));
}

function answerFor(prompt) {
  const lower = prompt.toLowerCase();
  for (const row of KNOWLEDGE) {
    if (row.keywords.some(k => lower.includes(k))) {
      return row.answer;
    }
  }
  // Generic fallback — keeps the demo working for queries that don't
  // match any FAQ keyword.
  return (
    'Thanks for the question. Our team would normally answer this '
    + 'individually; in the meantime please check the help centre or '
    + 'contact support@example.com for a faster response.'
  );
}

export class MockLLM {
  constructor({ modelVersion = 'gpt-4.5-2026', latencyMs = 1500.0 } = {}) {
    this.modelVersion = modelVersion;
    this.latencyMs = latencyMs;
    this.callCount = 0;
  }

  // Pretend to call a model. Sleeps, then returns a templated answer.
  async complete(prompt) {
    this.callCount += 1;
    const start = performance.now();
    // Sleep first so the latency is realistic regardless of which
    // branch generates the text.
    await new Promise(resolve => setTimeout(resolve, this.latencyMs));
    const response = answerFor(prompt);
    const elapsedMs = performance.now() - start;
    return {
      response,
      modelVersion: this.modelVersion,
      latencyMs: elapsedMs,
      promptTokens: estimateTokens(prompt),
      completionTokens: estimateTokens(response),
      get totalTokens() {
        return this.promptTokens + this.completionTokens;
      },
    };
  }
}
