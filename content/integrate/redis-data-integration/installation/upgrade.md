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
weight: 3
---

## Upgrading a VM installation

Follow the steps below to upgrade an existing
[VM installation]({{< relref "/integrate/redis-data-integration/installation/install-vm" >}})
of RDI:

1.  Download the RDI installer from the
    [Redis download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-installation-1.6.3.tar.gz)
    (in the *Modules, Tools & Integration* category) and extract it to your
    preferred installation folder.

1.  Go to the installation folder:

    ```bash
    cd rdi_install/$RDI_VERSION
    ```

1.  Run the `upgrade` script as a privileged user. Note that you must pass
    your RDI password to the script unless the password is empty.

    ```bash
    sudo ./upgrade.sh --rdi-password <redis-rdi-password>
    ```

### Recovering from failure during a VM upgrade

If the previous version is v1.4.4 or later, go to the `rdi_install/<PREVIOUS_VERSION>`
directory and run `sudo ./upgrade.sh`, as described in the section
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

{{< note >}}If the `collector-source` or the `processor` are not in the `Running` state during
the upgrade, you must run `redis-di deploy` and check again that they are both in the
`Running` state.
{{< /note >}}

### Upgrading a VM installation with High availability

If there is an active pipeline, the upgrade process will involve upgrading RDI on the active
VM first which will cause downtime for the collector-source (see
[Upgrade a VM installation](#upgrade-a-vm-installation) above). Afterwards, the passive
VM will be upgraded. Switching over won't eliminate the downtime because switching between
VMs also requires a about a minute of downtime.

## Upgrading a Kubernetes installation

Follow the steps below to upgrade an existing
[Kubernetes]({{< relref "/integrate/redis-data-integration/installation/install-k8s" >}})
installation of RDI:

1. Download the new versions of the images, if you are using a private registry:

    ```bash
    docker pull redis/rdi-processor:tagname
    docker pull redis/rdi-operator:tagname
    docker pull redis/rdi-api:tagname
    docker pull redis/rdi-monitor:tagname
    docker pull redis/rdi-collector-initializer
    docker pull redis/rdi-collector-api
    ```

1.  Download the RDI helm chart tar file from the 
    [Redis download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-1.6.3.tgz).

1.  Run the `helm upgrade` command:
    
    ```bash
    helm upgrade [RELEASE_NAME] [CHART]
    ```

    Note that you don't need to
    [deploy]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
    again after this step.

### Verifying the upgrade

Check the upgrade with the following command:

```bash
 sudo k3s kubectl get all -n <namespace>
```

You should find that all the pods are running (they will have `1/1` in the `READY` column of the
command's output).
Check for any pods that don't have `1/1` in the `READY` column (which is the second
column). For example, the pod below has `0/1` in the second column, which indicates the
deployment hasn't worked:

```bash
<pod_name>        0/1     CrashLoopBackOff   1881 (91s ago)   6d17h
```

You can also check that the latest version is running using the following command on one of
the pods:

```bash
sudo k3s kubectl describe <pod_name> -n <namespace>
```

Search for the image tag `Image: docker.io/redis/<pod_name>:<version/image_tag>`
in the command's output to verify the version.

If you find that the upgrade hasn't worked for any reason, then run the `helm upgrade`
command again (as described in the section
[Upgrading a Kubernetes installation](#upgrading-a-kubernetes-installation) above),
but this time with the previous version you were upgrading from. This will restore your
previous working state.

## What happens during the upgrade?

The upgrade process replaces the current RDI components with the new versions:

-   Firstly, the control plane components are replaced. At this point, the pipeline
    is still active but monitoring will be disconnected.

-   Secondly, the pipeline data path components are replaced with the new versions.
    If a pipeline is active while upgrading, the `collector-source` will be restarted
    as a result of restarting the `collector-initializer`. The pipeline will pause for
    about two minutes but it will catch up very quickly after restarting. 
    The pipeline data and state are both stored in Redis, so data will never normally
    be lost during the downtime while upgrading.
