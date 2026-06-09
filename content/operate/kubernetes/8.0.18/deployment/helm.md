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
url: '/operate/kubernetes/8.0.18/deployment/helm/'
---
Helm charts provide a simple way to install the Redis Enterprise for Kubernetes operator in just a few steps. For more information about Helm, go to [https://helm.sh/docs/](https://helm.sh/docs/).

## Prerequisites

- A [supported distribution]({{< relref "/operate/kubernetes/8.0.18/reference/supported_k8s_distributions" >}}) of Kubernetes.
- At least three worker nodes.
- [Kubernetes client (kubectl)](https://kubernetes.io/docs/tasks/tools/).
- [Helm 3.10 or later](https://helm.sh/docs/intro/install/)
    or 3.18 for migrating from a non-Helm installation.

If you suspect your file descriptor limits are below 100,000, you must either manually increase limits or [Allow automatic resource adjustment]({{< relref "/operate/kubernetes/8.0.18/security/allow-resource-adjustment" >}}). Most major cloud providers and standard container runtime configurations set default file descriptor limits well above the minimum required by Redis Enterprise. In these environments, you can safely run without enabling automatic resource adjustment.

### Example values

The steps below use the following placeholders to indicate command line parameters you must provide:

- `<repo-name>` is the name of the repo holding your Helm chart (example: `redis`).
- `<release-name>` is the name you give a specific installation of the Helm chart (example: `my-redis-enterprise-operator`)
- `<chart-version>` is the version of the Helm chart you are installing (example: `7.8.6-2`). Verify that the version you specify is listed in the [Redis Helm repository](https://helm.redis.io/). Using an invalid version number causes installation failures.
- `<namespace-name>` is the name of the new namespace the Redis operator will run in (example: `ns1`)
- `<path-to-chart>` is the filepath to the Helm chart, if it is stored in a local directory (example: `/home/charts/redis-enterprise-operator`)

## Install the operator

Below are several ways to install the operator using Helm. To create the REC in the same step, see [Create the REC at install time](#create-the-rec-at-install-time).

- [Install from the Redis Helm repository](#install-from-the-redis-helm-repository)
- [Install from local directory](#install-from-local-directory)
- [Specify values during install](#specify-values-during-install)
- [Install with values file](#install-with-values-file)

### Install from the Redis Helm repository

1. Add the Redis repository.

   ```sh
   helm repo add <repo-name> https://helm.redis.io
   ```

2. Install the Helm chart into a new namespace.

```sh
helm install <release-name> <repo-name>/redis-enterprise-operator \
    --version <chart-version> \
    --namespace <namespace-name> \
    --create-namespace
```

To install with Openshift, add `--set openshift.mode=true`.

To monitor the installation add the `--debug` flag. The installation runs several jobs synchronously and may take a few minutes to complete.

### Install from local directory

If you need a local copy of the chart, for example to inspect it or customize values, use one of the following methods.

**Pull the packaged chart (recommended).** `helm pull` fetches the exact packaged chart the Helm repository serves for the version you specify, matching what `helm install` from the repository would deploy.

1. Add the Redis repository, if you haven't already.

   ```sh
   helm repo add <repo-name> https://helm.redis.io
   ```

2. Pull and unpack the chart. This creates a `redis-enterprise-operator` directory in your current location.

   ```sh
   helm pull <repo-name>/redis-enterprise-operator --version <chart-version> --untar
   ```

3. Install the Helm chart from the local directory.

   ```sh
   helm install <release-name> ./redis-enterprise-operator \
       --namespace <namespace-name> \
       --create-namespace
   ```

**Download the source code.** Alternatively, download the chart source from GitHub.

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

1. View configurable values with `helm show values <repo-name>/redis-enterprise-operator`.

2. Install the Helm chart, overriding specific value defaults using `--set`.

```sh
helm install <release-name> <repo-name>/redis-enterprise-operator \
    --version <chart-version> \
    --namespace <namespace-name> \
    --create-namespace
    --set <key1>=<value1> \
    --set <key2>=<value2>
```

### Install with values file

1. View configurable values with `helm show values <repo-name>/redis-enterprise-operator`.

2. Create a YAML file to specify the values you want to configure.

3. Install the chart with the `--values` option.

```sh
helm install <release-name> <repo-name>/redis-enterprise-operator \
    --version <chart-version> \
    --namespace <namespace-name> \
    --create-namespace \
    --values <path-to-values-file>
```

## Create the REC at install time

The chart can create the `RedisEnterpriseCluster` (REC) custom resource at install time, so a single `helm install` deploys both the operator and the cluster. To enable this, set `cluster.create` to `true` and define the cluster under `cluster.spec` in your values file. The `spec` field accepts any field from the `RedisEnterpriseCluster` CRD. For the full list, see the [RedisEnterpriseCluster API reference]({{<relref "/operate/kubernetes/8.0.18/reference/api/redis_enterprise_cluster_api">}}).

{{<note>}}
`cluster.create` defaults to `false`. When `false`, the chart installs only the operator and you create the REC yourself.
{{</note>}}

1. Create a values file with a `cluster` section. For example:

    ```yaml
    cluster:
      create: true
      spec:
        nodes: 3
        redisEnterpriseImageSpec:
          repository: redislabs/redis
        redisEnterpriseServicesRiggerImageSpec:
          repository: redislabs/k8s-controller
        bootstrapperImageSpec:
          repository: redislabs/operator
    ```

2. Install the chart with the values file.

    ```sh
    helm install <release-name> <repo-name>/redis-enterprise-operator \
        --version <chart-version> \
        --namespace <namespace-name> \
        --create-namespace \
        --values <path-to-values-file>
    ```

    The chart runs a Kubernetes Job to create the REC. The Job deletes itself on success.

3. Confirm the operator deployment is running.

    ```sh
    kubectl get deployment redis-enterprise-operator --namespace <namespace-name>
    ```

4. Wait for the REC to reach the `Running` state. Initialization takes about a minute.

    ```sh
    kubectl get rec --namespace <namespace-name>
    ```

To update or uninstall an REC created by the chart, see [Update an REC created by the chart](#update-an-rec-created-by-the-chart) and [Uninstall the REC and operator together](#uninstall-the-rec-and-operator-together).

## Upgrade the chart

To upgrade an existing Helm chart installation:

```sh
helm upgrade <release-name> <repo-name>/redis-enterprise-operator --version <chart-version>
```

You can also upgrade from a local directory:

```sh
helm upgrade <release-name> <path-to-chart>
```

For example, to upgrade a chart with the release name `my-redis-enterprise` from the chart's root directory:

```sh
helm upgrade my-redis-enterprise .
```

To upgrade with OpenShift, add `--set openshift.mode=true`.

The upgrade process automatically updates the operator and its components, including the Custom Resource Definitions (CRDs). The CRDs are versioned and update only if the new version is higher than the existing version.

After you upgrade the operator, you might need to upgrade your Redis Enterprise clusters, depending on the Redis software version bundled with the operator. For detailed information about the upgrade process, see [Redis Enterprise for Kubernetes upgrade documentation](https://redis.io/docs/latest/operate/kubernetes/upgrade/).

{{< note >}}
If your databases use user-defined modules (custom non-bundled modules), you must take additional steps during the upgrade process. See [Upgrade with user-defined modules]({{< relref "/operate/kubernetes/8.0.18/upgrade/upgrade-redis-cluster#user-defined-modules" >}}) for details.
{{< /note >}}

For more information and options when upgrading charts, see [helm upgrade](https://helm.sh/docs/helm/helm_upgrade/).

### Update an REC created by the chart

If you used `cluster.create: true`, change REC settings by editing `cluster.spec` in your values file and running `helm upgrade`.

1. Update your values file. For example, to add labels:

    ```yaml
    cluster:
      create: true
      spec:
        nodes: 3
        redisEnterpriseImageSpec:
          repository: redislabs/redis
        redisEnterpriseServicesRiggerImageSpec:
          repository: redislabs/k8s-controller
        bootstrapperImageSpec:
          repository: redislabs/operator
        extraLabels:
          environment: production
    ```

2. Apply the changes.

    ```sh
    helm upgrade <release-name> <repo-name>/redis-enterprise-operator \
        --namespace <namespace-name> \
        --values <path-to-values-file>
    ```

    Some REC fields trigger a StatefulSet rolling update. Others, such as `extraLabels`, take effect immediately.

3. Confirm the change.

    ```sh
    kubectl get rec <rec-name> --namespace <namespace-name> -o yaml
    ```

## Uninstall

1. Delete any custom resources managed by the operator. See [Delete custom resources]({{<relref "operate/kubernetes/re-clusters/delete-custom-resources">}}) for detailed steps. You must delete custom resources in the correct order to avoid errors.

2. Uninstall the Helm chart.

```sh
helm uninstall <release-name>
```

This removes all Kubernetes resources associated with the chart and deletes the release.

{{<note>}}Custom Resource Definitions (CRDs) installed by the chart are not removed during chart uninstallation. To remove them manually after uninstalling the chart, run `kubectl delete crds -l app=redis-enterprise`.{{</note>}}

### Uninstall the REC and operator together

When `cluster.create` is `true`, `helm uninstall` removes both the REC and the operator. You don't need to delete the REC first.

```sh
helm uninstall <release-name> --namespace <namespace-name>
```

Confirm all resources are gone.

```sh
kubectl get all --namespace <namespace-name>
```

{{<note>}}
This applies only to RECs the chart created. If you created the REC outside the chart, follow [Delete custom resources]({{<relref "operate/kubernetes/re-clusters/delete-custom-resources">}}) before you run `helm uninstall`.
{{</note>}}

## Migrate from a non-Helm installation

To migrate an existing non-Helm installation of the Redis Enterprise operator to a Helm-based installation:

1. [Upgrade]({{<relref "operate/kubernetes/upgrade">}}) your existing Redis Enterprise operator to match the version of the Helm chart you want to install. Use the same non-Helm method you used for the original installation.

2. [Install](#install-the-operator) the Helm chart adding the `--take-ownership` flag:

   ```sh
   helm install <release-name> <repo-name>/redis-enterprise-operator --take-ownership
   ```

   - The `--take-ownership` flag is available with Helm versions 3.18 or later.
   - This flag is only needed for the first installation of the chart. Subsequent upgrades don't require this flag.
   - Use the `helm install` command, not `helm upgrade`.

3. Delete the old `ValidatingWebhookConfiguration` object from the previous non-Helm installation:

   ```sh
   kubectl delete validatingwebhookconfiguration redis-enterprise-admission
   ```

   This step is only needed when the `admission.limitToNamespace` chart value is set to `true` (the default). In this case, the webhook object installed by the chart is named `redis-enterprise-admission-<namespace>`, and the original webhook object, named `redis-enterprise-admission`, becomes redundant. If `admission.limitToNamespace` is set to `false`, the webhook installed by the chart is named `redis-enterprise-admission`, and the existing webhook object is reused.

## Known limitations

- Custom resources other than the REC must still be created using the standard process. The chart doesn't manage them.
- The chart doesn't include configuration options for multiple namespaces, rack-awareness, and Vault integration. The steps for configuring these options remain the same.
- The chart has had limited testing in advanced setups, including Active-Active configurations, air-gapped deployments, and IPv6/dual-stack environments.