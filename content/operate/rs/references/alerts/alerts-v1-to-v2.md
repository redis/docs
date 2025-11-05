---
Title: Transition cluster manager alerts to Prometheus alerts
alwaysopen: false
categories:
- docs
- operate
- rs
description: Transition from internal cluster manager alerts to external monitoring alerts using Prometheus.
linkTitle: Transition cluster manager alerts to Prometheus
weight: 50
---

As Redis Enterprise Software transitions from the [deprecated monitoring system]({{<relref "/operate/rs/monitoring/v1_monitoring">}}) to the [new metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}), some internal cluster manager alerts were deprecated in favor of external monitoring solutions.

You can use the following table to transition from the deprecated alerts and set up equivalent alerts in Prometheus with [PromQL (Prometheus Query Language)](https://prometheus.io/docs/prometheus/latest/querying/basics/):

| Cluster manager alert | Equivalent PromQL | Description |
|-----------------------|-------------------|-------------|
| BdbSizeAlert | <span class="break-all">`sum by(db, cluster) (redis_server_used_memory) / sum by(db, cluster) (redis_server_maxmemory) > 0.8`</span> | Redis server memory usage exceeds 80% |
| NodeMemoryAlert | <span class="break-all">`(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.7`</span> | Node memory usage exceeds 70% |
| NodeFreeFlashAlert | <span class="break-all">`(node_available_flash_bytes - node_bigstore_free_bytes) / node_available_flash_bytes > 0.7`</span> | Node flash storage usage exceeds 70% |
| NodeEphemeralStorageAlert | <span class="break-all">`(node_ephemeral_storage_avail_bytes - node_ephemeral_storage_free_bytes) / node_ephemeral_storage_avail_bytes > 0.7`</span> | Node ephemeral storage usage exceeds 70% |
| NodePersistentStorageAlert | <span class="break-all">`(node_persistent_storage_avail_bytes - node_persistent_storage_free_bytes) / node_persistent_storage_avail_bytes > 0.7`</span> | Node persistent storage usage exceeds 70% |
