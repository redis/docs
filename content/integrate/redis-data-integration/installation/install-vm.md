---
Title: Install on VMs
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to install RDI on one or more VMs
group: di
hideListLinks: false
linkTitle: Install on VMs
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

This guide explains how to install Redis Data Integration (RDI) on one or more VMs and integrate it with
your source database. You can also
[Install RDI on Kubernetes]({{< relref "/integrate/redis-data-integration/installation/install-k8s" >}}).

{{< note >}}We recommend you always use the latest version, which is RDI v{{< rdi-version >}}.
{{< /note >}}

## Create the RDI database

RDI uses a database on your Redis Enterprise cluster to store its state
information. Use the Redis Enterprise Cluster Manager UI to create the RDI database with the following
requirements:

{{< embed-md "rdi-db-reqs.md" >}}

## Hardware sizing

RDI is mainly CPU and network bound. 
Each of the RDI VMs should have at least:

{{< embed-md "rdi-vm-reqs.md" >}}

## VM Installation Requirements

You would normally install RDI on two VMs for High Availability (HA) but you can also install
just one VM if you don't need this. For example, you might not need HA during
development and testing.

{{< note >}}You can't install RDI on a host where a Redis Enterprise cluster
is also installed, due to incompatible network rules. If you want to install RDI on a
host that you have previously used for Redis Enterprise then you must
use [`iptables`](https://www.netfilter.org/projects/iptables/index.html) to
"clean" the host before installation with the following command line:

```bash
 sudo iptables-save | awk '/^[*]/ { print $1 } 
                     /^:[A-Z]+ [^-]/ { print $1 " ACCEPT" ; }
                     /COMMIT/ { print $0; }' | sudo iptables-restore
```

You may encounter problems if you use `iptables` v1.6.1 and earlier in
`nftables` mode. Use `iptables` versions later than v1.6.1 or enable the `iptables`
legacy mode with the following commands:

```bash
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
```

Also, `iptables` versions 1.8.0-1.8.4 have known issues that can prevent RDI
from working, especially on RHEL 8. Ideally, use `iptables` v1.8.8, which is
known to work correctly with RDI.
{{< /note >}}

The supported OS versions for RDI are:

{{< embed-md "rdi-os-reqs.md" >}}

You must run the RDI installer as a privileged user because it installs
[containerd](https://containerd.io/) and registers services. However, you don't
need any special privileges to run RDI processes for normal operation.

RDI has a few
requirements for cloud VMs that you must implement before running the
RDI installer, or else installation will fail. The following sections
give full pre-installation instructions for [RHEL](#firewall-rhel) and
[Ubuntu](#firewall-ubuntu).

### RHEL {#firewall-rhel}

We recommend you turn off
[`firewalld`](https://firewalld.org/documentation/)
before installation using the command:

```bash
sudo systemctl disable firewalld --now
```

However, if you do need to use `firewalld`, you must add the following rules:

```bash
sudo firewall-cmd --permanent --add-port=443/tcp # RDI API
sudo firewall-cmd --permanent --add-port=6443/tcp # kube-apiserver
sudo firewall-cmd --permanent --zone=trusted --add-source=10.42.0.0/16 # Kubernetes pods
sudo firewall-cmd --permanent --zone=trusted --add-source=10.43.0.0/16 # Kubernetes services
sudo firewall-cmd --reload
```

If you have `nm-cloud-setup.service` enabled, you must disable it and reboot the
node with the following commands:

```bash
sudo systemctl disable nm-cloud-setup.service nm-cloud-setup.timer
sudo reboot
```

### Ubuntu {#firewall-ubuntu}

We recommend you turn off
[Uncomplicated Firewall](https://wiki.ubuntu.com/UncomplicatedFirewall) (`ufw`)
before installation with the command:

```bash
sudo ufw disable
```

However, if you do need to use `ufw`, you must add the following rules:

```bash
sudo ufw allow 443/tcp # RDI API
sudo ufw allow 6443/tcp # kube-apiserver
sudo ufw allow from 10.42.0.0/16 to any # Kubernetes pods
sudo ufw allow from 10.43.0.0/16 to any # Kubernetes services
sudo ufw reload
```

## Installation steps

Follow the steps below for each of your VMs:

1.  Download the RDI installer from the
    [Redis download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-installation-{{< rdi-version >}}.tar.gz)
    (from the *Modules, Tools & Integration* category) and extract it to your preferred installation
    folder.

    ```bash
    export RDI_VERSION={{< rdi-version >}}
    wget https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-installation-$RDI_VERSION.tar.gz
    tar -xvf rdi-installation-$RDI_VERSION.tar.gz
    ```

1.  Go to the installation folder:

    ```bash
    cd rdi_install/$RDI_VERSION
    ```

1.  Run the `install.sh` script as a privileged user:

    ```bash
    sudo ./install.sh
    ```

    {{< note >}}RDI uses [K3s](https://k3s.io/) as part of its implementation.
    By default, the installer installs K3s in the `/var/lib` directory,
    but this might be a problem if you have limited space in `/var`
    or your company policy forbids you to install there. You can
    select a different directory for the K3s installation using the
    `--installation-dir` option with `install.sh`:

    ```bash
    sudo ./install.sh --installation-dir <custom-installation-directory>
    ```
    {{< /note >}}

The RDI installer collects all necessary configuration details and alerts you to potential issues, 
offering options to abort, apply fixes, or provide additional information. 
Once complete, it guides you through creating secrets and setting up your pipeline.

{{< note >}}It is strongly recommended to specify a hostname rather than an IP address for
connecting to your RDI database, for the following reasons:

-   Any DNS resolution issues will be detected during the installation rather than
    later during pipeline deployment.
-   If you use TLS, your RDI database CA certificate must contain the hostname you specified
    either as a common name (CN) or as a subject alternative name (SAN). CA certificates
    usually don't contain IP addresses.
{{< /note >}}

{{< note >}}If you specify `localhost` as the address of the RDI database server during
installation then the connection will fail if the actual IP address changes for the local
VM. For this reason, we recommend that you don't use `localhost` for the address. However,
if you do encounter this problem, you can fix it using the following commands on the VM
that is running RDI itself:

```bash
sudo k3s kubectl delete nodes --all
sudo service k3s restart
```
{{< /note >}}

After the installation is finished, RDI is ready for use.

### Supply cloud DNS information

{{< note >}}This section is only relevant if you are installing RDI
on VMs in a cloud environment.
{{< /note >}}

If you are using [Amazon Route 53](https://aws.amazon.com/route53/),
[Google Cloud DNS](https://cloud.google.com/dns?hl=en), or
[Azure DNS](https://azure.microsoft.com/en-gb/products/dns)
then you must supply the installer with the nameserver IP address
during installation. The table below
shows the appropriate IP address for each cloud provider:

| Platform | Nameserver IP |
| :-- | :-- |
| [Amazon Route 53](https://aws.amazon.com/route53/) | 169.254.169.253 |
| [Google Cloud DNS](https://cloud.google.com/dns?hl=en) | 169.254.169.254 |
| [Azure DNS](https://azure.microsoft.com/en-gb/products/dns) | 168.63.129.16 |

If you are using Route 53, you should first check that your VPC
is configured to allow it. See
[DNS attributes in your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/AmazonDNS-concepts.html#vpc-dns-support)
in the Amazon docs for more information.

### Installing with High Availability

To install RDI with High Availability (HA), perform the [Installation steps](#installation-steps)
on two different VMs. The first VM will automatically become the active (primary) instance, 
while the second VM will become the passive (secondary) one. 
When starting the RDI installation on the second VM, the installer will detect that the RDI
database is already in use and ask you to confirm that you intend to install RDI with HA.

After the installation is complete, you must set the source and target database secrets
on both VMs as described in [Deploy a pipeline]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}}). If you use `redis-di` to deploy your configuration, you only need to do this on one of the VMs, not both.

In a High Availability setup, the RDI pipeline is only active on the primary instance (VM).
The two RDI instances will use the RDI database for leader election. If the primary instance fails 
to renew the lease in the RDI database, it will lose the leadership and a failover to the secondary instance
will take place. After the failover, the secondary instance will become the primary one, 
and the RDI pipeline will be active on that VM.

## Prepare your source database

Before deploying a pipeline, you must configure your source database to enable CDC. See the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
section to learn how to do this.

## Deploy a pipeline

When the installation is complete, and you have prepared the source database for CDC,
you are ready to start using RDI. See the guides on how to
[configure]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}}) and
[deploy]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
RDI pipelines for more information. You can also configure and deploy a pipeline
using [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}}).

## Uninstall RDI

If you want to remove your RDI installation, go to the installation folder and run
the uninstall script as a privileged user:

```bash
sudo ./uninstall.sh
```

The script will ask if you are sure before proceeding:

```
This will uninstall RDI and its dependencies, are you sure? [y, N]
```

If you type anything other than "y" here, the script will abort without making any changes
to RDI or your source database.
