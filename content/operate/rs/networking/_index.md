---
Title: Manage networks
alwaysopen: false
categories:
- docs
- operate
- rs
description: Networking features and considerations designing your Redis Enteprise
  Software deployment.
hideListLinks: true
linktitle: Networking
weight: 39
---
When designing a Redis Enterprise Software solution, there are some
specific networking features that are worth your time to understand and
implement.

## [Configure cluster DNS]({{< relref "/operate/rs/networking/cluster-dns" >}})

Configure DNS to communicate between cluster nodes.

- [AWS Route53 DNS management]({{< relref "/operate/rs/networking/configuring-aws-route53-dns-redis-enterprise" >}})
- [Client prerequisites for mDNS]({{< relref "/operate/rs/networking/mdns" >}}) for development and test environments

## [Cluster load balancer setup]({{< relref "/operate/rs/networking/cluster-lba-setup" >}})

Set up a load balancer to direct traffic to cluster nodes when DNS is not available.

## [Multi-IP and IPv6]({{< relref "/operate/rs/networking/multi-ip-ipv6" >}})

Requirements for using multiple IP addresses or IPv6 addresses with Redis Enterprise Software.

## [Network port configurations]({{< relref "/operate/rs/networking/port-configurations" >}})

Describes the port ranges that Redis Enterprise Software uses.

## [Public and private endpoints]({{< relref "/operate/rs/networking/private-public-endpoints" >}})

Enable public and private endpoints for your databases.