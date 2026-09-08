---
Title: Metrics configuration object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents the cluster's v2 metrics stream engine configuration
linkTitle: metrics_config
weight: $weight
---

An API object that represents the cluster-wide configuration of the [v2 metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}).

| Name | Type | Default | Description |
|------|------|---------|-------------|
| key_distribution_enabled | boolean | `false` | Enables histogram metrics that report the distribution of key sizes and key item counts |
| key_size_buckets | string | `""` | Bucket boundaries for the key size distribution histogram. An empty value derives the boundaries from Redis. Otherwise, a comma-separated list of strictly ascending boundaries. Each boundary is a number (bytes) with an optional uppercase unit suffix `B`, `K`, `M`, `G`, `T`, `P`, or `E`; the numeric part must be between 1 and 1023. |
| key_items_buckets | string | `""` | Bucket boundaries for the key item-count distribution histogram. Uses the same format as `key_size_buckets`. |
| local_storage_max_size_mb | integer | `1024` | Maximum size, in MB, of on-node metrics storage (minimum 1) |
| local_storage_retention_days | integer | `8` | Number of days metrics are retained in on-node storage (minimum 1) |
| expose_db_tags | boolean | `false` | When `true`, enables export of database tags through the `db_tags` metric |
| metrics_tag_keys_exposed | array of strings | `[]` | The database tag keys that are eligible to be exported as labels (maximum 50 keys). Each key must follow the [tag key validation rules]({{<relref "/operate/rs/databases/configure/db-tags#tag-validation-rules">}}). Keys are matched against database tag keys exactly and case-sensitively. |
| max_requests_in_flight | integer | `2` | Maximum number of metrics requests the cluster processes concurrently. Set to 0 to remove the limit. |
