"use strict";

class MockPrimaryStore {
  constructor({ readLatencyMs = 150 } = {}) {
    this.readLatencyMs = readLatencyMs;
    this._reads = 0;
    this._records = new Map([
      ["p-001", { id: "p-001", name: "Sourdough Loaf", price_cents: "650", stock: "42" }],
      ["p-002", { id: "p-002", name: "Espresso Beans 250g", price_cents: "1495", stock: "120" }],
      ["p-003", { id: "p-003", name: "Olive Oil 500ml", price_cents: "1200", stock: "8" }],
      ["p-004", { id: "p-004", name: "Sea Salt Flakes", price_cents: "475", stock: "60" }],
    ]);
  }

  listIds() {
    return [...this._records.keys()].sort();
  }

  async read(id) {
    await new Promise((resolve) => setTimeout(resolve, this.readLatencyMs));
    this._reads += 1;
    const record = this._records.get(id);
    return record ? { ...record } : null;
  }

  updateField(id, field, value) {
    const record = this._records.get(id);
    if (!record) {
      return false;
    }
    record[field] = String(value);
    return true;
  }

  reads() {
    return this._reads;
  }

  resetReads() {
    this._reads = 0;
  }
}

module.exports = { MockPrimaryStore };
