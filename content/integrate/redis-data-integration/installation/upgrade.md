---
Title: Upgrading RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to upgrade an existing RDI installation
group: di
hideListLinks: false
linkTitle: Upgrade
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 30
---

> [!NOTE]
> Before upgrading to RDI 2.0.0, review the
> [processor default change](#upgrading-to-rdi-200).

## Upgrading a VM installation

Follow the steps below to upgrade an existing
[VM installation](/content/integrate/redis-data-integration/installation/install-vm.md)
of RDI:

1.  Download the RDI installer from the [Redis download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-installation-{{< rdi-version >}}.tar.gz)
    (in the *Modules, Tools & Integration* category) and extract it to your
    preferred installation folder.

    ```bash
    export RDI_VERSION={{< rdi-version >}}
    wget https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-installation-$RDI_VERSION.tar.gz
    tar -xvf rdi-installation-$RDI_VERSION.tar.gz
    ```

1.  Go to the installation folder:

    ```bash
    cd rdi_install/$RDI_VERSION
    ```

1.  Run the `upgrade.sh` script as a privileged user. Note that you must pass
    your RDI password to the script unless the password is empty.

    ```bash
    sudo ./upgrade.sh --rdi-password <redis-rdi-password>
    ```

### Recovering from failure during a VM upgrade

If the previous version is v1.4.4 or later, go to the `rdi_install/<PREVIOUS_VERSION>`
directory and run `sudo ./upgrade.sh` to revert to that version, as described in the section
[Upgrading a VM installation](#upgrading-a-vm-installation) above.

If the version you are replacing is earlier than v1.4.4, follow these steps. These steps restore and
run the CLI binary of the previous RDI version, which still provided the `redis-di upgrade` command.
(On current versions, upgrades are performed with the `upgrade.sh` script as described above, and
`redis-di upgrade` is no longer a CLI command.)

1.  Run `redis-di --version` to check the current version.

    If the version is the new one, copy the previous version
    of the RDI CLI to `/usr/local/bin` with the following command:
    
    ```bash
    sudo cp rdi_install/<PREVIOUS_VERSION>/deps/rdi-cli/<OS>/redis-di usr/local/bin
    ```

1.  Check that the CLI version is correct by running `redis-di --version`.

    Then, go to the `rdi_install/<PREVIOUS_VERSION>` directory and run the
    following command;

    ```bash
    sudo redis-di upgrade --rdi-host <RDI_REDIS_HOST> --rdi-port <RDI_REDIS_PORT>
    ```

> [!NOTE]
> If the `collector` or `processor` pods are not in the `Running` state after
> the upgrade, you must run `redis-di deploy` and check again that they are both in the
> `Running` state.

### Upgrading a VM installation with High Availability

If there is an active pipeline, upgrade RDI on the active VM first. 
This will cause a short pipeline downtime of up to two minutes. 
Afterwards, upgrade RDI on the passive VM. This will not cause any downtime.

> [!WARNING]
> When upgrading from RDI < 1.8.0 to RDI >= 1.8.0 in a VM HA setup, both RDI instances may incorrectly consider themselves active after the upgrade. This occurs because the upgrade process doesn't change the cluster id value from its default `cluster-1`, causing both clusters to assume they are the active cluster.
>
> **Symptoms:**
>
> - The upgraded passive node will start collector and processor components
> - Collector may enter a crash loop as it fails to connect to the source
> - Both clusters will restart in a loop
>
> **Workaround:**
>
> After upgrading, manually set a unique cluster ID for one of the installations (preferably on the passive instance):
>
> 1. Locate the RDI configuration file on the VM host. The file is typically located at `/etc/rdi/rdi-sys-config.yaml`.
> 2. Open the configuration file in a text editor. For example:
>
>    ```bash
>    sudo nano /etc/rdi/rdi-sys-config.yaml
>    ```

## Upgrading a Kubernetes installation

Follow the steps below to upgrade an existing
[Kubernetes](/content/integrate/redis-data-integration/installation/install-k8s.md)
installation of RDI:

1.  If you are using a private registry, pull the new versions of all images listed in 
    [Using a private image registry](/content/integrate/redis-data-integration/installation/install-k8s.md#using-a-private-image-registry)
    and add them to your local registry.

1.  Download the RDI Helm chart tar file from the [Redis download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-{{< rdi-version >}}.tgz)
    (in the *Modules, Tools & Integration* category).

    ```bash
    export RDI_VERSION={{< rdi-version >}}
    wget https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-$RDI_VERSION.tgz
    ```

1.  Adapt your `rdi-values.yaml` file to any changes in the new RDI version if needed.
    See also [Upgrading to RDI 1.8.0 or later from an earlier version](#upgrading-to-rdi-180-or-later-from-an-earlier-version). 
    Before making any changes, save your existing `rdi-values.yaml` if you need to revert 
    to the old RDI version for any reason.

1.  Run the `helm upgrade` command:
    
    ```bash
    helm upgrade --install rdi rdi-<tag>.tar.gz -f rdi-values.yaml -n rdi
    ```

Note that you don't need to
[deploy](/content/integrate/redis-data-integration/data-pipelines/deploy.md)
the RDI configuration again after this step.

### Upgrading to RDI 1.8.0 or later from an earlier version

When upgrading to RDI 1.8.0 or later from an earlier version
you must adapt your `rdi-values.yaml` file to the following changes:

-   All collector and processor values that were previously under `collector`,
    `collectorSourceMetricsExporter`, and `processor` have been moved to
    `operator.dataPlane.collector` and `operator.dataPlane.processor`.
-   `global.collectorApiEnabled` has been moved to `operator.dataPlane.collectorApi.enabled`,
    and is now a boolean value, not `"0"` or `"1"`.
-   `api.authEnabled` is also now a boolean value, not `"0"` or `"1"`.
-   The following values have been deprecated: `rdiMetricsExporter.service.protocol`,
    `rdiMetricsExporter.service.port`, `rdiMetricsExporter.serviceMonitor.path`,
    `api.service.name`.

### Verifying the upgrade

Check that all pods have `Running` status:

```bash
kubectl get all -n rdi
```

If you find that the upgrade did not work as expected for any reason, 
then run the `helm upgrade` command again (as described in the section
[Upgrading a Kubernetes installation](#upgrading-a-kubernetes-installation) above),
but this time with the previous version you were upgrading from, and using
your saved `rdi-values.yaml` for that version. This will restore your previous working state.

> [!NOTE]
> Downgrading from RDI 1.8.0 or later to an earlier version using `helm upgrade`
> will not work. If you need to perform such an upgrade, uninstall RDI completely first as
> described in [Uninstall RDI](/content/integrate/redis-data-integration/installation/install-k8s.md#uninstall-rdi),
> and then install the old version.

## Upgrading to RDI 2.0.0

RDI 2.0.0 changes several behaviors that affect a pipeline upgraded from RDI 1.19.x or earlier.

### The Flink processor becomes the default

RDI 2.0.0 changes the default processor from `classic` to `flink`. This default
applies when the pipeline's `config.yaml` omits `processors.type`.

For an existing pipeline that uses the classic processor, choose one of these options before upgrading:

- To migrate to the Flink processor, first follow
  [Migrate from the classic processor to the Flink processor](/content/integrate/redis-data-integration/installation/migration-classic-to-flink.md)
  on RDI 1.19.0. This stops the collector and drains the input streams before
  switching processors. Then upgrade RDI.
- To keep the classic processor, set `processors.type: classic` in the
  pipeline's `config.yaml` and deploy it before upgrading.

If your pipeline already uses `processors.type: flink`, no processor change
is needed. Continue with the upgrade instructions for your installation.

### Clearing a pipeline replaces deleting it

`DELETE /api/v2/pipelines/{name}` no longer empties a pipeline, and `redis-di delete` no longer
works. Clear the configuration with `redis-di deploy --empty`, or with
`PUT /api/v2/pipelines/{name}` and an empty configuration, instead. See
[Clear a pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md#clear-a-pipeline).

Clearing a pipeline is not the same as resetting it or flushing the target database. Clearing
removes the configuration and the pipeline's data from the RDI database, while resetting keeps the
configuration and re-snapshots the sources; neither one deletes any records from the target
database.

### Redeploying a configuration after clearing a pipeline

A configuration of an upgraded pipeline still references the names from before the upgrade, so
deploying it again after clearing the pipeline fails. See
[Redeploying a configuration after clearing a pipeline](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#redeploying-a-configuration-after-clearing-a-pipeline)
for what you have to change, with a before and after example.

### API changes

RDI 2.0.0 changes several API v2 query parameters and response fields. Most of them affect only
an API client, and are listed in the
[RDI 2.0.0 release notes](/content/integrate/redis-data-integration/release-notes/rdi-2-0-0.md).

The one to check for is the metric collections endpoint, which now keys `data_streams.streams`
by the source-qualified table name, such as `mysql.inventory.addresses`, instead of by the Redis
stream name. Update any dashboard or script that reads the previous form. See
[Observability](/content/integrate/redis-data-integration/observability.md) for the metrics RDI reports.

## Enabling the Flink processor

The
[Apache Flink](https://flink.apache.org/)-based stream processor is
fully supported on both VM and Kubernetes installations after upgrading to
RDI 1.19.0. Once the upgrade completes, it is always available —
no opt-in is required, and the defaults are sized for typical workloads.

> [!WARNING]
> The Flink processor is the default as of RDI 2.0.0.
> Upgrading to that release or later moves a pipeline whose `config.yaml` does not set
> [`processors.type`](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#processors)
> onto the Flink processor when you next deploy it. To keep such a pipeline on the classic
> processor, set `processors.type` to `classic` before you upgrade.

On Kubernetes, to override the Flink processor defaults, add an
`operator.dataPlane.flinkProcessor` block to your `rdi-values.yaml` file as
described in
[Configure the Flink processor](/content/integrate/redis-data-integration/installation/install-k8s.md#configure-the-flink-processor).
On VMs, see
[Configure the Flink processor](/content/integrate/redis-data-integration/installation/install-vm.md#configure-the-flink-processor).
For the per-pipeline migration steps, see
[Migrate from the classic processor to the Flink processor](/content/integrate/redis-data-integration/installation/migration-classic-to-flink.md).

## What happens during the upgrade?

The upgrade process replaces the current RDI components with their new versions:

-   Firstly, the control plane components are replaced. At this point, the pipeline
    is still active but monitoring will be disconnected.
-   Secondly, the pipeline data plane components are replaced.
    If a pipeline is active while upgrading, the `collector` and `processor`
    pods will be restarted. The pipeline will pause for up to two minutes but it 
    will catch up very quickly after restarting. 
    The pipeline data and state are both stored in Redis, so data will not
    be lost during the upgrade.
