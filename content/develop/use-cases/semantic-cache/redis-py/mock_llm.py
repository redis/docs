"""
Deterministic mock LLM for the semantic-cache demo.

The point of a semantic cache is to *skip* an LLM call when a prior
answer is reusable. To make that visible in a docs demo we need an
LLM stand-in that:

* takes long enough that the saved time on a cache hit is obvious
  (real-world model calls are 500 ms to several seconds);
* responds deterministically so a given prompt always produces the
  same answer, which keeps the demo reproducible;
* exposes an estimated token count so the demo can show the saving in
  "tokens not spent" terms alongside latency;
* needs no API keys, no network, no extra dependencies.

It is keyword-matched against a small lookup table of FAQ-style
answers for a fictional online retailer. Anything that doesn't match
falls back to a generic templated reply. The `latency_ms` parameter
is the simulated round trip; the default (1500 ms) is in the
neighbourhood of a real GPT-class model on a moderately-sized prompt.
"""

from __future__ import annotations

import time
from dataclasses import dataclass


@dataclass
class LLMResponse:
    response: str
    model_version: str
    latency_ms: float
    prompt_tokens: int
    completion_tokens: int

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens

    def to_dict(self) -> dict:
        return {
            "response": self.response,
            "model_version": self.model_version,
            "latency_ms": round(self.latency_ms, 2),
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
        }


# A small FAQ table for a fictional online retailer. Each row is
# (keyword set, response). The keyword set is matched against the
# *prompt*, so a paraphrase like "How do I return an item?" and
# "What is your return policy?" both land on the same row — but the
# match is by surface form, not embedding, so the cache lookup is
# what makes paraphrase reuse work. The mock LLM itself only matches
# crude keyword overlap.
_KNOWLEDGE = [
    (
        {"return", "refund", "exchange"},
        "You can return any unworn item within 30 days of delivery for a "
        "full refund. Start a return from your order page; we email a "
        "prepaid label and refund the original payment method within "
        "five business days of receiving the item.",
    ),
    (
        {"shipping", "delivery", "arrive", "ship"},
        "Standard shipping is free on orders over $50 and arrives in "
        "three to five business days. Expedited two-day shipping is "
        "$9.99 and is available at checkout for in-stock items.",
    ),
    (
        {"size", "sizing", "fit"},
        "We follow standard US sizing. For most styles we recommend "
        "ordering your usual size; the product page includes a sizing "
        "chart and customer fit notes for items that run small or large.",
    ),
    (
        {"warranty", "guarantee", "defect", "broken"},
        "All gear is covered by a one-year manufacturer warranty against "
        "defects in materials or workmanship. Email support with your "
        "order number and a photo of the issue and we will replace the "
        "item or issue a refund.",
    ),
    (
        {"contact", "support", "help", "agent"},
        "You can reach our support team by email at help@example.com or "
        "by live chat from the help centre, 9am to 9pm Eastern, seven "
        "days a week. Most tickets get a first reply within two hours.",
    ),
    (
        {"track", "tracking", "order", "where"},
        "Your tracking number is on the order confirmation email and on "
        "the order detail page once the package has been picked up by "
        "the carrier — typically within 24 hours of order placement.",
    ),
    (
        {"cancel", "modify", "change"},
        "Orders can be cancelled or modified for up to one hour after "
        "placement. After that the order has usually entered our "
        "warehouse system; the fastest path is to accept delivery and "
        "start a return for any unwanted items.",
    ),
    (
        {"discount", "coupon", "promo", "code"},
        "Active promotional codes are listed on the homepage banner. "
        "Codes apply at checkout and cannot be combined; the system "
        "automatically uses the larger of the two when more than one "
        "would qualify.",
    ),
]


class MockLLM:
    """A deterministic, slow, no-network stand-in for a real model."""

    def __init__(
        self,
        model_version: str = "gpt-4.5-2026",
        latency_ms: float = 1500.0,
    ) -> None:
        self.model_version = model_version
        self.latency_ms = latency_ms
        self.call_count = 0

    def complete(self, prompt: str) -> LLMResponse:
        """Pretend to call a model. Sleeps, then returns a templated answer."""
        self.call_count += 1
        start = time.perf_counter()
        # Sleep first so the latency is realistic regardless of which
        # branch generates the text.
        time.sleep(self.latency_ms / 1000.0)
        response = self._answer_for(prompt)
        elapsed_ms = (time.perf_counter() - start) * 1000

        return LLMResponse(
            response=response,
            model_version=self.model_version,
            latency_ms=elapsed_ms,
            prompt_tokens=_estimate_tokens(prompt),
            completion_tokens=_estimate_tokens(response),
        )

    @staticmethod
    def _answer_for(prompt: str) -> str:
        lower = prompt.lower()
        for keywords, answer in _KNOWLEDGE:
            if any(kw in lower for kw in keywords):
                return answer
        # Generic fallback — keeps the demo working for queries that
        # don't match any FAQ keyword.
        return (
            "Thanks for the question. Our team would normally answer this "
            "individually; in the meantime please check the help centre "
            "or contact support@example.com for a faster response."
        )


def _estimate_tokens(text: str) -> int:
    """Rough English token estimate: ~4 characters per token.

    Real tokenizers (BPE, SentencePiece) vary slightly but this is
    close enough for "look how many tokens you saved" demo signage.
    """
    if not text:
        return 0
    return max(1, len(text) // 4)
