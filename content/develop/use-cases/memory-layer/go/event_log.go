// Append-only event log for an agent thread, backed by a Redis
// Stream.
//
// Each thread gets a stream at `agent:events:{ThreadID}`. Every
// action the agent takes (a user turn arriving, a memory being
// recalled, a memory being written, a tool being called) is one
// `XADD` to that stream. Replay with `XREVRANGE` for the most recent
// N events; bound retention with `XTRIM MAXLEN ~` so the log stays
// cheap regardless of how long the thread has been running.
//
// The stream is independent of the session hash and the long-term
// memory store: it answers the "what just happened" question without
// competing with either of those for indexing or memory budget.
// Consumer groups (not used in this demo) would let downstream
// workers — summarisers, consolidators, audit pipelines — replay the
// log without losing position.

package main

import (
	"context"
	"fmt"
	"strconv"

	"github.com/redis/go-redis/v9"
)

// DefaultMaxLen is the approximate cap on stream length. `MAXLEN ~`
// lets Redis trim in whole-node units instead of exactly-N units,
// which is much cheaper at the cost of overshooting the bound by up
// to a node's worth.
const DefaultMaxLen = 1000

// AgentEvent is a single entry from the per-thread event stream.
type AgentEvent struct {
	EventID  string  `json:"event_id"`
	ThreadID string  `json:"thread_id"`
	Action   string  `json:"action"`
	Detail   string  `json:"detail"`
	TS       float64 `json:"ts"`
}

// AgentEventLog appends, replays, and bounds the per-thread event
// stream.
type AgentEventLog struct {
	Client    *redis.Client
	KeyPrefix string
	MaxLen    int64
}

// NewAgentEventLog returns an event log helper with the supplied
// client. Pass zero values for any field to use the defaults
// (agent:events: / 1000).
func NewAgentEventLog(client *redis.Client, keyPrefix string, maxLen int64) *AgentEventLog {
	if keyPrefix == "" {
		keyPrefix = "agent:events:"
	}
	if maxLen <= 0 {
		maxLen = DefaultMaxLen
	}
	return &AgentEventLog{
		Client:    client,
		KeyPrefix: keyPrefix,
		MaxLen:    maxLen,
	}
}

// StreamKey returns the Redis key for a thread id.
func (l *AgentEventLog) StreamKey(threadID string) string {
	return l.KeyPrefix + threadID
}

// Record appends one event and returns its stream id.
//
// `MAXLEN ~ N` (`Approx: true` on `XAddArgs`) keeps the stream
// bounded with near-zero overhead; an exact bound forces a scan and
// is rarely worth the cost.
func (l *AgentEventLog) Record(ctx context.Context, threadID, action, detail string) (string, error) {
	id, err := l.Client.XAdd(ctx, &redis.XAddArgs{
		Stream: l.StreamKey(threadID),
		MaxLen: l.MaxLen,
		Approx: true,
		Values: map[string]any{
			"action": action,
			"detail": detail,
			"ts":     strconv.FormatFloat(unixSecs(), 'f', -1, 64),
		},
	}).Result()
	if err != nil {
		return "", fmt.Errorf("XADD: %w", err)
	}
	return id, nil
}

// Recent returns the most recent events, newest first.
func (l *AgentEventLog) Recent(ctx context.Context, threadID string, count int64) ([]AgentEvent, error) {
	rows, err := l.Client.XRevRangeN(ctx, l.StreamKey(threadID), "+", "-", count).Result()
	if err != nil {
		return nil, fmt.Errorf("XREVRANGE: %w", err)
	}
	out := make([]AgentEvent, 0, len(rows))
	for _, row := range rows {
		action, _ := row.Values["action"].(string)
		detail, _ := row.Values["detail"].(string)
		tsStr, _ := row.Values["ts"].(string)
		ts, _ := strconv.ParseFloat(tsStr, 64)
		out = append(out, AgentEvent{
			EventID:  row.ID,
			ThreadID: threadID,
			Action:   action,
			Detail:   detail,
			TS:       ts,
		})
	}
	return out, nil
}

// Clear drops the entire stream for a thread.
func (l *AgentEventLog) Clear(ctx context.Context, threadID string) (bool, error) {
	n, err := l.Client.Del(ctx, l.StreamKey(threadID)).Result()
	if err != nil {
		return false, fmt.Errorf("DEL: %w", err)
	}
	return n > 0, nil
}
