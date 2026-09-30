// Working-memory store for an agent session, backed by a Redis Hash.
//
// Each session is one Hash document at `agent:session:{ThreadID}`.
// The hash holds the running scratchpad, the current goal, a rolling
// window of recent turns (serialised as a JSON list to fit in one
// field), and a few audit fields. One `HGETALL` returns the whole
// session in a single round trip on every step of the agent loop.
//
// Every write refreshes the key's TTL with `EXPIRE`, so idle sessions
// fall off without a separate cleanup job and active sessions stay
// alive as long as the agent keeps touching them. A separate
// `LongTermMemory` is what survives beyond a session's TTL.
//
// The turn window is bounded to `MaxTurns` in application code; the
// hash itself doesn't grow, so the working set per thread stays
// constant regardless of how long the agent has been running.

package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// DefaultMaxTurns is how many recent turns to keep inline on the
// session hash. Older turns flow through the event log
// (AgentEventLog) and the long-term memory store (LongTermMemory).
const DefaultMaxTurns = 20

// SessionTurn is a single role/content/timestamp triple inside the
// rolling session window.
type SessionTurn struct {
	Role    string  `json:"role"`
	Content string  `json:"content"`
	TS      float64 `json:"ts"`
}

// SessionState is the full per-thread working-memory state.
type SessionState struct {
	ThreadID     string        `json:"thread_id"`
	User         string        `json:"user"`
	Agent        string        `json:"agent"`
	Goal         string        `json:"goal"`
	Scratchpad   string        `json:"scratchpad"`
	TurnCount    int           `json:"turn_count"`
	CreatedTS    float64       `json:"created_ts"`
	LastActiveTS float64       `json:"last_active_ts"`
	RecentTurns  []SessionTurn `json:"recent_turns"`
	TTLSeconds   int           `json:"ttl_seconds"`
}

// AgentSession owns the working-memory Hash and the rolling turn
// window for a single agent thread.
type AgentSession struct {
	Client            *redis.Client
	KeyPrefix         string
	DefaultTTLSeconds int
	MaxTurns          int
}

// NewAgentSession returns a session helper with the supplied client.
// Pass zero values for any field to use the defaults
// (agent:session: / 3600 / 20).
func NewAgentSession(
	client *redis.Client,
	keyPrefix string,
	defaultTTLSeconds int,
	maxTurns int,
) *AgentSession {
	if keyPrefix == "" {
		keyPrefix = "agent:session:"
	}
	if defaultTTLSeconds <= 0 {
		defaultTTLSeconds = 3600
	}
	if maxTurns <= 0 {
		maxTurns = DefaultMaxTurns
	}
	return &AgentSession{
		Client:            client,
		KeyPrefix:         keyPrefix,
		DefaultTTLSeconds: defaultTTLSeconds,
		MaxTurns:          maxTurns,
	}
}

// SessionKey returns the Redis key for a thread id.
func (s *AgentSession) SessionKey(threadID string) string {
	return s.KeyPrefix + threadID
}

// NewThreadID returns a random 12-hex-character id, matching the
// shape the Python, Node, .NET, and Rust helpers produce.
func (s *AgentSession) NewThreadID() string {
	id, err := newThreadID()
	if err != nil {
		// crypto/rand failing is a kernel-level problem we can't
		// gracefully recover from inside a demo; surface a panic so
		// the operator sees what's wrong rather than handing back an
		// empty string that would silently collide with other
		// threads.
		panic(fmt.Errorf("generating thread id: %w", err))
	}
	return id
}

// StartParams collects the optional fields for `Start`. Using a
// struct keeps the call site readable when only a couple of fields
// are set.
type StartParams struct {
	User       string
	Agent      string
	Goal       string
	TTLSeconds int // 0 => use DefaultTTLSeconds
}

// Start creates a fresh working memory for a thread. Overwrites any
// existing session at the same key. The agent normally calls this
// once per thread at the first turn and relies on `Load` /
// `AppendTurn` for subsequent steps.
func (s *AgentSession) Start(
	ctx context.Context,
	threadID string,
	p StartParams,
) (*SessionState, error) {
	user := p.User
	if user == "" {
		user = "default"
	}
	agent := p.Agent
	if agent == "" {
		agent = "default"
	}
	ttl := p.TTLSeconds
	if ttl <= 0 {
		ttl = s.DefaultTTLSeconds
	}
	now := unixSecs()
	state := &SessionState{
		ThreadID:     threadID,
		User:         user,
		Agent:        agent,
		Goal:         p.Goal,
		Scratchpad:   "",
		TurnCount:    0,
		CreatedTS:    now,
		LastActiveTS: now,
		RecentTurns:  []SessionTurn{},
		TTLSeconds:   ttl,
	}
	if err := s.write(ctx, state, ttl); err != nil {
		return nil, err
	}
	return state, nil
}

// Load returns the session state, or `nil` if it has expired.
func (s *AgentSession) Load(ctx context.Context, threadID string) (*SessionState, error) {
	key := s.SessionKey(threadID)
	raw, err := s.Client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("HGETALL: %w", err)
	}
	if len(raw) == 0 {
		return nil, nil
	}
	ttl, _ := s.Client.TTL(ctx, key).Result()
	ttlSeconds := int(ttl / time.Second)
	if ttlSeconds < 0 {
		ttlSeconds = 0
	}
	var turns []SessionTurn
	if blob, ok := raw["recent_turns"]; ok && blob != "" {
		_ = json.Unmarshal([]byte(blob), &turns)
	}
	turnCount, _ := strconv.Atoi(raw["turn_count"])
	createdTS, _ := strconv.ParseFloat(raw["created_ts"], 64)
	lastActiveTS, _ := strconv.ParseFloat(raw["last_active_ts"], 64)
	return &SessionState{
		ThreadID:     threadID,
		User:         orDefault(raw["user"], "default"),
		Agent:        orDefault(raw["agent"], "default"),
		Goal:         raw["goal"],
		Scratchpad:   raw["scratchpad"],
		TurnCount:    turnCount,
		CreatedTS:    createdTS,
		LastActiveTS: lastActiveTS,
		RecentTurns:  turns,
		TTLSeconds:   ttlSeconds,
	}, nil
}

// AppendTurnParams collects the optional fields for `AppendTurn`.
type AppendTurnParams struct {
	Role string
	// Content is the turn text.
	Content string
	// User and Agent are only consulted when the session does not yet
	// exist — they seed the auto-created session so the
	// working-memory hash matches the user the caller is operating
	// against. On an existing session they're ignored; the original
	// `Start` values stand.
	User       string
	Agent      string
	TTLSeconds int // 0 => use DefaultTTLSeconds
}

// AppendTurn appends a turn, bounds the rolling window, and refreshes
// the TTL.
//
// Read-modify-write here is last-writer-wins on the turn list if two
// concurrent turns reach the same thread; the demo never triggers
// that race in practice (one browser, one turn at a time) but a
// multi-worker agent that shares a thread id would wrap this in
// `WATCH` / `MULTI` / `EXEC` or a Lua script that does the append
// atomically server-side.
func (s *AgentSession) AppendTurn(
	ctx context.Context,
	threadID string,
	p AppendTurnParams,
) (*SessionState, error) {
	state, err := s.Load(ctx, threadID)
	if err != nil {
		return nil, err
	}
	if state == nil {
		state, err = s.Start(ctx, threadID, StartParams{
			User:       p.User,
			Agent:      p.Agent,
			TTLSeconds: p.TTLSeconds,
		})
		if err != nil {
			return nil, err
		}
	}
	state.RecentTurns = append(state.RecentTurns, SessionTurn{
		Role:    p.Role,
		Content: p.Content,
		TS:      unixSecs(),
	})
	if len(state.RecentTurns) > s.MaxTurns {
		state.RecentTurns = state.RecentTurns[len(state.RecentTurns)-s.MaxTurns:]
	}
	state.TurnCount++
	state.LastActiveTS = unixSecs()
	ttl := p.TTLSeconds
	if ttl <= 0 {
		ttl = s.DefaultTTLSeconds
	}
	state.TTLSeconds = ttl
	if err := s.write(ctx, state, ttl); err != nil {
		return nil, err
	}
	return state, nil
}

// SetGoal updates the goal field without touching turns or the
// scratchpad. Creates the session if it doesn't exist yet — setting
// a goal on a fresh thread is a sensible first step in the agent
// loop, so this method covers both the "rename the goal mid-session"
// and the "start a thread with this goal" cases.
func (s *AgentSession) SetGoal(
	ctx context.Context,
	threadID, text string,
	p StartParams,
) (*SessionState, error) {
	state, err := s.Load(ctx, threadID)
	if err != nil {
		return nil, err
	}
	if state == nil {
		p.Goal = text
		return s.Start(ctx, threadID, p)
	}
	state.Goal = text
	state.LastActiveTS = unixSecs()
	ttl := p.TTLSeconds
	if ttl <= 0 {
		ttl = s.DefaultTTLSeconds
	}
	state.TTLSeconds = ttl
	if err := s.write(ctx, state, ttl); err != nil {
		return nil, err
	}
	return state, nil
}

// Delete drops the session immediately. Returns true if it existed.
func (s *AgentSession) Delete(ctx context.Context, threadID string) (bool, error) {
	n, err := s.Client.Del(ctx, s.SessionKey(threadID)).Result()
	if err != nil {
		return false, fmt.Errorf("DEL: %w", err)
	}
	return n > 0, nil
}

func (s *AgentSession) write(ctx context.Context, state *SessionState, ttl int) error {
	key := s.SessionKey(state.ThreadID)
	turnsBlob, err := json.Marshal(state.RecentTurns)
	if err != nil {
		return fmt.Errorf("marshalling recent_turns: %w", err)
	}
	mapping := map[string]any{
		"thread_id":      state.ThreadID,
		"user":           state.User,
		"agent":          state.Agent,
		"goal":           state.Goal,
		"scratchpad":     state.Scratchpad,
		"turn_count":     strconv.Itoa(state.TurnCount),
		"created_ts":     strconv.FormatFloat(state.CreatedTS, 'f', -1, 64),
		"last_active_ts": strconv.FormatFloat(state.LastActiveTS, 'f', -1, 64),
		"recent_turns":   string(turnsBlob),
	}
	// MULTI/EXEC so HSET and EXPIRE either both apply or neither
	// does. A connection drop between the two writes would otherwise
	// leave the session without a TTL.
	if _, err := s.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.HSet(ctx, key, mapping)
		pipe.Expire(ctx, key, time.Duration(ttl)*time.Second)
		return nil
	}); err != nil {
		return fmt.Errorf("session write MULTI/EXEC: %w", err)
	}
	return nil
}

func newThreadID() (string, error) {
	var b [6]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]), nil
}

func unixSecs() float64 {
	return float64(time.Now().UnixNano()) / 1e9
}

func orDefault(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}
