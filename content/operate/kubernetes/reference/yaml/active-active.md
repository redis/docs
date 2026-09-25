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

For complete deployment instructions, see [Active-Active databases](/content/operate/kubernetes/active-active/_index.md).

## Applying the configuration

To deploy Active-Active databases using these YAML files, follow [Create Active-Active database (REAADB)](/content/operate/kubernetes/active-active/create-reaadb.md), which provides detailed instructions for preparing clusters, creating RERC resources, and deploying REAADB configurations.

## Namespace examples

A namespace is an abstraction used by Kubernetes to support multiple virtual clusters on the same physical cluster.

`ns-illinois.yaml` is used in [Create Active-Active database](/content/operate/kubernetes/active-active/create-reaadb.md#example-values).

{{<embed-yaml "k8s/ns-illinois.md" "ns-illinois.yaml">}}

`ns-virginia.yaml` is used in [Create Active-Active database](/content/operate/kubernetes/active-active/create-reaadb.md#example-values).

{{<embed-yaml "k8s/ns-virginia.md" "ns-virginia.yaml">}}

## REC examples

A Redis Enterprise cluster is a collection of Redis Enterprise nodes that pools system resources across nodes and supports multi-tenant database instances.

`rec-chicago.yaml` is used in [Create Active-Active database](/content/operate/kubernetes/active-active/create-reaadb.md#prerequisites) and [Create RERC](/content/operate/kubernetes/active-active/create-reaadb.md#create-rerc).

{{<embed-yaml "k8s/rec-chicago.md" "rec-chicago.yaml">}}

`rec-arlington.yaml` is used in [Create Active-Active database](/content/operate/kubernetes/active-active/create-reaadb.md#prerequisites) and [Create RERC](/content/operate/kubernetes/active-active/create-reaadb.md#create-rerc).

{{<embed-yaml "k8s/rec-arlington.md" "rec-arlington.yaml">}}

## RERC examples

RedisEnterpriseRemoteCluster represents a remote participating cluster.

`rerc-ohare.yaml` is used in the [Create RERC](/content/operate/kubernetes/active-active/create-reaadb.md#create-rerc) section.

{{<embed-yaml "k8s/rerc-ohare.md" "rerc-ohare.yaml">}}

`rerc-raegan.yaml` is used in the [Create RERC](/content/operate/kubernetes/active-active/create-reaadb.md#create-rerc) section.

{{<embed-yaml "k8s/rerc-raegan.md" "rerc-raegan.yaml">}}

### RERC configuration

- [metadata.name](/content/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api.md#appredislabscomv1alpha1): Unique name for this remote cluster reference
- [spec.recName](/content/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api.md#spec): Name of the remote REC
- [spec.recNamespace](/content/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api.md#spec): Namespace of the remote REC
- [spec.apiFqdnUrl](/content/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api.md#spec): API endpoint URL for the remote cluster
- [spec.dbFqdnSuffix](/content/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api.md#spec): Database hostname suffix for the remote cluster
- [spec.secretName](/content/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api.md#spec): Secret containing authentication credentials

Edit the values in the downloaded YAML file for your specific setup, updating the remote cluster details, API endpoints, and secret names to match your actual environment.

## Active-Active database examples

Active-Active databases are geo-distributed databases that span multiple Redis Enterprise clusters and use multi-primary replication and conflict-free replicated data types (CRDTs).

`reaadb-boeing.yaml` is used in the [Create Active-Active database](/content/operate/kubernetes/active-active/create-reaadb.md#create-reaadb) section.

{{<embed-yaml "k8s/reaadb-boeing.md" "reaadb-boeing.yaml">}}

### REAADB configuration

- [metadata.name](/content/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api.md#appredislabscomv1alpha1): Active-Active database name
- [spec.participatingClusters](/content/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api.md#specparticipatingclusters): List of RERC names that participate in this database
- [spec.globalConfigurations](/content/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api.md#specglobalconfigurations): Database settings applied to all participating clusters

Edit the downloaded YAML file to add global database settings such as memory allocation, shard count, replication settings, database secrets, Redis modules, and database-specific Redis configuration.

## Related documentation

- [Active-Active databases (index)](/content/operate/kubernetes/active-active/_index.md)
- [Prepare participating clusters](/content/operate/kubernetes/active-active/prepare-clusters.md)
- [Create Active-Active database (REAADB)](/content/operate/kubernetes/active-active/create-reaadb.md)
- [Edit global configuration](/content/operate/kubernetes/active-active/global-config.md)
- [Sync global database secret](/content/operate/kubernetes/active-active/global-db-secret.md)
- [RERC API reference](/content/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api.md)
- [REAADB API reference](/content/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api.md)
- [Networking configuration](/content/operate/kubernetes/networking/_index.md)
