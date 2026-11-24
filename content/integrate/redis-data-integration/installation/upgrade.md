---
Title: Upgrading RDI
alwaysopen: false
bannerText: 'You can upgrade to RDI 2.2.x from RDI 1.8.0 or later. We recommend that you upgrade to the latest RDI version.'
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

To upgrade RDI, follow the procedure for a
[VM installation](#upgrading-a-vm-installation) or a
[Kubernetes installation](#upgrading-a-kubernetes-installation), and do the
[upgrade steps](#upgrade-steps) that apply to the version you upgrade from. To upgrade from a
version before 1.8.0, upgrade to RDI 1.19.1 first, following the
[RDI 1.19.1 upgrade instructions](/content/integrate/redis-data-integration/1.19.1/installation/upgrade.md),
and check that the `default` pipeline runs.

Each upgrade step starts with these properties:

- **From**: The versions that you upgrade from, and any other condition for the step. Do every
  step whose **From** includes your version. The steps are sorted by **From**, latest version
  first, and then by **When**.
- **When**: Before, during, or after the upgrade. The procedures tell you where to do each group
  of steps. Within a group, you can do the steps in any order, unless the **When** line says
  otherwise.
- **VM** and **Helm**: What a VM installation or a Kubernetes installation with Helm needs. If an
  RDI version does the step for you, this line says that you can skip it when you upgrade to that
  version or later.
- **HA**: What a VM installation with high availability (HA) needs. An HA installation is a pair
  of VMs that share the RDI database.
- **DR**: What a Kubernetes
  [disaster recovery (DR) setup](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md)
  needs.

> [!WARNING]
> Downgrading from RDI 2.0.0 or later to a version earlier than 2.0.0 is not supported. Do not
> downgrade from RDI 2.2.x after you create a pipeline other than `default`.

## Upgrading a VM installation

Follow the steps below to upgrade an existing
[VM installation](/content/integrate/redis-data-integration/installation/install-vm.md)
of RDI. In an HA installation, do them on the active VM first, and then on the passive VM,
as
[Upgrading a VM installation with high availability](#upgrading-a-vm-installation-with-high-availability)
describes.

1.  Do the [upgrade steps](#upgrade-steps) that apply to a VM installation and say **When**:
    Before the upgrade.

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

1.  Do the upgrade steps that apply to a VM installation and say **When**: During the upgrade.

1.  Run the `upgrade.sh` script as a privileged user. Note that you must pass
    your RDI password to the script unless the password is empty.

    ```bash
    sudo ./upgrade.sh --rdi-password <redis-rdi-password>
    ```

1.  Do the upgrade steps that apply to a VM installation and say **When**: After the upgrade.

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

## Upgrading a Kubernetes installation

Follow the steps below to upgrade an existing
[Kubernetes](/content/integrate/redis-data-integration/installation/install-k8s.md)
installation of RDI. In a DR setup, do them at the leader's site first, and then at the other
site, as [Upgrading a DR setup](#upgrading-a-dr-setup) describes.

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
    Before making any changes, save your existing `rdi-values.yaml` if you need to revert 
    to the old RDI version for any reason.

1.  Do the [upgrade steps](#upgrade-steps) that apply to a Kubernetes installation and say
    **When**: Before the upgrade.

1.  Do the upgrade steps that apply to a Kubernetes installation and say **When**: During the
    upgrade, and then run the `helm upgrade` command:
    
    ```bash
    helm upgrade --install rdi rdi-<tag>.tar.gz -f rdi-values.yaml -n rdi
    ```

1.  Do the upgrade steps that apply to a Kubernetes installation and say **When**: After the
    upgrade.

Note that you don't need to
[deploy](/content/integrate/redis-data-integration/data-pipelines/deploy.md)
the RDI configuration again after this step.

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

### Downgrading a DR setup

Do not downgrade a DR setup after you create a pipeline other than `default`. A DR setup with a
DynamoDB lease requires RDI 2.2.0 or later.

To downgrade a DR setup with a GCS lease to RDI 2.0.0, plan for downtime. The examples use
the CLI contexts `site-a` and `site-b` from
[Deploy pipelines and secrets](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#deploy-pipelines-and-secrets):

1. Put both instances in standby, and check that neither reports `Leader Election Mode: leader`:

   ```bash
   redis-di --context site-a set-setting standby_mode true
   redis-di --context site-b set-setting standby_mode true
   ```

1. Delete the lease object:

   ```bash
   gcloud storage rm "gs://<lease-bucket>/<lease-object>"
   ```

1. Downgrade both instances with Helm. Versions before 2.2.0 use
   `operator.leaderElection.standbyMode` instead of the `standby_mode` setting. The first
   instance that takes part in leader election recreates the lease in its earlier format.
1. Check that only one instance is the leader, and verify pipeline health and data delivery.

The `standby_mode` settings remain in the RDI database. If you upgrade to 2.2.0 again, run
`redis-di delete-setting standby_mode` on each instance as soon as it runs 2.2.0, or set the
mode you want.

## Upgrading an HA installation or a DR setup

An HA installation and a DR setup each have two RDI instances that use leader election. Only the
leader runs the pipelines. Upgrade the leader first, and upgrade the other instance only after
[`redis-di info`](/content/integrate/redis-data-integration/reference/cli/redis-di-info.md)
on the upgraded instance shows `Leader Election Mode: leader`. On each instance, do the
[upgrade steps](#upgrade-steps) as their **HA** or **DR** line says. Finish upgrading both
instances before you create a pipeline other than `default`.

The first upgraded instance that becomes the leader saves its pipelines as the backup that RDI
restores at every later failover. This matters most when you upgrade from a version before
2.0.0: the other instance does not keep a copy of your pipelines, so if it became the leader
first, RDI would delete your pipelines at the next failover.

### Upgrading a VM installation with high availability

In an HA installation, the active VM is the leader. To upgrade the two VMs:

1.  Upgrade the active VM, following [Upgrading a VM installation](#upgrading-a-vm-installation).
    If a pipeline is active, it stops for up to two minutes.

1.  Run `redis-di info` on the upgraded VM, and wait until it shows
    `Leader Election Mode: leader`.

1.  Upgrade the passive VM in the same way. This causes no pipeline downtime.

### Upgrading a DR setup

In a DR setup, the leader is the site whose RDI instance holds the lease. The examples use the
`site-a` and `site-b` contexts from
[Deploy pipelines and secrets](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#deploy-pipelines-and-secrets),
and assume that site A is the leader. To upgrade the two sites:

1.  Upgrade site A, following
    [Upgrading a Kubernetes installation](#upgrading-a-kubernetes-installation) with its values
    file, such as `rdi-values-site-a.yaml`.

1.  Check site A, as [Verify a takeover](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#verify-a-takeover)
    describes:

    1.  Run `redis-di --context site-a info`, and check that it shows
        `Leader Election Mode: leader`.
    1.  Run `redis-di --context site-a describe "<pipeline>"` for each pipeline, and check its
        components and errors.
    1.  Make a test change in the source, and confirm that the expected result reaches the
        target.

1.  Upgrade site B in the same way, with its values file, such as `rdi-values-site-b.yaml`.

> [!WARNING]
> With a GCS lease, the upgraded leader migrates the lease to a format that versions before
> 2.2.0 can't read. The follower can take over only after you upgrade it, so upgrade it as
> soon as you've checked the leader.

<a id="upgrading-to-rdi-220"></a>
<a id="upgrading-to-rdi-200"></a>

## Upgrade steps

### Check which certificate authorities RDI trusts

- **From**: RDI 2.0.x or earlier
- **When**: Before the upgrade
- **VM**: Not available, since these settings are Helm values
- **Helm**: Required if you want to trust only the certificate authorities of your secrets
- **HA**: Not available, since these settings are Helm values
- **DR**: Same as **Helm**, in the values file of each site

Debezium collectors and the Collector API now trust the system certificate authorities (CAs) in
addition to the CAs of your secrets. To trust only the CAs of your secrets, as before, set
`operator.dataPlane.collector.useSystemTruststore` and
`operator.dataPlane.collectorApi.useSystemTruststore` to `false` in your Helm values.

### Validate your configurations before you redeploy them

- **From**: RDI 2.0.x or earlier
- **When**: After the upgrade, before you deploy a configuration again
- **VM**: Required
- **Helm**: Required
- **HA**: Required, on the active VM
- **DR**: Required, on the leader

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

RDI 2.2.0 and 2.2.1 also reject the properties that RDI manages itself, which RDI 2.2.2 and later
ignore. See [Remove overrides of internal Redis keys](#remove-overrides-of-internal-redis-keys).

### Remove overrides of internal Redis keys

- **From**: RDI 2.0.x or earlier, with a configuration that sets any of the following properties
- **When**: After the upgrade, before you deploy a configuration again
- **VM**: Required for RDI 2.2.0 and 2.2.1, which reject these properties. RDI 2.2.2 and later
  ignore them.
- **Helm**: Required for RDI 2.2.0 and 2.2.1, which reject these properties. RDI 2.2.2 and later
  ignore them.
- **HA**: Same as **VM**, on the active VM
- **DR**: Same as **Helm**, on the leader

RDI 2.2.0 and later always use the Redis keys and consumer groups that they generate. They build
the keystore for source mutual TLS (mTLS) from the source's TLS secret, instead of the keystore
properties that RDI 1.x needed. RDI 2.2.0 and 2.2.1 reject the following properties, and RDI 2.2.2
and later ignore them, with no error and no warning. This example shows where to remove them
from your configuration:

```yaml
sources:
  <source-name>:
    advanced:
      source:
        topic.delimiter: <value> # Ignored since RDI 2.2.2
        offset.storage.redis.key: <value> # Ignored since RDI 2.2.2
        schema.history.internal.redis.key: <value> # Ignored since RDI 2.2.2
        database.ssl.keystore: <value> # Ignored since RDI 2.2.2
        database.ssl.keystore.password: <value> # Ignored since RDI 2.2.2
        mongodb.ssl.keystore: <value> # Ignored since RDI 2.2.2
        mongodb.ssl.keystore.password: <value> # Ignored since RDI 2.2.2
      riotx:
        streamPrefix: <value> # Ignored since RDI 2.2.2
processors:
  advanced:
    source:
      stream.name.pattern: <value> # Ignored since RDI 2.2.2
      consumer.group: <value> # Ignored since RDI 2.2.2
    processor:
      counters.key: <value> # Ignored since RDI 2.2.2
```

The operator uses the generated keys for your existing pipelines as soon as you upgrade, even
before you redeploy them, and RDI does not migrate the state stored under custom keys or consumer
groups. As a result:

- A Debezium collector that used custom offset or schema history keys takes a new snapshot.
- A Flink processor that used a custom consumer group replays the entries retained in its
  streams.
- The entries left in streams with custom names or prefixes are no longer consumed.

Remove these properties from your configurations.

### Update tools that read the VM log files

- **From**: RDI 2.0.x or earlier, with scripts or tools that read the log files by path
- **When**: After the upgrade
- **VM**: Required
- **Helm**: Not needed
- **HA**: Required, on both VMs
- **DR**: Not needed

On a VM installation, RDI 2.2.0 stores the log files of each pipeline in
`/opt/rdi/logs/pipelines/<pipeline>/` and those of the control plane in
`/opt/rdi/logs/control-plane/`, with new file names, such as
`pipelines/default/collector-mysql-collector-source.log`. Update any scripts or tools that read
the log files by path. RDI does not delete the log files at the previous paths, so delete them
once you no longer need them. See
[RDI logs](/content/integrate/redis-data-integration/troubleshooting.md#rdi-logs) for the new
file names.

### Reset MariaDB and SQL Server sources after you add tables

- **From**: RDI 2.0.x or earlier, with a MariaDB or SQL Server source
- **When**: After the upgrade, when you add tables to a source
- **VM**: Required
- **Helm**: Required
- **HA**: Required, on the active VM
- **DR**: Required, on the leader

RDI 2.2.0 limits the schema history of MariaDB and SQL Server sources to the tables that they
capture, as it already did for MySQL and Oracle sources. If you add a table to the `tables` list
of an existing MariaDB or SQL Server source, or add a database or schema to the ones it captures,
[reset the source](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#start-stop-and-reset-a-single-source).
Otherwise, the source stops with an unknown schema error when the new table first changes. To
keep the previous behavior, set `schema.history.internal.store.only.captured.tables.ddl` to
`false` in the `advanced.source` section of the source.

<a id="the-flink-processor-becomes-the-default"></a>

### Set the processor type of your pipelines

- **From**: RDI 1.15.0 to 1.19.x, with a pipeline whose `config.yaml` doesn't set `processors.type`
- **When**: Before the upgrade
- **VM**: Required
- **Helm**: Required
- **HA**: Required, on the active VM
- **DR**: Required, on the leader

RDI 2.0.0 changes the default processor from `classic` to `flink`. Keep the classic processor
through the upgrade, since switching processors with records still in the RDI input streams can
leave records unprocessed. Check that the `config.yaml` of each pipeline sets
[`processors.type`](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#processors),
normally to `classic`. If it doesn't, set `processors.type: classic` and redeploy the pipeline.

To move to the Flink processor, migrate the pipeline after the upgrade, as described in
[Migrate to the Flink processor](#migrate-to-the-flink-processor).

### Label the source and target secrets

- **From**: RDI 1.19.x or earlier
- **When**: Before the upgrade
- **VM**: Skip this step if you upgrade to RDI 2.2.2 or later, whose `upgrade.sh` script adds the
  labels for you. For an earlier version, run the commands on the VM.
- **Helm**: Required
- **HA**: Same as **VM**, on both VMs, since each VM keeps its own secrets
- **DR**: Required, at both sites, since each site keeps its own secrets

RDI 2.0.0 and later find the secrets of a pipeline by their labels. The `source-db` and
`target-db` secrets of an installation from RDI 1.19.x or earlier may not have these labels, for
example if you created them with an earlier version or with `kubectl`. A pipeline upgraded with
unlabeled secrets keeps running, but:

- `redis-di deploy` fails table validation with an access denied error for the user
  `${SOURCE_DB_USERNAME}`, also with `--dry-run`.
- `redis-di list-secrets` doesn't list the source.
- Changing these secrets doesn't restart the components, so they keep using the previous values.

Before you upgrade, add the labels to the secrets. This doesn't change the secret values.

```bash
kubectl label secret source-db target-db -n rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi

# With source TLS or mTLS
kubectl label secret source-db-ssl -n rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi

# With target TLS or mTLS
kubectl label secret target-db-ssl -n rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi
```

If you have already upgraded, add the labels in the same way, and then restart the operator so
that it finds the labeled secrets:

```bash
kubectl rollout restart deployment/rdi-operator -n rdi
```

After the upgrade, `redis-di list-secrets` lists the secrets of the source as well as those of the
target.

### Move the certificates to their default file names

- **From**: RDI 1.19.x or earlier, with source or target TLS or mTLS
- **When**: After the upgrade
- **VM**: Skip this step if you upgrade to RDI 2.2.2 or later, whose `upgrade.sh` script moves the
  certificates for you. For an earlier version, run the commands on the VM.
- **Helm**: Required
- **HA**: Same as **VM**, on both VMs
- **DR**: Required, at both sites

RDI 1.x `redis-di set-secret` stored a certificate that you set from a file under that file's
name, for example `myca.pem` in the `source-db-ssl` secret, with `SOURCE_DB_CACERT` set to
`/etc/certificates/source_db/myca.pem` in the `source-db` secret. RDI 2.0.0 and later know only the
default file names `ca.crt`, `client.crt`, and `client.key`. A pipeline with certificates under
other file names keeps streaming, but `redis-di delete-secret` fails with a not found error for
these certificates, and `redis-di list-secrets` lists them as simple secrets.

Each certificate has an entry in the `source-db` or `target-db` secret that names its file in
`source-db-ssl` or `target-db-ssl`:

| Certificate | Source entry | Target entry | Default file |
| ----------- | ------------ | ------------ | ------------ |
| CA certificate | `SOURCE_DB_CACERT` | `TARGET_DB_CACERT` | `ca.crt` |
| Client certificate | `SOURCE_DB_CERT` | `TARGET_DB_CERT` | `client.crt` |
| Client key | `SOURCE_DB_KEY` | `TARGET_DB_KEY` | `client.key` |

To see the files that the entries name, run:

```bash
for key in CACERT CERT KEY; do
  kubectl get secret source-db -n rdi -o jsonpath="{.data.SOURCE_DB_${key}}" | base64 --decode
  echo
  kubectl get secret target-db -n rdi -o jsonpath="{.data.TARGET_DB_${key}}" | base64 --decode
  echo
done
```

Move each certificate whose file has another name: copy the file to the default file name, point
the entry to the new file, and then delete the old file. For example, for a source CA certificate
stored as `/etc/certificates/source_db/myca.pem`:

```bash
kubectl patch secret source-db-ssl -n rdi --type=json \
  -p '[{"op":"copy","from":"/data/myca.pem","path":"/data/ca.crt"}]'
kubectl patch secret source-db -n rdi --type=merge \
  -p '{"stringData":{"SOURCE_DB_CACERT":"/etc/certificates/source_db/ca.crt"}}'
kubectl patch secret source-db-ssl -n rdi --type=json \
  -p '[{"op":"remove","path":"/data/myca.pem"}]'
```

For a target client certificate and key stored as `/etc/certificates/target_db/redis.crt` and
`/etc/certificates/target_db/redis.key`:

```bash
kubectl patch secret target-db-ssl -n rdi --type=json \
  -p '[{"op":"copy","from":"/data/redis.crt","path":"/data/client.crt"},
       {"op":"copy","from":"/data/redis.key","path":"/data/client.key"}]'
kubectl patch secret target-db -n rdi --type=merge \
  -p '{"stringData":{"TARGET_DB_CERT":"/etc/certificates/target_db/client.crt",
                     "TARGET_DB_KEY":"/etc/certificates/target_db/client.key"}}'
kubectl patch secret target-db-ssl -n rdi --type=json \
  -p '[{"op":"remove","path":"/data/redis.crt"},{"op":"remove","path":"/data/redis.key"}]'
```

Follow these rules:

- Don't copy a certificate to a default file name that another file already has, for example
  when the client certificate is stored as `ca.crt`, since the copy overwrites that file. Set that
  certificate again with `redis-di set-secret` instead.
- Keep the old file while another entry still names it, for example a single PEM file for the
  client certificate and its key. Delete it after you move the last certificate that it holds.

Instead of moving the certificates, you can set them again with `redis-di set-secret`. It stores
them under the default file names, but leaves the old files in the secret.

### Clearing a pipeline is different from deleting it

- **From**: RDI 1.19.x or earlier, with scripts or procedures that clear or delete pipelines
- **When**: After the upgrade
- **VM**: Required
- **Helm**: Required
- **HA**: Same as **VM**
- **DR**: Same as **Helm**

`DELETE /api/v2/pipelines/{name}` deletes a pipeline rather than emptying its configuration. In RDI 2.2.0, use
`redis-di delete` to delete the pipeline, or clear the configuration with
`redis-di deploy --empty`, or with
`PUT /api/v2/pipelines/{name}` and an empty configuration, instead. See
[Clear a pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md#clear-a-pipeline).

Clearing a pipeline is not the same as resetting it or flushing the target database. Clearing
removes the configuration and the pipeline's data from the RDI database, while resetting keeps the
configuration and re-snapshots the sources; neither one deletes any records from the target
database.

### Redeploying a configuration after clearing a pipeline

- **From**: RDI 1.19.x or earlier
- **When**: After the upgrade, when you deploy a configuration again after you clear its pipeline
- **VM**: Required
- **Helm**: Required
- **HA**: Required, on the active VM
- **DR**: Required, on the leader

A configuration of an upgraded pipeline still references the names from before the upgrade, so
deploying it again after clearing the pipeline fails. See
[Redeploying a configuration after clearing a pipeline](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#redeploying-a-configuration-after-clearing-a-pipeline)
for what you have to change, with a before and after example.

### API changes

- **From**: RDI 1.19.x or earlier, with API clients, dashboards, or scripts that read the metric
  collections
- **When**: After the upgrade
- **VM**: Required
- **Helm**: Required
- **HA**: Same as **VM**
- **DR**: Same as **Helm**

RDI 2.0.0 changes several API v2 query parameters and response fields. Most of them affect only
an API client, and are listed in the
[RDI 2.0.0 release notes](/content/integrate/redis-data-integration/release-notes/rdi-2-0-0.md).

The one to check for is the metric collections endpoint, which now keys `data_streams.streams`
by the source-qualified table name, such as `mysql.inventory.addresses`, instead of by the Redis
stream name. Update any dashboard or script that reads the previous form. See
[Observability](/content/integrate/redis-data-integration/observability.md) for the metrics RDI reports.

<a id="enabling-the-flink-processor"></a>

### Migrate to the Flink processor

- **From**: RDI 1.19.x or earlier, with a pipeline that uses the classic processor
- **When**: After the upgrade
- **VM**: Recommended
- **Helm**: Recommended
- **HA**: Recommended, on the active VM
- **DR**: Recommended, on the leader

The Flink processor is the default processor since RDI 2.0.0. After the upgrade, we recommend
that you migrate your pipelines that use the classic processor. Follow
[Migrate from the classic processor to the Flink processor](/content/integrate/redis-data-integration/installation/migration-classic-to-flink.md),
which drains the input streams and then redeploys the pipeline with `processors.type` set to
`flink`.

The Flink processor needs no setup, and its defaults suit typical workloads. To change them, see
Configure the Flink processor for a
[VM installation](/content/integrate/redis-data-integration/installation/install-vm.md#configure-the-flink-processor) or a
[Kubernetes installation](/content/integrate/redis-data-integration/installation/install-k8s.md#configure-the-flink-processor).

### Check the archived log retention of Oracle sources

- **From**: A version before 1.18.1, with an Oracle source
- **When**: Before the upgrade
- **VM**: Required
- **Helm**: Required
- **HA**: Same as **VM**
- **DR**: Same as **Helm**

Check that your backup and cleanup jobs keep archived logs long enough before you upgrade. See
[Upgrade from RDI versions before 1.18.1](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/oracle/archive-log-retention.md#upgrade-from-rdi-versions-before-1181).

### Delete the operator Deployment

- **From**: A version before 1.18.1
- **When**: During the upgrade, right before you run `helm upgrade`
- **VM**: Skip this step if you upgrade to RDI 2.2.2 or later, whose `upgrade.sh` script stops the
  operator for you. RDI 2.2.0 and 2.2.1 have no manual fix, so upgrade to RDI 2.2.2 or later.
- **Helm**: Required if `operator.leaderElection.enabled` is `true`
- **HA**: Same as **VM**
- **DR**: Same as **Helm**, at each site, right before you run `helm upgrade` there

Operators before 1.18.1 don't take part in the local leader election, so during the rolling update
the old operator can recreate components of the old version, such as the classic processor next
to the Flink processor. Delete the operator Deployment right before you run `helm upgrade`:

```bash
kubectl delete deployment rdi-operator -n rdi --cascade=foreground
```

`helm upgrade` recreates the operator. Start it as soon as the command returns, so that the new
operator starts within the lease time-to-live (TTL) of the installed version, 60 seconds by
default.

### Upgrade directly to RDI 2.2.2 or later

- **From**: RDI 1.8.0 to 1.14.x
- **When**: Before the upgrade
- **VM**: Required
- **Helm**: Required
- **HA**: Same as **VM**
- **DR**: Not needed, since DR requires RDI 1.15.0 or later

RDI 1.14.x and earlier don't accept `processors.type`, so you can't
[set the processor type of your pipelines](#set-the-processor-type-of-your-pipelines) before the
upgrade. Upgrade directly to RDI 2.2.2 or later, which sets `processors.type` to `classic` during
the upgrade on each pipeline that doesn't set it. RDI 2.0.x, 2.2.0, and 2.2.1 switch such a
pipeline to the Flink processor without draining its input streams.

### Add the processor type to your configurations

- **From**: RDI 1.8.0 to 1.14.x
- **When**: After the upgrade, before you deploy a configuration again
- **VM**: Required, unless you migrate the pipeline to the Flink processor
- **Helm**: Required, unless you migrate the pipeline to the Flink processor
- **HA**: Same as **VM**
- **DR**: Not needed, since DR requires RDI 1.15.0 or later

The upgrade sets `processors.type` to `classic` on the deployed pipeline, but not in your
`config.yaml`. Add `processors.type: classic` to the `config.yaml` of each pipeline, so that the
next `redis-di deploy` keeps the classic processor. Otherwise, it switches the pipeline to the
Flink processor without draining its input streams. To move to the Flink processor instead, see
[Migrate to the Flink processor](#migrate-to-the-flink-processor).

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
