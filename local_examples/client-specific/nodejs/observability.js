// EXAMPLE: observability
// STEP_START import
import { createClient, OpenTelemetry } from 'redis';
import { metrics } from '@opentelemetry/api';
import {
  ConsoleMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader
} from '@opentelemetry/sdk-metrics';
// STEP_END

// STEP_START setup_meter_provider
const reader = new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
});

const meterProvider = new MeterProvider({
    readers: [reader]
});

metrics.setGlobalMeterProvider(meterProvider);
// STEP_END

// STEP_START client_config
OpenTelemetry.init({
    metrics: {
        enabled: true,
        enabledMetricGroups: ["command", "pubsub", "streaming", "resiliency"],
        includeCommands: ["GET", "HSET", "XREADGROUP", "PUBLISH"],
        excludeCommands: ["SET"],
        hidePubSubChannelNames: true,
        hideStreamNames: false,
        bucketsOperationDuration: [0.001, 0.01, 0.1, 1],
        bucketsStreamProcessingDuration: [0.01, 0.1, 1, 5],
    },
});
// STEP_END

// STEP_START use_redis
const client = createClient();

await client.connect();

await client.set('key', 'value');
const value = await client.get('key');
console.log(value); // >>> value
// STEP_END

// STEP_START shutdown
await meterProvider.forceFlush();
await meterProvider.shutdown();
await client.destroy();
// STEP_END
