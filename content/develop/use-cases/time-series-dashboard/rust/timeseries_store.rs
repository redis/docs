//! Redis TimeSeries helpers for the rolling three-sensor dashboard demo.

use crate::sensor_simulator::{SensorDefinition, SensorSample};
use redis::{aio::ConnectionLike, cmd, ErrorKind, RedisError, RedisResult, Value};
use serde::Serialize;
use std::collections::BTreeMap;
use std::time::{SystemTime, UNIX_EPOCH};

pub const SAMPLE_INTERVAL_MS: i64 = 500;
pub const WINDOW_MS: i64 = 12_000;
pub const BUCKET_MS: i64 = 3_000;
pub const RETENTION_MS: i64 = 12_000;

#[derive(Debug, Clone, Serialize)]
pub struct Point {
    pub timestamp: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Bucket {
    pub start: i64,
    pub end: i64,
    pub avg: Option<f64>,
    pub min: Option<f64>,
    pub max: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LatestValue {
    pub timestamp: i64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct SensorSnapshot {
    pub sensor_id: String,
    pub zone: String,
    pub unit: String,
    pub latest: Option<LatestValue>,
    pub raw_points: Vec<Point>,
    pub buckets: Vec<Bucket>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DashboardSnapshot {
    pub now: i64,
    pub window_ms: i64,
    pub bucket_ms: i64,
    pub sample_interval_ms: i64,
    pub retention_ms: i64,
    pub sensors: Vec<SensorSnapshot>,
}

#[derive(Debug, Clone)]
pub struct RedisTimeSeriesStore {
    sensors: Vec<SensorDefinition>,
}

impl RedisTimeSeriesStore {
    pub fn new(sensors: Vec<SensorDefinition>) -> Self {
        Self { sensors }
    }

    pub async fn ensure_schema<C>(&self, con: &mut C) -> RedisResult<()>
    where
        C: ConnectionLike + Send,
    {
        for sensor in &self.sensors {
            let mut command = cmd("TS.CREATE");
            command.arg(sensor.key()).arg("RETENTION").arg(RETENTION_MS).arg("LABELS");
            for (label, value) in sensor.labels() {
                command.arg(label).arg(value);
            }

            let result: RedisResult<Value> = command.query_async(con).await;
            if let Err(error) = result {
                if !is_key_exists_error(&error) {
                    return Err(error);
                }
            }
        }

        Ok(())
    }

    pub async fn add_samples<C>(&self, con: &mut C, samples: &[SensorSample]) -> RedisResult<()>
    where
        C: ConnectionLike + Send,
    {
        if samples.is_empty() {
            return Ok(());
        }

        let timestamp_ms = now_millis()?;
        let mut command = cmd("TS.MADD");
        for sample in samples {
            command.arg(sample.sensor.key()).arg(timestamp_ms).arg(sample.value);
        }

        let _: Value = command.query_async(con).await?;
        Ok(())
    }

    pub async fn dashboard_snapshot<C>(&self, con: &mut C) -> RedisResult<DashboardSnapshot>
    where
        C: ConnectionLike + Send,
    {
        let now_ms = now_millis()?;
        let start_ms = now_ms - WINDOW_MS;
        let aggregate_start_ms = start_ms - BUCKET_MS;
        let mut sensors = Vec::with_capacity(self.sensors.len());

        for sensor in &self.sensors {
            let raw_points = self.range_query(con, sensor, start_ms, now_ms).await?;
            let min_points = self
                .aggregate_query(con, sensor, aggregate_start_ms, now_ms, "min")
                .await?;
            let max_points = self
                .aggregate_query(con, sensor, aggregate_start_ms, now_ms, "max")
                .await?;
            let avg_points = self
                .aggregate_query(con, sensor, aggregate_start_ms, now_ms, "avg")
                .await?;
            let latest = self.latest_query(con, sensor).await?;

            let min_by_bucket = index_points(&min_points);
            let max_by_bucket = index_points(&max_points);
            let avg_by_bucket = index_points(&avg_points);

            let mut first_bucket_start = (start_ms / BUCKET_MS) * BUCKET_MS;
            if first_bucket_start > start_ms {
                first_bucket_start -= BUCKET_MS;
            }
            let last_bucket_start = (now_ms / BUCKET_MS) * BUCKET_MS;

            let mut buckets = Vec::new();
            let mut bucket_start = first_bucket_start;
            while bucket_start <= last_bucket_start {
                buckets.push(Bucket {
                    start: bucket_start,
                    end: bucket_start + BUCKET_MS,
                    avg: avg_by_bucket.get(&bucket_start).copied().flatten(),
                    min: min_by_bucket.get(&bucket_start).copied().flatten(),
                    max: max_by_bucket.get(&bucket_start).copied().flatten(),
                });
                bucket_start += BUCKET_MS;
            }

            sensors.push(SensorSnapshot {
                sensor_id: sensor.sensor_id.to_string(),
                zone: sensor.zone.to_string(),
                unit: sensor.unit.to_string(),
                latest,
                raw_points,
                buckets,
            });
        }

        Ok(DashboardSnapshot {
            now: now_ms,
            window_ms: WINDOW_MS,
            bucket_ms: BUCKET_MS,
            sample_interval_ms: SAMPLE_INTERVAL_MS,
            retention_ms: RETENTION_MS,
            sensors,
        })
    }

    async fn range_query<C>(
        &self,
        con: &mut C,
        sensor: &SensorDefinition,
        start_ms: i64,
        end_ms: i64,
    ) -> RedisResult<Vec<Point>>
    where
        C: ConnectionLike + Send,
    {
        let value: Value = cmd("TS.RANGE")
            .arg(sensor.key())
            .arg(start_ms)
            .arg(end_ms)
            .query_async(con)
            .await?;
        parse_points(value)
    }

    async fn aggregate_query<C>(
        &self,
        con: &mut C,
        sensor: &SensorDefinition,
        start_ms: i64,
        end_ms: i64,
        aggregation: &str,
    ) -> RedisResult<Vec<Point>>
    where
        C: ConnectionLike + Send,
    {
        let value: Value = cmd("TS.RANGE")
            .arg(sensor.key())
            .arg(start_ms)
            .arg(end_ms)
            .arg("ALIGN")
            .arg(0)
            .arg("AGGREGATION")
            .arg(aggregation)
            .arg(BUCKET_MS)
            .query_async(con)
            .await?;
        parse_points(value)
    }

    async fn latest_query<C>(
        &self,
        con: &mut C,
        sensor: &SensorDefinition,
    ) -> RedisResult<Option<LatestValue>>
    where
        C: ConnectionLike + Send,
    {
        let value: Value = match cmd("TS.GET").arg(sensor.key()).query_async(con).await {
            Ok(value) => value,
            Err(error) if is_missing_series_error(&error) => return Ok(None),
            Err(error) => return Err(error),
        };

        match value {
            Value::Bulk(values) if values.len() >= 2 => Ok(Some(LatestValue {
                timestamp: as_i64(&values[0])?,
                value: as_f64(&values[1])?,
            })),
            Value::Nil => Ok(None),
            _ => Ok(None),
        }
    }
}

fn now_millis() -> RedisResult<i64> {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| RedisError::from((ErrorKind::TypeError, "system clock went backwards")))?;

    i64::try_from(duration.as_millis())
        .map_err(|_| RedisError::from((ErrorKind::TypeError, "timestamp overflow")))
}

fn parse_points(value: Value) -> RedisResult<Vec<Point>> {
    let rows = match value {
        Value::Bulk(rows) => rows,
        Value::Nil => return Ok(Vec::new()),
        other => {
            return Err(RedisError::from((
                ErrorKind::TypeError,
                "unexpected TS.RANGE response",
                format!("{other:?}"),
            )))
        }
    };

    let mut points = Vec::with_capacity(rows.len());
    for row in rows {
        let Value::Bulk(pair) = row else {
            continue;
        };
        if pair.len() < 2 {
            continue;
        }

        points.push(Point {
            timestamp: as_i64(&pair[0])?,
            value: as_f64(&pair[1])?,
        });
    }

    Ok(points)
}

fn as_i64(value: &Value) -> RedisResult<i64> {
    match value {
        Value::Int(number) => Ok(*number),
        Value::Data(bytes) => String::from_utf8_lossy(bytes)
            .parse::<i64>()
            .map_err(|_| RedisError::from((ErrorKind::TypeError, "expected integer value"))),
        other => Err(RedisError::from((
            ErrorKind::TypeError,
            "expected integer value",
            format!("{other:?}"),
        ))),
    }
}

fn as_f64(value: &Value) -> RedisResult<f64> {
    match value {
        Value::Int(number) => Ok(*number as f64),
        Value::Data(bytes) => String::from_utf8_lossy(bytes)
            .parse::<f64>()
            .map_err(|_| RedisError::from((ErrorKind::TypeError, "expected floating-point value"))),
        other => Err(RedisError::from((
            ErrorKind::TypeError,
            "expected floating-point value",
            format!("{other:?}"),
        ))),
    }
}

fn index_points(points: &[Point]) -> BTreeMap<i64, Option<f64>> {
    points
        .iter()
        .map(|point| (point.timestamp, Some(point.value)))
        .collect()
}

fn is_key_exists_error(error: &RedisError) -> bool {
    error
        .to_string()
        .to_lowercase()
        .contains("key already exists")
}

fn is_missing_series_error(error: &RedisError) -> bool {
    error
        .to_string()
        .to_lowercase()
        .contains("tsdb: the key does not exist")
}
