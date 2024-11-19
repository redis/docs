---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Set up a test deployment of Redis Enterprise Software for Linux.
linkTitle: Quickstart
title: Redis Enterprise Software quickstart
weight: 1
url: '/operate/rs/7.4/installing-upgrading/quickstarts/redis-enterprise-software-quickstart/'
---
This guide helps you install Redis Enterprise Software on a Linux host to test its capabilities.

When finished, you'll have a simple cluster with a single node:

1. [Ensure port availability](#ensure-port-availability)

1. [Install Redis Enterprise Software](#install-redis-enterprise-software)

1. [Set up a Redis Enterprise Software cluster](#set-up-a-cluster)

1. [Create a new Redis database](#create-a-database)

1. [Connect to your Redis database](#connect-to-your-database)

{{< note >}}
**This quickstart is designed for local testing only.**
For production environments, see the [install and setup]({{< relref "/operate/rs/installing-upgrading#install-redis-enterprise-software" >}}) guide for deployment options and instructions.
{{< /note >}}

## Ensure port availability

{{<embed-md "port-availability-embed.md">}}

### Update `sysctl.conf` to avoid port collisions

{{<embed-md "port-collision-avoidance.md">}}

### Ubuntu conflicts with port 53

{{<embed-md "port-53.md">}}


### Configuration for AWS and GCP

For detailed configuration instructions, see your cloud provider's documentation.

1. Create a VPC that you can use with regional subnets.

1. Within this VPC, create firewall rules that allow external and internal access for Redis Enterprise Software.


| Ingress/Egress   | Source                                             | Protocol  | Ports                                    | Other protocols  |
|------------------|----------------------------------------------------|-----------|------------------------------------------|------------------|
| Ingress          | 0.0.0.0/0                                          | TCP       | 21, 22, 53, 8001, 8443, 9443, 8070, <nobr>10000-19999</nobr> | ICMP             |
| Ingress          | 0.0.0.0/0                                          | UDP       | 53, 5353                                  |                  |
| Ingress          | 10.0.0.0/8  (if subnets use 10. ranges) | all       | all                                      |                  | 


## Install Redis Enterprise Software

To install Redis Enterprise Software:

1. Download the installation files from the [Redis Enterprise Download Center](https://redis.io/downloads/#software)
and copy the download package to a machine with a Linux-based OS. 

    {{< note >}}
You are required to create a free account to access the download center.
    {{< /note >}}

1. Extract the installation files:

    ```sh
    tar vxf <downloaded tar file name>
    ```

1. Run the `install.sh` script in the current directory:

    ```sh
    sudo ./install.sh -y
    ```

## Set up a cluster

To set up your machine as a Redis Enterprise Software cluster:

{{< embed-md "cluster-setup.md" >}}

## Create a database

{{<embed-md "quick-db-setup.md">}}

## Connect to your database

After you create the Redis database, you can connect to it and store data.
See [Test client connection]({{< relref "/operate/rs/databases/connect/test-client-connectivity" >}}) for connection options and examples.

## Supported web browsers

To use the Redis Enterprise Software Cluster Manager UI, you need a modern browser with JavaScript enabled.

The following browsers have been tested with the current version of the Cluster Manager UI:

- Microsoft Windows, version 10 or later.
    - [Google Chrome](https://www.google.com/chrome/), version 48 and later
    - [Microsoft Edge](https://www.microsoft.com/edge), version 20 and later
    - [Mozilla Firefox](https://www.mozilla.org/firefox/), version 44 and and later
    - [Opera](https://www.opera.com/), version 35 and later

- Apple macOS:
    - [Google Chrome](https://www.google.com/chrome/), version 48 and later
    - [Mozilla Firefox](https://www.mozilla.org/firefox/), version 44 and and later
    - [Opera](https://www.opera.com/), version 35 and later

- Linux:
    - [Google Chrome](https://www.google.com/chrome/), version 49 and later
    - [Mozilla Firefox](https://www.mozilla.org/firefox/), version 44 and and later
    - [Opera](https://www.opera.com/), version 35 and later
