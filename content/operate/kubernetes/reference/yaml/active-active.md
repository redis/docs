---
Title: Active-Active examples
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: YAML examples for Active-Active Redis Enterprise databases across multiple Kubernetes clusters.
linkTitle: Active-Active
weight: 30
---

This page provides YAML examples for deploying Active-Active Redis Enterprise databases across multiple Kubernetes clusters. Active-Active databases provide multi-master replication with conflict resolution, enabling global distribution and local read/write access.

To learn more, see [Active-Active databases]({{< relref "/operate/kubernetes/active-active" >}}).

## Architecture

This example shows a two-cluster Active-Active setup:
- Cluster 1: `rec-chicago` in namespace `ns-chicago`
- Cluster 2: `rec-boston` in namespace `ns-boston`

For complete deployment instructions, see [Active-Active databases]({{< relref "/operate/kubernetes/active-active" >}}).

## RERC for Chicago cluster

Create a RedisEnterpriseRemoteCluster (RERC) resource on each participating cluster that points to the other clusters.

{{<embed-yaml "k8s/rerc.md" "redis-enterprise-remote-cluster.yaml">}}

RERC configuration:
- `metadata.name`: Unique name for this remote cluster reference
- `spec.recName`: Name of the remote REC
- `spec.recNamespace`: Namespace of the remote REC
- `spec.apiFqdnUrl`: API endpoint URL for the remote cluster
- `spec.dbFqdnSuffix`: Database hostname suffix for the remote cluster
- `spec.secretName`: Secret containing authentication credentials

Edit the values in the downloaded YAML file for your specific setup, updating the remote cluster details, API endpoints, and secret names to match your actual environment.

## Active-Active database

The RedisEnterpriseActiveActiveDatabase (REAADB) resource defines the Active-Active database.

{{<embed-yaml "k8s/reaadb.md" "redis-enterprise-active-active-database.yaml">}}

REAADB configuration:
- `metadata.name`: Active-Active database name
- `spec.participatingClusters`: List of RERC names that participate in this database
- `spec.globalConfigurations`: Database settings applied to all participating clusters

Edit the downloaded YAML file to add global database settings such as memory allocation, shard count, replication settings, database secrets, Redis modules, and database-specific Redis configuration.

## Applying the configuration

To deploy Active-Active databases using these YAML files, follow [Create Active-Active database (REAADB)]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}}), which provides detailed instructions for preparing clusters, creating RERC resources, and deploying REAADB configurations.

## Related documentation

- [Create Active-Active database (REAADB)]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}})
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api" >}})
- [RERC API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_remote_cluster_api" >}})
- [Networking configuration]({{< relref "/operate/kubernetes/networking" >}})
