// Deterministic mock LLM for the semantic-cache demo.
//
// The point of a semantic cache is to *skip* an LLM call when a prior
// answer is reusable. To make that visible in a docs demo we need an
// LLM stand-in that:
//
//   - takes long enough that the saved time on a cache hit is obvious
//     (real-world model calls are 500 ms to several seconds);
//   - responds deterministically so a given prompt always produces the
//     same answer, which keeps the demo reproducible;
//   - exposes an estimated token count so the demo can show the
//     saving in "tokens not spent" terms alongside latency;
//   - needs no API keys, no network, no extra dependencies.
//
// It is keyword-matched against a small lookup table of FAQ-style
// answers for a fictional online retailer. Anything that doesn't
// match falls back to a generic templated reply. The `LatencyMs`
// field is the simulated round trip; the default (1500 ms) is in the
// neighbourhood of a real GPT-class model on a moderately-sized
// prompt.

package main

import (
	"strings"
	"sync/atomic"
	"time"
)

type knowledgeEntry struct {
	keywords []string
	answer   string
}

var knowledge = []knowledgeEntry{
	{
		keywords: []string{"return", "refund", "exchange"},
		answer: "You can return any unworn item within 30 days of delivery for a " +
			"full refund. Start a return from your order page; we email a " +
			"prepaid label and refund the original payment method within " +
			"five business days of receiving the item.",
	},
	{
		keywords: []string{"shipping", "delivery", "arrive", "ship"},
		answer: "Standard shipping is free on orders over $50 and arrives in " +
			"three to five business days. Expedited two-day shipping is " +
			"$9.99 and is available at checkout for in-stock items.",
	},
	{
		keywords: []string{"size", "sizing", "fit"},
		answer: "We follow standard US sizing. For most styles we recommend " +
			"ordering your usual size; the product page includes a sizing " +
			"chart and customer fit notes for items that run small or large.",
	},
	{
		keywords: []string{"warranty", "guarantee", "defect", "broken"},
		answer: "All gear is covered by a one-year manufacturer warranty against " +
			"defects in materials or workmanship. Email support with your " +
			"order number and a photo of the issue and we will replace the " +
			"item or issue a refund.",
	},
	{
		keywords: []string{"contact", "support", "help", "agent"},
		answer: "You can reach our support team by email at help@example.com or " +
			"by live chat from the help centre, 9am to 9pm Eastern, seven " +
			"days a week. Most tickets get a first reply within two hours.",
	},
	{
		keywords: []string{"track", "tracking", "order", "where"},
		answer: "Your tracking number is on the order confirmation email and on " +
			"the order detail page once the package has been picked up by " +
			"the carrier — typically within 24 hours of order placement.",
	},
	{
		keywords: []string{"cancel", "modify", "change"},
		answer: "Orders can be cancelled or modified for up to one hour after " +
			"placement. After that the order has usually entered our " +
			"warehouse system; the fastest path is to accept delivery and " +
			"start a return for any unwanted items.",
	},
	{
		keywords: []string{"discount", "coupon", "promo", "code"},
		answer: "Active promotional codes are listed on the homepage banner. " +
			"Codes apply at checkout and cannot be combined; the system " +
			"automatically uses the larger of the two when more than one " +
			"would qualify.",
	},
}

const fallbackAnswer = "Thanks for the question. Our team would normally answer this " +
	"individually; in the meantime please check the help centre or " +
	"contact support@example.com for a faster response."

// estimateTokens is a rough English token estimate: ~4 characters per
// token. Real tokenizers (BPE, SentencePiece) vary slightly but this
// is close enough for "look how many tokens you saved" demo signage.
func estimateTokens(text string) int {
	if text == "" {
		return 0
	}
	if n := len(text) / 4; n > 1 {
		return n
	}
	return 1
}

func answerFor(prompt string) string {
	lower := strings.ToLower(prompt)
	for _, row := range knowledge {
		for _, k := range row.keywords {
			if strings.Contains(lower, k) {
				return row.answer
			}
		}
	}
	return fallbackAnswer
}

// LLMResponse captures everything the demo UI wants to show about a
// mock LLM call. `LatencyMs` is the actual measured wall-clock
// duration, not the configured target, in case scheduling jitter
// pushes us a few milliseconds over.
type LLMResponse struct {
	Response         string
	ModelVersion     string
	LatencyMs        float64
	PromptTokens     int
	CompletionTokens int
}

// TotalTokens is the convenience sum the demo panel uses.
func (r LLMResponse) TotalTokens() int {
	return r.PromptTokens + r.CompletionTokens
}

// MockLLM stands in for a real model client.
type MockLLM struct {
	ModelVersion string
	LatencyMs    float64
	callCount    atomic.Int64
}

// NewMockLLM returns a MockLLM configured with sensible defaults. Pass
// 0 for `latencyMs` to use the 1500 ms default; any other non-negative
// value overrides it (including very small values for tests).
func NewMockLLM(modelVersion string, latencyMs float64) *MockLLM {
	if modelVersion == "" {
		modelVersion = "gpt-4.5-2026"
	}
	if latencyMs <= 0 {
		latencyMs = 1500
	}
	return &MockLLM{ModelVersion: modelVersion, LatencyMs: latencyMs}
}

// CallCount is the number of times Complete has been invoked. Useful
// for tests that assert the cache really skipped the LLM on a hit.
func (m *MockLLM) CallCount() int64 {
	return m.callCount.Load()
}

// Complete pretends to call an LLM. Sleeps first so the latency is
// realistic regardless of which branch generates the text, then
// keyword-matches a templated answer.
func (m *MockLLM) Complete(prompt string) LLMResponse {
	m.callCount.Add(1)
	start := time.Now()
	time.Sleep(time.Duration(m.LatencyMs * float64(time.Millisecond)))
	resp := answerFor(prompt)
	elapsedMs := float64(time.Since(start)) / float64(time.Millisecond)
	return LLMResponse{
		Response:         resp,
		ModelVersion:     m.ModelVersion,
		LatencyMs:        elapsedMs,
		PromptTokens:     estimateTokens(prompt),
		CompletionTokens: estimateTokens(resp),
	}
}
