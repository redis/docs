// Package streaming provides a Redis event-stream helper backed by a
// single Redis Stream.
//
// Producers append events with XADD. Consumers belong to consumer
// groups and read with XREADGROUP. The group as a whole tracks a
// single last-delivered-id cursor, and each consumer gets its own
// pending-entries list (PEL) of in-flight messages it has been handed.
// Once a consumer has processed an entry it acknowledges it with XACK;
// entries left unacknowledged past an idle threshold can be swept to a
// healthy consumer with XAUTOCLAIM (or to a specific one with XCLAIM).
//
// Each XADD carries an approximate MAXLEN so the stream stays bounded
// as it rolls forward. XRANGE supports replay over the retained
// history for debugging, audit, or rebuilding a downstream projection.
// Approximate trimming can release entries that are still in a group's
// PEL: those entries appear in XAUTOCLAIM's deleted-IDs list, which
// the caller should log and route to a dead-letter store. Redis 7+
// removes them from the PEL inside the XAUTOCLAIM call itself, so no
// explicit XACK is needed.
//
// The same stream can be read by any number of consumer groups — each
// group has its own cursor and its own pending lists, so analytics,
// notifications, and audit can all process the full event flow at
// their own pace without coordinating with each other.
package streaming

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Entry is one stream entry: an ID plus its field/value map.
type Entry struct {
	ID     string            `json:"id"`
	Fields map[string]string `json:"fields"`
}

// StreamInfo is the JSON-friendly subset of XINFO STREAM the demo cares about.
type StreamInfo struct {
	Length          int64  `json:"length"`
	LastGeneratedID string `json:"last_generated_id"`
	FirstEntryID    string `json:"first_entry_id"`
	LastEntryID     string `json:"last_entry_id"`
}

// GroupInfo is the JSON-friendly subset of one XINFO GROUPS row.
type GroupInfo struct {
	Name            string `json:"name"`
	Consumers       int64  `json:"consumers"`
	Pending         int64  `json:"pending"`
	LastDeliveredID string `json:"last_delivered_id"`
	// Lag is -1 when Redis cannot determine it (e.g. the consumer group
	// was created after some entries had already been trimmed).
	Lag int64 `json:"lag"`
}

// ConsumerInfo is the JSON-friendly subset of one XINFO CONSUMERS row.
type ConsumerInfo struct {
	Name    string `json:"name"`
	Pending int64  `json:"pending"`
	IdleMs  int64  `json:"idle_ms"`
}

// PendingEntry is one row from XPENDING in detail mode.
type PendingEntry struct {
	ID         string `json:"id"`
	Consumer   string `json:"consumer"`
	IdleMs     int64  `json:"idle_ms"`
	Deliveries int64  `json:"deliveries"`
}

// Stats holds the helper's in-process counters.
type Stats struct {
	ProducedTotal int64 `json:"produced_total"`
	AckedTotal    int64 `json:"acked_total"`
	ClaimedTotal  int64 `json:"claimed_total"`
}

// EventStream is the producer/consumer helper around one Redis Stream
// plus its consumer groups.
type EventStream struct {
	client          *redis.Client
	streamKey       string
	maxlenApprox    int64
	claimMinIdleMs  int64

	mu             sync.Mutex
	producedTotal  int64
	ackedTotal     int64
	claimedTotal   int64
}

// NewEventStream constructs an EventStream around the given Redis
// client. maxlenApprox is the approximate MAXLEN cap applied on every
// XADD; claimMinIdleMs is the idle threshold XAUTOCLAIM uses.
func NewEventStream(client *redis.Client, streamKey string, maxlenApprox int64, claimMinIdleMs int64) *EventStream {
	return &EventStream{
		client:         client,
		streamKey:      streamKey,
		maxlenApprox:   maxlenApprox,
		claimMinIdleMs: claimMinIdleMs,
	}
}

// StreamKey returns the configured stream key.
func (s *EventStream) StreamKey() string { return s.streamKey }

// MaxlenApprox returns the configured approximate MAXLEN cap.
func (s *EventStream) MaxlenApprox() int64 { return s.maxlenApprox }

// ClaimMinIdleMs returns the configured XAUTOCLAIM idle threshold.
func (s *EventStream) ClaimMinIdleMs() int64 { return s.claimMinIdleMs }

// ------------------------------------------------------------------
// Producer
// ------------------------------------------------------------------

// Produce appends a single event. Returns the stream ID Redis assigned.
func (s *EventStream) Produce(ctx context.Context, eventType string, payload map[string]string) (string, error) {
	ids, err := s.ProduceBatch(ctx, []ProducerEvent{{Type: eventType, Payload: payload}})
	if err != nil {
		return "", err
	}
	if len(ids) == 0 {
		return "", errors.New("XADD returned no id")
	}
	return ids[0], nil
}

// ProducerEvent is one event in a ProduceBatch call.
type ProducerEvent struct {
	Type    string
	Payload map[string]string
}

// ProduceBatch pipelines several XADDs in one round trip.
//
// Each entry carries an approximate MAXLEN cap. The "~" flavour lets
// Redis trim at a macro-node boundary, which is much cheaper than
// exact trimming and is the right call for a retention guardrail
// rather than a hard size limit.
func (s *EventStream) ProduceBatch(ctx context.Context, events []ProducerEvent) ([]string, error) {
	if len(events) == 0 {
		return nil, nil
	}
	pipe := s.client.Pipeline()
	cmds := make([]*redis.StringCmd, 0, len(events))
	for _, ev := range events {
		fields := encodeFields(ev.Type, ev.Payload)
		cmd := pipe.XAdd(ctx, &redis.XAddArgs{
			Stream: s.streamKey,
			MaxLen: s.maxlenApprox,
			Approx: true,
			Values: fields,
		})
		cmds = append(cmds, cmd)
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(cmds))
	for _, cmd := range cmds {
		id, err := cmd.Result()
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	s.mu.Lock()
	s.producedTotal += int64(len(ids))
	s.mu.Unlock()
	return ids, nil
}

func encodeFields(eventType string, payload map[string]string) map[string]interface{} {
	fields := make(map[string]interface{}, len(payload)+2)
	fields["type"] = eventType
	fields["ts_ms"] = fmt.Sprintf("%d", time.Now().UnixMilli())
	for k, v := range payload {
		fields[k] = v
	}
	return fields
}

// ------------------------------------------------------------------
// Consumer groups
// ------------------------------------------------------------------

// EnsureGroup creates the consumer group if it doesn't exist.
//
// "$" means "deliver only events appended after this point"; pass
// "0-0" to replay the entire stream into a fresh group. BUSYGROUP
// errors (group already exists) are swallowed so this is idempotent.
func (s *EventStream) EnsureGroup(ctx context.Context, group, startID string) error {
	if startID == "" {
		startID = "$"
	}
	err := s.client.XGroupCreateMkStream(ctx, s.streamKey, group, startID).Err()
	if err == nil {
		return nil
	}
	if strings.Contains(err.Error(), "BUSYGROUP") {
		return nil
	}
	return err
}

// DeleteGroup drops a consumer group entirely.
func (s *EventStream) DeleteGroup(ctx context.Context, group string) error {
	return s.client.XGroupDestroy(ctx, s.streamKey, group).Err()
}

// Consume reads new entries for this consumer via XREADGROUP.
//
// The ">" ID means "deliver entries this consumer group has not
// delivered to anyone yet" — that is the at-least-once path.
// Replaying an explicit ID instead would re-deliver an entry that is
// already in this consumer's pending list (see ConsumeOwnPel for that
// recovery path).
func (s *EventStream) Consume(ctx context.Context, group, consumer string, count int64, blockMs int64) ([]Entry, error) {
	res, err := s.client.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    group,
		Consumer: consumer,
		Streams:  []string{s.streamKey, ">"},
		Count:    count,
		Block:    time.Duration(blockMs) * time.Millisecond,
	}).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}
	return flattenStreams(res), nil
}

// ConsumeOwnPel re-delivers entries already in this consumer's PEL.
//
// Reading with an explicit ID ("0" here) instead of ">" replays the
// entries already assigned to this consumer name without advancing
// the group's last-delivered-id. This is the canonical recovery path
// after a crash on the same consumer name, and is also how a consumer
// picks up entries that another consumer (or XAUTOCLAIM) handed to it.
func (s *EventStream) ConsumeOwnPel(ctx context.Context, group, consumer string, count int64) ([]Entry, error) {
	res, err := s.client.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    group,
		Consumer: consumer,
		Streams:  []string{s.streamKey, "0"},
		Count:    count,
		Block:    -1,
	}).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}
	return flattenStreams(res), nil
}

// Ack runs XACK on the given IDs and returns the number Redis cleared.
func (s *EventStream) Ack(ctx context.Context, group string, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	n, err := s.client.XAck(ctx, s.streamKey, group, ids...).Result()
	if err != nil {
		return 0, err
	}
	s.mu.Lock()
	s.ackedTotal += n
	s.mu.Unlock()
	return n, nil
}

// Autoclaim sweeps idle pending entries to the named consumer.
//
// A single XAUTOCLAIM call scans up to pageCount PEL entries starting
// at startID and returns a continuation cursor. For a full sweep of
// the PEL, loop until the cursor returns to "0-0" (or hit maxPages as
// a safety net so a very large PEL can't monopolise the call).
//
// Returns (claimed, deletedIDs). deletedIDs are PEL entries whose
// stream payload had already been trimmed by the time this sweep ran
// (typically because MAXLEN ~ retention outran a slow consumer).
// XAUTOCLAIM removes those dangling slots from the PEL itself — the
// caller does NOT need to XACK them — but they cannot be retried, so
// log and route them to a dead-letter store for observability.
//
// go-redis's typed XAutoClaim wrapper discards the deleted-IDs slot,
// so we issue XAUTOCLAIM through client.Do and parse the raw reply.
func (s *EventStream) Autoclaim(ctx context.Context, group, consumer string, pageCount int64, startID string, maxPages int) ([]Entry, []string, error) {
	if startID == "" {
		startID = "0-0"
	}
	if maxPages <= 0 {
		maxPages = 10
	}
	if pageCount <= 0 {
		pageCount = 100
	}
	cursor := startID
	claimedAll := make([]Entry, 0)
	deletedAll := make([]string, 0)
	for i := 0; i < maxPages; i++ {
		nextCursor, claimed, deleted, err := s.doAutoclaim(ctx, group, consumer, cursor, pageCount)
		if err != nil {
			return nil, nil, err
		}
		claimedAll = append(claimedAll, claimed...)
		deletedAll = append(deletedAll, deleted...)
		if nextCursor == "0-0" {
			break
		}
		cursor = nextCursor
	}
	s.mu.Lock()
	s.claimedTotal += int64(len(claimedAll))
	s.mu.Unlock()
	return claimedAll, deletedAll, nil
}

// doAutoclaim runs one XAUTOCLAIM call via client.Do and parses the raw
// reply so the third (deleted-IDs) element is preserved on Redis 7+.
func (s *EventStream) doAutoclaim(ctx context.Context, group, consumer, startID string, count int64) (string, []Entry, []string, error) {
	args := []interface{}{"XAUTOCLAIM", s.streamKey, group, consumer, s.claimMinIdleMs, startID}
	if count > 0 {
		args = append(args, "COUNT", count)
	}
	raw, err := s.client.Do(ctx, args...).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "0-0", nil, nil, nil
		}
		return "", nil, nil, err
	}
	arr, ok := raw.([]interface{})
	if !ok {
		return "", nil, nil, fmt.Errorf("XAUTOCLAIM: unexpected reply type %T", raw)
	}
	if len(arr) < 2 {
		return "", nil, nil, fmt.Errorf("XAUTOCLAIM: short reply (%d elements)", len(arr))
	}

	nextCursor, _ := arr[0].(string)
	claimedRaw, _ := arr[1].([]interface{})
	claimed := make([]Entry, 0, len(claimedRaw))
	for _, entryRaw := range claimedRaw {
		entryArr, ok := entryRaw.([]interface{})
		if !ok || len(entryArr) < 2 {
			continue
		}
		id, _ := entryArr[0].(string)
		fields, _ := entryArr[1].([]interface{})
		claimed = append(claimed, Entry{ID: id, Fields: pairsToMap(fields)})
	}

	deleted := make([]string, 0)
	if len(arr) >= 3 {
		if delRaw, ok := arr[2].([]interface{}); ok {
			for _, d := range delRaw {
				if s, ok := d.(string); ok {
					deleted = append(deleted, s)
				}
			}
		}
	}
	return nextCursor, claimed, deleted, nil
}

func pairsToMap(pairs []interface{}) map[string]string {
	out := make(map[string]string, len(pairs)/2)
	for i := 0; i+1 < len(pairs); i += 2 {
		k, _ := pairs[i].(string)
		v, _ := pairs[i+1].(string)
		out[k] = v
	}
	return out
}

// DeleteConsumer drops a consumer from a group.
//
// XGROUP DELCONSUMER destroys this consumer's PEL entries — any entry
// it still owned is no longer tracked anywhere in the group, and
// XAUTOCLAIM will never find it again. Always HandoverPending (or
// XCLAIM manually) to a healthy consumer first; this method is the
// raw destructive call and is exposed only for explicit cleanup.
func (s *EventStream) DeleteConsumer(ctx context.Context, group, consumer string) (int64, error) {
	n, err := s.client.XGroupDelConsumer(ctx, s.streamKey, group, consumer).Result()
	if err != nil {
		return 0, err
	}
	return n, nil
}

// HandoverPending moves every PEL entry owned by fromConsumer to toConsumer.
//
// Enumerates the source consumer's PEL with XPENDING ... CONSUMER and
// reassigns each ID with XCLAIM at zero idle time so the move is
// unconditional. (XAUTOCLAIM does not filter by source consumer, so it
// cannot be used for a per-consumer handover.)
//
// Call this before DeleteConsumer whenever the source still has
// pending entries — otherwise XGROUP DELCONSUMER would silently
// destroy them and they could never be recovered.
func (s *EventStream) HandoverPending(ctx context.Context, group, fromConsumer, toConsumer string, batch int64) (int, error) {
	if batch <= 0 {
		batch = 100
	}
	total := 0
	for {
		rows, err := s.client.XPendingExt(ctx, &redis.XPendingExtArgs{
			Stream:   s.streamKey,
			Group:    group,
			Start:    "-",
			End:      "+",
			Count:    batch,
			Consumer: fromConsumer,
		}).Result()
		if err != nil {
			return total, err
		}
		if len(rows) == 0 {
			return total, nil
		}
		ids := make([]string, 0, len(rows))
		for _, row := range rows {
			ids = append(ids, row.ID)
		}
		claimed, err := s.client.XClaim(ctx, &redis.XClaimArgs{
			Stream:   s.streamKey,
			Group:    group,
			Consumer: toConsumer,
			MinIdle:  0,
			Messages: ids,
		}).Result()
		if err != nil {
			return total, err
		}
		total += len(claimed)
		s.mu.Lock()
		s.claimedTotal += int64(len(claimed))
		s.mu.Unlock()
		if int64(len(rows)) < batch {
			return total, nil
		}
	}
}

// ------------------------------------------------------------------
// Replay, length, trim
// ------------------------------------------------------------------

// Replay reads a slice of history with XRANGE.
//
// Read-only: ranges do not update any group cursor and do not ack
// anything. Useful for bootstrapping a new projection, for building an
// audit view, or for debugging what actually went through the stream.
func (s *EventStream) Replay(ctx context.Context, startID, endID string, count int64) ([]Entry, error) {
	if startID == "" {
		startID = "-"
	}
	if endID == "" {
		endID = "+"
	}
	if count <= 0 {
		count = 100
	}
	msgs, err := s.client.XRangeN(ctx, s.streamKey, startID, endID, count).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}
	return xMessagesToEntries(msgs), nil
}

// Tail returns the most recent count entries in reverse-chronological
// order, via XREVRANGE.
func (s *EventStream) Tail(ctx context.Context, count int64) ([]Entry, error) {
	if count <= 0 {
		count = 10
	}
	msgs, err := s.client.XRevRangeN(ctx, s.streamKey, "+", "-", count).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}
	return xMessagesToEntries(msgs), nil
}

// Length runs XLEN.
func (s *EventStream) Length(ctx context.Context) (int64, error) {
	n, err := s.client.XLen(ctx, s.streamKey).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return 0, nil
		}
		return 0, err
	}
	return n, nil
}

// TrimMaxlen runs an approximate XTRIM MAXLEN ~.
func (s *EventStream) TrimMaxlen(ctx context.Context, maxlen int64) (int64, error) {
	// Limit=0 -> no cap; the third arg to XTrimMaxLenApprox is the LIMIT
	// modifier, not the count. Passing 0 means "no LIMIT clause".
	return s.client.XTrimMaxLenApprox(ctx, s.streamKey, maxlen, 0).Result()
}

// TrimMinid runs an approximate XTRIM MINID ~.
func (s *EventStream) TrimMinid(ctx context.Context, minid string) (int64, error) {
	return s.client.XTrimMinIDApprox(ctx, s.streamKey, minid, 0).Result()
}

// ------------------------------------------------------------------
// Inspection
// ------------------------------------------------------------------

// InfoStream returns a JSON-friendly subset of XINFO STREAM.
func (s *EventStream) InfoStream(ctx context.Context) (StreamInfo, error) {
	raw, err := s.client.XInfoStream(ctx, s.streamKey).Result()
	if err != nil {
		// Missing stream → return zero-valued info rather than an error
		// so the demo's /state endpoint can render an empty view.
		return StreamInfo{}, nil
	}
	first := ""
	if raw.FirstEntry.ID != "" {
		first = raw.FirstEntry.ID
	}
	last := ""
	if raw.LastEntry.ID != "" {
		last = raw.LastEntry.ID
	}
	return StreamInfo{
		Length:          raw.Length,
		LastGeneratedID: raw.LastGeneratedID,
		FirstEntryID:    first,
		LastEntryID:     last,
	}, nil
}

// InfoGroups returns a JSON-friendly subset of XINFO GROUPS.
func (s *EventStream) InfoGroups(ctx context.Context) ([]GroupInfo, error) {
	raw, err := s.client.XInfoGroups(ctx, s.streamKey).Result()
	if err != nil {
		return nil, nil
	}
	out := make([]GroupInfo, 0, len(raw))
	for _, g := range raw {
		out = append(out, GroupInfo{
			Name:            g.Name,
			Consumers:       g.Consumers,
			Pending:         g.Pending,
			LastDeliveredID: g.LastDeliveredID,
			Lag:             g.Lag,
		})
	}
	return out, nil
}

// InfoConsumers returns a JSON-friendly subset of XINFO CONSUMERS.
func (s *EventStream) InfoConsumers(ctx context.Context, group string) ([]ConsumerInfo, error) {
	raw, err := s.client.XInfoConsumers(ctx, s.streamKey, group).Result()
	if err != nil {
		return nil, nil
	}
	out := make([]ConsumerInfo, 0, len(raw))
	for _, c := range raw {
		out = append(out, ConsumerInfo{
			Name:    c.Name,
			Pending: c.Pending,
			IdleMs:  c.Idle.Milliseconds(),
		})
	}
	return out, nil
}

// PendingDetail returns a per-entry PEL view (id, consumer, idle, deliveries).
func (s *EventStream) PendingDetail(ctx context.Context, group string, count int64) ([]PendingEntry, error) {
	if count <= 0 {
		count = 20
	}
	rows, err := s.client.XPendingExt(ctx, &redis.XPendingExtArgs{
		Stream: s.streamKey,
		Group:  group,
		Start:  "-",
		End:    "+",
		Count:  count,
	}).Result()
	if err != nil {
		return nil, nil
	}
	out := make([]PendingEntry, 0, len(rows))
	for _, r := range rows {
		out = append(out, PendingEntry{
			ID:         r.ID,
			Consumer:   r.Consumer,
			IdleMs:     r.Idle.Milliseconds(),
			Deliveries: r.RetryCount,
		})
	}
	return out, nil
}

// Stats returns a snapshot of the helper's in-process counters.
func (s *EventStream) Stats() Stats {
	s.mu.Lock()
	defer s.mu.Unlock()
	return Stats{
		ProducedTotal: s.producedTotal,
		AckedTotal:    s.ackedTotal,
		ClaimedTotal:  s.claimedTotal,
	}
}

// ResetStats zeroes the helper's in-process counters.
func (s *EventStream) ResetStats() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.producedTotal = 0
	s.ackedTotal = 0
	s.claimedTotal = 0
}

// DeleteStream drops the stream key entirely. Used by the demo's reset
// path; not something a real app should call casually.
func (s *EventStream) DeleteStream(ctx context.Context) error {
	return s.client.Del(ctx, s.streamKey).Err()
}

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

func flattenStreams(streams []redis.XStream) []Entry {
	out := make([]Entry, 0)
	for _, st := range streams {
		for _, msg := range st.Messages {
			out = append(out, Entry{ID: msg.ID, Fields: valuesToStringMap(msg.Values)})
		}
	}
	return out
}

func xMessagesToEntries(msgs []redis.XMessage) []Entry {
	out := make([]Entry, 0, len(msgs))
	for _, msg := range msgs {
		out = append(out, Entry{ID: msg.ID, Fields: valuesToStringMap(msg.Values)})
	}
	return out
}

func valuesToStringMap(values map[string]interface{}) map[string]string {
	out := make(map[string]string, len(values))
	for k, v := range values {
		switch t := v.(type) {
		case string:
			out[k] = t
		case []byte:
			out[k] = string(t)
		case nil:
			out[k] = ""
		default:
			out[k] = fmt.Sprintf("%v", t)
		}
	}
	return out
}
