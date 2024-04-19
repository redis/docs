---
Title: Installation
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: How to install Redis Data Integration without an active Internet connection
group: di
linkTitle: Installation
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

## Prepare the source database

Each database type has a different set of preparation steps. Please follow the links below to get the right steps for your chosen source database.

<!-- add links with content for different database types here-->

## Install RDI CLI

RDI CLI is a small executable that provides Command Line Interface for RDI.
Download the tar file according the operating system you plan to run the CLI on:

**RHEL 8**

**RHEL 9**

**Ubuntu 18.04**

**Ubuntu 20.04**


RDI CLI needs to be given execute permissions:

```bash
chmode +x /usr/local/bin/redis-di
```
## Install RDI on VMs

RDI can be installed on one VM for non-production environments and on two VMs in production environments for high-availability topology.

**Supported Operating Systems**

- RHEL 8 & 9
- Ubuntu 18.04 & 20.04

### Prerequisites

RDI installation runs as a privileged user. This is because RDI is needs to install [containerd](https://containerd.io/) and register services.

However, RDI processes themselves do NOT need to run using a privileged user

### Installation steps

Follow the following steps on each of the VMs

1. Download RDI installation and unarchive it

``` bash
curl https://qa-onprem.s3.amazonaws.com/redis-di/$RDI_VERSION/rdi-installation-$RDI_VERSION.tar.gz -O
tar -xvf rdi-installation-$RDI_VERSION.tar.gz
```

2. Change directory to the installation directory

```bash
cd rdi_install/$RDI_VERSION
````

3. Run the installation

```bash
sudo redis-di install
```

The installer will ask you for Redis Enterprise cluster admin credentials in case you want it to create the RDI Redis database for you. 
> Note: the installer does not create RDI Redis database with TLS/mTLS. If you want to use TLS or other advanced options please create the Redis database in the Redis Enterprise console.

If you don’t want the installation to create the RDI database for you:

- Please go to the Redis console and create a database with 250mb RAM with 1 primary and one replica.
- Please secure this database with a password and TLS if you are creating it for a production environment.
- Provide the installation with the required RDI database details
  
At the end of the installation RDI is created and ready to be used.

Note that RDI is giving you instructions on how to create secrets and create your pipeline