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
> Before you upgrade, review [Upgrading to RDI 2.2.0](#upgrading-to-rdi-220). If you upgrade
> from RDI 1.19.x or earlier, also review [Upgrading to RDI 2.0.0](#upgrading-to-rdi-200).

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
Afterwards, wait until `redis-di info` reports the upgraded VM as the leader, then upgrade RDI
on the passive VM. This will not cause any downtime.

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

## Upgrading to RDI 2.2.0

Check the following changes before you upgrade from RDI 2.0.0. If you upgrade from RDI 1.19.x or
earlier, also review [Upgrading to RDI 2.0.0](#upgrading-to-rdi-200).

### Upgrade the leader first

If you run two RDI instances with leader election, upgrade the leader first. Upgrade the other
instance only after
[`redis-di info`](/content/integrate/redis-data-integration/reference/cli/redis-di-info.md)
on the upgraded instance shows `Leader Election Mode: leader`. This applies both to a VM
installation with [high availability](#upgrading-a-vm-installation-with-high-availability) and
to a disaster recovery setup with a Google Cloud Storage (GCS) lease.

The first upgraded instance that becomes the leader saves its pipelines as the backup that RDI
restores at every later failover. This matters most when you upgrade from a version before
2.0.0: the other instance does not keep a copy of your pipelines, so if it became the leader first, RDI
would delete your pipelines at the next failover.

### Validate your configurations before you redeploy them

RDI 2.2.0 rejects some configurations that earlier versions accepted. After the upgrade, check
each configuration with `redis-di deploy --dry-run` before you deploy it again, and fix the
following:

- A source named `api`, or a source name that contains consecutive dashes (`--`). Rename the
  source, and update its secrets, its secret references in `config.yaml`, and the `server_name`
  of its jobs. See
  [Name your sources](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#name-your-sources)
  for the naming rules, and
  [Add or remove a source](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#add-or-remove-a-source)
  for what renaming a source implies.
- A secret provider name that contains consecutive dashes. Rename the provider, and update the
  references to it in `config.yaml`.
- Job files with fields, types, or expression languages that their transformation blocks or
  output arguments do not support.
- The internal key overrides described in
  [Remove overrides of internal Redis keys](#remove-overrides-of-internal-redis-keys).

### Remove overrides of internal Redis keys

RDI 2.2.0 always uses the Redis keys and consumer groups that it generates, and rejects the
following properties:

- `topic.delimiter`, `offset.storage.redis.key`, and `schema.history.internal.redis.key` in
  `sources.<name>.advanced.source`.
- `stream.name.pattern` and `consumer.group` in `processors.advanced.source`, and `counters.key`
  in `processors.advanced.processor`.
- `streamPrefix` in `sources.<name>.advanced.riotx`.

The operator uses the generated keys for your existing pipelines as soon as you upgrade, even
before you redeploy them, and RDI does not migrate the state stored under custom keys or consumer
groups. As a result:

- A Debezium collector that used custom offset or schema history keys takes a new snapshot.
- A Flink processor that used a custom consumer group replays the entries retained in its
  streams.
- The entries left in streams with custom names or prefixes are no longer consumed.

Remove these properties from your configurations before you deploy them again.

### Check which certificate authorities RDI trusts

Debezium collectors and the Collector API now trust the system certificate authorities (CAs) in
addition to the CAs of your secrets. To trust only the CAs of your secrets, as before, set
`operator.dataPlane.collector.useSystemTruststore` and
`operator.dataPlane.collectorApi.useSystemTruststore` to `false` in your Helm values.

### Update tools that read the VM log files

On a VM installation, RDI 2.2.0 stores the log files of each pipeline in
`/opt/rdi/logs/pipelines/<pipeline>/` and those of the control plane in
`/opt/rdi/logs/control-plane/`, with new file names, such as
`pipelines/default/collector-mysql-collector-source.log`. Update any scripts or tools that read
the log files by path. RDI does not delete the log files at the previous paths, so delete them
once you no longer need them. See
[RDI logs](/content/integrate/redis-data-integration/troubleshooting.md#rdi-logs) for the new
file names.

### Reset MariaDB sources after you add tables

RDI 2.2.0 limits the schema history of a MariaDB source to the tables that it captures, as it
already did for MySQL sources. If you add a table to the `tables` list of an existing MariaDB
source, or a database to its `databases` list, [reset the source](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#start-stop-and-reset-a-single-source).
Otherwise, the source stops with an unknown schema error when the new table first changes. To
keep the previous behavior, set `schema.history.internal.store.only.captured.tables.ddl` to
`false` in the `advanced.source` section of the source.

### Upgrade from a version before 1.8.0 in two steps

Do not upgrade an installation of a version before 1.8.0 directly to RDI 2.2.0. These versions
keep the pipeline configuration in the RDI database and run the collector and stream processor
without a pipeline resource. RDI versions 1.8.0 to 2.0.0 convert them into the `default` pipeline
when you upgrade, but RDI 2.2.0 no longer does. After a direct upgrade, RDI has no pipeline, and
the old collector and stream processor keep running without RDI managing them.

Upgrade to RDI 2.0.0 first, as described in the
[RDI 2.0.0 upgrade instructions](/content/integrate/redis-data-integration/2.0.0/installation/upgrade.md).
Check that the `default` pipeline runs, and then upgrade to RDI 2.2.0.

### Create pipelines explicitly

The operator no longer creates an empty `default` pipeline when you install RDI. An installation
that you upgrade keeps its pipeline, so this affects only new installations. If your scripts or
tools expect a `default` pipeline right after you install RDI, make them create it first, for
example with `redis-di deploy --empty`.

### Create named pipelines after you upgrade every instance

RDI 2.2.0 supports pipeline names other than `default`. Finish upgrading all the RDI instances
before you create a named pipeline. Your existing `default` pipeline keeps its resource names,
Redis keys, and metrics paths. See
[Multiple pipelines in one RDI installation](/content/integrate/redis-data-integration/data-pipelines/multiple-pipelines.md)
for the naming rules and for how to manage several pipelines.

### Downgrade from RDI 2.2.0

If you need to return to an earlier version after you upgrade to RDI 2.2.0, check the following
first:

- Do not downgrade after you create a pipeline other than `default`.
- If you use a GCS lease, delete the lease object before you downgrade, for example with
  `gcloud storage rm gs://<bucket>/<object>`. Earlier versions cannot read the lease that RDI
  2.2.0 writes, so the downgraded leader can acquire the lease only after it creates the object
  again.
- If you downgrade to a version before 2.0.0, delete the `rdi:migration-number` key and the
  `rdi:resources:pipelines.rdi.redis.com:*` keys from the RDI database before you upgrade again.
  Otherwise, the upgraded instance restores your pipelines from the outdated backup in these keys.

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

### Clearing a pipeline is different from deleting it

`DELETE /api/v2/pipelines/{name}` does not empty a pipeline. In RDI 2.2.0, use
`redis-di delete` to delete the pipeline, or clear the configuration with
`redis-di deploy --empty`, or with
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
