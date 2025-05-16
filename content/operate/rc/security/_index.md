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
bannerText: This section is a work in progress. Page content is not final.
bannerChildren: true
---

Redis Cloud provides a number of ways to secure subscriptions and databases.

As a Redis Cloud user, consider these security domains:

- The [Redis Cloud console](#admin-console-security)
- [Your databases]({{< relref "/operate/rc/security/network-data-security/" >}})
- The [Redis Cloud API]({{< relref "/operate/rc/api/get-started/enable-the-api" >}})

First, you might want to review our [shared responsibility model]({{< relref "/operate/rc/security/shared-responsibility-model" >}}) for security.

## Redis Cloud console security {#admin-console-security}

The Redis Cloud console is the web application you use to manage your Redis Cloud deployments. 

Secure access to the Redis Cloud console by:

- Assigning appropriate roles to [team members with access]({{< relref "/operate/rc/security/console-access-control/access-management#team-management-roles" >}}).

- Enabling [multi-factor authentication]({{< relref "/operate/rc/security/console-access-control/multi-factor-authentication" >}}).

- Enabling [SAML SSO]({{< relref "/operate/rc/security/console-access-control/saml-sso" >}}).

{{< note >}}
A user session on Redis Cloud expires after 30 minutes. You'll be signed out of Redis Cloud after 30 minutes of inactivity.
{{< /note >}}

## Database security

You have several options when it comes to securing your Redis Cloud databases. For more information, see [Cloud database security]({{< relref "/operate/rc/security/network-data-security/" >}}). Options include:

- [Encryption at rest]({{< relref "/operate/rc/security/network-data-security/encryption-at-rest" >}})
- [Role-based access control]({{< relref "/operate/rc/security/data-access-control/role-based-access-control" >}})
- [TLS]({{< relref "/operate/rc/security/network-data-security/tls-ssl" >}})
- [Network security]({{< relref "/operate/rc/security/network-data-security/connect-private-endpoint" >}}) using
[VPC peering]({{< relref "/operate/rc/security/network-data-security/connect-private-endpoint/vpc-peering" >}}) and [CIDR whitelist]({{< relref "/operate/rc/security/network-data-security/cidr-whitelist" >}})

## API security

The Redis Cloud API allows you to programmatically administer your subscriptions and database deployments. This API is disabled by default. When you [enable the API]({{< relref "/operate/rc/api/get-started/enable-the-api" >}}), you can then [manage the API keys]({{< relref "/operate/rc/api/get-started/manage-api-keys" >}}) for all owners of your Redis Cloud account. For an overview of the security features of the API, see the [API authentication documentation]({{< relref "/operate/rc/api/get-started/" >}}).

## Continue learning with Redis University

{{< university-links >}}