---
Title: Network and data security
LinkTitle: Network and data security (TLS, CIDR Allow list, private endpoint connectivity, encryption)
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
weight: 3
aliases:
    - /operate/rc/security/database-security/
    - /operate/rc/security/network-and-data-security/
---

Redis Cloud provides several features to help you secure your databases. These include
[password-based authentication]({{< relref "/operate/rc/security/data-access-control/default-user" >}}) and [role-based access control]({{< relref "/operate/rc/security/data-access-control/role-based-access-control" >}}),
[network security]({{< relref "/operate/rc/security/network-data-security/connect-private-endpoint" >}}), [TLS]({{< relref "/operate/rc/security/network-data-security/tls-ssl" >}}), and [encryption-at-rest]({{< relref "/operate/rc/security/network-data-security/encryption-at-rest" >}}).

## Passwords, users, and roles

All Redis Cloud databases [require a password]({{< relref "/operate/rc/security/data-access-control/default-user" >}}) to connect. However, we recommend enabling [role-based access control]({{< relref "/operate/rc/security/data-access-control/role-based-access-control" >}}) (RBAC) for additional security. With RBAC, you can define
all the roles you need, with the appropriate permissions, and assign those roles
to your users.

## Network security

Redis Cloud supports two types of network security: [IP Restrictions]({{< relref "/operate/rc/security/network-data-security/connect-private-endpoint" >}}#ip) and [VPCs]({{< relref "/operate/rc/security/network-data-security/connect-private-endpoint" >}}#virtual-private-clouds). We recommend that you employ at least one of these network security options to constrain access to your databases.

## Transport Layer Security (TLS)

Redis Cloud supports [Transport Layer Security]({{< relref "/operate/rc/security/network-data-security/tls-ssl" >}}) (TLS) for database connections. TLS, often called "SSL", ensures the privacy of the TCP connection between your application and database. When client
authentication is enabled, TLS also ensures that those clients with an authorized key can connect to your Redis databases.

We strongly recommend enabling TLS for any application transmitting sensitive data across the wire.

## Disk encryption

Redis Cloud provides encryption for all data stored on disk in Redis databases. See our [encryption at rest documentation]({{< relref "/operate/rc/security/network-data-security/encryption-at-rest" >}}) for specific details.

## Continue learning with Redis University

{{< university-links >}}
