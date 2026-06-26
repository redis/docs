# Pre-seed the semantic cache with a handful of FAQ answers.
#
# In a real deployment the cache fills up organically as users ask
# questions: a first-time question is a miss, the LLM answers, and the
# response is written back. To make the demo immediately useful — so
# the first query you type lands on a hit instead of a cold miss — we
# seed a small set of canonical prompts and their answers at startup.
#
# The seed list mirrors the keyword table in `mock_llm.rb` but stores
# the *canonical phrasing* of each question. Paraphrases of any of
# these prompts ("How do I return an item?", "Can I get a refund?")
# embed close to the canonical entry and the cache lookup serves the
# stored response without ever calling the model.

module SemCache
  module SeedCache
    SEED_ENTRIES = [
      {
        prompt: 'What is your return policy?',
        response:
          'You can return any unworn item within 30 days of delivery for ' \
          'a full refund. Start a return from your order page; we email ' \
          'a prepaid label and refund the original payment method within ' \
          'five business days of receiving the item.'
      },
      {
        prompt: 'How long does shipping take?',
        response:
          'Standard shipping is free on orders over $50 and arrives in ' \
          'three to five business days. Expedited two-day shipping is ' \
          '$9.99 and is available at checkout for in-stock items.'
      },
      {
        prompt: 'How do I find my size?',
        response:
          'We follow standard US sizing. For most styles we recommend ' \
          'ordering your usual size; the product page includes a sizing ' \
          'chart and customer fit notes for items that run small or ' \
          'large.'
      },
      {
        prompt: 'Is there a warranty on your products?',
        response:
          'All gear is covered by a one-year manufacturer warranty ' \
          'against defects in materials or workmanship. Email support ' \
          'with your order number and a photo of the issue and we will ' \
          'replace the item or issue a refund.'
      },
      {
        prompt: 'How can I contact customer support?',
        response:
          'You can reach our support team by email at help@example.com ' \
          'or by live chat from the help centre, 9am to 9pm Eastern, ' \
          'seven days a week. Most tickets get a first reply within two ' \
          'hours.'
      },
      {
        prompt: 'Where is my order?',
        response:
          'Your tracking number is on the order confirmation email and ' \
          'on the order detail page once the package has been picked up ' \
          'by the carrier — typically within 24 hours of order ' \
          'placement.'
      }
    ].freeze

    # Returns the number of entries written. Batched-encode the
    # canonical prompts in a single informers call so we pay the model
    # load once and amortise the tokenisation overhead across the row
    # set — useful on Ruby because the per-call dispatch cost is
    # higher than the equivalent in Python or Node.
    def self.seed(cache, embedder, tenant: 'acme', locale: 'en',
                  model_version: 'gpt-4.5-2026')
      prompts = SEED_ENTRIES.map { |e| e[:prompt] }
      vectors = embedder.encode_many(prompts)
      SEED_ENTRIES.each_with_index do |entry, i|
        cache.put(
          prompt: entry[:prompt],
          response: entry[:response],
          embedding: vectors[i],
          tenant: tenant,
          locale: locale,
          model_version: model_version
        )
      end
      SEED_ENTRIES.length
    end
  end
end
