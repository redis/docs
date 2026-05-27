/**
 * Simulated sensor definitions and value generation for the dashboard demo.
 */

class SensorDefinition {
  constructor({
    sensorId,
    zone,
    unit,
    minValue,
    maxValue,
    baseline,
    drift,
    spikeChance = 0,
    spikeSize = 0,
  }) {
    this.sensorId = sensorId;
    this.zone = zone;
    this.unit = unit;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.baseline = baseline;
    this.drift = drift;
    this.spikeChance = spikeChance;
    this.spikeSize = spikeSize;
  }

  get sensorType() {
    return "power_consumption";
  }

  get key() {
    return `ts:sensor:${this.sensorType}:${this.sensorId}`;
  }

  get labels() {
    return {
      site: "demo",
      sensor_type: this.sensorType,
      sensor_id: this.sensorId,
      zone: this.zone,
      unit: this.unit,
    };
  }
}

const SENSORS = [
  new SensorDefinition({
    sensorId: "power-1",
    zone: "north",
    unit: "watts",
    minValue: 320.0,
    maxValue: 920.0,
    baseline: 480.0,
    drift: 18.0,
    spikeChance: 0.10,
    spikeSize: 120.0,
  }),
  new SensorDefinition({
    sensorId: "power-2",
    zone: "central",
    unit: "watts",
    minValue: 320.0,
    maxValue: 920.0,
    baseline: 560.0,
    drift: 20.0,
    spikeChance: 0.08,
    spikeSize: 140.0,
  }),
  new SensorDefinition({
    sensorId: "power-3",
    zone: "south",
    unit: "watts",
    minValue: 320.0,
    maxValue: 920.0,
    baseline: 640.0,
    drift: 24.0,
    spikeChance: 0.12,
    spikeSize: 160.0,
  }),
];

class SensorSimulator {
  constructor(sensors) {
    this.sensors = sensors;
    this.values = new Map(sensors.map((sensor) => [sensor.sensorId, sensor.baseline]));
  }

  nextSamples() {
    const samples = [];

    for (const sensor of this.sensors) {
      const current = this.values.get(sensor.sensorId);
      const drift = this.randomBetween(-sensor.drift, sensor.drift);
      const pull = (sensor.baseline - current) * 0.12;
      let value = current + drift + pull;

      if (sensor.spikeChance > 0 && Math.random() < sensor.spikeChance) {
        value += this.randomBetween(0.5, 1.0) * sensor.spikeSize;
      }

      value = Math.max(sensor.minValue, Math.min(sensor.maxValue, value));
      value = Math.round(value * 100) / 100;

      this.values.set(sensor.sensorId, value);
      samples.push([sensor, value]);
    }

    return samples;
  }

  randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }
}

module.exports = {
  SensorDefinition,
  SensorSimulator,
  SENSORS,
};
