# Deterministic mock LLM for the semantic-cache demo.
#
# The point of a semantic cache is to *skip* an LLM call when a prior
# answer is reusable. To make that visible in a docs demo we need an
# LLM stand-in that:
#
#   * takes long enough that the saved time on a cache hit is obvious
#     (real-world model calls are 500 ms to several seconds);
#   * responds deterministically so a given prompt always produces the
#     same answer, which keeps the demo reproducible;
#   * exposes an estimated token count so the demo can show the saving
#     in "tokens not spent" terms alongside latency;
#   * needs no API keys, no network, no extra dependencies.
#
# It is keyword-matched against a small lookup table of FAQ-style
# answers for a fictional online retailer. Anything that doesn't match
# falls back to a generic templated reply. The `latency_ms` parameter
# is the simulated round trip; the default (1500 ms) is in the
# neighbourhood of a real GPT-class model on a moderately-sized prompt.

module SemCache
  class MockLLM
    KNOWLEDGE = [
      {
        keywords: %w[return refund exchange],
        answer:
          'You can return any unworn item within 30 days of delivery for a ' \
          'full refund. Start a return from your order page; we email a ' \
          'prepaid label and refund the original payment method within ' \
          'five business days of receiving the item.'
      },
      {
        keywords: %w[shipping delivery arrive ship],
        answer:
          'Standard shipping is free on orders over $50 and arrives in ' \
          'three to five business days. Expedited two-day shipping is ' \
          '$9.99 and is available at checkout for in-stock items.'
      },
      {
        keywords: %w[size sizing fit],
        answer:
          'We follow standard US sizing. For most styles we recommend ' \
          'ordering your usual size; the product page includes a sizing ' \
          'chart and customer fit notes for items that run small or large.'
      },
      {
        keywords: %w[warranty guarantee defect broken],
        answer:
          'All gear is covered by a one-year manufacturer warranty against ' \
          'defects in materials or workmanship. Email support with your ' \
          'order number and a photo of the issue and we will replace the ' \
          'item or issue a refund.'
      },
      {
        keywords: %w[contact support help agent],
        answer:
          'You can reach our support team by email at help@example.com or ' \
          'by live chat from the help centre, 9am to 9pm Eastern, seven ' \
          'days a week. Most tickets get a first reply within two hours.'
      },
      {
        keywords: %w[track tracking order where],
        answer:
          'Your tracking number is on the order confirmation email and on ' \
          'the order detail page once the package has been picked up by ' \
          'the carrier — typically within 24 hours of order placement.'
      },
      {
        keywords: %w[cancel modify change],
        answer:
          'Orders can be cancelled or modified for up to one hour after ' \
          'placement. After that the order has usually entered our ' \
          'warehouse system; the fastest path is to accept delivery and ' \
          'start a return for any unwanted items.'
      },
      {
        keywords: %w[discount coupon promo code],
        answer:
          'Active promotional codes are listed on the homepage banner. ' \
          'Codes apply at checkout and cannot be combined; the system ' \
          'automatically uses the larger of the two when more than one ' \
          'would qualify.'
      }
    ].freeze

    Response = Struct.new(
      :response, :model_version, :latency_ms,
      :prompt_tokens, :completion_tokens, keyword_init: true
    ) do
      def total_tokens
        prompt_tokens.to_i + completion_tokens.to_i
      end
    end

    attr_reader :model_version, :latency_ms, :call_count

    def initialize(model_version: 'gpt-4.5-2026', latency_ms: 1500.0)
      @model_version = model_version
      @latency_ms = latency_ms.to_f
      @call_count = 0
    end

    # Pretend to call a model. Sleeps for the configured latency, then
    # returns a templated answer. The sleep happens first so the
    # latency budget is realistic regardless of which branch produces
    # the text.
    def complete(prompt)
      @call_count += 1
      started = monotonic_ms
      sleep(@latency_ms / 1000.0) if @latency_ms.positive?
      response_text = answer_for(prompt)
      Response.new(
        response: response_text,
        model_version: @model_version,
        latency_ms: monotonic_ms - started,
        prompt_tokens: estimate_tokens(prompt),
        completion_tokens: estimate_tokens(response_text)
      )
    end

    private

    def monotonic_ms
      Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0
    end

    # Rough English token estimate: ~4 characters per token. Real
    # tokenizers (BPE, SentencePiece) vary slightly but this is close
    # enough for "look how many tokens you saved" demo signage.
    def estimate_tokens(text)
      return 0 if text.nil? || text.empty?
      [(text.length / 4), 1].max
    end

    def answer_for(prompt)
      lower = prompt.to_s.downcase
      row = KNOWLEDGE.find { |r| r[:keywords].any? { |k| lower.include?(k) } }
      return row[:answer] if row

      # Generic fallback — keeps the demo working for queries that
      # don't match any FAQ keyword.
      'Thanks for the question. Our team would normally answer this ' \
        'individually; in the meantime please check the help centre or ' \
        'contact support@example.com for a faster response.'
    end
  end
end
