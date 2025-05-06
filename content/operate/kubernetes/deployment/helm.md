---
Title: Install Redis Enterprise Helm chart
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Install Redis Enterprise for Kubernetes version 7.8.6 using Helm charts.
linkTitle: Helm
weight: 11
---
Helm charts provide a simple way to install the Redis Enterprise for Kubernetes operator in just a few steps. For more information about Helm, go to [https://helm.sh/docs/](https://helm.sh/docs/).

{{<note>}} This feature is currently in public preview and is not supported on production workloads. Only new installations of the Redis operator are supported at this time. The steps for [creating the RedisEnterpriseCluster (REC)]({{<relref "operate/kubernetes/deployment/quick-start#create-a-redis-enterprise-cluster-rec">}}) and other custom resources remain the same.{{</note>}}

## Prerequisites

- A [supported distribution]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) of Kubernetes.
- At least three worker nodes.
- [Kubernetes client (kubectl)](https://kubernetes.io/docs/tasks/tools/).
- [Helm 3.10 or later](https://helm.sh/docs/intro/install/).

If you suspect your file descriptor limits are below 100k, you must either manually increase limits or [Allow automatic resource adjustment]({{< relref "/operate/kubernetes/security/enable-privileged-mode.md" >}}). Most major cloud providers and standard container runtime configurations set default file descriptor limits well above the minimum required by Redis Enterprise. In these environments, you can safely run without enabling automatic resource adjustment.

### Example values

The steps below use the following placeholders to indicate command line parameters you must provide:

- `<repo-name>` is the name of the repo holding your Helm chart (example: `redis`).
- `<release-name>` is the name you give a specific installation of the Helm chart (example: `my-redis-enterprise-operator`)
- `<chart-version>` is the version of the Helm chart you are installing (example: `7.8.2-2`)
- `<namespace-name>` is the name of the new namespace the Redis operator will run in (example: `ns1`)
- `<path-to-chart>` is the filepath to the Helm chart, if it is stored in a local directory (example: `/home/charts/redis-enterprise-operator`)

## Install

1. Add the Redis repository.

```sh
helm repo add <repo-name> https://helm.redis.io/
```

2. Install the Helm chart into a new namespace.

```sh
helm install <release-name> redis/redis-enterprise-operator \
    --version <chart-version> \
    --namespace <namespace-name> \
    --create-namespace
```

To install with Openshift, add `--set openshift.mode=true`.

To monitor the installation add the `--debug` flag. The installation runs several jobs synchronously and may take a few minutes to complete.

{{<note>}}
If you want the operator to automatically manage file descriptor limits, make sure to set `allowAutoAdjustment=true` when installing the chart. This requires enabling privilege escalation for the Redis Enterprise container. See [Allow automatic resource adjustment]({{< relref "/operate/kubernetes/security/enable-privileged-mode.md" >}}) for more information.
{{</note>}}

### Install from local directory

1. Find the latest release on the [redis-enterprise-k8s-docs](https://github.com/RedisLabs/redis-enterprise-k8s-docs/releases) repo and download the `tar.gz` source code into a local directory.

2. Install the Helm chart from your local directory.

```sh
helm install <release-name> <path-to-chart> \
    --namespace <namespace-name> \
    --create-namespace
```

To install with Openshift, add `--set openshift.mode=true`.

To monitor the installation add the `--debug` flag. The installation runs several jobs synchronously and may take a few minutes to complete.

### Specify values during install

1. View configurable values with `helm show values <repo-name>/<chart-name>`.

2. Install the Helm chart, overriding specific value defaults using `--set`.

{{<note>}}
To enable automatic resource adjustment during installation, include `--set allowAutoAdjustment=true`. This requires elevated container capabilities. For more information, see [Allow automatic resource adjustment]({{< relref "/operate/kubernetes/security/enable-privileged-mode.md" >}}).
{{</note>}}

```sh
helm install <operator-name> redis/redis-enterprise-operator \
    --version <release-name> \
    --namespace <namespace-name> \
    --create-namespace
    --set <key1>=<value1> \
    --set <key2>=<value2>
```

### Install with values file

1. View configurable values with `helm show values <repo-name>/<chart-name>`.

2. Create a YAML file to specify the values you want to configure.

3. Install the chart with the `--values` option.

```sh
helm install <operator-name> redis/redis-enterprise-operator \
    --version <release-name> \
    --namespace <namespace-name> \
    --create-namespace \
    --values <path-to-values-file>
```

## Uninstall

1. Delete any custom resources managed by the operator. See [Delete custom resources]({{<relref "operate/kubernetes/re-clusters/delete-custom-resources">}}) for detailed steps. You must delete custom resources in the correct order to avoid errors.

2. Uninstall the Helm chart.

```sh
helm uninstall <release-name>
```

This removes all Kubernetes resources associated with the chart and deletes the release.

{{<note>}}Custom Resource Definitions (CRDs) installed by the chart are not removed during chart uninstallation. To remove them manually after uninstalling the chart, run `kubectl delete crds -l app=redis-enterprise`.{{</note>}}

## Known limitations

- Only new installations of the Redis operator are supported at this time. The steps for [creating the RedisEnterpriseCluster (REC)]({{<relref "operate/kubernetes/deployment/quick-start#create-a-redis-enterprise-cluster-rec">}}) and other custom resources remain the same.
- Upgrades and migrations are not supported.
- The chart doesn't include configuration options for multiple namespaces, rack-awareness, and Vault integration. The steps for configuring these options remain the same.
- The chart has had limited testing in advanced setups, including Active-Active configurations, air-gapped deployments, and IPv6/dual-stack environments.