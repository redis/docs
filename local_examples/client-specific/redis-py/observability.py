# EXAMPLE: observability
# STEP_START import
# OpenTelemetry metrics API
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter

# Redis observability API
from redis.observability.providers import get_observability_instance
from redis.observability.config import OTelConfig, MetricGroup

# Redis client
import redis
# STEP_END

# STEP_START setup_meter_provider
exporter = OTLPMetricExporter(endpoint="http://localhost:4318/v1/metrics")
reader = PeriodicExportingMetricReader(exporter=exporter, export_interval_millis=10000)
provider = MeterProvider(metric_readers=[reader])
metrics.set_meter_provider(provider)
# STEP_END

# STEP_START client_config
otel = get_observability_instance()
otel.init(OTelConfig(
    # Metric groups to enable (default: CONNECTION_BASIC | RESILIENCY)
    metric_groups=[
        MetricGroup.CONNECTION_BASIC,    # Connection creation time, relaxed timeout
        MetricGroup.CONNECTION_ADVANCED, # Connection wait time, timeouts, closed connections
        MetricGroup.COMMAND,             # Command execution duration
        MetricGroup.RESILIENCY,          # Error counts, maintenance notifications
        MetricGroup.PUBSUB,              # PubSub message counts
        MetricGroup.STREAMING,           # Stream message lag
        MetricGroup.CSC,                 # Client Side Caching metrics
    ],

    # Filter which commands to track
    include_commands=['GET', 'SET', 'HGET'],  # Only track these commands
    # OR
    exclude_commands=['DEBUG', 'SLOWLOG'],    # Track all except these

    # Privacy controls
    hide_pubsub_channel_names=True,  # Hide channel names in PubSub metrics
    hide_stream_names=True,          # Hide stream names in streaming metrics

    # Custom histogram buckets
    buckets_operation_duration=[
        0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1,
        0.25, 0.5, 1, 2.5,
    ],
    buckets_stream_processing_duration=[
        0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1,
        0.25, 0.5, 1, 2.5,
    ],
    buckets_connection_create_time=[
        0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1,
        0.25, 0.5, 1, 2.5,
    ],
    buckets_connection_wait_time=[
        0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1,
        0.25, 0.5, 1, 2.5,
    ],
))
# STEP_END

# STEP_START use_redis
r = redis.Redis(host='localhost', port=6379)
r.set('key', 'value')  # Metrics collected automatically
r.get('key')
# STEP_END

# STEP_START shutdown
otel.shutdown()
# STEP_END
