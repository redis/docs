package main

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	SampleIntervalMS = 500
	WindowMS         = 12_000
	BucketMS         = 3_000
	RetentionMS      = 12_000
)

type Point struct {
	Timestamp int64   `json:"timestamp"`
	Value     float64 `json:"value"`
}

type Bucket struct {
	Start int64    `json:"start"`
	End   int64    `json:"end"`
	Avg   *float64 `json:"avg"`
	Min   *float64 `json:"min"`
	Max   *float64 `json:"max"`
}

type LatestValue struct {
	Timestamp int64   `json:"timestamp"`
	Value     float64 `json:"value"`
}

type SensorSnapshot struct {
	SensorID  string       `json:"sensor_id"`
	Zone      string       `json:"zone"`
	Unit      string       `json:"unit"`
	Latest    *LatestValue `json:"latest"`
	RawPoints []Point      `json:"raw_points"`
	Buckets   []Bucket     `json:"buckets"`
}

type DashboardSnapshot struct {
	Now              int64            `json:"now"`
	WindowMS         int64            `json:"window_ms"`
	BucketMS         int64            `json:"bucket_ms"`
	SampleIntervalMS int64            `json:"sample_interval_ms"`
	RetentionMS      int64            `json:"retention_ms"`
	Sensors          []SensorSnapshot `json:"sensors"`
}

type RedisTimeSeriesStore struct {
	client  *redis.Client
	sensors []SensorDefinition
}

func NewRedisTimeSeriesStore(client *redis.Client, sensors []SensorDefinition) *RedisTimeSeriesStore {
	return &RedisTimeSeriesStore{
		client:  client,
		sensors: sensors,
	}
}

func (s *RedisTimeSeriesStore) EnsureSchema(ctx context.Context) error {
	for _, sensor := range s.sensors {
		args := []interface{}{"TS.CREATE", sensor.Key(), "RETENTION", RetentionMS, "LABELS"}
		for label, value := range sensor.Labels() {
			args = append(args, label, value)
		}

		if err := s.client.Do(ctx, args...).Err(); err != nil {
			if !strings.Contains(strings.ToLower(err.Error()), "key already exists") {
				return err
			}
		}
	}
	return nil
}

func (s *RedisTimeSeriesStore) AddSamples(ctx context.Context, samples []SensorSample) error {
	if len(samples) == 0 {
		return nil
	}

	timestampMS := time.Now().UnixMilli()
	args := []interface{}{"TS.MADD"}
	for _, sample := range samples {
		args = append(args, sample.Sensor.Key(), timestampMS, sample.Value)
	}
	return s.client.Do(ctx, args...).Err()
}

func (s *RedisTimeSeriesStore) DashboardSnapshot(ctx context.Context) (*DashboardSnapshot, error) {
	nowMS := time.Now().UnixMilli()
	startMS := nowMS - WindowMS
	sensorSnapshots := make([]SensorSnapshot, 0, len(s.sensors))

	for _, sensor := range s.sensors {
		aggregateStartMS := startMS - BucketMS
		rawPoints, err := s.rangeQuery(ctx, sensor, startMS, nowMS)
		if err != nil {
			return nil, err
		}
		minPoints, err := s.aggregateQuery(ctx, sensor, aggregateStartMS, nowMS, "min")
		if err != nil {
			return nil, err
		}
		maxPoints, err := s.aggregateQuery(ctx, sensor, aggregateStartMS, nowMS, "max")
		if err != nil {
			return nil, err
		}
		avgPoints, err := s.aggregateQuery(ctx, sensor, aggregateStartMS, nowMS, "avg")
		if err != nil {
			return nil, err
		}
		latest, err := s.latestQuery(ctx, sensor)
		if err != nil {
			return nil, err
		}

		minByBucket := indexPoints(minPoints)
		maxByBucket := indexPoints(maxPoints)
		avgByBucket := indexPoints(avgPoints)

		firstBucketStart := (startMS / BucketMS) * BucketMS
		if firstBucketStart > startMS {
			firstBucketStart -= BucketMS
		}
		lastBucketStart := (nowMS / BucketMS) * BucketMS

		buckets := make([]Bucket, 0)
		for bucketStart := firstBucketStart; bucketStart <= lastBucketStart; bucketStart += BucketMS {
			bucketEnd := bucketStart + BucketMS
			buckets = append(buckets, Bucket{
				Start: bucketStart,
				End:   bucketEnd,
				Avg:   avgByBucket[bucketStart],
				Min:   minByBucket[bucketStart],
				Max:   maxByBucket[bucketStart],
			})
		}

		sensorSnapshots = append(sensorSnapshots, SensorSnapshot{
			SensorID:  sensor.SensorID,
			Zone:      sensor.Zone,
			Unit:      sensor.Unit,
			Latest:    latest,
			RawPoints: rawPoints,
			Buckets:   buckets,
		})
	}

	return &DashboardSnapshot{
		Now:              nowMS,
		WindowMS:         WindowMS,
		BucketMS:         BucketMS,
		SampleIntervalMS: SampleIntervalMS,
		RetentionMS:      RetentionMS,
		Sensors:          sensorSnapshots,
	}, nil
}

func (s *RedisTimeSeriesStore) rangeQuery(ctx context.Context, sensor SensorDefinition, startMS, endMS int64) ([]Point, error) {
	result, err := s.client.Do(ctx, "TS.RANGE", sensor.Key(), startMS, endMS).Result()
	if err != nil {
		return nil, err
	}
	return parsePoints(result)
}

func (s *RedisTimeSeriesStore) aggregateQuery(
	ctx context.Context,
	sensor SensorDefinition,
	startMS,
	endMS int64,
	aggregation string,
) ([]Point, error) {
	result, err := s.client.Do(
		ctx,
		"TS.RANGE",
		sensor.Key(),
		startMS,
		endMS,
		"ALIGN",
		0,
		"AGGREGATION",
		aggregation,
		BucketMS,
	).Result()
	if err != nil {
		return nil, err
	}
	return parsePoints(result)
}

func (s *RedisTimeSeriesStore) latestQuery(ctx context.Context, sensor SensorDefinition) (*LatestValue, error) {
	result, err := s.client.Do(ctx, "TS.GET", sensor.Key()).Result()
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "tsdb: the key does not exist") {
			return nil, nil
		}
		return nil, err
	}

	row, ok := result.([]interface{})
	if !ok || len(row) < 2 {
		return nil, nil
	}

	timestamp, err := asInt64(row[0])
	if err != nil {
		return nil, err
	}
	value, err := asFloat64(row[1])
	if err != nil {
		return nil, err
	}

	return &LatestValue{
		Timestamp: timestamp,
		Value:     value,
	}, nil
}

func parsePoints(result interface{}) ([]Point, error) {
	rows, ok := result.([]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected TS response type %T", result)
	}

	points := make([]Point, 0, len(rows))
	for _, row := range rows {
		pair, ok := row.([]interface{})
		if !ok || len(pair) < 2 {
			continue
		}

		timestamp, err := asInt64(pair[0])
		if err != nil {
			return nil, err
		}
		value, err := asFloat64(pair[1])
		if err != nil {
			return nil, err
		}

		points = append(points, Point{
			Timestamp: timestamp,
			Value:     value,
		})
	}

	return points, nil
}

func indexPoints(points []Point) map[int64]*float64 {
	indexed := make(map[int64]*float64, len(points))
	for _, point := range points {
		value := point.Value
		indexed[point.Timestamp] = &value
	}
	return indexed
}

func asInt64(value interface{}) (int64, error) {
	switch typed := value.(type) {
	case int64:
		return typed, nil
	case string:
		return strconv.ParseInt(typed, 10, 64)
	case []byte:
		return strconv.ParseInt(string(typed), 10, 64)
	default:
		return strconv.ParseInt(fmt.Sprint(value), 10, 64)
	}
}

func asFloat64(value interface{}) (float64, error) {
	switch typed := value.(type) {
	case float64:
		return typed, nil
	case int64:
		return float64(typed), nil
	case string:
		return strconv.ParseFloat(typed, 64)
	case []byte:
		return strconv.ParseFloat(string(typed), 64)
	default:
		return strconv.ParseFloat(fmt.Sprint(value), 64)
	}
}
