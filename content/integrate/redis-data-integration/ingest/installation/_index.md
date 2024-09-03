---
Title: Installation
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to install RDI ingest
group: di
hideListLinks: false
linkTitle: Installation
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

This guide explains how to install RDI and integrate it with your source database.

{{< note >}}RDI v1.2.7 had a CoreDNS issue where in some installations the host DNS could not
resolve hostnames for the RDI components. This meant that it couldn't connect to the RDI database
and resume the installation. This problem is fixed in v1.2.8, so we recommend you use this version
instead of v1.2.7.
{{< /note >}}

## Install RDI on VMs

You would normally install RDI on two VMs for high availability (HA) but you can also install
one just one VM if you don't need this. For example, you might not need HA during
development and testing.

The supported OS versions for RDI are:

- RHEL 8 & 9
- Ubuntu 18.04 & 20.04

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
for all the [RDI services]({{< relref "/integrate/redis-data-integration/ingest/reference/ports" >}})
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
ufw disable
```

However, if you do need to use `ufw`, you must add the following rules:

```bash
ufw allow 6443/tcp #apiserver
ufw allow from 10.42.0.0/16 to any #pods
ufw allow from 10.43.0.0/16 to any #services
```

You should also add [port rules](https://ubuntu.com/server/docs/firewalls)
for all the [RDI services]({{< relref "/integrate/redis-data-integration/ingest/reference/ports" >}})
you intend to use:

```bash
ufw allow 8080/tcp  # (Required) rdi-operator/rdi-api
ufw allow 9090/tcp  # vm-dis-reloader
ufw allow 9092/tcp  # prometheus-service
ufw allow 9121/tcp  # rdi-metric-exporter
```

{{<note>}}You may also need to add similar rules to open other ports if your setup requires them.
{{</note>}}

## Hardware sizing

RDI is mainly CPU and network bound. 
Each of the RDI VMs should have:

- CPU: A minimum of 4 CPU cores. You should consider adding
  2-6 extra cores on top of this if your dataset is big and you want to ingest the
  baseline snapshot as fast as possible.
- RAM: 2GB 
- Disk: 25GB of disk (this includes the OS footprint)
- 10GB or more network interface

## Installation steps

Follow the steps below for each of your VMs:

1.  Download the RDI installer from the [Redis download center](https://cloud.redis.io/#/rlec-downloads)
    (under the *Modules, Tools & Integration* dropdown)
    and extract it to your preferred installation folder.

1. Go to the installation folder:

    ```bash
    cd rdi_install/$RDI_VERSION
    ```

1. Run the installer as a privileged user:

    ```bash
    sudo ./install.sh
    ```
RDI uses a database on your Redis Enterprise cluster to store its state
information. *This requires Redis Enterprise v6.4 or greater*.

The installer gives you instructions to help you create secrets and create your pipeline.
It will ask you for cluster admin credentials during installation. You should supply
these if you want the installer to create the RDI database for you.
 
{{<note>}}The installer does not create the RDI Redis database with
[TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security)/
[mTLS](https://en.wikipedia.org/wiki/Mutual_authentication#mTLS).
If you want to use TLS or other advanced options then you must create the Redis database
yourself using the Redis Enterprise console.{{</note>}}

If you don’t want the installation to create the RDI database for you:

- Use the Redis console to create a database with 250MB RAM with 1 primary and 1 replica.
- If you are deploying RDI for a production environment then secure this database with a password
  and TLS.
- Provide the installation with the required RDI database details.

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

## "Silent" installation

You can use the
[installer script](#installation-steps) or the
[`redis-di install`]({{< relref "/integrate/redis-data-integration/ingest/reference/cli/redis-di-install" >}})
command with the `--file` option (or the shorter version `-f`) to supply answers
to the installer's questions automatically using properties from a
[TOML](https://toml.io/en/) file:

```bash
./install.sh --file silent.toml
```

### Silent install example

The following example shows the properties for a typical
silent install configuration:

```toml
title = "RDI Silent Installer Config"

scaffold = true
deploy_directory = "/opt/rdi/config"

# If you are *not* using an existing RDI database and you want
# the installer to create one then remove the properties in this
# section, apart from :
# - `password`
# - `use_existing_rdi` -  set this to `false`
# Also, uncomment the [rdi.cluster] section below.
[rdi.database]
host = "localhost"
port = 12001
username = "username"
password = "password"
use_existing_rdi = true
ssl = true

# Uncomment this section and remove properties from the
# [rdi.database] section as described above if you
# are *not* using an existing RDI database and you want
# the installer to create one.
# [rdi.cluster]
# host = "localhost"
# port = 9443
# username = "username"
# password = "password"


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
| `high_availability` | Do you want to enable replication on the RDI database (true/false)? You should only use this if you ask the installer to create the RDI database for you. |
| `scaffold` | Do you want to enable [scaffolding]({{< relref "/integrate/redis-data-integration/ingest/reference/cli/redis-di-scaffold" >}}) during the install? (true/false) |
| `db_index` | Integer to specify the source database type for scaffolding. The options are 2 (MySQL/MariaDB), 3 (Oracle), 4 (PostgreSQL), and 5 (SQL Server). |
| `deploy_directory` | Path to the directory where you want to store the RDI configuration. |

#### `rdi.database`

Use the properties in this section if you want to use an existing RDI database.
See [`rdi.cluster`](#rdicluster) below if you want the installer to create a new
RDI database. However, you should still supply the `password` in this
section and set `use_existing_rdi` to `false` if the installer creates the
database.

| Property | Description |
|-- |-- |
| `host` | Hostname for the Redis database to store RDI state. |
| `port` | Port for the RDI database. |
| `username` | Username for the RDI database. |
| `password` | Password for the RDI database. |
| `use_existing_rdi` | Do you want to use an existing RDI instance (true) or create a new one (false)? If you enable SSL (see the property below), this will be set to true, overriding the value you specify here. |
| `ssl` | Is SSL enabled for the RDI database (true/false)? If this is false then RDI will ignore the settings in the [`rdi.database.certificates`](#rdidatabasecertificates) section. |

#### `rdi.cluster`

Use the properties in this section if you are *not* using an existing RDI database
and you want the installer to create one.
See [`rdi.database`](#rdidatabase) above if you want to use an existing RDI database.

| Property | Description |
|-- |-- |
| `host` | Hostname of the Redis cluster to use for RDI. |
| `port` | Port for the cluster. |
| `username` | Username for the cluster. |
| `password` | Password for the cluster. |

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

You must also configure your source database to use the Debezium connector for CDC. See the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs" >}})
section to learn how to do this.

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
