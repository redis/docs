---
Title: Install Redis Enterprise Helm chart
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Install the Redis Enterprise for Kubernetes version 7.8.Wisconsin using helm charts.
linkTitle: Helm
weight: 11
---

Helm charts provide a simple way to install the Redis Enterprise for Kubernetes operator in just a few steps. For more information about Helm, go to [https://helm.sh/docs/](https://helm.sh/docs/).

{{<note>}} This feature is currently in public preview and is not supported on production workloads. Only new installations of Redis operator are supported at this time. The steps to [create the RedisEnterpriseCluster (REC)]({{<relref "operate/kubernetes/deployment/quick-start/#create-a-redis-enterprise-cluster-rec">}}) and other custom resources remain the same.{{</note>}}

## Prerequisites

- [Supported distribution]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions.md" >}}) of Kubernetes
- Three or more worker nodes
- [Kubernetes client (kubectl)](https://kubernetes.io/docs/tasks/tools/)
- [Helm 3.10 or later](https://helm.sh/docs/intro/install/)

## Install

1. Add the `redis-enterprise-helm` repository.

    ```sh
    helm repo add redis-enterprise-helm https://helm.redis.io/
    ```

1. Install the Helm chart in a new namespace.

    ```sh
    helm install <my-redis-enterprise-operator> redis-enterprise-helm/redis-enterprise-operator \
        -- version <release-name> \
        -- namespace <namespace-name> \
        -- create-namespace
    ```

To install with Openshift, add `--set openshift.mode=true`.

To monitor the install add the `--debug` flag. The installation runs several jobs synchonously and may take a minute or two to complete.

### Install from local directory

DOWNLOAD TGZ FILE
HELM INSTALL FROM LOCAL DIRECTORY

## Configuration

See [`values.yaml`](https://github.com/RedisLabs/redis-enterprise-operator/blob/master/deploy/helm/redis-enterprise-operator/values.yaml) for the default values.

### Install with values file

### Install and override specific default values

## Uninstall

1. Delete any custom resources managed by the operator in the following order. LINK TO UNINSTALL PAGE, POSSIBLY EMBED
    ```sh
    kubectl delete redb <name>
    kubectl delete rerc <name>
    kubectl delete reaadb <name>
    kubectl delete rec <name>
    ```

## Known limitations
