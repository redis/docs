"use strict";

/**
 * Mock primary data store for the prefetch-cache demo.
 *
 * This stands in for a source-of-truth database (Postgres, MySQL, Mongo,
 * etc.) that holds reference data the application serves to users.
 *
 * Every mutation appends a change event to an in-process queue, which the
 * sync worker drains and applies to Redis. In a real system the queue is
 * replaced by a CDC pipeline — Redis Data Integration, Debezium plus a
 * lightweight consumer, or an equivalent tool that tails the source's
 * binlog/WAL and pushes changes into Redis.
 *
 * The store also exposes `readLatencyMs` so the demo can illustrate
 * how much slower a direct primary read would be than a Redis hit.
 */

const CHANGE_OP_UPSERT = "upsert";
const CHANGE_OP_DELETE = "delete";

class MockPrimaryStore {
  constructor({ readLatencyMs = 80 } = {}) {
    this.readLatencyMs = readLatencyMs;
    this._reads = 0;

    // Change-event queue. The sync worker awaits `nextChange()` and we
    // resolve the oldest pending waiter (or buffer the event) so the
    // queue order matches the mutation order.
    this._pendingEvents = [];
    this._waiters = [];

    // Node.js JS execution is single-threaded, so the only "lock" we need
    // is a no-op marker: we serialise a mutation and its emit by doing
    // both synchronously, without any `await` in between. That gives us
    // the same guarantee Python's `_emit_change_locked` gives — two
    // concurrent callers cannot interleave mutation A → mutation B →
    // emit B → emit A.
    this._records = new Map([
      [
        "cat-001",
        { id: "cat-001", name: "Beverages", display_order: "1", featured: "true", parent_id: "" },
      ],
      [
        "cat-002",
        { id: "cat-002", name: "Bakery", display_order: "2", featured: "true", parent_id: "" },
      ],
      [
        "cat-003",
        { id: "cat-003", name: "Pantry Staples", display_order: "3", featured: "false", parent_id: "" },
      ],
      [
        "cat-004",
        { id: "cat-004", name: "Frozen", display_order: "4", featured: "false", parent_id: "" },
      ],
      [
        "cat-005",
        { id: "cat-005", name: "Specialty Cheeses", display_order: "5", featured: "false", parent_id: "cat-002" },
      ],
    ]);
  }

  /** Metadata-only listing. No simulated latency, no read counter increment. */
  listIds() {
    return [...this._records.keys()].sort();
  }

  /** Return every record. Used by the cache's bulk-load path on startup. */
  async listRecords() {
    await new Promise((resolve) => setTimeout(resolve, this.readLatencyMs));
    this._reads += 1;
    return [...this._records.values()].map((r) => ({ ...r }));
  }

  /** Single-record read. Not on the demo's normal read path. */
  async read(entityId) {
    await new Promise((resolve) => setTimeout(resolve, this.readLatencyMs));
    this._reads += 1;
    const record = this._records.get(entityId);
    return record ? { ...record } : null;
  }

  addRecord(record) {
    const entityId = (record && record.id ? String(record.id) : "").trim();
    if (!entityId) {
      return false;
    }
    if (this._records.has(entityId)) {
      return false;
    }
    const snapshot = { ...record };
    this._records.set(entityId, snapshot);
    // Emit synchronously after mutation, before yielding to the event
    // loop, so queue order matches mutation order.
    this._emitChange(CHANGE_OP_UPSERT, entityId, { ...snapshot });
    return true;
  }

  updateField(entityId, field, value) {
    const record = this._records.get(entityId);
    if (record === undefined) {
      return false;
    }
    record[field] = String(value);
    this._emitChange(CHANGE_OP_UPSERT, entityId, { ...record });
    return true;
  }

  deleteRecord(entityId) {
    if (!this._records.has(entityId)) {
      return false;
    }
    this._records.delete(entityId);
    this._emitChange(CHANGE_OP_DELETE, entityId, null);
    return true;
  }

  /**
   * Block up to `timeoutMs` for the next change event. Resolves to the
   * event, or null if the timeout elapsed.
   */
  nextChange(timeoutMs) {
    if (this._pendingEvents.length > 0) {
      return Promise.resolve(this._pendingEvents.shift());
    }
    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        // Remove ourselves from the waiter list.
        const idx = this._waiters.findIndex((w) => w.resolve === waiterResolve);
        if (idx !== -1) {
          this._waiters.splice(idx, 1);
        }
        resolve(null);
      }, timeoutMs);
      const waiterResolve = (event) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve(event);
      };
      this._waiters.push({ resolve: waiterResolve });
    });
  }

  reads() {
    return this._reads;
  }

  resetReads() {
    this._reads = 0;
  }

  _emitChange(op, entityId, fields) {
    const event = {
      op,
      id: entityId,
      fields,
      timestamp_ms: Date.now(),
    };
    if (this._waiters.length > 0) {
      const waiter = this._waiters.shift();
      waiter.resolve(event);
    } else {
      this._pendingEvents.push(event);
    }
  }
}

module.exports = { MockPrimaryStore, CHANGE_OP_UPSERT, CHANGE_OP_DELETE };
