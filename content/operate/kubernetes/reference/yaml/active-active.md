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

For complete deployment instructions, see [Active-Active databases]({{< relref "/operate/kubernetes/active-active" >}}).

## Namespace examples

A namespace is an abstraction used by Kubernetes to support multiple virtual clusters on the same physical cluster.

`ns-illinois.yaml` is used in [Create Active-Active database]({{< relref "/operate/kubernetes/active-active/create-reaadb#example-values" >}}).

{{<embed-yaml "k8s/ns-illinois.md" "ns-illinois.yaml">}}

`ns-virginia.yaml` is used in [Create Active-Active database]({{< relref "/operate/kubernetes/active-active/create-reaadb#example-values" >}}).

{{<embed-yaml "k8s/ns-virginia.md" "ns-virginia.yaml">}}

## REC examples

A Redis Enterprise cluster is a collection of Redis Enterprise nodes that pools system resources across nodes and supports multi-tenant database instances.

`rec-chicago.yaml` is used in [Create Active-Active database]({{< relref "/operate/kubernetes/active-active/create-reaadb#prerequisites" >}}) and [Create RERC]({{< relref "/operate/kubernetes/active-active/create-reaadb#create-rerc" >}}).

{{<embed-yaml "k8s/rec-chicago.md" "rec-chicago.yaml">}}

`rec-arlington.yaml` is used in [Create Active-Active database]({{< relref "/operate/kubernetes/active-active/create-reaadb#prerequisites" >}}) and [Create RERC]({{< relref "/operate/kubernetes/active-active/create-reaadb#create-rerc" >}}).

{{<embed-yaml "k8s/rec-arlington.md" "rec-arlington.yaml">}}

## RERC examples

RedisEnterpriseRemoteCluster represents a remote participating cluster.

`rerc-ohare.yaml` is used in the [Create RERC]({{< relref "/operate/kubernetes/active-active/create-reaadb#create-rerc" >}}) section.

{{<embed-yaml "k8s/rerc-ohare.md" "rerc-ohare.yaml">}}

`rerc-raegan.yaml` is used in the [Create RERC]({{< relref "/operate/kubernetes/active-active/create-reaadb#create-rerc" >}}) section.

{{<embed-yaml "k8s/rerc-raegan.md" "rerc-raegan.yaml">}}

### RERC configuration

- `metadata.name`: Unique name for this remote cluster reference
- `spec.recName`: Name of the remote REC
- `spec.recNamespace`: Namespace of the remote REC
- `spec.apiFqdnUrl`: API endpoint URL for the remote cluster
- `spec.dbFqdnSuffix`: Database hostname suffix for the remote cluster
- `spec.secretName`: Secret containing authentication credentials

Edit the values in the downloaded YAML file for your specific setup, updating the remote cluster details, API endpoints, and secret names to match your actual environment.

## Active-Active database examples

Active-Active databases are geo-distributed databases that span multiple Redis Enterprise clusters and use multi-primary replication and conflict-free replicated data types (CRDTs).

`reaadb-boeing.yaml` is used in [Create Active-Active database]({{< relref "/operate/kubernetes/active-active/create-reaadb#create-reaadb" >}}) section.

{{<embed-yaml "k8s/reaadb-boeing.md" "reaadb-boeing.yaml">}}

### REAADB configuration

- `metadata.name`: Active-Active database name
- `spec.participatingClusters`: List of RERC names that participate in this database
- `spec.globalConfigurations`: Database settings applied to all participating clusters

Edit the downloaded YAML file to add global database settings such as memory allocation, shard count, replication settings, database secrets, Redis modules, and database-specific Redis configuration.

## Applying the configuration

To deploy Active-Active databases using these YAML files, follow [Create Active-Active database (REAADB)]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}}), which provides detailed instructions for preparing clusters, creating RERC resources, and deploying REAADB configurations.

## Related documentation

- [Create Active-Active database (REAADB)]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}})
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api" >}})
- [RERC API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api" >}})
- [Networking configuration]({{< relref "/operate/kubernetes/networking" >}})
