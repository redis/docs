package main

import (
	"math"
	"math/rand"
)

type SensorDefinition struct {
	SensorID    string
	Zone        string
	Unit        string
	MinValue    float64
	MaxValue    float64
	Baseline    float64
	Drift       float64
	SpikeChance float64
	SpikeSize   float64
}

func (s SensorDefinition) SensorType() string {
	return "power_consumption"
}

func (s SensorDefinition) Key() string {
	return "ts:sensor:" + s.SensorType() + ":" + s.SensorID
}

func (s SensorDefinition) Labels() map[string]string {
	return map[string]string{
		"site":        "demo",
		"sensor_type": s.SensorType(),
		"sensor_id":   s.SensorID,
		"zone":        s.Zone,
		"unit":        s.Unit,
	}
}

type SensorSample struct {
	Sensor SensorDefinition
	Value  float64
}

var Sensors = []SensorDefinition{
	{
		SensorID:    "power-1",
		Zone:        "north",
		Unit:        "watts",
		MinValue:    320.0,
		MaxValue:    920.0,
		Baseline:    480.0,
		Drift:       18.0,
		SpikeChance: 0.10,
		SpikeSize:   120.0,
	},
	{
		SensorID:    "power-2",
		Zone:        "central",
		Unit:        "watts",
		MinValue:    320.0,
		MaxValue:    920.0,
		Baseline:    560.0,
		Drift:       20.0,
		SpikeChance: 0.08,
		SpikeSize:   140.0,
	},
	{
		SensorID:    "power-3",
		Zone:        "south",
		Unit:        "watts",
		MinValue:    320.0,
		MaxValue:    920.0,
		Baseline:    640.0,
		Drift:       24.0,
		SpikeChance: 0.12,
		SpikeSize:   160.0,
	},
}

type SensorSimulator struct {
	sensors []SensorDefinition
	values  map[string]float64
}

func NewSensorSimulator(sensors []SensorDefinition) *SensorSimulator {
	values := make(map[string]float64, len(sensors))
	for _, sensor := range sensors {
		values[sensor.SensorID] = sensor.Baseline
	}
	return &SensorSimulator{
		sensors: sensors,
		values:  values,
	}
}

func (s *SensorSimulator) NextSamples() []SensorSample {
	samples := make([]SensorSample, 0, len(s.sensors))
	for _, sensor := range s.sensors {
		current := s.values[sensor.SensorID]
		drift := randomBetween(-sensor.Drift, sensor.Drift)
		pull := (sensor.Baseline - current) * 0.12
		value := current + drift + pull

		if sensor.SpikeChance > 0 && rand.Float64() < sensor.SpikeChance {
			value += randomBetween(0.5, 1.0) * sensor.SpikeSize
		}

		value = math.Max(sensor.MinValue, math.Min(sensor.MaxValue, value))
		value = math.Round(value*100) / 100

		s.values[sensor.SensorID] = value
		samples = append(samples, SensorSample{
			Sensor: sensor,
			Value:  value,
		})
	}

	return samples
}

func randomBetween(min, max float64) float64 {
	return min + rand.Float64()*(max-min)
}
