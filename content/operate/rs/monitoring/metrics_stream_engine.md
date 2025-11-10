---
Title: Metrics stream engine for monitoring v2
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: The new metrics stream engine for monitoring Redis Enterprise Software.
hideListLinks: true
linkTitle: Metrics stream engine for monitoring v2
weight: 60
---

The new metrics stream engine is generally available as of [Redis Enterprise Software version 8.0]({{<relref "/operate/rs/release-notes/rs-8-0-releases">}}).

The new metrics stream engine:

- Exposes the v2 Prometheus scraping endpoint at `https://<IP>:8070/v2`.

- Exports all time-series metrics to external monitoring tools such as Grafana, DataDog, NewRelic, and Dynatrace using Prometheus.

- Enables real-time monitoring, including full monitoring during maintenance operations, which provides full visibility into performance during events such as shards' failovers and scaling operations.

## Integrate with external monitoring tools

To integrate Redis Enterprise metrics into your monitoring environment, see the integration guides for [Prometheus and Grafana]({{< relref "/operate/rs/monitoring/prometheus_and_grafana" >}}).

For a detailed tutorial to deploy a complete monitoring stack with Prometheus and Grafana, see [Redis Software Observability with Prometheus and Grafana](https://redis.io/learn/operate/observability/redis-software-prometheus-and-grafana).

Filter [Libraries and tools]({{<relref "/integrate">}}) by "observability" for additional tools and guides.

## Prometheus metrics v2

For a list of all available v2 metrics, see [Prometheus metrics v2]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v2">}}).

The v2 scraping endpoint also exposes metrics for `node_exporter` version 1.8.1. For more information, see the [Prometheus node_exporter GitHub repository](https://github.com/prometheus/node_exporter).

## Transition from Prometheus v1 to Prometheus v2

If you are already using the existing scraping endpoint for integration, do the following to transition from v1 metrics to v2 metrics:

1. Change the `metrics_path` in your Prometheus configuration file from `/` to `/v2` to use the new scraping endpoint.

    Here's an example of the updated scraping configuration in `prometheus.yml`:

    ```yaml
    scrape_configs:
      # Scrape Redis Enterprise
      - job_name: redis-enterprise
        scrape_interval: 30s
        scrape_timeout: 30s
        metrics_path: /v2
        scheme: https
        tls_config:
          insecure_skip_verify: true
        static_configs:
          - targets: ["<cluster_name>:8070"]
    ```

1. Use the metrics tables in [this guide]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}) to transition from v1 metrics to equivalent v2 PromQL.

It is possible to scrape both existing and new endpoints simultaneously, allowing advanced dashboard preparation and a smooth transition.

## Best practices for monitoring

Follow these best practices when monitoring your Redis Enterprise Software cluster using the metrics stream engine.

### Monitor host-level metrics

For cluster health, resources, and node stability, monitor these metrics:

| Group | Metric | Why monitor | Unit |
|-------|--------|-------------|------|
| CPU utilization | `node_cpu_user`,<br />`node_cpu_system` | Detect CPU saturation from Redis or the OS that results in higher latency and queueing. | Seconds (counter) |
| Memory (freeable) | <span class="break-all">`node_memory_MemTotal_bytes`</span>,<br /><span class="break-all">`node_memory_MemFree_bytes`</span>,<br /><span class="break-all">`node_memory_Buffers_bytes`</span>,<br /><span class="break-all">`node_memory_Cached_bytes`</span> | Detect memory pressure early. Low free memory or cache can precede swapping or out-of-memory errors. | Bytes (gauge) |
| Swap usage | <span class="break-all">`node_ephemeral_storage_free`</span> | Monitor memory and disk pressure in your setup. Sustained pressure leads to latency spikes. | Bytes (gauge) |
| Network traffic | <span class="break-all">`node_ingress_bytes`</span>,<br /><span class="break-all">`node_egress_bytes`</span> | Ensure the network interface is not saturated. Protects replication and client responsiveness. | Bytes (counter) |
| Disk space | <span class="break-all">`node_filesystem_avail_bytes`</span>,<br /><span class="break-all">`node_filesystem_size_bytes`</span> | Prevent persistence and logging outages from low disk space. | Bytes (gauge) |
| Cluster state | `has_quorum{…}` | Monitor whether quorum is maintained (1) or lost (0). | Boolean |
| | `node_metrics_up` | Monitor whether the node is connected and reporting to the cluster. | Gauge |
| Licensing | `license_shards_limit` | Track shard capacity limits by type (RAM or flash). | Count |
| Certificates | <span class="break-all">`node_cert_expires_in_seconds`</span> | Avoid downtime from expired node certificates. | Seconds (gauge) |
| Services – CPU | <span class="break-all">`namedprocess_namegroup_cpu_seconds_total`</span> | Identify abnormal CPU usage by platform services that can starve Redis, such as `alert_mgr`, `redis_mgr`, `dmc_proxy`. | Seconds (counter) |
| Services – memory | <span class="break-all">`namedprocess_namegroup_memory_bytes`</span> | Detect memory leaks or outliers in platform services, such as `alert_mgr`, `redis_mgr`, `dmc_proxy`. | Bytes (gauge) |

### Monitor database-level metrics

For database performance, availability, and efficiency, monitor the following metrics:

| Group | Metric | Why monitor | Unit |
|-------|--------|-------------|------|
| Memory | <span class="break-all">`redis_server_used_memory`</span> | Track actual data memory to prevent out-of-memory errors and evictions. | Bytes |
| Memory | `redis_server_allocator_allocated` | Monitor bytes allocated by allocator (includes internal fragmentation). | Bytes |
| Memory | `redis_server_allocator_active` | Monitor bytes in active pages (includes external fragmentation). Use delta/ratio versus allocated to infer defraggable memory. | Bytes |
| Memory | <span class="break-all">`redis_server_active_defrag_running`</span> | Monitor if defragmentation is active and the intended CPU %. High values can affect performance. | % (gauge) |
| Latency | <span class="break-all">`endpoint_read_requests_latency_histogram`</span>,<br /><span class="break-all">`endpoint_write_requests_latency_histogram`</span>,<br /><span class="break-all">`endpoint_other_requests_latency_histogram`</span> | Monitor server-side command latency. | Microseconds |
| High availability | <span class="break-all">`redis_server_master_repl_offset`</span> | Compute replica throughput and lag using deltas over time. | Bytes (counter) |
| High availability | <span class="break-all">`redis_server_master_link_status`</span> | Monitor replica link status (up or down) for early warning of high availability risk. | Status |
| Active-Active | <span class="break-all">`database_syncer_dst_lag`</span>,<br /><span class="break-all">`database_syncer_lag_ms`</span> | Detect cross-region synchronization delays that impact consistency and SLAs. | Milliseconds (gauge) |
| Active-Active | <span class="break-all">`database_syncer_state`</span> | Monitor operational state for troubleshooting synchronization issues. | Gauge |
| Traffic – requests | <span class="break-all">`endpoint_read_requests`</span>,<br /><span class="break-all">`endpoint_write_requests`</span>,<br /><span class="break-all">`endpoint_other_requests`</span> | Monitor workload mix and spikes that drive capacity and latency. Total equals the sum of all three. | Counter |
| Traffic – responses | <span class="break-all">`endpoint_read_responses`</span>,<br /><span class="break-all">`endpoint_write_responses`</span>,<br /><span class="break-all">`endpoint_other_responses`</span> | Validate service responsiveness and symmetry with requests. | Counter |
| Traffic – bytes | <span class="break-all">`endpoint_ingress`</span>,<br /><span class="break-all">`endpoint_egress`</span> | Monitor size trends and watch for sudden growth that impacts egress costs or bandwidth. | Bytes (counter) |
| Egress queue | <span class="break-all">`endpoint_egress_pending`</span>,<br /><span class="break-all">`endpoint_egress_pending_discarded`</span> | Monitor back-pressure and drops that indicate network or client issues. | Bytes (counter) |
| Connections | <span class="break-all">`endpoint_client_connection`</span> | Monitor accepted connections over time and match against client rollouts or spikes. | Counter |
| Connections | <span class="break-all">`endpoint_client_connection_expired`</span> | Monitor connections closed due to TTL expiry, which can indicate idle policy or client issues. | Counter |
| Connections | <span class="break-all">`endpoint_longest_pipeline_histogram`</span> | Monitor long pipelines that can amplify latency bursts and detect misbehaving clients. | Histogram (count) |
| Connections | <span class="break-all">`endpoint_client_connections`</span>,<br /><span class="break-all">`endpoint_client_disconnections`</span>,<br /><span class="break-all">`endpoint_proxy_disconnections`</span> | Monitor connection churn and identify who closed the socket (client versus proxy). Current connections ≈ connections − disconnections. | Counter |
| Cache efficiency | <span class="break-all">`redis_server_db_keys`</span>,<br /><span class="break-all">`redis_server_db_avg_ttl`</span> | Monitor key inventory and TTL coverage to inform eviction strategy. | Counter |
| Cache efficiency | <span class="break-all">`redis_server_evicted_keys	`</span>,<br /><span class="break-all">`redis_server_expired_keys`</span> | Monitor eviction and expiry rates. Frequent evictions indicate memory pressure or poor sizing. | Counter |
| Cache efficiency | `cache_hits`,<br /><span class="break-all">`cache_hit_rate`</span> | Monitor hit rate, which drives read latency and cost. Cache hit rate equals <span class="break-all">cache_hits/(cache_hits+cache_misses)</span>. | Count / Ratio (%) |
| Cache efficiency | <span class="break-all">`endpoint_client_tracking_on_requests`</span>,<br /><span class="break-all">`endpoint_client_tracking_off_requests`</span>,<br /><span class="break-all">`endpoint_disposed_commands_after_client_caching`</span> | Track client-side caching usage and misuse. | Counter |
| Big / complex keys | <span class="break-all">`redis_server_<data_type>_<size_or_items>_<bucket>`</span> | Monitor oversized keys and cardinality that cause fragmentation, slow replication, and CPU spikes. Track to prevent incidents. Examples:<br /><span class="break-all">`strings_sizes_over_512M`</span>,<br /><span class="break-all">`zsets_items_over_8M`</span> | Gauge |
| Security – clients | <span class="break-all">`endpoint_client_expiration_refresh`</span>,<br /><span class="break-all">`endpoint_client_establishment_failures`</span> | Monitor unstable clients or problems with authentication or setup. | Counter |
| Security – LDAP | <span class="break-all">`endpoint_successful_ldap_authentication`</span>,<br /><span class="break-all">`endpoint_failed_ldap_authentication`</span>,<br /><span class="break-all">`endpoint_disconnected_ldap_client`</span> | Monitor authentication health and detect brute-force attacks or misconfigurations. | Counter |
| Security – cert-based | <span class="break-all">`endpoint_successful_cba_authentication`</span>,<br /><span class="break-all">`endpoint_failed_cba_authentication`</span>,<br /><span class="break-all">`endpoint_disconnected_cba_client`</span> | Monitor certificate authentication status and failures. | Counter |
| Security – password | <span class="break-all">`endpoint_disconnected_user_password_client`</span> | Monitor password-authentication client disconnects and correlate with policy changes. | Counter |
| Security – ACL | <span class="break-all">`acl_access_denied_auth`</span>,<br /><span class="break-all">`acl_access_denied_cmd`</span>,<br /><span class="break-all">`acl_access_denied_key`</span>,<br /><span class="break-all">`acl_access_denied_channel`</span> | Monitor unauthorized access attempts and incorrectly scoped ACLs. | Counter |
