//! Deterministic mock LLM for the semantic-cache demo.
//!
//! The point of a semantic cache is to *skip* an LLM call when a prior
//! answer is reusable. To make that visible in a docs demo we need an
//! LLM stand-in that:
//!
//!   - takes long enough that the saved time on a cache hit is obvious
//!     (real-world model calls are 500 ms to several seconds);
//!   - responds deterministically so a given prompt always produces the
//!     same answer, which keeps the demo reproducible;
//!   - exposes an estimated token count so the demo can show the
//!     saving in "tokens not spent" terms alongside latency;
//!   - needs no API keys, no network, no extra dependencies.
//!
//! It is keyword-matched against a small lookup table of FAQ-style
//! answers for a fictional online retailer. Anything that doesn't
//! match falls back to a generic templated reply. The `latency_ms`
//! field is the simulated round trip; the default (1500 ms) is in the
//! neighbourhood of a real GPT-class model on a moderately-sized
//! prompt.

use std::sync::atomic::{AtomicI64, Ordering};
use std::thread;
use std::time::{Duration, Instant};

struct KnowledgeEntry {
    keywords: &'static [&'static str],
    answer: &'static str,
}

const KNOWLEDGE: &[KnowledgeEntry] = &[
    KnowledgeEntry {
        keywords: &["return", "refund", "exchange"],
        answer: "You can return any unworn item within 30 days of delivery for a \
                 full refund. Start a return from your order page; we email a \
                 prepaid label and refund the original payment method within \
                 five business days of receiving the item.",
    },
    KnowledgeEntry {
        keywords: &["shipping", "delivery", "arrive", "ship"],
        answer: "Standard shipping is free on orders over $50 and arrives in \
                 three to five business days. Expedited two-day shipping is \
                 $9.99 and is available at checkout for in-stock items.",
    },
    KnowledgeEntry {
        keywords: &["size", "sizing", "fit"],
        answer: "We follow standard US sizing. For most styles we recommend \
                 ordering your usual size; the product page includes a sizing \
                 chart and customer fit notes for items that run small or large.",
    },
    KnowledgeEntry {
        keywords: &["warranty", "guarantee", "defect", "broken"],
        answer: "All gear is covered by a one-year manufacturer warranty against \
                 defects in materials or workmanship. Email support with your \
                 order number and a photo of the issue and we will replace the \
                 item or issue a refund.",
    },
    KnowledgeEntry {
        keywords: &["contact", "support", "help", "agent"],
        answer: "You can reach our support team by email at help@example.com or \
                 by live chat from the help centre, 9am to 9pm Eastern, seven \
                 days a week. Most tickets get a first reply within two hours.",
    },
    KnowledgeEntry {
        keywords: &["track", "tracking", "order", "where"],
        answer: "Your tracking number is on the order confirmation email and on \
                 the order detail page once the package has been picked up by \
                 the carrier — typically within 24 hours of order placement.",
    },
    KnowledgeEntry {
        keywords: &["cancel", "modify", "change"],
        answer: "Orders can be cancelled or modified for up to one hour after \
                 placement. After that the order has usually entered our \
                 warehouse system; the fastest path is to accept delivery and \
                 start a return for any unwanted items.",
    },
    KnowledgeEntry {
        keywords: &["discount", "coupon", "promo", "code"],
        answer: "Active promotional codes are listed on the homepage banner. \
                 Codes apply at checkout and cannot be combined; the system \
                 automatically uses the larger of the two when more than one \
                 would qualify.",
    },
];

const FALLBACK_ANSWER: &str =
    "Thanks for the question. Our team would normally answer this \
     individually; in the meantime please check the help centre or \
     contact support@example.com for a faster response.";

/// Rough English token estimate: ~4 characters per token. Real
/// tokenizers (BPE, SentencePiece) vary slightly but this is close
/// enough for "look how many tokens you saved" demo signage.
pub fn estimate_tokens(text: &str) -> i64 {
    if text.is_empty() {
        return 0;
    }
    let n = (text.len() / 4) as i64;
    if n > 1 {
        n
    } else {
        1
    }
}

fn answer_for(prompt: &str) -> &'static str {
    let lower = prompt.to_lowercase();
    for row in KNOWLEDGE {
        for kw in row.keywords {
            if lower.contains(kw) {
                return row.answer;
            }
        }
    }
    FALLBACK_ANSWER
}

// The unused fields and methods on this type are intentional: this
// docs example mirrors the Python / Node / Go / Jedis demos and
// exposes the same public surface (`model_version`, `latency_ms`,
// `total_tokens()`, `call_count()`) so a reader copying the example
// into their own project doesn't have to add fields back to match
// the prose in `_index.md`. The demo HTTP layer only reads
// `response` and `latency_ms`, hence the dead-code warnings.
#[allow(dead_code)]
pub struct LlmResponse {
    pub response: String,
    pub model_version: String,
    pub latency_ms: f64,
    pub prompt_tokens: i64,
    pub completion_tokens: i64,
}

impl LlmResponse {
    #[allow(dead_code)]
    pub fn total_tokens(&self) -> i64 {
        self.prompt_tokens + self.completion_tokens
    }
}

pub struct MockLlm {
    pub model_version: String,
    pub latency_ms: f64,
    call_count: AtomicI64,
}

impl MockLlm {
    pub fn new(model_version: Option<&str>, latency_ms: f64) -> Self {
        let model_version = model_version
            .filter(|s| !s.is_empty())
            .unwrap_or("gpt-4.5-2026")
            .to_string();
        let latency_ms = if latency_ms <= 0.0 { 1500.0 } else { latency_ms };
        Self {
            model_version,
            latency_ms,
            call_count: AtomicI64::new(0),
        }
    }

    #[allow(dead_code)]
    pub fn call_count(&self) -> i64 {
        self.call_count.load(Ordering::Relaxed)
    }

    /// Pretend to call an LLM. Sleeps first so the latency is
    /// realistic regardless of which branch generates the text, then
    /// keyword-matches a templated answer.
    pub fn complete(&self, prompt: &str) -> LlmResponse {
        self.call_count.fetch_add(1, Ordering::Relaxed);
        let start = Instant::now();
        thread::sleep(Duration::from_micros((self.latency_ms * 1000.0) as u64));
        let resp = answer_for(prompt);
        let elapsed_ms = (start.elapsed().as_micros() as f64) / 1000.0;
        LlmResponse {
            response: resp.to_string(),
            model_version: self.model_version.clone(),
            latency_ms: elapsed_ms,
            prompt_tokens: estimate_tokens(prompt),
            completion_tokens: estimate_tokens(resp),
        }
    }
}
