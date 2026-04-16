/**
 * Redis TimeSeries helpers for the rolling three-sensor dashboard demo.
 */

const SAMPLE_INTERVAL_MS = 500;
const WINDOW_MS = 12_000;
const BUCKET_MS = 3_000;
const RETENTION_MS = 12_000;

class RedisTimeSeriesStore {
  constructor({ redisClient, sensors }) {
    this.redis = redisClient;
    this.sensors = sensors;
  }

  async ensureSchema() {
    for (const sensor of this.sensors) {
      const args = ["TS.CREATE", sensor.key, "RETENTION", String(RETENTION_MS), "LABELS"];
      for (const [label, value] of Object.entries(sensor.labels)) {
        args.push(label, value);
      }

      try {
        await this.redis.sendCommand(args);
      } catch (error) {
        if (!String(error.message || error).toLowerCase().includes("key already exists")) {
          throw error;
        }
      }
    }
  }

  async addSamples(samples) {
    if (samples.length === 0) {
      return;
    }

    const timestampMs = Date.now();
    const args = ["TS.MADD"];
    for (const [sensor, value] of samples) {
      args.push(sensor.key, String(timestampMs), String(value));
    }
    await this.redis.sendCommand(args);
  }

  async range(sensor, startMs, endMs) {
    const points = await this.redis.sendCommand([
      "TS.RANGE",
      sensor.key,
      String(startMs),
      String(endMs),
    ]);

    return points.map(([timestamp, value]) => ({
      timestamp: Number(timestamp),
      value: Number(value),
    }));
  }

  async aggregate(sensor, startMs, endMs, aggregation) {
    const points = await this.redis.sendCommand([
      "TS.RANGE",
      sensor.key,
      String(startMs),
      String(endMs),
      "ALIGN",
      "0",
      "AGGREGATION",
      aggregation,
      String(BUCKET_MS),
    ]);

    return points.map(([timestamp, value]) => ({
      timestamp: Number(timestamp),
      value: Number(value),
    }));
  }

  async latest(sensor) {
    const sample = await this.redis.sendCommand(["TS.GET", sensor.key]);
    if (!sample || sample.length === 0) {
      return null;
    }

    const [timestamp, value] = sample;
    return {
      timestamp: Number(timestamp),
      value: Number(value),
    };
  }

  async dashboardSnapshot() {
    const nowMs = Date.now();
    const startMs = nowMs - WINDOW_MS;
    const sensorsPayload = [];

    for (const sensor of this.sensors) {
      const aggregateStartMs = startMs - BUCKET_MS;
      const [rawPoints, minPoints, maxPoints, avgPoints, latest] = await Promise.all([
        this.range(sensor, startMs, nowMs),
        this.aggregate(sensor, aggregateStartMs, nowMs, "min"),
        this.aggregate(sensor, aggregateStartMs, nowMs, "max"),
        this.aggregate(sensor, aggregateStartMs, nowMs, "avg"),
        this.latest(sensor),
      ]);

      const minByBucket = new Map(minPoints.map((point) => [point.timestamp, point.value]));
      const maxByBucket = new Map(maxPoints.map((point) => [point.timestamp, point.value]));
      const avgByBucket = new Map(avgPoints.map((point) => [point.timestamp, point.value]));

      let firstBucketStart = Math.floor(startMs / BUCKET_MS) * BUCKET_MS;
      if (firstBucketStart > startMs) {
        firstBucketStart -= BUCKET_MS;
      }
      const lastBucketStart = Math.floor(nowMs / BUCKET_MS) * BUCKET_MS;

      const buckets = [];
      for (
        let bucketStart = firstBucketStart;
        bucketStart <= lastBucketStart;
        bucketStart += BUCKET_MS
      ) {
        buckets.push({
          start: bucketStart,
          end: bucketStart + BUCKET_MS,
          avg: avgByBucket.get(bucketStart) ?? null,
          min: minByBucket.get(bucketStart) ?? null,
          max: maxByBucket.get(bucketStart) ?? null,
        });
      }

      sensorsPayload.push({
        sensor_id: sensor.sensorId,
        zone: sensor.zone,
        unit: sensor.unit,
        latest,
        raw_points: rawPoints,
        buckets,
      });
    }

    return {
      now: nowMs,
      window_ms: WINDOW_MS,
      bucket_ms: BUCKET_MS,
      sample_interval_ms: SAMPLE_INTERVAL_MS,
      retention_ms: RETENTION_MS,
      sensors: sensorsPayload,
    };
  }
}

module.exports = {
  RedisTimeSeriesStore,
  SAMPLE_INTERVAL_MS,
  WINDOW_MS,
  BUCKET_MS,
  RETENTION_MS,
};
