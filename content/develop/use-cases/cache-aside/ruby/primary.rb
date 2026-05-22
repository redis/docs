# frozen_string_literal: true

# In-memory stand-in for a slow primary database. Each read sleeps for
# `read_latency_ms` so the difference between a cache hit and a miss is
# visible in the demo UI.
class MockPrimaryStore
  attr_reader :read_latency_ms

  def initialize(read_latency_ms: 150)
    @read_latency_ms = read_latency_ms
    @reads = 0
    @mutex = Mutex.new
    @records = {
      "p-001" => { "id" => "p-001", "name" => "Sourdough Loaf", "price_cents" => "650", "stock" => "42" },
      "p-002" => { "id" => "p-002", "name" => "Espresso Beans 250g", "price_cents" => "1495", "stock" => "120" },
      "p-003" => { "id" => "p-003", "name" => "Olive Oil 500ml", "price_cents" => "1200", "stock" => "8" },
      "p-004" => { "id" => "p-004", "name" => "Sea Salt Flakes", "price_cents" => "475", "stock" => "60" },
    }
  end

  def list_ids
    @records.keys.sort
  end

  def read(id)
    sleep(@read_latency_ms / 1000.0)
    @mutex.synchronize do
      @reads += 1
      record = @records[id]
      record ? record.dup : nil
    end
  end

  def update_field(id, field, value)
    @mutex.synchronize do
      record = @records[id]
      return false unless record
      record[field] = value.to_s
      true
    end
  end

  def reads
    @mutex.synchronize { @reads }
  end

  def reset_reads
    @mutex.synchronize { @reads = 0 }
  end
end
