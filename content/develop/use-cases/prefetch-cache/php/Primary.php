<?php

/**
 * Mock primary data store for the prefetch-cache demo.
 *
 * This stands in for a source-of-truth database (Postgres, MySQL,
 * Mongo, etc.) that holds reference data the application serves.
 *
 * The reference Python implementation keeps the records in an
 * in-memory dict guarded by a Lock, and emits change events into an
 * in-process queue.Queue. PHP under `php -S` gives every HTTP request
 * a fresh process, so state cannot live in object properties: the
 * records and the change feed both live in Redis.
 *
 *   demo:primary:hash:{id}    each record as a Redis hash
 *   demo:primary:ids          set of every record id
 *   demo:primary:changes      change feed (a Redis list; LPUSH on
 *                             mutate, BRPOP on the consumer side)
 *   demo:primary:reads        single counter for primary reads
 *
 * To preserve the "queue order matches mutation order" guarantee from
 * the reference (two concurrent update_field calls must produce change
 * events in queue order matching mutation order), every mutation runs
 * inside a Lua script so the record write and the change-feed LPUSH
 * happen atomically on the Redis server.
 *
 * Requires: predis/predis 3.x
 */

declare(strict_types=1);

use Predis\ClientInterface;

class MockPrimaryStore
{
    public const CHANGE_OP_UPSERT = 'upsert';
    public const CHANGE_OP_DELETE = 'delete';

    // Atomically add a record (if absent) and emit an upsert change
    // event. Mutation and emit happen in a single Redis-side step, so
    // two concurrent callers can't interleave mutation A → mutation B
    // → emit B → emit A.
    private const ADD_SCRIPT = <<<'LUA'
local id = ARGV[1]
local fields_json = ARGV[2]
local change_json = ARGV[3]
local ids_key = KEYS[1]
local hash_key = KEYS[2]
local changes_key = KEYS[3]
if redis.call('SISMEMBER', ids_key, id) == 1 then
  return 0
end
redis.call('SADD', ids_key, id)
local fields = cjson.decode(fields_json)
for k, v in pairs(fields) do
  redis.call('HSET', hash_key, k, tostring(v))
end
redis.call('LPUSH', changes_key, change_json)
return 1
LUA;

    private const UPDATE_SCRIPT = <<<'LUA'
local id = ARGV[1]
local field = ARGV[2]
local value = ARGV[3]
local now_ms = tonumber(ARGV[4])
local ids_key = KEYS[1]
local hash_key = KEYS[2]
local changes_key = KEYS[3]
if redis.call('SISMEMBER', ids_key, id) == 0 then
  return 0
end
redis.call('HSET', hash_key, field, value)
local raw = redis.call('HGETALL', hash_key)
local fields = {}
for i = 1, #raw, 2 do
  fields[raw[i]] = raw[i + 1]
end
local change = cjson.encode({
  op = 'upsert',
  id = id,
  fields = fields,
  timestamp_ms = now_ms,
})
redis.call('LPUSH', changes_key, change)
return 1
LUA;

    private const DELETE_SCRIPT = <<<'LUA'
local id = ARGV[1]
local now_ms = tonumber(ARGV[2])
local ids_key = KEYS[1]
local hash_key = KEYS[2]
local changes_key = KEYS[3]
if redis.call('SISMEMBER', ids_key, id) == 0 then
  return 0
end
redis.call('SREM', ids_key, id)
redis.call('DEL', hash_key)
local change = cjson.encode({
  op = 'delete',
  id = id,
  fields = cjson.null,
  timestamp_ms = now_ms,
})
redis.call('LPUSH', changes_key, change)
return 1
LUA;

    private ClientInterface $redis;
    private int $readLatencyMs;

    private string $idsKey;
    private string $hashKeyPrefix;
    private string $changesKey;
    private string $readsKey;

    /**
     * @var array<string,array<string,string>>
     */
    private static array $seedRecords = [
        'cat-001' => [
            'id' => 'cat-001',
            'name' => 'Beverages',
            'display_order' => '1',
            'featured' => 'true',
            'parent_id' => '',
        ],
        'cat-002' => [
            'id' => 'cat-002',
            'name' => 'Bakery',
            'display_order' => '2',
            'featured' => 'true',
            'parent_id' => '',
        ],
        'cat-003' => [
            'id' => 'cat-003',
            'name' => 'Pantry Staples',
            'display_order' => '3',
            'featured' => 'false',
            'parent_id' => '',
        ],
        'cat-004' => [
            'id' => 'cat-004',
            'name' => 'Frozen',
            'display_order' => '4',
            'featured' => 'false',
            'parent_id' => '',
        ],
        'cat-005' => [
            'id' => 'cat-005',
            'name' => 'Specialty Cheeses',
            'display_order' => '5',
            'featured' => 'false',
            'parent_id' => 'cat-002',
        ],
    ];

    public function __construct(ClientInterface $redis, int $readLatencyMs = 80)
    {
        $this->redis = $redis;
        $this->readLatencyMs = $readLatencyMs;
        $this->idsKey = 'demo:primary:ids';
        $this->hashKeyPrefix = 'demo:primary:hash:';
        $this->changesKey = 'demo:primary:changes';
        $this->readsKey = 'demo:primary:reads';
    }

    public function getReadLatencyMs(): int
    {
        return $this->readLatencyMs;
    }

    public function getChangesKey(): string
    {
        return $this->changesKey;
    }

    private function hashKey(string $id): string
    {
        return $this->hashKeyPrefix . $id;
    }

    /**
     * Wipe primary state and re-seed the five demo categories. Called
     * by the demo server on startup so the data is always in a known
     * shape across restarts.
     */
    public function seedIfEmpty(): void
    {
        if ((int) $this->redis->exists($this->idsKey) > 0) {
            return;
        }
        $pipe = $this->redis->pipeline();
        foreach (self::$seedRecords as $id => $record) {
            $pipe->sadd($this->idsKey, [$id]);
            $hashKey = $this->hashKey($id);
            $pipe->del([$hashKey]);
            $args = [];
            foreach ($record as $k => $v) {
                $args[] = $k;
                $args[] = $v;
            }
            $pipe->hset($hashKey, ...$args);
        }
        $pipe->execute();
    }

    public function resetSeed(): void
    {
        // Clear every primary key. Used on /reset in tests.
        $ids = $this->redis->smembers($this->idsKey) ?: [];
        $pipe = $this->redis->pipeline();
        foreach ($ids as $id) {
            $pipe->del([$this->hashKey((string) $id)]);
        }
        $pipe->del([$this->idsKey, $this->changesKey, $this->readsKey]);
        $pipe->execute();
        $this->seedIfEmpty();
    }

    /**
     * @return list<string>
     */
    public function listIds(): array
    {
        $ids = $this->redis->smembers($this->idsKey) ?: [];
        $ids = array_map('strval', $ids);
        sort($ids, SORT_STRING);
        return $ids;
    }

    /**
     * Return every record. Used by the cache's bulk-load path.
     *
     * @return list<array<string,string>>
     */
    public function listRecords(): array
    {
        if ($this->readLatencyMs > 0) {
            usleep($this->readLatencyMs * 1000);
        }
        $this->redis->incr($this->readsKey);

        $ids = $this->listIds();
        $pipe = $this->redis->pipeline();
        foreach ($ids as $id) {
            $pipe->hgetall($this->hashKey($id));
        }
        $results = $pipe->execute();

        $records = [];
        foreach ($results as $row) {
            if (is_array($row) && !empty($row)) {
                $records[] = array_map('strval', $row);
            }
        }
        return $records;
    }

    /**
     * Single-record read. Not on the demo's normal read path.
     *
     * @return ?array<string,string>
     */
    public function read(string $entityId): ?array
    {
        if ($this->readLatencyMs > 0) {
            usleep($this->readLatencyMs * 1000);
        }
        $this->redis->incr($this->readsKey);
        $row = $this->redis->hgetall($this->hashKey($entityId));
        if (!is_array($row) || empty($row)) {
            return null;
        }
        return array_map('strval', $row);
    }

    /**
     * Insert if absent, emit an upsert event under the same Lua script
     * so the queue order matches the mutation order.
     *
     * @param array<string,string> $record
     */
    public function addRecord(array $record): bool
    {
        $entityId = trim((string) ($record['id'] ?? ''));
        if ($entityId === '') {
            return false;
        }
        $normalised = [];
        foreach ($record as $k => $v) {
            $normalised[(string) $k] = (string) $v;
        }
        $changeJson = json_encode([
            'op' => self::CHANGE_OP_UPSERT,
            'id' => $entityId,
            'fields' => $normalised,
            'timestamp_ms' => $this->nowMs(),
        ], JSON_UNESCAPED_SLASHES);
        $fieldsJson = json_encode($normalised, JSON_UNESCAPED_SLASHES);

        $result = $this->redis->eval(
            self::ADD_SCRIPT,
            3,
            $this->idsKey,
            $this->hashKey($entityId),
            $this->changesKey,
            $entityId,
            $fieldsJson,
            $changeJson
        );
        return (int) $result === 1;
    }

    /**
     * Atomic update + emit. Two concurrent callers cannot interleave
     * mutation A → mutation B → emit B → emit A because the Lua
     * script holds the Redis main thread for the duration.
     */
    public function updateField(string $entityId, string $field, string $value): bool
    {
        $result = $this->redis->eval(
            self::UPDATE_SCRIPT,
            3,
            $this->idsKey,
            $this->hashKey($entityId),
            $this->changesKey,
            $entityId,
            $field,
            $value,
            (string) $this->nowMs()
        );
        return (int) $result === 1;
    }

    public function deleteRecord(string $entityId): bool
    {
        $result = $this->redis->eval(
            self::DELETE_SCRIPT,
            3,
            $this->idsKey,
            $this->hashKey($entityId),
            $this->changesKey,
            $entityId,
            (string) $this->nowMs()
        );
        return (int) $result === 1;
    }

    /**
     * Block up to $timeoutSeconds for the next change event. Returns
     * null on timeout.
     *
     * @return ?array<string,mixed>
     */
    public function nextChange(int $timeoutSeconds): ?array
    {
        // BRPOP on the changes list. Predis returns [key, value] on
        // success or null on timeout.
        $result = $this->redis->brpop([$this->changesKey], $timeoutSeconds);
        if ($result === null || $result === false) {
            return null;
        }
        $raw = is_array($result) ? ($result[1] ?? null) : null;
        if (!is_string($raw)) {
            return null;
        }
        $change = json_decode($raw, true);
        if (!is_array($change)) {
            return null;
        }
        // cjson serialises null as a real null on the consumer side
        // for the delete case; normalise that into PHP null.
        if (array_key_exists('fields', $change) && $change['fields'] === null) {
            $change['fields'] = null;
        }
        return $change;
    }

    public function reads(): int
    {
        return (int) ($this->redis->get($this->readsKey) ?? 0);
    }

    public function resetReads(): void
    {
        $this->redis->del([$this->readsKey]);
    }

    private function nowMs(): float
    {
        return microtime(true) * 1000.0;
    }
}
