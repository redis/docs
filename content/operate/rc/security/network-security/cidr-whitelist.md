---
Title: Configure CIDR allow list
alwaysopen: false
categories:
- docs
- operate
- rc
description: The CIDR allow list permits traffic between a range of IP addresses and
  the Redis Cloud VPC.
linkTitle: CIDR allow list
weight: 1
aliases:
    - /operate/rc/security/cidr-whitelist/
---

The [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) [allow list](https://en.wikipedia.org/wiki/Whitelist) lets you restrict traffic to your Redis Cloud database. When you configure an allow list, only the [IP addresses](https://en.wikipedia.org/wiki/IP_address) defined in the list can connect to the database. Traffic from all other IP addresses is blocked.


{{< note >}}
To use the CIDR allow list, you must be on either paid Redis Cloud Essentials or on Redis Cloud Pro.  This feature is not supported on free Redis Cloud Essentials plans.
{{< /note >}}

## Define CIDR allow list

To define the CIDR allow list for a database:

1. Select **Databases** from the [Redis Cloud console](https://cloud.redis.io/) menu and then select your database from the list.

1. From the database's **Configuration** screen, select the **Edit database** button.

1. In the **Security** section, turn on the **CIDR allow list** toggle.

1. Enter the first IP address (in CIDR format) you want to allow in the text box and then select the check mark to add it to the allow list:

    {{<image filename="images/rc/database-details-configuration-tab-security-cidr-allowlist-add-first-ip.png" width="80%" alt="Add the first IP address to the CIDR allow list." >}}
   
1. To allow additional IP addresses:

    1. Select **Add CIDR**.

    1. Enter the new IP address in the text box and then select check to add it to the allow list.

        {{<image filename="images/rc/database-details-configuration-tab-security-cidr-allowlist-add-more-ips.png" width="80%" alt="Add a new IP address to the CIDR allow list." >}}

1. Select **Save database** to apply your changes.

{{< note >}}
The database CIDR allow list applies to both the public endpoint and the private endpoint. If you use connectivity options such as [VPC Peering]({{< relref "/operate/rc/security/vpc-peering" >}}) and [Transit Gateway]({{< relref "/operate/rc/security/aws-transit-gateway" >}}) to connect to your database via the private endpoint, you must also add those IPs to your database's CIDR allow list.
{{< /note >}}

## Continue learning with Redis University

{{< university-links >}}
