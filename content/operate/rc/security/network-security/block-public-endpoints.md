---
Title: Block public endpoints
alwaysopen: false
categories:
- docs
- operate
- rc
description: Learn how to block the public endpoints of your databases.
weight: 40
aliases:
- /operate/rc/security/database-security/block-public-endpoints/
- /operate/rc/security/block-public-endpoints/
---

By default, you can connect to Redis Cloud databases through the database's public endpoint, or through the database's private endpoint with a private connectivity method. 

Public endpoints are accessible from the public internet and don't require a private connectivity method. While this makes Redis Cloud databases convenient to use, it also exposes the databases to potential unauthorized access or brute force attacks, even with a database password in place. Some organizations may want to block public access to their databases to comply with security policies or to better meet stringent compliance standards.

Users with Redis Cloud Pro databases can choose to block public endpoints for all databases in their subscription.

{{< note >}}
After you block your database's public endpoint, any connection from an IP address that is not part of the private address space defined in [RFC 1918](https://datatracker.ietf.org/doc/html/rfc1918#section-3) will be rejected. Ensure that all connections to your database are made through a private connectivity method before blocking the public endpoint.
{{< /note >}}

## Block public endpoints

You can block public endpoints for a [new subscription](#new-subscription) or an [existing subscription](#existing-subscription).

### New subscription

To block the public endpoints when you [create a new Pro subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}):

1. Follow the instructions to [create a Pro database with custom settings]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#custom-settings" >}}). 
1. On the **Setup** tab, go to **Advanced options > Security** to select persistent storage encryption options. 
1. Select **Block public endpoint** to block the public endpoint for all databases on the subscription. 
1. Select **Continue** to go to the [Sizing tab]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#sizing-tab" >}}). Follow the instructions to provision your database(s).

After you block the public endpoints for a new subscription, you will need to set up a [private connectivity method](#private-connectivity-methods) to connect to your databases. 

### Existing subscription

For existing subscriptions, we recommend setting up a [private connectivity method](#private-connectivity-methods) to connect to your databases before blocking the private endpoint and migrating all connections to the private endpoint. 

To block the public endpoints of an existing Pro subscription:

1. From the [Redis Cloud console](https://cloud.redis.io/), select the **Subscriptions** menu and then select your subscription from the list. 
1. Open the **Security** tab to view security settings.
1. In the **Endpoint** section, select **Edit**.
1. Select **Block public endpoint**.
1. Select **Save** to save your changes.
1. A window will appear asking you to confirm that blocking the public endpoint will reject clients connecting to the public endpoint. Select **I understand** and then **Block** to confirm.

After your changes are saved, any incoming connections to the public endpoint of your database will be rejected, and only connections through a private connectivity method will be allowed.

## Private connectivity methods

Redis Cloud supports the following private connectivity options:
- [VPC peering]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/vpc-peering" >}})
- [Google Cloud Private Service Connect]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/private-service-connect" >}}) _(Google Cloud only)_
- [AWS Transit Gateway]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/aws-transit-gateway" >}}) _(AWS only)_