//! Simulated sensor definitions and value generation for the dashboard demo.

use rand::Rng;
use std::collections::BTreeMap;

#[derive(Debug, Clone)]
pub struct SensorDefinition {
    pub sensor_id: &'static str,
    pub zone: &'static str,
    pub unit: &'static str,
    pub min_value: f64,
    pub max_value: f64,
    pub baseline: f64,
    pub drift: f64,
    pub spike_chance: f64,
    pub spike_size: f64,
}

impl SensorDefinition {
    pub fn sensor_type(&self) -> &'static str {
        "power_consumption"
    }

    pub fn key(&self) -> String {
        format!("ts:sensor:{}:{}", self.sensor_type(), self.sensor_id)
    }

    pub fn labels(&self) -> BTreeMap<&'static str, &'static str> {
        BTreeMap::from([
            ("site", "demo"),
            ("sensor_type", self.sensor_type()),
            ("sensor_id", self.sensor_id),
            ("zone", self.zone),
            ("unit", self.unit),
        ])
    }
}

#[derive(Debug, Clone)]
pub struct SensorSample {
    pub sensor: SensorDefinition,
    pub value: f64,
}

pub fn sensors() -> Vec<SensorDefinition> {
    vec![
        SensorDefinition {
            sensor_id: "power-1",
            zone: "north",
            unit: "watts",
            min_value: 320.0,
            max_value: 920.0,
            baseline: 480.0,
            drift: 18.0,
            spike_chance: 0.10,
            spike_size: 120.0,
        },
        SensorDefinition {
            sensor_id: "power-2",
            zone: "central",
            unit: "watts",
            min_value: 320.0,
            max_value: 920.0,
            baseline: 560.0,
            drift: 20.0,
            spike_chance: 0.08,
            spike_size: 140.0,
        },
        SensorDefinition {
            sensor_id: "power-3",
            zone: "south",
            unit: "watts",
            min_value: 320.0,
            max_value: 920.0,
            baseline: 640.0,
            drift: 24.0,
            spike_chance: 0.12,
            spike_size: 160.0,
        },
    ]
}

#[derive(Debug, Clone)]
pub struct SensorSimulator {
    sensors: Vec<SensorDefinition>,
    values: BTreeMap<&'static str, f64>,
}

impl SensorSimulator {
    pub fn new(sensors: Vec<SensorDefinition>) -> Self {
        let values = sensors
            .iter()
            .map(|sensor| (sensor.sensor_id, sensor.baseline))
            .collect();

        Self { sensors, values }
    }

    pub fn next_samples(&mut self) -> Vec<SensorSample> {
        let mut rng = rand::thread_rng();
        let mut samples = Vec::with_capacity(self.sensors.len());

        for sensor in &self.sensors {
            let current = *self.values.get(sensor.sensor_id).unwrap_or(&sensor.baseline);
            let drift = random_between(&mut rng, -sensor.drift, sensor.drift);
            let pull = (sensor.baseline - current) * 0.12;
            let mut value = current + drift + pull;

            if sensor.spike_chance > 0.0 && rng.gen::<f64>() < sensor.spike_chance {
                value += random_between(&mut rng, 0.5, 1.0) * sensor.spike_size;
            }

            value = value.clamp(sensor.min_value, sensor.max_value);
            value = (value * 100.0).round() / 100.0;

            self.values.insert(sensor.sensor_id, value);
            samples.push(SensorSample {
                sensor: sensor.clone(),
                value,
            });
        }

        samples
    }
}

fn random_between(rng: &mut impl Rng, min: f64, max: f64) -> f64 {
    min + rng.gen::<f64>() * (max - min)
}
