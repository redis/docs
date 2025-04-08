---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes how to enable public and private endpoints for databases on
  a cluster.
linkTitle: Public and private endpoints
title: "Enable private and\_public database endpoints"
weight: $weight
url: '/operate/rs/7.4/networking/private-public-endpoints/'
---
Each node in Redis Enterprise can be configured with [private and external IP addresses]({{< relref "/operate/rs/7.4/networking/multi-ip-ipv6" >}}). By default, Redis Enterprise Software databases expose a single endpoint, e.g. cluster.com (FQDN), using the external IP addresses, making it available to the public network (e.g. the internet). Additionally, the cluster can be configured to expose a private FQDN, which utilizes the private IP addresses for access from the private network only (e.g. VPC or an internal network).

When you create a cluster via the UI, you can configure it to expose private and public endpoints.
This is common for environments such as cloud platforms and enterprises.

When doing so, the cluster creates an additional FQDN, e.g. internal.cluster.com for private network (e.g. VPC or an internal network), while the cluster.com FQDN can be used by a public network (e.g. the internet).

You can enable public and private endpoints during cluster creation only.
However, you can still add an additional FQDN in a different domain (cluster.io, for example) after cluster creation.

To enable private and public endpoints:

1. Verify the IP addresses are bound to the server or instance.

1. During cluster setup, turn on **Enable public endpoints support** in the **Cluster** screen's **Configuration** section.

    {{<image filename="images/rs/screenshots/cluster/setup/enable-public-endpoints.png" width="75%" alt="The endpoint support setting appears in the **Configuration section** of the **Cluster** setup screen." >}}

    If this setting is not enabled when the cluster is created, databases on the cluster support only a single endpoint.

1. Select **Next** to proceed to **Node** configuration.

1. In the **Network configuration** section:

    1. Configure the machine's public IP address for external traffic.

    1. Configure the private IP address for both internal and external traffic so it can be used for private database endpoints.

After cluster creation, both sets of endpoints are available for databases in the cluster.

To view and copy public and private endpoints for a database in the cluster, see the database's **Configuration > General** section.

{{<image filename="images/rs/screenshots/databases/config-general-endpoints.png" width="75%" alt="View public and private endpoints from the General section of the database's Configuration screen." >}}
