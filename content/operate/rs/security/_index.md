---
Title: Security
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
hideListLinks: true
weight: 60
aliases:
    - /operate/rs/administering/designing-production/security
---

Redis Enterprise Software provides various features to secure your Redis Enterprise Software deployment:

| Authentication | Authorization | Encryption | TLS |
|----------------|---------------|------------|-----|
| [User login lockout and session timeout]({{<relref "/operate/rs/security/access-control/manage-users/login-lockout">}}) | [Role-based access control]({{<relref "/operate/rs/security/access-control">}}) | [Encrypt data in transit]({{<relref "/operate/rs/security/encryption#encrypt-data-in-transit">}}) | [Enable TLS]({{<relref "/operate/rs/security/encryption/tls/enable-tls">}}) |
| [Default user]({{<relref "/operate/rs/security/access-control/manage-users/default-user">}}) | [Create roles]({{<relref "/operate/rs/security/access-control/create-roles">}}) | [Encrypt data at rest]({{<relref "/operate/rs/security/encryption#encrypt-data-at-rest">}}) | [Configure TLS protocol]({{<relref "/operate/rs/security/encryption/tls/tls-protocols">}}) |
| [Password complexity rules]({{<relref "/operate/rs/security/access-control/manage-passwords/password-complexity-rules">}}) | [Create users and assign roles]({{<relref "/operate/rs/security/access-control/create-users">}}) | [Encrypt data in use]({{<relref "/operate/rs/security/encryption#encrypt-data-in-use">}}) | [Configure cipher suites]({{<relref "/operate/rs/security/encryption/tls/ciphers">}}) |
| [Password expiration]({{<relref "/operate/rs/security/access-control/manage-passwords/password-expiration">}}) | [Role-based LDAP authentication]({{<relref "/operate/rs/security/access-control/ldap">}}) | | |
| [Password rotation]({{<relref "/operate/rs/security/access-control/manage-passwords/rotate-passwords">}}) | | | |
| [Certificates]({{<relref "/operate/rs/security/certificates">}}) | | | |

## Recommended security practices

See [Recommended security practices]({{<relref "/operate/rs/security/recommended-security-practices">}}) to learn how to protect Redis Enterprise Software.

## Redis Trust Center

Visit our [Trust Center](https://trust.redis.io/) to learn more about Redis security policies. If you find a suspected security bug, you can [submit a report](https://hackerone.com/redis-vdp?type=team).