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

## Upgrading a VM installation

Follow the steps below to upgrade an existing
[VM installation]({{< relref "/integrate/redis-data-integration/installation/install-vm" >}})
of RDI:

1.  Download the RDI installer from the [Redis download center](https://redis.io/downloads/)
    (in the *Modules, Tools & Integration* category) and extract it to your
    preferred installation folder.

    ```bash
    export RDI_VERSION=<version>
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
directory and run `sudo ./upgrade.sh` to revert to the that version, as described in the section
[Upgrading a VM installation](#upgrading-a-vm-installation) above.

If the version you are replacing is earlier than v1.4.4, follow these steps:

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

{{< note >}}If the `collector-source` or the `processor` pods are not in the `Running` state after
the upgrade, you must run `redis-di deploy` and check again that they are both in the
`Running` state.
{{< /note >}}

### Upgrading a VM installation with High Availability

If there is an active pipeline, upgrade RDI on the active VM first. 
This will cause a short pipeline downtime of up to two minutes. 
Afterwards, upgrade RDI on the passive VM. This will not cause any downtime.

## Upgrading a Kubernetes installation

Follow the steps below to upgrade an existing
[Kubernetes]({{< relref "/integrate/redis-data-integration/installation/install-k8s" >}})
installation of RDI:

1.  If you are using a private registry, pull the new versions of all images listed in 
    [Using a private image registry]({{< relref "/integrate/redis-data-integration/installation/install-k8s#using-a-private-image-registry" >}})
    and add them to your local registry.

1.  Download the RDI Helm chart tar file from the [Redis download center](https://redis.io/downloads/)
    (in the *Modules, Tools & Integration* category).

1.  Adapt your `rdi-values.yaml` file to any changes in the new RDI version if needed.
    See also [Upgrading to RDI 1.8.0 or later from an earlier version](#upgrading-to-rdi-180-or-later-from-an-earlier-version). 
    Before making any changes, save your existing `rdi-values.yaml` if you need to revert 
    to the old RDI version for any reason.

1.  Run the `helm upgrade` command:
    
    ```bash
    helm upgrade --install rdi rdi-<tag>.tar.gz -f rdi-values.yaml -n rdi
    ```

Note that you don't need to
[deploy]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
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

{{< note >}}Downgrading from RDI 1.8.0 or later to an earlier version using `helm upgrade`
will not work. If you need to perform such an upgrade, uninstall RDI completely first as
described in [Uninstall RDI]({{< relref "/integrate/redis-data-integration/installation/install-k8s#uninstall-rdi" >}}),
and then install the old version.
{{< /note >}}

## What happens during the upgrade?

The upgrade process replaces the current RDI components with their new versions:

-   Firstly, the control plane components are replaced. At this point, the pipeline
    is still active but monitoring will be disconnected.
-   Secondly, the pipeline data plane components are replaced.
    If a pipeline is active while upgrading, the `collector-source` and `processor`
    pods will be restarted. The pipeline will pause for up to two minutes but it 
    will catch up very quickly after restarting. 
    The pipeline data and state are both stored in Redis, so data will not
    be lost during the upgrade.
