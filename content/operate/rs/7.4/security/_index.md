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
url: '/operate/rs/7.4/security/'
---

Redis Enterprise Software provides various features to secure your Redis Enterprise Software deployment:

| Login and passwords | Users and roles | Encryption and TLS | Certificates and audit |
|---------------------|-----------------|--------------------|-----------------------|
| [Password attempts and session timeout](/content/operate/rs/7.4/security/access-control/manage-users/login-lockout.md) | [Cluster and database access explained](/content/operate/rs/7.4/security/access-control/_index.md) | [Enable TLS](/content/operate/rs/7.4/security/encryption/tls/enable-tls.md) | [Create certificates](/content/operate/rs/7.4/security/certificates/create-certificates.md) |
| [Password complexity](/content/operate/rs/7.4/security/access-control/manage-passwords/password-complexity-rules.md) | [Create users](/content/operate/rs/7.4/security/access-control/create-users.md) | [Configure TLS protocols](/content/operate/rs/7.4/security/encryption/tls/tls-protocols.md) | [Monitor certificates](/content/operate/rs/7.4/security/certificates/monitor-certificates.md) |
| [Password expiration](/content/operate/rs/7.4/security/access-control/manage-passwords/password-expiration.md) | [Create roles](/content/operate/rs/7.4/security/access-control/create-combined-roles.md) | [Configure cipher suites](/content/operate/rs/7.4/security/encryption/tls/ciphers.md) | [Update certificates](/content/operate/rs/7.4/security/certificates/updating-certificates.md) |
| [Default database access](/content/operate/rs/7.4/security/access-control/manage-users/default-user.md) | [Redis ACLs](/content/operate/rs/7.4/security/access-control/redis-acl-overview.md) | [Encrypt private keys on disk](/content/operate/rs/7.4/security/encryption/pem-encryption.md) | [Enable OCSP stapling](/content/operate/rs/7.4/security/certificates/ocsp-stapling.md) |
| [Rotate user passwords](/content/operate/rs/7.4/security/access-control/manage-passwords/rotate-passwords.md) | [Integrate with LDAP](/content/operate/rs/7.4/security/access-control/ldap/_index.md) | [Internode encryption](/content/operate/rs/7.4/security/encryption/internode-encryption.md) | [Audit database connections](/content/operate/rs/7.4/security/audit-events.md) |

## Recommended security practices

See [Recommended security practices](/content/operate/rs/7.4/security/recommended-security-practices.md) to learn how to protect Redis Enterprise Software.

## Redis Trust Center

Visit our [Trust Center](https://trust.redis.io/) to learn more about Redis security policies. If you find a suspected security bug, you can [submit a report](https://hackerone.com/redis-vdp?type=team).
