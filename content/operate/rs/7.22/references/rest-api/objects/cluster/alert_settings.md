---
Title: Alert settings object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the alert_settings object used with Redis Enterprise Software
  REST API calls.
linkTitle: alert_settings
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/cluster/alert_settings/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| cluster_certs_about_to_expire | <span class="break-all">[cluster_alert_settings_with_threshold]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold" >}})</span> object | Cluster certificate will expire in x days |
| cluster_even_node_count | boolean (default: false) | True high availability requires an odd number of nodes in the cluster |
| cluster_flash_overcommit | boolean (default: false) | Flash memory committed to databases is larger than cluster total flash memory |
| cluster_inconsistent_rl_sw | boolean (default: false) | Some nodes in the cluster are running different versions of Redis Enterprise software |
| cluster_internal_bdb | boolean (default: false) | Issues with internal cluster databases |
| cluster_license_about_to_expire | <span class="break-all">[cluster_alert_settings_with_threshold]({{<relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold">}})</span> object | Cluster license will expire in x days. This alert is enabled by default. Its default threshold is 7 days before license expiration. |
| cluster_multiple_nodes_down | boolean (default: false) | Multiple cluster nodes are down (this might cause data loss) |
| cluster_node_joined | boolean (default: false) | New node joined the cluster |
| cluster_node_remove_abort_completed | boolean (default: false) | Cancel node remove operation completed |
| cluster_node_remove_abort_failed | boolean (default: false) | Cancel node remove operation failed |
| cluster_node_remove_completed | boolean (default: false) | Node removed from the cluster |
| cluster_node_remove_failed | boolean (default: false) | Failed to remove a node from the cluster |
| cluster_ocsp_query_failed | boolean (default: false) | Failed to query the OCSP server |
| cluster_ocsp_status_revoked | boolean (default: false) | OCSP certificate status is REVOKED |
| cluster_ram_overcommit | boolean (default: false) | RAM committed to databases is larger than cluster total RAM |
| cluster_too_few_nodes_for_replication | boolean (default: false) | Replication requires at least 2 nodes in the cluster |
| node_aof_slow_disk_io | boolean (default: false) | AOF reaching disk I/O limits
| node_checks_error | boolean (default: false) | Some node checks have failed |
| node_cpu_utilization | <span class="break-all">[cluster_alert_settings_with_threshold]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold" >}})</span> object | Node CPU utilization has reached the threshold value (% of the utilization limit) |
| node_ephemeral_storage | <span class="break-all">[cluster_alert_settings_with_threshold]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold" >}})</span> object | Node ephemeral storage has reached the threshold value (% of the storage limit) |
| node_failed | boolean (default: false) | Node failed |
| node_free_flash | <span class="break-all">[cluster_alert_settings_with_threshold]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold" >}})</span> object | Node flash storage has reached the threshold value (% of the storage limit) |
| node_insufficient_disk_aofrw | boolean (default: false) | Insufficient AOF disk space |
| node_internal_certs_about_to_expire | <span class="break-all">[cluster_alert_settings_with_threshold]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold" >}})</span> object| Internal certificate on node will expire in x days |
| node_memory | <span class="break-all">[cluster_alert_settings_with_threshold]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold" >}})</span> object | Node memory has reached the threshold value (% of the memory limit) |
| node_net_throughput | <span class="break-all">[cluster_alert_settings_with_threshold]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold" >}})</span> object | Node network throughput has reached the threshold value (bytes/s) |
| node_persistent_storage | <span class="break-all">[cluster_alert_settings_with_threshold]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster/cluster_alert_settings_with_threshold" >}})</span> object | Node persistent storage has reached the threshold value (% of the storage limit) |
