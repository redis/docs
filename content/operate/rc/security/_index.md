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
- [Your databases]({{< relref "/operate/rc/security/database-security/_index.md" >}})
- The [Redis Cloud API]({{< relref "/operate/rc/api/get-started/enable-the-api.md" >}})

First, you might want to review our [shared responsibility model]({{< relref "/operate/rc/security/shared-responsibility-model.md" >}}) for security.

## Redis Cloud console security {#admin-console-security}

The Redis Cloud console is the web application you use to manage your Redis Cloud deployments. 

Secure access to the Redis Cloud console by:

- Assigning appropriate roles to [team members with access]({{< relref "/operate/rc/security/access-control/access-management#team-management-roles" >}}).

- Enabling [multi-factor authentication]({{< relref "/operate/rc/security/access-control/multi-factor-authentication" >}}).

- Enabling [SAML SSO]({{< relref "/operate/rc/security/access-control/saml-sso" >}}).

## Database security

You have several options when it comes to securing your Redis Cloud databases. For more information, see [Cloud database security]({{< relref "/operate/rc/security/database-security/_index.md" >}}). Options include:

- [Encryption at rest]({{< relref "/operate/rc/security/encryption-at-rest.md" >}})
- [Role-based access control]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control.md" >}})
- [Network security]({{< relref "/operate/rc/security/database-security/network-security.md" >}})
- [TLS]({{< relref "/operate/rc/security/database-security/tls-ssl.md" >}})
- [Network security]({{< relref "/operate/rc/security/database-security/network-security.md" >}}) using
[VPC peering]({{< relref "/operate/rc/security/vpc-peering.md" >}}) and [CIDR whitelist]({{< relref "/operate/rc/security/cidr-whitelist.md" >}})

## API security

The Redis Cloud API allows you to programmatically administer your subscriptions and database deployments. This API is disabled by default. When you [enable the API]({{< relref "/operate/rc/api/get-started/enable-the-api.md" >}}), you can then [manage the API keys]({{< relref "/operate/rc/api/get-started/manage-api-keys.md" >}}) for all owners of your Redis Cloud account. For an overview of the security features of the API, see the [API authentication documentation]({{< relref "/operate/rc/api/get-started/_index.md" >}}).
