---
Title: Installation
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Install Redis Data Integration without an active internet connection
group: di
linkTitle: Installation
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

This guide explains how to install RDI and integrate it with your source database.

## Preparation

Before you install RDI, you must first prepare your source database.
Each database type has a different set of preparation steps. Use the links
below to see the appropriate steps for your source database.
<!-- add links with content for different database types here-->

## Install RDI on VMs

You would normally install RDI on 2 VMs for high availability (HA) but you can also install
one just 1 VM if you don't need this. For example, you might not need HA during
development and testing.

The supported OS versions for RDI are:

- RHEL 8 & 9
- Ubuntu 18.04 & 20.04

You must run the RDI installer as a privileged user because it installs
[containerd](https://containerd.io/) and registers services. However, you don't
need any special privileges to run RDI processes for normal operation.

### Hardware sizing
RDI is mainly CPU and network bound. 
Each of RDI VMs should have:

- CPU: Min 4 cores CPU. Consider a configuration that would allow for 2-6 additional cores depending on how big is your dataset and how fast you would like RDI to ingest the baseline snapshot.
- RAM: 2GB 
- Disk: 25GB of disk (this includes the OS footprint)
- 10 GB or more network interface
  


### Installation steps

Follow the steps below for each of your VMs:

1. Download and extract the RDI installation:

    ``` bash
    curl https://qa-onprem.s3.amazonaws.com/redis-di/$RDI_VERSION/rdi-installation-$RDI_VERSION.tar.gz -O
    tar -xvf rdi-installation-$RDI_VERSION.tar.gz
    ```

1. Go to the installation folder:

    ```bash
    cd rdi_install/$RDI_VERSION
    ```

1. Run the installer as a privileged user:

    ```bash
    sudo ./install.sh
    ```

The installer will ask you for Redis Enterprise cluster admin credentials. You should supply
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

Once the installation is finished, RDI is ready for use.

{{<note>}}RDI gives you instructions to help you create secrets and create your pipeline.{{</note>}}
