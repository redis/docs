---
Title: Local metrics storage
alwaysopen: false
categories:
- docs
- integrate
- rs
description: Keep a history of v2 metrics on each Redis Software node and include it in support packages.
group: observability
linkTitle: Local metrics storage
summary: Keep a history of v2 metrics on each Redis Software node for troubleshooting and support packages.
type: integration
weight: 49
tocEmbedHeaders: true
---

Local metrics storage is available as of [Redis Software version 8.2](/content/operate/rs/release-notes/rs-8-2-releases/_index.md).

Local metrics storage is an optional history layer on top of the [v2 metrics stream engine](/content/operate/rs/monitoring/metrics_stream_engine/_index.md) stored on each node. [Support packages](#support-packages) include this history automatically.

## Tiers

Local storage collects metrics in two tiers:

- **Standard** collects metrics about every 30 seconds whenever local storage is enabled.

- **Granular** collects metrics every second, but only while you run it. You start and stop it on demand, on one node or on all nodes. Use it for short troubleshooting windows, not for continuous collection. Granular collection stops automatically after a maximum duration if you don't stop it first. Its data stays on disk after collection stops, so support packages still include it. The data is deleted automatically after a cleanup delay. You can also delete it yourself, but only after collection stops on every node you're deleting data from.

## Resource cost

Use a tier only if the node has enough spare CPU and memory.

**Standard** is expected to raise CPU use by about 3–5% and memory use by about 2.5–5.5%. For example:

- If CPU is at about 50%, you can enable standard. CPU is expected to rise to about 52%.
- If CPU is at about 95%, add headroom first. Otherwise, CPU could reach 98–100%.
- If you have 2.6 GB of memory used and 1 GB available, you can enable standard. Memory use is expected to rise by about 65–143 MB.
- If you have 2.6 GB of memory used and 100 MB available, add headroom first. Otherwise, the increase could use up the available memory.

**Granular** is expected to raise CPU use by about 95–125%, which can nearly double it, and memory use by about 4–5.5%. For example:

- If CPU is at about 30%, you can run granular collection. CPU is expected to rise to about 59–68%. The increase lasts only while granular collection runs. After collection stops, CPU is expected to return to its previous level.
- If CPU is at about 50%, add headroom first. Otherwise, CPU demand could reach 98–113% and saturate the node.
- If you have 2.6 GB of memory used and 1 GB available, you can run granular collection. Memory use is expected to rise by about 104–143 MB. The increase lasts only while granular collection runs. After collection stops, memory use is expected to return to its previous level.
- If you have 2.6 GB of memory used and 100 MB available, add headroom first. Otherwise, the increase could use up the available memory.

## Storage-pressure retention

Each node keeps its stored metrics within its size limit by shortening retention when disk usage runs high. Every minute, the node compares the size of its stored data with `local_storage_max_size_mb`:

- When usage rises above 90% of the limit, the node's effective retention drops by one day, to a minimum of one day.
- When usage falls below 50% of the limit, effective retention returns to the configured `local_storage_retention_days`.

A busy or undersized node can therefore keep less history than you configured. To compare configured and effective retention for each node, see [metrics status](/content/operate/rs/references/rest-api/requests/metrics/_index.md#get-metrics-status).

## Support packages

When local storage is enabled, [support packages](/content/operate/rs/installing-upgrading/creating-support-package.md) include each node's stored metrics. You don't need to run a separate command or set a flag, and you can't leave the metrics out.

- **Format**: The metrics are Prometheus-compatible time series database (TSDB) blocks. You can load them into your own Prometheus-compatible system and query them with Prometheus Query Language (PromQL), even if you had no external monitoring in place when the issue happened.
- **History**: Each node contributes all the metrics it currently retains, up to its effective retention.
- **Granular data**: Included after collection stops, until the data is deleted.

For where the metrics are in the package, see [support package files](/content/operate/rs/installing-upgrading/creating-support-package.md#node-support-package-files).

## Manage local storage

### Enable local storage

Local storage is disabled by default. To enable it, turn on `metrics_local_storage_service` with the [REST API](/content/operate/rs/references/rest-api/requests/cluster/services_configuration.md) or the [CLI](/content/operate/rs/references/cli-utilities/rladmin/cluster/config.md). The setting applies to every node in the cluster.

- **REST API**: Send a `PUT /v1/cluster/services_configuration` request with the following body:

    ```json
    {
      "metrics_local_storage_service": {
        "operating_mode": "enabled"
      }
    }
    ```

- **CLI**: Run the following `rladmin` command:

    ```sh
    rladmin cluster config services metrics_local_storage_service enabled
    ```

### Set the standard tier's size limit and retention

To change how much disk space the standard tier uses and how long it keeps metrics, update `local_storage_max_size_mb` and `local_storage_retention_days` with the [REST API](/content/operate/rs/references/rest-api/requests/metrics_config/_index.md) or the [CLI](/content/operate/rs/references/cli-utilities/rladmin/metrics.md#metrics-config). The following examples set a 2048 MB limit and 14-day retention.

- **REST API**: Send a `PUT /v1/metrics_config` request with the following body:

    ```json
    {
      "local_storage_max_size_mb": 2048,
      "local_storage_retention_days": 14
    }
    ```

- **CLI**: Run the following `rladmin` command:

    ```sh
    rladmin metrics config local_storage_max_size_mb 2048 local_storage_retention_days 14
    ```

### Check local storage status

To check each node's store state, disk usage, and configured and effective retention, use the [REST API](/content/operate/rs/references/rest-api/requests/metrics/_index.md#get-metrics-status) or the [CLI](/content/operate/rs/references/cli-utilities/rladmin/metrics.md#metrics-status).

- **REST API**: Send the following request. To check a single node, add `?node_uid=<node-id>`.

    ```sh
    GET /v1/metrics/status
    ```

- **CLI**: Run the following `rladmin` command. To check a single node, add `node <node-id>`.

    ```sh
    rladmin metrics status
    ```

### Start, stop, or check granular collection

To control granular collection, use the [REST API](/content/operate/rs/references/rest-api/requests/metrics/granular.md) or the [CLI](/content/operate/rs/references/cli-utilities/rladmin/metrics.md#metrics-granular-start). Each command applies to all nodes unless you specify a node.

- **REST API**: Send one of the following requests. To target a single node, add `?node_uid=<node-id>`.

    ```sh
    POST /v1/metrics/granular/start
    POST /v1/metrics/granular/stop
    GET /v1/metrics/granular/status
    ```

- **CLI**: Run one of the following `rladmin` commands. To target a single node, add `node <node-id>`.

    ```sh
    rladmin metrics granular start
    rladmin metrics granular stop
    rladmin metrics granular status
    ```

### Delete granular data

To delete granular data before the cleanup delay passes, use the [REST API](/content/operate/rs/references/rest-api/requests/metrics/granular.md#delete-granular-data) or the [CLI](/content/operate/rs/references/cli-utilities/rladmin/metrics.md#metrics-granular-cleanup). Stop granular collection on the affected nodes first.

- **REST API**: Send the following request. To target a single node, add `?node_uid=<node-id>`.

    ```sh
    DELETE /v1/metrics/granular/data
    ```

- **CLI**: Run the following `rladmin` command. To target a single node, add `node <node-id>`.

    ```sh
    rladmin metrics granular cleanup
    ```

### Change the granular maximum duration and cleanup delay

To change how long granular collection runs and how long its data is kept after it stops, update [`granular_metrics_job_settings`](/content/operate/rs/references/rest-api/objects/job_scheduler/granular_metrics_job_settings.md) with the [REST API](/content/operate/rs/references/rest-api/requests/job_scheduler/_index.md). Both values are in seconds. The following example sets a 2-hour maximum duration and a 48-hour cleanup delay.

- **REST API**: Send a `PUT /v1/job_scheduler` request with the following body:

    ```json
    {
      "granular_metrics_job_settings": {
        "granular_max_duration": 7200,
        "granular_cleanup_delay": 172800
      }
    }
    ```

### Get the stored metrics

To get the stored metrics, [create a support package](/content/operate/rs/installing-upgrading/creating-support-package.md) with the [REST API](/content/operate/rs/references/rest-api/requests/cluster/debuginfo.md) or the [CLI](/content/operate/rs/references/cli-utilities/rladmin/cluster/debug_info.md).

- **REST API**: Send the following request:

    ```sh
    GET /v1/cluster/debuginfo
    ```

- **CLI**: Run the following `rladmin` command:

    ```sh
    rladmin cluster debug_info
    ```
