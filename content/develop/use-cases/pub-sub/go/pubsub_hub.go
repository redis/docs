// Package pubsub provides a Redis-backed pub/sub hub helper.
//
// The helper wraps PUBLISH / SUBSCRIBE / PSUBSCRIBE plus the introspection
// commands (PUBSUB CHANNELS, PUBSUB NUMSUB, PUBSUB NUMPAT) into a small,
// named API that:
//
//   - publishes JSON-encoded messages to a channel and counts how many
//     subscribers Redis reported delivering to
//   - creates named in-process subscribers that own a *redis.PubSub object
//     and a background dispatch goroutine, with a buffered ring of recent
//     messages for the demo UI
//   - tracks per-channel publish counters and per-subscriber received
//     counts for the demo UI
//
// Pub/sub has at-most-once delivery: a message that arrives while a
// subscriber is disconnected is gone. If you need persistence or replay,
// use Redis Streams instead.
package pubsub

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"sync"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"
)

// errEmptyTargets is returned when a subscription is registered with
// no channels or patterns.
var errEmptyTargets = errors.New("subscription requires at least one channel or pattern")

// errDuplicateName returns the "already exists" error used by Subscribe
// and PSubscribe.
func errDuplicateName(name string) error {
	return fmt.Errorf("subscription named %q already exists", name)
}

// ReceivedMessage is the wire shape of a delivered pub/sub message.
//
// Pattern subscriptions carry the matching pattern in Pattern (as a
// non-nil *string); exact-match subscriptions leave it nil so the JSON
// shape is `"pattern": null` — the demo UI uses this to label messages
// delivered via PSUBSCRIBE.
type ReceivedMessage struct {
	Channel      string      `json:"channel"`
	Pattern      *string     `json:"pattern"`
	Payload      interface{} `json:"payload"`
	ReceivedAtMs int64       `json:"received_at_ms"`
}

// Stats is the snapshot returned by RedisPubSubHub.Stats().
type Stats struct {
	PublishedTotal       int64          `json:"published_total"`
	DeliveredTotal       int64          `json:"delivered_total"`
	ReceivedTotal        int64          `json:"received_total"`
	ActiveSubscriptions  int            `json:"active_subscriptions"`
	ChannelPublished     map[string]int `json:"channel_published"`
	PatternSubscriptions int64          `json:"pattern_subscriptions"`
}

// Subscription is a named in-process subscriber bound to one or more
// channels or patterns. Each Subscription owns its own *redis.PubSub
// object (and therefore its own Redis connection) and a background
// goroutine that pumps incoming messages into a bounded ring buffer.
//
// Subscriptions are independent: closing one does not affect another,
// even if they share channels.
type Subscription struct {
	name      string
	hub       *RedisPubSubHub
	targets   []string
	isPattern bool

	pubsub *redis.PubSub
	ch     <-chan *redis.Message

	mu       sync.Mutex
	buffer   []*ReceivedMessage // newest first, capped at bufferSize
	bufSize  int
	received int64

	closed atomic.Bool
	done   chan struct{}

	ctx    context.Context
	cancel context.CancelFunc
}

// Name returns the subscription's registered name.
func (s *Subscription) Name() string { return s.name }

// Targets returns a copy of the subscription's channel or pattern list.
func (s *Subscription) Targets() []string {
	out := make([]string, len(s.targets))
	copy(out, s.targets)
	return out
}

// IsPattern reports whether the subscription was registered via
// PSUBSCRIBE rather than SUBSCRIBE.
func (s *Subscription) IsPattern() bool { return s.isPattern }

// ReceivedTotal returns the cumulative count of messages this
// subscription has received since it was created (or since the last
// ResetReceived).
func (s *Subscription) ReceivedTotal() int64 {
	return atomic.LoadInt64(&s.received)
}

// Messages returns the most recent messages, newest first. If limit is
// positive, the slice is truncated to that length.
func (s *Subscription) Messages(limit int) []ReceivedMessage {
	s.mu.Lock()
	defer s.mu.Unlock()
	n := len(s.buffer)
	if limit > 0 && n > limit {
		n = limit
	}
	out := make([]ReceivedMessage, n)
	for i := 0; i < n; i++ {
		out[i] = *s.buffer[i]
	}
	return out
}

// ResetReceived clears the buffer and zeroes the cumulative counter.
func (s *Subscription) ResetReceived() {
	s.mu.Lock()
	s.buffer = s.buffer[:0]
	s.mu.Unlock()
	atomic.StoreInt64(&s.received, 0)
}

// Close stops the dispatch goroutine and releases the underlying Redis
// connection. Safe to call more than once.
func (s *Subscription) Close() {
	if !s.closed.CompareAndSwap(false, true) {
		return
	}
	s.cancel()
	// Closing the PubSub closes its message channel, which lets the
	// dispatch goroutine exit cleanly.
	_ = s.pubsub.Close()
	<-s.done
}

// IsAlive reports whether the dispatch goroutine is still running.
func (s *Subscription) IsAlive() bool {
	return !s.closed.Load()
}

// run is the dispatch goroutine. It reads from the *redis.PubSub
// channel, wraps each message as a ReceivedMessage, and appends it to
// the head of the ring buffer.
func (s *Subscription) run() {
	defer close(s.done)
	for msg := range s.ch {
		s.dispatch(msg)
	}
}

func (s *Subscription) dispatch(msg *redis.Message) {
	var pattern *string
	if msg.Pattern != "" {
		p := msg.Pattern
		pattern = &p
	}
	// Try to decode the payload as JSON so the UI sees structured data;
	// fall back to the raw string if it doesn't parse.
	var payload interface{}
	if err := json.Unmarshal([]byte(msg.Payload), &payload); err != nil {
		payload = msg.Payload
	}
	wrapped := &ReceivedMessage{
		Channel:      msg.Channel,
		Pattern:      pattern,
		Payload:      payload,
		ReceivedAtMs: time.Now().UnixMilli(),
	}

	s.mu.Lock()
	// Prepend so the newest message is at index 0.
	if len(s.buffer) >= s.bufSize {
		s.buffer = s.buffer[:s.bufSize-1]
	}
	s.buffer = append([]*ReceivedMessage{wrapped}, s.buffer...)
	s.mu.Unlock()
	atomic.AddInt64(&s.received, 1)
}

// RedisPubSubHub is the top-level helper. Construct one per process and
// register subscriptions through it; the hub owns the per-channel
// publish counters and the registry of live subscriptions.
type RedisPubSubHub struct {
	client     *redis.Client
	bufferSize int

	subsMu        sync.Mutex
	subscriptions map[string]*Subscription

	statsMu          sync.Mutex
	publishedTotal   int64
	deliveredTotal   int64
	channelPublished map[string]int
}

// NewRedisPubSubHub creates a hub that uses client for every PUBLISH /
// SUBSCRIBE / PSUBSCRIBE call. Each Subscription will hold its own
// *redis.PubSub object (and therefore its own connection from the
// client's pool), so the client must be configured with enough pool
// capacity for the expected subscriber count.
//
// bufferSize caps the per-subscriber recent-message buffer; 50 is a
// reasonable default for the demo UI.
func NewRedisPubSubHub(client *redis.Client, bufferSize int) *RedisPubSubHub {
	if bufferSize <= 0 {
		bufferSize = 50
	}
	return &RedisPubSubHub{
		client:           client,
		bufferSize:       bufferSize,
		subscriptions:    make(map[string]*Subscription),
		channelPublished: make(map[string]int),
	}
}

// Publish JSON-encodes message and PUBLISHes it to channel. The
// returned integer is the count Redis itself reported — the number of
// clients that were subscribed (directly or via pattern) at the moment
// the message was fanned out.
func (h *RedisPubSubHub) Publish(ctx context.Context, channel string, message interface{}) (int64, error) {
	payload, err := json.Marshal(message)
	if err != nil {
		return 0, err
	}
	delivered, err := h.client.Publish(ctx, channel, payload).Result()
	if err != nil {
		return 0, err
	}
	h.statsMu.Lock()
	h.publishedTotal++
	h.deliveredTotal += delivered
	h.channelPublished[channel]++
	h.statsMu.Unlock()
	return delivered, nil
}

// Subscribe registers a named exact-match subscription on one or more
// channels. Returns an error if a subscription with the same name
// already exists, or if the SUBSCRIBE call fails.
func (h *RedisPubSubHub) Subscribe(ctx context.Context, name string, channels []string) (*Subscription, error) {
	return h.register(ctx, name, channels, false)
}

// PSubscribe registers a named pattern subscription on one or more
// glob patterns. Patterns are matched server-side using Redis glob
// syntax (`*`, `?`, `[abc]`).
func (h *RedisPubSubHub) PSubscribe(ctx context.Context, name string, patterns []string) (*Subscription, error) {
	return h.register(ctx, name, patterns, true)
}

func (h *RedisPubSubHub) register(ctx context.Context, name string, targets []string, isPattern bool) (*Subscription, error) {
	if len(targets) == 0 {
		return nil, errEmptyTargets
	}
	h.subsMu.Lock()
	if _, exists := h.subscriptions[name]; exists {
		h.subsMu.Unlock()
		return nil, errDuplicateName(name)
	}

	// Open the subscription before adding it to the registry so an
	// error from go-redis leaves the registry untouched.
	var ps *redis.PubSub
	if isPattern {
		ps = h.client.PSubscribe(ctx, targets...)
	} else {
		ps = h.client.Subscribe(ctx, targets...)
	}

	subCtx, cancel := context.WithCancel(context.Background())
	sub := &Subscription{
		name:      name,
		hub:       h,
		targets:   append([]string(nil), targets...),
		isPattern: isPattern,
		pubsub:    ps,
		ch:        ps.Channel(),
		bufSize:   h.bufferSize,
		done:      make(chan struct{}),
		ctx:       subCtx,
		cancel:    cancel,
	}
	h.subscriptions[name] = sub
	h.subsMu.Unlock()

	go sub.run()
	return sub, nil
}

// Unsubscribe closes and removes the named subscription. Returns true
// if a subscription with that name was registered.
func (h *RedisPubSubHub) Unsubscribe(name string) bool {
	h.subsMu.Lock()
	sub, ok := h.subscriptions[name]
	if ok {
		delete(h.subscriptions, name)
	}
	h.subsMu.Unlock()
	if !ok {
		return false
	}
	sub.Close()
	return true
}

// Subscriptions returns a snapshot of every currently-registered
// subscription in insertion order... well, in map iteration order
// sorted by name so the UI is stable.
func (h *RedisPubSubHub) Subscriptions() []*Subscription {
	h.subsMu.Lock()
	defer h.subsMu.Unlock()
	out := make([]*Subscription, 0, len(h.subscriptions))
	for _, sub := range h.subscriptions {
		out = append(out, sub)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].name < out[j].name })
	return out
}

// GetSubscription returns the named subscription, or nil if none is
// registered with that name.
func (h *RedisPubSubHub) GetSubscription(name string) *Subscription {
	h.subsMu.Lock()
	defer h.subsMu.Unlock()
	return h.subscriptions[name]
}

// ActiveChannels lists server-side channels with at least one
// exact-match subscriber (PUBSUB CHANNELS). Pattern subscribers do not
// appear in this list — they are counted separately via
// PatternSubscriberCount.
func (h *RedisPubSubHub) ActiveChannels(ctx context.Context, pattern string) ([]string, error) {
	if pattern == "" {
		pattern = "*"
	}
	channels, err := h.client.PubSubChannels(ctx, pattern).Result()
	if err != nil {
		return nil, err
	}
	sort.Strings(channels)
	return channels, nil
}

// ChannelSubscriberCounts counts subscribers per channel (PUBSUB NUMSUB).
//
// Reports only exact-match subscriptions — pattern subscribers are
// counted separately via PatternSubscriberCount.
func (h *RedisPubSubHub) ChannelSubscriberCounts(ctx context.Context, channels []string) (map[string]int64, error) {
	if len(channels) == 0 {
		return map[string]int64{}, nil
	}
	return h.client.PubSubNumSub(ctx, channels...).Result()
}

// PatternSubscriberCount returns the total active pattern
// subscriptions across all clients (PUBSUB NUMPAT).
func (h *RedisPubSubHub) PatternSubscriberCount(ctx context.Context) (int64, error) {
	return h.client.PubSubNumPat(ctx).Result()
}

// Stats reports a snapshot of publish and receive counters plus the
// current registry size.
//
// DeliveredTotal is what Redis itself counted (the sum of PUBLISH
// return values); ReceivedTotal is what this process's in-memory
// subscribers saw. In a single-process demo they should track each
// other closely.
func (h *RedisPubSubHub) Stats(ctx context.Context) Stats {
	h.statsMu.Lock()
	published := h.publishedTotal
	delivered := h.deliveredTotal
	perChannel := make(map[string]int, len(h.channelPublished))
	for k, v := range h.channelPublished {
		perChannel[k] = v
	}
	h.statsMu.Unlock()

	subs := h.Subscriptions()
	var received int64
	for _, sub := range subs {
		received += sub.ReceivedTotal()
	}
	patternSubs, err := h.PatternSubscriberCount(ctx)
	if err != nil {
		patternSubs = 0
	}
	return Stats{
		PublishedTotal:       published,
		DeliveredTotal:       delivered,
		ReceivedTotal:        received,
		ActiveSubscriptions:  len(subs),
		ChannelPublished:     perChannel,
		PatternSubscriptions: patternSubs,
	}
}

// ResetStats zeroes the publish counters and each subscription's
// received counter and buffer.
func (h *RedisPubSubHub) ResetStats() {
	h.statsMu.Lock()
	h.publishedTotal = 0
	h.deliveredTotal = 0
	h.channelPublished = make(map[string]int)
	h.statsMu.Unlock()
	for _, sub := range h.Subscriptions() {
		sub.ResetReceived()
	}
}

// Shutdown closes every active subscription. Safe to call more than once.
func (h *RedisPubSubHub) Shutdown() {
	h.subsMu.Lock()
	subs := make([]*Subscription, 0, len(h.subscriptions))
	for _, sub := range h.subscriptions {
		subs = append(subs, sub)
	}
	h.subscriptions = make(map[string]*Subscription)
	h.subsMu.Unlock()
	for _, sub := range subs {
		sub.Close()
	}
}
