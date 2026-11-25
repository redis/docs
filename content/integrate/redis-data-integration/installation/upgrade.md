---
Title: Upgrading RDI
alwaysopen: false
bannerText: 'Upgrade to the latest RDI version, RDI 2.2.2 or later. You can upgrade to it from RDI 1.8.0 or later.'
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
[upgrade steps](#upgrade-steps) that apply to the version you upgrade from. Before you upgrade,
read the [release notes](/content/integrate/redis-data-integration/release-notes/_index.md) of
every version after yours, up to the one you install, and do what they say for your
installation. To upgrade from a version before 1.8.0, upgrade to RDI 1.19.1 first, following the
[RDI 1.19.1 upgrade instructions](/content/integrate/redis-data-integration/1.19.1/installation/upgrade.md),
and check that the `default` pipeline runs.

Each upgrade step starts with these properties:

- **From**: The versions that you upgrade from, and any other condition for the step. Do every
  step whose **From** includes your version.
- **When**: Before, during, or after the upgrade. The procedures tell you where to do each group
  of steps. Within a group, you can do the steps in any order, unless the **When** line says
  otherwise.
- **Applies to**: The installations that need the step: VM installations, Kubernetes
  installations with Helm, or both. It also says what a VM installation with high availability
  (HA) or a Kubernetes
  [disaster recovery (DR) setup](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md)
  needs, if that differs.

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

Go to the `rdi_install/<PREVIOUS_VERSION>` directory and run `sudo ./upgrade.sh` to revert to
that version, as described in [Upgrading a VM installation](#upgrading-a-vm-installation).

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

## Upgrading and downgrading HA and DR setups

An HA installation and a DR setup each have two RDI instances that use leader election. Only the
leader runs the pipelines. Upgrade the leader first, and upgrade the other instance only after
[`redis-di info`](/content/integrate/redis-data-integration/reference/cli/redis-di-info.md)
on the upgraded instance shows `Leader Election Mode: leader`. Finish upgrading both instances
before you create a pipeline other than `default`.

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
> With a GCS lease, the follower can't take over until you upgrade it, so upgrade it as soon as
> you've checked the leader.

### Downgrading a DR setup

Don't downgrade a DR setup after you create a pipeline other than `default`, and don't downgrade
a DR setup with a DynamoDB lease to RDI 2.0.x.

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

1. Downgrade both instances with Helm. RDI 2.0.x uses `operator.leaderElection.standbyMode`
   instead of the `standby_mode` setting.
1. Check that only one instance is the leader, and verify pipeline health and data delivery.

If you upgrade to RDI 2.2.x again, run `redis-di delete-setting standby_mode` on each instance as
soon as it runs RDI 2.2.x, or set the mode you want.

<a id="upgrading-to-rdi-220"></a>
<a id="upgrading-to-rdi-200"></a>

## Upgrade steps

The table lists the steps by **When**, and then by **From**, latest version first:

| Step | From | When | Applies to |
| :-- | :-- | :-- | :-- |
| [Label the source and target secrets](#label-the-source-and-target-secrets) | RDI 1.19.x or earlier | Before the upgrade | Helm |
| [Delete the operator Deployment](#delete-the-operator-deployment) | A version before 1.18.1 | During the upgrade | Helm |
| [Validate your configurations before you redeploy them](#validate-your-configurations-before-you-redeploy-them) | RDI 2.0.x or earlier | After the upgrade | VM and Helm |
| [Remove overrides of internal Redis keys](#remove-overrides-of-internal-redis-keys) | RDI 2.0.x or earlier | After the upgrade | VM and Helm |
| [Add the processor type to your configurations](#add-the-processor-type-to-your-configurations) | RDI 1.19.x or earlier | After the upgrade | VM and Helm |

### Label the source and target secrets

- **From**: RDI 1.19.x or earlier, including an installation that you already upgraded to RDI
  2.0.x, 2.2.0, or 2.2.1, unless you have already labeled its secrets
- **When**: Before the upgrade
- **Applies to**: Helm installations, at both sites of a DR setup

Add the labels to the secrets:

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

After the upgrade, run `redis-di list-secrets`, and check that it lists the secrets of the source
as well as those of the target. If it doesn't list the source, run the `kubectl label` commands
again, and then restart the operator:

```bash
kubectl rollout restart deployment/rdi-operator -n rdi
```

### Delete the operator Deployment

- **From**: A version before 1.18.1, with `operator.leaderElection.enabled` set to `true`
- **When**: During the upgrade, right before you run `helm upgrade`
- **Applies to**: Helm installations, at each site of a DR setup

Delete the operator Deployment, and run `helm upgrade` as soon as the command returns:

```bash
kubectl delete deployment rdi-operator -n rdi --cascade=foreground
```

### Validate your configurations before you redeploy them

- **From**: RDI 2.0.x or earlier
- **When**: After the upgrade, before you deploy a configuration again
- **Applies to**: VM and Helm installations

Check each configuration with `redis-di deploy --dry-run`, and fix any issues that it reports. If
it rejects the name of a source, rename the source as described in
[Add or remove a source](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#add-or-remove-a-source).

### Remove overrides of internal Redis keys

- **From**: RDI 2.0.x or earlier, with a configuration that sets any of the following properties
- **When**: After the upgrade
- **Applies to**: VM and Helm installations

RDI 2.2.2 and later ignore the following properties and use their own values. Remove them from
your configuration:

```yaml
sources:
  <source-name>:
    advanced:
      source:
        topic.delimiter: <value>
        offset.storage.redis.key: <value>
        schema.history.internal.redis.key: <value>
        database.ssl.keystore: <value>
        database.ssl.keystore.password: <value>
        mongodb.ssl.keystore: <value>
        mongodb.ssl.keystore.password: <value>
      riotx:
        streamPrefix: <value>
processors:
  advanced:
    source:
      stream.name.pattern: <value>
      consumer.group: <value>
    processor:
      counters.key: <value>
```

<a id="the-flink-processor-becomes-the-default"></a>

### Add the processor type to your configurations

- **From**: RDI 1.19.x or earlier, with a pipeline whose `config.yaml` doesn't set
  `processors.type`
- **When**: After the upgrade, before you deploy a configuration again
- **Applies to**: VM and Helm installations

The upgrade sets
[`processors.type`](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#processors)
to `classic` on the deployed pipeline, but not in your `config.yaml`. Add
`processors.type: classic` to the `config.yaml` of the pipeline, so that the next
`redis-di deploy` keeps the classic processor. You don't need to deploy the change now. To move
to the Flink processor instead, see [Optional steps after the upgrade](#optional-steps-after-the-upgrade).

<a id="enabling-the-flink-processor"></a>

## Optional steps after the upgrade

You can do these steps at any time after the upgrade:

- Migrate the pipelines that use the classic processor to the Flink processor, the default
  processor since RDI 2.0.0. See
  [Migrate from the classic processor to the Flink processor](/content/integrate/redis-data-integration/installation/migration-classic-to-flink.md).
- Change the defaults of the Flink processor, as described in Configure the Flink processor for a
  [VM installation](/content/integrate/redis-data-integration/installation/install-vm.md#configure-the-flink-processor) or a
  [Kubernetes installation](/content/integrate/redis-data-integration/installation/install-k8s.md#configure-the-flink-processor).

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
