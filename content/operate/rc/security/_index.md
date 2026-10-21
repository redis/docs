---
Title: Security
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
weight: 51
---

Redis Cloud provides a number of ways to secure subscriptions and databases.

As a Redis Cloud user, consider these security domains:

- The [Redis Cloud console](#admin-console-security)
- [Your databases](/content/operate/rc/security/database-security/_index.md)
- The [Redis Cloud API](/content/operate/rc/api/get-started/enable-the-api.md)

First, you might want to review our [shared responsibility model](/content/operate/rc/security/shared-responsibility-model.md) for security.

## Redis Cloud console security {#admin-console-security}

The Redis Cloud console is the web application you use to manage your Redis Cloud deployments. 

Secure access to the Redis Cloud console by:

- Assigning appropriate roles to [team members with access](/content/operate/rc/security/access-control/access-management.md#team-management-roles).

- Enabling [multi-factor authentication](/content/operate/rc/security/access-control/multi-factor-authentication.md).

- Enabling [SAML SSO](/content/operate/rc/security/access-control/saml-sso/_index.md).

> [!NOTE]
> A user session on Redis Cloud expires after 30 minutes. You'll be signed out of Redis Cloud after 30 minutes of inactivity.

## Database security

You have several options when it comes to securing your Redis Cloud databases. For more information, see [Cloud database security](/content/operate/rc/security/database-security/_index.md). Options include:

- [Encryption at rest](/content/operate/rc/security/encryption-at-rest.md)
- [Role-based access control](/content/operate/rc/security/access-control/data-access-control/role-based-access-control.md)
- [TLS](/content/operate/rc/security/database-security/tls-ssl.md)
- [Network security](/content/operate/rc/security/database-security/network-security.md) using
- [VPC peering](/content/operate/rc/security/vpc-peering.md) and [CIDR whitelist](/content/operate/rc/security/cidr-whitelist.md)

## API security

The Redis Cloud API allows you to programmatically administer your subscriptions and database deployments. This API is disabled by default. When you [enable the API](/content/operate/rc/api/get-started/enable-the-api.md), you can then [manage the API keys](/content/operate/rc/api/get-started/manage-api-keys.md) for all owners of your Redis Cloud account. For an overview of the security features of the API, see the [API authentication documentation](/content/operate/rc/api/get-started/_index.md).

## Continue learning with Redis University

{{< university-links >}}