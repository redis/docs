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

{{<note>}} This feature is currently in public preview and is not supported on production workloads. Only new installations of the Redis operator are supported at this time. The steps for [creating the RedisEnterpriseCluster (REC)]({{<relref "operate/kubernetes/deployment/quick-start/#create-a-redis-enterprise-cluster-rec">}}) and other custom resources remain the same.{{</note>}}

## Prerequisites

- A [supported distribution]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions.md" >}}) of Kubernetes.
- At least three worker nodes.
- [Kubernetes client (kubectl)](https://kubernetes.io/docs/tasks/tools/).
- [Helm 3.10 or later](https://helm.sh/docs/intro/install/).

## Install

1. Add the `redis` repository.

    ```sh
    helm repo add redis-enterprise https://helm.redis.io/
    ```

1. Install the Helm chart into a new namespace.

    ```sh
    helm install <operator-name> redis/redis-enterprise-operator \
        -- version <release-name> \
        -- namespace <namespace-name> \
        -- create-namespace
    ```

To install with Openshift, add `--set openshift.mode=true`.

To monitor the installation add the `--debug` flag. The installation runs several jobs synchronously and may take few minutes to complete.

### Install from local directory

1. Find the latest release on the [redis-enterprise-k8s-docs Github](https://github.com/RedisLabs/redis-enterprise-k8s-docs/releases) and download the `tar.gz` source code into a local directory.

1. Install the Helm chart from your local directory.

    ```sh
    helm install <release-name> <path-to-chart> \
        -- namespace <namespace-name> \
        -- create-namespace
    ```

To install with Openshift, add `--set openshift.mode=true`.

To monitor the installation add the `--debug` flag. The installation runs several jobs synchronously and may take few minutes to complete.

### Specify values during install

1. View configurable values with `helm show values redis/redis --version <release-name>`.

1. Install the Helm chart, overriding specific value defaults using `--set`.

    ```sh
    helm install <operator-name> redis/redis-enterprise-operator \
        -- version <release-name> \
        -- namespace <namespace-name> \
        -- create-namespace
        --set <key1>=<value1> \
        --set <key2>=<value2>
    ```

### Install with values file

1. View configurable values with `helm show values redis/redis-enterprise-operator --version <release-name>`.

1. Create a YAML file containing the configuration values you want to set.
1. Create a YAML file to specify the values you want to configure.

1. Install the chart with the `--values` option.

    ```sh
    helm install <operator-name> redis/redis-enterprise-operator \
        -- version <release-name> \
        -- namespace <namespace-name> \
        -- create-namespace \
        -- values <path-to-values-file>
    ```

## Uninstall

1. Delete any custom resources managed by the operator. See [Delete custom resources]({{<relref "content/operate/kubernetes/re-clusters/delete-custom-resources.md">}}) for detailed steps. Custom resources must be deleted in the correct order to avoid errors.

1. Uninstall the helm chart.

    ```sh
    helm uninstall <release-name>
    ```

This removes all Kubernetes resources associated with the chart and deletes the release.

{{<note>}}Custom Resource Definitions (CRDs) installed by the chart are not removed during chart uninstallation. To remove them manually after uninstalling the chart, run `kubectl delete crds -l app=redis-enterprise`.{{</note>}}

## Known limitations

- Only new installations of the Redis operator are supported at this time. The steps for [creating the RedisEnterpriseCluster (REC)]({{<relref "operate/kubernetes/deployment/quick-start/#create-a-redis-enterprise-cluster-rec">}}) and other custom resources remain the same.
- Upgrades and migrations are not supported.
- The chart doesn't include configuration options for multiple namespaces, rack-awareness, and Vault integration. The steps for configuring these options remains the same.
- The chart has had limited testing in advanced setups, including Active-Active configurations, air-gapped deployments, and IPv6/dual-stack environments.