<?php

declare(strict_types=1);

use Predis\Client as PredisClient;

/**
 * In-memory stand-in for a slow primary database, with state persisted in
 * Redis under "demo:primary:*" so updates and the read counter survive
 * across stateless PHP requests.
 *
 * Each read sleeps for $readLatencyMs to make the cache hit/miss latency
 * difference visible in the demo UI.
 */
class MockPrimaryStore
{
    private const READS_KEY = 'demo:primary:reads';
    private const RECORDS_KEY_PREFIX = 'demo:primary:product:';
    private const SEED_FLAG_KEY = 'demo:primary:seeded';

    /** @var array<string, array<string, string>> */
    private const SEED_RECORDS = [
        'p-001' => ['id' => 'p-001', 'name' => 'Sourdough Loaf', 'price_cents' => '650', 'stock' => '42'],
        'p-002' => ['id' => 'p-002', 'name' => 'Espresso Beans 250g', 'price_cents' => '1495', 'stock' => '120'],
        'p-003' => ['id' => 'p-003', 'name' => 'Olive Oil 500ml', 'price_cents' => '1200', 'stock' => '8'],
        'p-004' => ['id' => 'p-004', 'name' => 'Sea Salt Flakes', 'price_cents' => '475', 'stock' => '60'],
    ];

    private PredisClient $redis;
    private int $readLatencyMs;

    public function __construct(PredisClient $redis, int $readLatencyMs = 150)
    {
        $this->redis = $redis;
        $this->readLatencyMs = $readLatencyMs;
        $this->ensureSeeded();
    }

    public function readLatencyMs(): int
    {
        return $this->readLatencyMs;
    }

    /** @return string[] */
    public function listIds(): array
    {
        $ids = array_keys(self::SEED_RECORDS);
        sort($ids);
        return $ids;
    }

    /** @return ?array<string, string> */
    public function read(string $id): ?array
    {
        usleep($this->readLatencyMs * 1000);
        $this->redis->incr(self::READS_KEY);
        $record = $this->redis->hgetall(self::RECORDS_KEY_PREFIX . $id);
        return is_array($record) && count($record) > 0 ? $record : null;
    }

    public function updateField(string $id, string $field, string $value): bool
    {
        $key = self::RECORDS_KEY_PREFIX . $id;
        if ((int) $this->redis->exists($key) === 0) {
            return false;
        }
        $this->redis->hset($key, $field, $value);
        return true;
    }

    public function reads(): int
    {
        return (int) ($this->redis->get(self::READS_KEY) ?? 0);
    }

    public function resetReads(): void
    {
        $this->redis->del([self::READS_KEY]);
    }

    private function ensureSeeded(): void
    {
        if ((int) $this->redis->exists(self::SEED_FLAG_KEY) === 1) {
            return;
        }
        foreach (self::SEED_RECORDS as $id => $record) {
            $this->redis->hmset(self::RECORDS_KEY_PREFIX . $id, $record);
        }
        $this->redis->set(self::SEED_FLAG_KEY, '1');
    }
}
