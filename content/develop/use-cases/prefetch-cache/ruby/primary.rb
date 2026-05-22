# Mock primary data store for the prefetch-cache demo.
#
# This stands in for a source-of-truth database (Postgres, MySQL, Mongo,
# etc.) that holds reference data the application serves to users.
#
# Every mutation appends a change event to an in-process queue, which
# the sync worker drains and applies to Redis. In a real system the
# queue is replaced by a CDC pipeline -- Redis Data Integration,
# Debezium plus a lightweight consumer, or an equivalent tool that
# tails the source's binlog/WAL and pushes changes into Redis.
#
# The store also exposes +read_latency_ms+ so the demo can illustrate
# how much slower a direct primary read would be than a Redis hit.

require "thread"

CHANGE_OP_UPSERT = "upsert"
CHANGE_OP_DELETE = "delete"

class MockPrimaryStore
  # In-memory stand-in for a primary database of reference data.

  attr_reader :read_latency_ms

  def initialize(read_latency_ms: 80)
    @read_latency_ms = read_latency_ms
    @lock = Mutex.new
    @reads = 0
    @changes = Queue.new
    @records = {
      "cat-001" => {
        "id" => "cat-001",
        "name" => "Beverages",
        "display_order" => "1",
        "featured" => "true",
        "parent_id" => "",
      },
      "cat-002" => {
        "id" => "cat-002",
        "name" => "Bakery",
        "display_order" => "2",
        "featured" => "true",
        "parent_id" => "",
      },
      "cat-003" => {
        "id" => "cat-003",
        "name" => "Pantry Staples",
        "display_order" => "3",
        "featured" => "false",
        "parent_id" => "",
      },
      "cat-004" => {
        "id" => "cat-004",
        "name" => "Frozen",
        "display_order" => "4",
        "featured" => "false",
        "parent_id" => "",
      },
      "cat-005" => {
        "id" => "cat-005",
        "name" => "Specialty Cheeses",
        "display_order" => "5",
        "featured" => "false",
        "parent_id" => "cat-002",
      },
    }
  end

  def list_ids
    @lock.synchronize { @records.keys.sort }
  end

  # Return every record. Used by the cache's bulk-load path on startup.
  def list_records
    sleep(@read_latency_ms / 1000.0)
    @lock.synchronize do
      @reads += 1
      @records.values.map { |r| r.dup }
    end
  end

  # Single-record read. Not on the demo's normal read path.
  def read(entity_id)
    sleep(@read_latency_ms / 1000.0)
    @lock.synchronize do
      @reads += 1
      record = @records[entity_id]
      record ? record.dup : nil
    end
  end

  def add_record(record)
    entity_id = (record["id"] || "").to_s.strip
    return false if entity_id.empty?
    @lock.synchronize do
      return false if @records.key?(entity_id)
      @records[entity_id] = record.dup
      # Emit while the lock is held so the queue order matches the
      # mutation order. Two concurrent callers cannot interleave
      # mutation A, mutation B, emit B, emit A.
      emit_change_locked(CHANGE_OP_UPSERT, entity_id, record.dup)
    end
    true
  end

  def update_field(entity_id, field, value)
    @lock.synchronize do
      record = @records[entity_id]
      return false if record.nil?
      record[field] = value
      emit_change_locked(CHANGE_OP_UPSERT, entity_id, record.dup)
    end
    true
  end

  def delete_record(entity_id)
    @lock.synchronize do
      return false unless @records.key?(entity_id)
      @records.delete(entity_id)
      emit_change_locked(CHANGE_OP_DELETE, entity_id, nil)
    end
    true
  end

  # Block up to +timeout_seconds+ for the next change event.
  #
  # Queue#pop does not accept a timeout directly. We use a short polling
  # loop on +pop(true)+ (non-blocking), sleeping for a fraction of the
  # timeout between attempts, so the worker remains responsive to its
  # stop flag.
  def next_change(timeout_seconds)
    deadline = monotonic + timeout_seconds
    loop do
      begin
        return @changes.pop(true)
      rescue ThreadError
        remaining = deadline - monotonic
        return nil if remaining <= 0
        sleep([remaining, 0.01].min)
      end
    end
  end

  def reads
    @lock.synchronize { @reads }
  end

  def reset_reads
    @lock.synchronize { @reads = 0 }
  end

  private

  # Append a change event to the feed. Caller must hold +@lock+.
  #
  # Queue#push is itself thread-safe and does not try to acquire
  # +@lock+, so calling it while holding the records lock cannot
  # deadlock. Holding the lock here is what guarantees that the queue
  # order matches the order in which the records hash was mutated.
  def emit_change_locked(op, entity_id, fields)
    @changes.push(
      op: op,
      id: entity_id,
      fields: fields,
      timestamp_ms: Time.now.to_f * 1000.0,
    )
  end

  def monotonic
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end
end
