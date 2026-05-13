// Mock primary data store for the prefetch-cache demo.
//
// This stands in for a source-of-truth database (Postgres, MySQL, Mongo,
// etc.) that holds reference data the application serves to users.
//
// Every mutation appends a change event to an in-process Go channel,
// which the sync worker drains and applies to Redis. In a real system
// the channel is replaced by a CDC pipeline -- Redis Data Integration,
// Debezium plus a lightweight consumer, or an equivalent tool that
// tails the source's binlog/WAL and pushes changes into Redis.
//
// The store also exposes ReadLatencyMs so the demo can illustrate how
// much slower a direct primary read would be than a Redis hit.
package prefetchcache

import (
	"sort"
	"sync"
	"time"
)

// Change op constants emitted on the change feed.
const (
	ChangeOpUpsert = "upsert"
	ChangeOpDelete = "delete"
)

// Change is a primary mutation event. Fields is nil for delete ops.
type Change struct {
	Op          string
	ID          string
	Fields      map[string]string
	TimestampMs float64
}

// MockPrimaryStore is an in-memory stand-in for a primary database of
// reference data.
type MockPrimaryStore struct {
	readLatencyMs int

	mu      sync.Mutex
	reads   int
	changes chan Change
	records map[string]map[string]string
}

// NewMockPrimaryStore returns a MockPrimaryStore seeded with the same
// five sample records as the Python reference. The change channel is
// buffered generously so concurrent mutations never block the producer.
func NewMockPrimaryStore(readLatencyMs int) *MockPrimaryStore {
	return &MockPrimaryStore{
		readLatencyMs: readLatencyMs,
		changes:       make(chan Change, 1024),
		records: map[string]map[string]string{
			"cat-001": {
				"id":            "cat-001",
				"name":          "Beverages",
				"display_order": "1",
				"featured":      "true",
				"parent_id":     "",
			},
			"cat-002": {
				"id":            "cat-002",
				"name":          "Bakery",
				"display_order": "2",
				"featured":      "true",
				"parent_id":     "",
			},
			"cat-003": {
				"id":            "cat-003",
				"name":          "Pantry Staples",
				"display_order": "3",
				"featured":      "false",
				"parent_id":     "",
			},
			"cat-004": {
				"id":            "cat-004",
				"name":          "Frozen",
				"display_order": "4",
				"featured":      "false",
				"parent_id":     "",
			},
			"cat-005": {
				"id":            "cat-005",
				"name":          "Specialty Cheeses",
				"display_order": "5",
				"featured":      "false",
				"parent_id":     "cat-002",
			},
		},
	}
}

// ReadLatencyMs returns the configured simulated read latency.
func (p *MockPrimaryStore) ReadLatencyMs() int {
	return p.readLatencyMs
}

// ListIDs returns the primary record IDs in sorted order. No sleep, no
// counter increment -- this stands in for a fast metadata query (for example,
// SELECT id FROM categories) rather than a full record read.
func (p *MockPrimaryStore) ListIDs() []string {
	p.mu.Lock()
	defer p.mu.Unlock()
	ids := make([]string, 0, len(p.records))
	for id := range p.records {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// ListRecords returns every record. Used by the cache's bulk-load path
// on startup. Sleeps for ReadLatencyMs and increments the read counter.
func (p *MockPrimaryStore) ListRecords() []map[string]string {
	time.Sleep(time.Duration(p.readLatencyMs) * time.Millisecond)
	p.mu.Lock()
	defer p.mu.Unlock()
	p.reads++
	out := make([]map[string]string, 0, len(p.records))
	// Iterate sorted IDs so the snapshot order is deterministic.
	ids := make([]string, 0, len(p.records))
	for id := range p.records {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	for _, id := range ids {
		out = append(out, copyRecord(p.records[id]))
	}
	return out
}

// Read returns a single record by id, or nil if absent. Not on the
// demo's normal read path.
func (p *MockPrimaryStore) Read(id string) map[string]string {
	time.Sleep(time.Duration(p.readLatencyMs) * time.Millisecond)
	p.mu.Lock()
	defer p.mu.Unlock()
	p.reads++
	rec, ok := p.records[id]
	if !ok {
		return nil
	}
	return copyRecord(rec)
}

// AddRecord inserts a record if id is absent and emits an upsert event.
// Returns false if the id already exists or is empty.
func (p *MockPrimaryStore) AddRecord(record map[string]string) bool {
	id := record["id"]
	if id == "" {
		return false
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, exists := p.records[id]; exists {
		return false
	}
	p.records[id] = copyRecord(record)
	// Emit while the lock is held so the channel order matches the
	// mutation order. Two concurrent callers cannot interleave
	// mutation A -> mutation B -> emit B -> emit A.
	p.emitChangeLocked(ChangeOpUpsert, id, copyRecord(p.records[id]))
	return true
}

// UpdateField updates a single field in place and emits an upsert event.
// Returns false if the id is unknown.
func (p *MockPrimaryStore) UpdateField(id, field, value string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	rec, ok := p.records[id]
	if !ok {
		return false
	}
	rec[field] = value
	p.emitChangeLocked(ChangeOpUpsert, id, copyRecord(rec))
	return true
}

// DeleteRecord removes a record and emits a delete event. Returns false
// if the id is unknown.
func (p *MockPrimaryStore) DeleteRecord(id string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, ok := p.records[id]; !ok {
		return false
	}
	delete(p.records, id)
	p.emitChangeLocked(ChangeOpDelete, id, nil)
	return true
}

// NextChange blocks up to timeout for the next change event. Returns
// (zero Change, false) if the timeout elapsed with nothing on the
// channel. The boolean disambiguates a zero-value Change from a
// genuine timeout.
func (p *MockPrimaryStore) NextChange(timeout time.Duration) (Change, bool) {
	if timeout <= 0 {
		select {
		case change := <-p.changes:
			return change, true
		default:
			return Change{}, false
		}
	}
	timer := time.NewTimer(timeout)
	defer timer.Stop()
	select {
	case change := <-p.changes:
		return change, true
	case <-timer.C:
		return Change{}, false
	}
}

// Reads returns the cumulative number of full-record reads since the
// counter was last reset.
func (p *MockPrimaryStore) Reads() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.reads
}

// ResetReads zeroes the primary read counter.
func (p *MockPrimaryStore) ResetReads() {
	p.mu.Lock()
	p.reads = 0
	p.mu.Unlock()
}

// emitChangeLocked appends a change event to the feed. The caller must
// hold p.mu. Channel sends are themselves thread-safe and never try to
// acquire p.mu, so sending while holding the records lock cannot
// deadlock; holding the lock here is what guarantees that the channel
// order matches the order in which the records map was mutated.
func (p *MockPrimaryStore) emitChangeLocked(op, id string, fields map[string]string) {
	p.changes <- Change{
		Op:          op,
		ID:          id,
		Fields:      fields,
		TimestampMs: float64(time.Now().UnixNano()) / 1e6,
	}
}

func copyRecord(in map[string]string) map[string]string {
	out := make(map[string]string, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}
