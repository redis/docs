// EXAMPLE: observability
// REMOVE_START
package main

// REMOVE_END

// STEP_START import
import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/extra/redisotel-native/v9"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// STEP_END

func main() {
	// STEP_START setup_meter_provider
	ctx := context.Background()

	// Create OTLP exporter that sends metrics to the collector
	// Default endpoint is localhost:4317 (gRPC)
	exporter, err := otlpmetricgrpc.New(ctx,
		otlpmetricgrpc.WithInsecure(), // Use insecure for local development
		// For production, configure TLS and authentication:
		// otlpmetricgrpc.WithEndpoint("your-collector:4317"),
		// otlpmetricgrpc.WithTLSCredentials(...),
	)

	if err != nil {
		panic(err)
	}

	// Create resource with service name
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(
				fmt.Sprintf("go-redis-examples:%d", time.Now().Unix()),
			),
		),
	)

	if err != nil {
		panic(err)
	}

	// Create meter provider with periodic reader
	// Metrics are exported every 10 seconds
	meterProvider := metric.NewMeterProvider(
		metric.WithResource(res),
		metric.WithReader(
			metric.NewPeriodicReader(exporter,
				metric.WithInterval(10*time.Second),
			),
		),
	)

	// Set the global meter provider
	otel.SetMeterProvider(meterProvider)
	// STEP_END

	// STEP_START client_config
	// Initialize OTel instrumentation BEFORE creating Redis clients
	otelInstance := redisotel.GetObservabilityInstance()
	config := redisotel.NewConfig().
		// You must enable OTel explicitly
		WithEnabled(true).
		// Enable the metric groups you want to collect. Use bitwise OR
		// to combine multiple groups. The default is `MetricGroupAll`
		// which includes all groups.
		WithMetricGroups(redisotel.MetricGroupFlagCommand |
			redisotel.MetricGroupFlagConnectionBasic |
			redisotel.MetricGroupFlagResiliency |
			redisotel.MetricGroupFlagConnectionAdvanced).
		// Filter which commands to track
		WithIncludeCommands([]string{"GET", "SET"}).
		WithExcludeCommands([]string{"DEBUG", "SLOWLOG"}).
		// Privacy controls
		WithHidePubSubChannelNames(true).
		WithHideStreamNames(true).
		// Custom histogram buckets
		WithHistogramBuckets([]float64{
			0.0001, // 0.1ms
			0.0005, // 0.5ms
			0.001,  // 1ms
			0.005,  // 5ms
			0.01,   // 10ms
			0.05,   // 50ms
			0.1,    // 100ms
			0.5,    // 500ms
			1.0,    // 1s
			5.0,    // 5s
			10.0,   // 10s
		})

	if err := otelInstance.Init(config); err != nil {
		panic(err)
	}
	// STEP_END

	// STEP_START use_redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	rdb.Set(ctx, "key", "value", 0)
	v, err := rdb.Get(ctx, "key").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(v)
	// STEP_END

	// STEP_START shutdown
	rdb.Close()
	otelInstance.Shutdown()
	meterProvider.Shutdown(context.Background())
	// STEP_END
}
