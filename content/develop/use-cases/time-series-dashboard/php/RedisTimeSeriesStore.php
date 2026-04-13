<?php

use Predis\Client as PredisClient;

final class RedisTimeSeriesStore
{
    public const SAMPLE_INTERVAL_MS = 500;
    public const WINDOW_MS = 12000;
    public const BUCKET_MS = 3000;
    public const RETENTION_MS = 12000;

    /** @var list<SensorDefinition> */
    private array $sensors;

    /**
     * @param list<SensorDefinition> $sensors
     */
    public function __construct(
        private readonly PredisClient $redis,
        array $sensors
    ) {
        $this->sensors = $sensors;
    }

    public function ensureSchema(): void
    {
        foreach ($this->sensors as $sensor) {
            $args = ['TS.CREATE', $sensor->key(), 'RETENTION', (string) self::RETENTION_MS, 'LABELS'];
            foreach ($sensor->labels() as $label => $value) {
                $args[] = $label;
                $args[] = $value;
            }

            try {
                $this->redis->executeRaw($args);
            } catch (\Throwable $exception) {
                if (stripos($exception->getMessage(), 'key already exists') === false) {
                    throw $exception;
                }
            }
        }
    }

    /**
     * @param list<array{sensor: SensorDefinition, value: float}> $samples
     */
    public function addSamples(array $samples, ?int $timestampMs = null): void
    {
        if ($samples === []) {
            return;
        }

        $timestampMs ??= (int) floor(microtime(true) * 1000);
        $args = ['TS.MADD'];
        foreach ($samples as $sample) {
            $args[] = $sample['sensor']->key();
            $args[] = (string) $timestampMs;
            $args[] = $this->formatFloat($sample['value']);
        }

        $this->redis->executeRaw($args);
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboardSnapshot(): array
    {
        $nowMs = (int) floor(microtime(true) * 1000);
        $startMs = $nowMs - self::WINDOW_MS;
        $aggregateStartMs = $startMs - self::BUCKET_MS;
        $sensorPayload = [];

        foreach ($this->sensors as $sensor) {
            $rawPoints = $this->range($sensor, $startMs, $nowMs);
            $minPoints = $this->aggregate($sensor, $aggregateStartMs, $nowMs, 'min');
            $maxPoints = $this->aggregate($sensor, $aggregateStartMs, $nowMs, 'max');
            $avgPoints = $this->aggregate($sensor, $aggregateStartMs, $nowMs, 'avg');
            $latest = $this->latest($sensor);

            $minByBucket = $this->indexByTimestamp($minPoints);
            $maxByBucket = $this->indexByTimestamp($maxPoints);
            $avgByBucket = $this->indexByTimestamp($avgPoints);

            $firstBucketStart = intdiv($startMs, self::BUCKET_MS) * self::BUCKET_MS;
            if ($firstBucketStart > $startMs) {
                $firstBucketStart -= self::BUCKET_MS;
            }
            $lastBucketStart = intdiv($nowMs, self::BUCKET_MS) * self::BUCKET_MS;

            $buckets = [];
            for ($bucketStart = $firstBucketStart; $bucketStart <= $lastBucketStart; $bucketStart += self::BUCKET_MS) {
                $buckets[] = [
                    'start' => $bucketStart,
                    'end' => $bucketStart + self::BUCKET_MS,
                    'avg' => $avgByBucket[$bucketStart] ?? null,
                    'min' => $minByBucket[$bucketStart] ?? null,
                    'max' => $maxByBucket[$bucketStart] ?? null,
                ];
            }

            $sensorPayload[] = [
                'sensor_id' => $sensor->sensorId,
                'zone' => $sensor->zone,
                'unit' => $sensor->unit,
                'latest' => $latest,
                'raw_points' => $rawPoints,
                'buckets' => $buckets,
            ];
        }

        return [
            'now' => $nowMs,
            'window_ms' => self::WINDOW_MS,
            'bucket_ms' => self::BUCKET_MS,
            'sample_interval_ms' => self::SAMPLE_INTERVAL_MS,
            'retention_ms' => self::RETENTION_MS,
            'sensors' => $sensorPayload,
        ];
    }

    /**
     * @return list<array{timestamp: int, value: float}>
     */
    private function range(SensorDefinition $sensor, int $startMs, int $endMs): array
    {
        $response = $this->redis->executeRaw([
            'TS.RANGE',
            $sensor->key(),
            (string) $startMs,
            (string) $endMs,
        ]);

        return $this->parsePoints($response);
    }

    /**
     * @return list<array{timestamp: int, value: float}>
     */
    private function aggregate(SensorDefinition $sensor, int $startMs, int $endMs, string $aggregation): array
    {
        $response = $this->redis->executeRaw([
            'TS.RANGE',
            $sensor->key(),
            (string) $startMs,
            (string) $endMs,
            'ALIGN',
            '0',
            'AGGREGATION',
            $aggregation,
            (string) self::BUCKET_MS,
        ]);

        return $this->parsePoints($response);
    }

    /**
     * @return array{timestamp: int, value: float}|null
     */
    private function latest(SensorDefinition $sensor): ?array
    {
        try {
            $response = $this->redis->executeRaw(['TS.GET', $sensor->key()]);
        } catch (\Throwable $exception) {
            if (stripos($exception->getMessage(), 'does not exist') !== false) {
                return null;
            }

            throw $exception;
        }

        if (!is_array($response) || count($response) < 2) {
            return null;
        }

        return [
            'timestamp' => (int) $response[0],
            'value' => (float) $response[1],
        ];
    }

    /**
     * @param mixed $response
     * @return list<array{timestamp: int, value: float}>
     */
    private function parsePoints(mixed $response): array
    {
        if (!is_array($response)) {
            return [];
        }

        $points = [];
        foreach ($response as $row) {
            if (!is_array($row) || count($row) < 2) {
                continue;
            }

            $points[] = [
                'timestamp' => (int) $row[0],
                'value' => (float) $row[1],
            ];
        }

        return $points;
    }

    /**
     * @param list<array{timestamp: int, value: float}> $points
     * @return array<int, float>
     */
    private function indexByTimestamp(array $points): array
    {
        $indexed = [];
        foreach ($points as $point) {
            $indexed[$point['timestamp']] = $point['value'];
        }

        return $indexed;
    }

    private function formatFloat(float $value): string
    {
        return rtrim(rtrim(number_format($value, 6, '.', ''), '0'), '.');
    }
}
