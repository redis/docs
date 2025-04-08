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
weight: 1
---

This guide explains how to install Redis Data Integration (RDI) on one or more VMs and integrate it with
your source database. You can also
[Install RDI on Kubernetes]({{< relref "/integrate/redis-data-integration/installation/install-k8s" >}}).

{{< note >}}We recommend you always use the latest version, which is RDI {{< field "rdi_current_version" >}}.
{{< /note >}}

## Hardware sizing

RDI is mainly CPU and network bound. 
Each of the RDI VMs should have at least:

- **CPU**: A minimum of 4 CPU cores. You should consider adding
  2-6 extra cores on top of this if your dataset is big and you want to ingest the
  baseline snapshot as fast as possible.
- **RAM**: 2GB 
- **Disk**: 25GB, which includes the OS footprint. In particular,
  RDI requires  7GB in  `/var` and 1GB in `/opt` folder  (to
  store the log files).
- **Network interface**: 10GB or more.

## Install RDI on VMs

You would normally install RDI on two VMs for high availability (HA) but you can also install
one just one VM if you don't need this. For example, you might not need HA during
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
update-alternatives --set iptables /usr/sbin/iptables-legacy
update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
```

Also, `iptables` versions 1.8.0-1.8.4 have known issues that can prevent RDI
from working, especially on RHEL 8. Ideally, use `iptables` v1.8.8, which is
known to work correctly with RDI.
{{< /note >}}

The supported OS versions for RDI are:

- RHEL 8 & 9
- Ubuntu 20.04, 22.04, and 24.04

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
systemctl disable firewalld --now
```

However, if you do need to use `firewalld`, you must add the following rules:

```bash
firewall-cmd --permanent --add-port=6443/tcp #apiserver
firewall-cmd --permanent --zone=trusted --add-source=10.42.0.0/16 #pods
firewall-cmd --permanent --zone=trusted --add-source=10.43.0.0/16 #services
firewall-cmd --reload
```

You should also add [port rules](https://firewalld.org/documentation/howto/open-a-port-or-service.html)
for all the [RDI services]({{< relref "/integrate/redis-data-integration/reference/ports" >}})
you intend to use:

```bash
firewall-cmd --permanent --add-port=8080/tcp  # (Required) rdi-operator/rdi-api
firewall-cmd --permanent --add-port=9090/tcp  # vm-dis-reloader
firewall-cmd --permanent --add-port=9092/tcp  # prometheus-service
firewall-cmd --permanent --add-port=9121/tcp  # rdi-metric-exporter
```

{{<note>}}You may also need to add similar rules to open other ports if your setup requires them.
{{</note>}}

If you have `nm-cloud-setup.service` enabled, you must disable it and reboot the
node with the following commands:

```bash
systemctl disable nm-cloud-setup.service nm-cloud-setup.timer
reboot
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
ufw allow 6443/tcp #apiserver
ufw allow from 10.42.0.0/16 to any #pods
ufw allow from 10.43.0.0/16 to any #services
```

You should also add [port rules](https://ubuntu.com/server/docs/firewalls)
for all the [RDI services]({{< relref "/integrate/redis-data-integration/reference/ports" >}})
you intend to use:

```bash
ufw allow 8080/tcp  # (Required) rdi-operator/rdi-api
ufw allow 9090/tcp  # vm-dis-reloader
ufw allow 9092/tcp  # prometheus-service
ufw allow 9121/tcp  # rdi-metric-exporter
```

{{<note>}}You may also need to add similar rules to open other ports if your setup requires them.
{{</note>}}

## Installation steps

Follow the steps below for each of your VMs:

1.  Download the RDI installer from the
    [Redis download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-installation-1.6.4.tar.gz)
    (from the *Modules, Tools & Integration* category) and extract it to your preferred installation
    folder.

1. Go to the installation folder:

    ```bash
    cd rdi_install/$RDI_VERSION
    ```

1. Run the installer as a privileged user:

    ```bash
    sudo ./install.sh
    ```

    {{< note >}}RDI uses [K3s](https://k3s.io/) as part of its implementation.
    By default, the installer installs K3s in the `/var/lib` directory,
    but this might be a problem if you have limited space in `/var`
    or your company policy forbids you to install there. You can
    select a different directory for the K3s installation using the
    `--installation-dir` option with `install.sh` (or
    [`redis-di install`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-install" >}})):

    ```bash
    sudo ./install.sh --installation-dir <custom-directory-path>
    ```
    {{< /note >}}

RDI uses a database on your Redis Enterprise cluster to store its state
information. *This requires Redis Enterprise v6.4 or greater*.

The installer gives you instructions to help you create secrets and create your pipeline.
It will ask you for cluster admin credentials during installation.

Use the Redis console to create the RDI database with the following requirements:

- 250MB RAM with one primary and one replica.
- If you are deploying RDI for a production environment then secure this database with a password
  and TLS.
- Provide the installation with the required RDI database details.
- Set the database's
  [eviction policy]({{< relref "/operate/rs/databases/memory-performance/eviction-policy" >}}) to `noeviction`. Note that you can't set this using
  [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}),
  so you must either do it using the admin UI or with the following
  [REST API]({{< relref "/operate/rs/references/rest-api" >}})
  command:

  ```bash
  curl -v -k -d '{"eviction_policy": "noeviction"}' \
    -u '<USERNAME>:<PASSWORD>' \
    -H "Content-Type: application/json" \
    -X PUT https://<CLUSTER_FQDN>:9443/v1/bdbs/<BDB_UID>
  ```

- Set the database's
  [data persistence]({{< relref "/operate/rs/databases/configure/database-persistence" >}})
  to AOF - fsync every 1 sec. Note that you can't set this using
  [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}),
  so you must either do it using the admin UI or with the following
  [REST API]({{< relref "/operate/rs/references/rest-api" >}})
  commands:

  ```bash
  curl -v -k -d '{"data_persistence":"aof"}' \
    -u '<USERNAME>:<PASSWORD>' \
    -H "Content-Type: application/json" 
    -X PUT https://<CLUSTER_FQDN>:9443/v1/bdbs/<BDB_UID>
  curl -v -k -d '{"aof_policy":"appendfsync-every-sec"}' \
    -u '<USERNAME>:<PASSWORD>' \
    -H "Content-Type: application/json" \
    -X PUT https://<CLUSTER_FQDN>:9443/v1/bdbs/<BDB_UID>
  ```

- **Ensure that the RDI database is not clustered.** RDI will not work correctly if the
  RDI database is clustered, but it is OK for the target database to be clustered.

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

## Supply cloud DNS information

{{< note >}}This section is only relevant if you are installing RDI
on VMs in a cloud environment.
{{< /note >}}

If you are using [Amazon Route 53](https://aws.amazon.com/route53/),
[Google Cloud DNS](https://cloud.google.com/dns?hl=en), or
[Azure DNS](https://azure.microsoft.com/en-gb/products/dns)
then you must supply the installer with the nameserver IP address
during installation (or with the `nameservers` property if you are
using [Silent installation](#silent-installation)). The table below
shows the appropriate IP address for each platform:

| Platform | Nameserver IP |
| :-- | :-- |
| [Amazon Route 53](https://aws.amazon.com/route53/) | 169.254.169.253 |
| [Google Cloud DNS](https://cloud.google.com/dns?hl=en) | 169.254.169.254 |
| [Azure DNS](https://azure.microsoft.com/en-gb/products/dns) | 168.63.129.16 |

If you are planning to use Route 53, you should first check that your VPC
is configured to allow it. See
[DNS attributes in your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/AmazonDNS-concepts.html#vpc-dns-support)
in the Amazon docs for more information.

## "Silent" installation

You can use the
[installer script](#installation-steps) or the
[`redis-di install`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-install" >}})
command with the `--file` option (or the shorter version `-f`) to supply answers
to the installer's questions automatically using properties from a
[TOML](https://toml.io/en/) file:

```bash
./install.sh --file silent.toml
```

### Silent install example

The following TOML file example shows the properties for a typical
silent install configuration:

```toml
title = "RDI Silent Installer Config"

scaffold = true
db_index = 4
deploy_directory = "/opt/rdi/config"

# Upstream DNS servers. This is needed if the installer detects a DNS resolver 
# with a loopback address as an upstream DNS server.
# nameservers = ["8.8.8.8", "8.8.4.4"]

# HTTPS port you want to expose the RDI API on, if different from 443.
# https_port = 5443

[rdi.database]
host = "localhost"
port = 12001
username = "username"
password = "password"
ssl = true

# Uncomment the properties in this section only if the RDI
# database uses TLS/mTLS.
# [rdi.database.certificates]
# ca = "/home/ubuntu/rdi/certs/ca.crt"
# cert = "/home/ubuntu/rdi/certs/client.crt"
# key = "/home/ubuntu/rdi/certs/client.key"
# passphrase = "foobar"
```

The sections below describe the properties in more detail.

### Silent install properties

#### Root

| Property | Description |
|-- |-- |
| `title` | Text to identify the file. RDI doesn't use use this, so you can use any text you like. |
| `scaffold` | Do you want to enable [scaffolding]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-scaffold" >}}) during the install? (true/false) |
| `db_index` | Integer to specify the source database type for scaffolding. The options are 2 (MySQL/MariaDB), 3 (Oracle), 4 (PostgreSQL), and 5 (SQL Server). |
| `deploy_directory` | Path to the directory where you want to store the RDI configuration. |
| `nameservers` | Upstream DNS servers. This is needed if the installer detects a DNS resolver with a loopback address as an upstream DNS server (for example, `nameservers = ["8.8.8.8", "8.8.4.4"]`). |
| `https_port` | HTTPS port you want to expose the RDI API on, if different from 443. |

#### `rdi.database`

Use the properties in this section to specify your RDI database.

| Property | Description |
|-- |-- |
| `host` | Hostname for the Redis database to store RDI state. |
| `port` | Port for the RDI database. |
| `username` | Username for the RDI database. |
| `password` | Password for the RDI database. |
| `ssl` | Is SSL enabled for the RDI database (true/false)? If this is false then RDI will ignore the settings in the [`rdi.database.certificates`](#rdidatabasecertificates) section. |

#### `rdi.database.certificates`

Use these properties only if the RDI database requires
[TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) or
[mTLS](https://en.wikipedia.org/wiki/Mutual_authentication#mTLS).
You must also set `ssl` to `true` in the
[`rdi.database`](#rdidatabase) section to enable these properties.

| Property | Description |
|-- |-- |
| `ca` | Path to the CA certificate file. |
| `cert` | Path to the client certificate file. |
| `key` | Path to the key file. |
| `passphrase` | Password for the private key (string). |

## Prepare your source database

You must also configure your source database to use the CDC connector. See the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
section to learn how to do this.

## Deploy a pipeline

When the installation is complete, and you have prepared the source database for CDC,
you are ready to start using RDI. See the guides to
[configuring]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}}) and
[deploying]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
RDI pipelines for more information. You can also configure and deploy a pipeline
using [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}}).

## Uninstall RDI

If you want to remove your RDI installation, go to the installation folder and run
the uninstall script as a privileged user:

```bash
sudo ./uninstall.sh
```

The script will check you are sure before you proceed:

```
This will uninstall RDI and its dependencies, are you sure? [y, N]
```

If you type anything other than "y" here, the script will abort without making any changes
to RDI or your source database.
