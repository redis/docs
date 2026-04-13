<?php

final class SensorDefinition
{
    public function __construct(
        public readonly string $sensorId,
        public readonly string $zone,
        public readonly string $unit,
        public readonly float $minValue,
        public readonly float $maxValue,
        public readonly float $baseline,
        public readonly float $drift,
        public readonly float $spikeChance,
        public readonly float $spikeSize
    ) {
    }

    public function sensorType(): string
    {
        return 'power_consumption';
    }

    public function key(): string
    {
        return 'ts:sensor:' . $this->sensorType() . ':' . $this->sensorId;
    }

    /**
     * @return array<string, string>
     */
    public function labels(): array
    {
        return [
            'site' => 'demo',
            'sensor_type' => $this->sensorType(),
            'sensor_id' => $this->sensorId,
            'zone' => $this->zone,
            'unit' => $this->unit,
        ];
    }
}

final class SensorCatalog
{
    /**
     * @return list<SensorDefinition>
     */
    public static function sensors(): array
    {
        return [
            new SensorDefinition(
                sensorId: 'power-1',
                zone: 'north',
                unit: 'watts',
                minValue: 320.0,
                maxValue: 920.0,
                baseline: 480.0,
                drift: 18.0,
                spikeChance: 0.10,
                spikeSize: 120.0
            ),
            new SensorDefinition(
                sensorId: 'power-2',
                zone: 'central',
                unit: 'watts',
                minValue: 320.0,
                maxValue: 920.0,
                baseline: 560.0,
                drift: 20.0,
                spikeChance: 0.08,
                spikeSize: 140.0
            ),
            new SensorDefinition(
                sensorId: 'power-3',
                zone: 'south',
                unit: 'watts',
                minValue: 320.0,
                maxValue: 920.0,
                baseline: 640.0,
                drift: 24.0,
                spikeChance: 0.12,
                spikeSize: 160.0
            ),
        ];
    }
}

final class SensorSimulator
{
    /**
     * @param list<SensorDefinition> $sensors
     */
    public function __construct(private readonly array $sensors)
    {
    }

    /**
     * @param array<string, float> $state
     * @return array{state: array<string, float>, samples: array<int, array{sensor: SensorDefinition, value: float}>}
     */
    public function nextSamples(array $state): array
    {
        $samples = [];
        $nextState = $state;

        foreach ($this->sensors as $sensor) {
            $current = $nextState[$sensor->sensorId] ?? $sensor->baseline;
            $drift = $this->randomBetween(-$sensor->drift, $sensor->drift);
            $pull = ($sensor->baseline - $current) * 0.12;
            $value = $current + $drift + $pull;

            if ($sensor->spikeChance > 0 && $this->randomFloat() < $sensor->spikeChance) {
                $value += $this->randomBetween(0.5, 1.0) * $sensor->spikeSize;
            }

            $value = max($sensor->minValue, min($sensor->maxValue, $value));
            $value = round($value, 2);

            $nextState[$sensor->sensorId] = $value;
            $samples[] = [
                'sensor' => $sensor,
                'value' => $value,
            ];
        }

        return [
            'state' => $nextState,
            'samples' => $samples,
        ];
    }

    /**
     * @return array<string, float>
     */
    public function initialState(): array
    {
        $state = [];
        foreach ($this->sensors as $sensor) {
            $state[$sensor->sensorId] = $sensor->baseline;
        }

        return $state;
    }

    private function randomBetween(float $min, float $max): float
    {
        return $min + ($this->randomFloat() * ($max - $min));
    }

    private function randomFloat(): float
    {
        return mt_rand() / mt_getrandmax();
    }
}
