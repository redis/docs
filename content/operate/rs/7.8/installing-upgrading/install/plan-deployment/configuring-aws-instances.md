---
Title: Configure AWS EC2 instances for Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Considerations for installing and running Redis Enterprise Software on
  Amazon Elastic Cloud Compute (EC2) instances.
linkTitle: AWS EC2 configuration
weight: 80
url: '/operate/rs/7.8/installing-upgrading/install/plan-deployment/configuring-aws-instances/'
---
There are some special considerations for installing
and running Redis Enterprise Software on Amazon Elastic Cloud Compute (EC2) instances. 

These include:

- [Storage considerations](#storage)
- [Instance types](#instance-types)
- [Security group configuration](#security)

## Storage considerations {#storage}

AWS EC2 instances are ephemeral, but your persistent database storage should
not be. If you require a persistent storage location for your database,
the storage must be located outside of the instance. When you
set up an instance, make sure it has a properly sized EBS-backed volume
connected. When you set up Redis Enterprise Software on the instance, make sure that [the
persistence storage]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}) is configured to use this volume.

{{< note >}}
After [installing the Redis Enterprise Software package]({{< relref "/operate/rs/installing-upgrading" >}}) on the instance
and **before** running through [the setup process]({{< relref "/operate/rs/clusters/new-cluster-setup.md" >}}),
you must give the group `redislabs` permission to the EBS volume by
running the following command from the OS command-line interface (CLI):
```sh
chown redislabs:redislabs /< ebs folder name>
```
{{< /note >}}

Another feature that may be of importance to you is the use of
Provisioned IOPS for EBS-backed volumes. Provisioned IOPS guarantee a
certain level of disk performance. There are two features in Redis Enterprise Software where
this feature could be critical to use:

1. When using [Auto Tiering]({{< relref "/operate/rs/databases/auto-tiering/" >}})
1. When using AOF on every write and there is a high write load. In
    this case, the provisioned IOPS should be on the nodes used as
    replicas in the cluster.

## Instance types {#instance-types}

Choose an instance type that has (at minimum) enough free memory and
disk space to meet the Redis Enterprise Software [hardware
requirements]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements.md" >}}).

In addition, some instance types are optimized for EBS-backed volumes
and some are not. If you are using persistent storage, you should use an
instance type that is, especially if disk drain rate matters to your database
implementation.

## Security group configuration {#security}

When configuring the security group:

- Define a custom TCP rule for port 8443 to allow web browser access
    to the Redis Enterprise Software Cluster Manager UI from the IP address range you use to
    access the Cluster Manager UI.
- If you are using the DNS resolving option with Redis Enterprise Software, define a DNS UDP
    rule for port 53 to allow access to the databases' endpoints by
    using the [DNS resolving mechanism]({{< relref "/operate/rs/networking/cluster-dns" >}}).
- To create a cluster that has multiple nodes all running as instances on AWS,
    you need to define a security group that has an All TCP rule for all ports, 0 - 65535,
    and add it to all instances that are part of the cluster.
    This ensures that all nodes are able to communicate with each other.
    To limit the number of open ports, you can open only the [ports used by Redis Enterprise Software]({{< relref "/operate/rs/networking/port-configurations.md" >}}).

After successfully launching the instances:

1. Install Redis Enterprise Software from the [Linux package or AWS AMI]({{< relref "/operate/rs/installing-upgrading" >}}).
2. [Set up the cluster]({{< relref "/operate/rs/clusters/new-cluster-setup.md" >}}).
