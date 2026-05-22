package cacheaside

import (
	"context"
	"sort"
	"sync"
	"time"
)

// MockPrimaryStore is an in-memory stand-in for a slow primary database.
type MockPrimaryStore struct {
	ReadLatency time.Duration

	mu      sync.Mutex
	reads   int
	records map[string]map[string]string
}

// NewMockPrimaryStore constructs a MockPrimaryStore with sample products.
func NewMockPrimaryStore(readLatency time.Duration) *MockPrimaryStore {
	return &MockPrimaryStore{
		ReadLatency: readLatency,
		records: map[string]map[string]string{
			"p-001": {"id": "p-001", "name": "Sourdough Loaf", "price_cents": "650", "stock": "42"},
			"p-002": {"id": "p-002", "name": "Espresso Beans 250g", "price_cents": "1495", "stock": "120"},
			"p-003": {"id": "p-003", "name": "Olive Oil 500ml", "price_cents": "1200", "stock": "8"},
			"p-004": {"id": "p-004", "name": "Sea Salt Flakes", "price_cents": "475", "stock": "60"},
		},
	}
}

// ListIDs returns the sample product IDs in sorted order.
func (m *MockPrimaryStore) ListIDs() []string {
	m.mu.Lock()
	defer m.mu.Unlock()
	ids := make([]string, 0, len(m.records))
	for id := range m.records {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// Read returns a copy of the record for id after sleeping for the configured latency.
func (m *MockPrimaryStore) Read(ctx context.Context, id string) (map[string]string, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-time.After(m.ReadLatency):
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.reads++
	rec, ok := m.records[id]
	if !ok {
		return nil, nil
	}
	cp := make(map[string]string, len(rec))
	for k, v := range rec {
		cp[k] = v
	}
	return cp, nil
}

// UpdateField writes a single field on the primary record.
func (m *MockPrimaryStore) UpdateField(id, field, value string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	rec, ok := m.records[id]
	if !ok {
		return false
	}
	rec[field] = value
	return true
}

// Reads returns the cumulative number of primary reads since startup.
func (m *MockPrimaryStore) Reads() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.reads
}

// ResetReads zeroes the primary read counter.
func (m *MockPrimaryStore) ResetReads() {
	m.mu.Lock()
	m.reads = 0
	m.mu.Unlock()
}
