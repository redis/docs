"""
Simulated sensor definitions and value generation for the dashboard demo.
"""

from __future__ import annotations

from dataclasses import dataclass
import random


@dataclass(frozen=True)
class SensorDefinition:
    """Describe one simulated power sensor and its Redis labels."""

    sensor_id: str
    zone: str
    unit: str
    min_value: float
    max_value: float
    baseline: float
    drift: float
    spike_chance: float = 0.0
    spike_size: float = 0.0

    @property
    def sensor_type(self) -> str:
        return "power_consumption"

    @property
    def key(self) -> str:
        return f"ts:sensor:{self.sensor_type}:{self.sensor_id}"

    @property
    def labels(self) -> dict[str, str]:
        return {
            "site": "demo",
            "sensor_type": self.sensor_type,
            "sensor_id": self.sensor_id,
            "zone": self.zone,
            "unit": self.unit,
        }


SENSORS: list[SensorDefinition] = [
    SensorDefinition(
        sensor_id="power-1",
        zone="north",
        unit="watts",
        min_value=320.0,
        max_value=920.0,
        baseline=480.0,
        drift=18.0,
        spike_chance=0.10,
        spike_size=120.0,
    ),
    SensorDefinition(
        sensor_id="power-2",
        zone="central",
        unit="watts",
        min_value=320.0,
        max_value=920.0,
        baseline=560.0,
        drift=20.0,
        spike_chance=0.08,
        spike_size=140.0,
    ),
    SensorDefinition(
        sensor_id="power-3",
        zone="south",
        unit="watts",
        min_value=320.0,
        max_value=920.0,
        baseline=640.0,
        drift=24.0,
        spike_chance=0.12,
        spike_size=160.0,
    ),
]


class SensorSimulator:
    """Generate smooth, bounded readings for a set of sensors."""

    def __init__(self, sensors: list[SensorDefinition]) -> None:
        self.sensors = sensors
        self._values = {sensor.sensor_id: sensor.baseline for sensor in sensors}

    def next_samples(self) -> list[tuple[SensorDefinition, float]]:
        samples: list[tuple[SensorDefinition, float]] = []

        for sensor in self.sensors:
            current = self._values[sensor.sensor_id]
            drift = random.uniform(-sensor.drift, sensor.drift)
            pull = (sensor.baseline - current) * 0.12
            value = current + drift + pull

            if sensor.spike_chance and random.random() < sensor.spike_chance:
                value += random.uniform(0.5, 1.0) * sensor.spike_size

            value = max(sensor.min_value, min(sensor.max_value, value))
            value = round(value, 2)

            self._values[sensor.sensor_id] = value
            samples.append((sensor, value))

        return samples
