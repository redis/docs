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
url: '/operate/rs/7.8/security/'
---

Redis Enterprise Software provides various features to secure your Redis Enterprise Software deployment:

| Login and passwords | Users and roles | Encryption and TLS | Certificates and audit |
|---------------------|-----------------|--------------------|-----------------------|
| [Password attempts and session timeout]({{<relref "/operate/rs/security/access-control/manage-users/login-lockout">}}) | [Cluster and database access explained]({{<relref "/operate/rs/security/access-control">}}) | [Enable TLS]({{<relref "/operate/rs/security/encryption/tls/enable-tls">}}) | [Create certificates]({{<relref "/operate/rs/security/certificates/create-certificates">}}) |
| [Password complexity]({{<relref "/operate/rs/security/access-control/manage-passwords/password-complexity-rules">}}) | [Create users]({{<relref "/operate/rs/security/access-control/create-users">}}) | [Configure TLS protocols]({{<relref "/operate/rs/security/encryption/tls/tls-protocols">}}) | [Monitor certificates]({{<relref "/operate/rs/security/certificates/monitor-certificates">}}) |
| [Password expiration]({{<relref "/operate/rs/security/access-control/manage-passwords/password-expiration">}}) | [Create roles]({{<relref "/operate/rs/security/access-control/create-combined-roles">}}) | [Configure cipher suites]({{<relref "/operate/rs/security/encryption/tls/ciphers">}}) | [Update certificates]({{<relref "/operate/rs/security/certificates/updating-certificates">}}) |
| [Default database access]({{<relref "/operate/rs/security/access-control/manage-users/default-user">}}) | [Redis ACLs]({{<relref "/operate/rs/security/access-control/redis-acl-overview">}}) | [Encrypt private keys on disk]({{<relref "/operate/rs/security/encryption/pem-encryption">}}) | [Enable OCSP stapling]({{<relref "/operate/rs/security/certificates/ocsp-stapling">}}) |
| [Rotate user passwords]({{<relref "/operate/rs/security/access-control/manage-passwords/rotate-passwords">}}) | [Integrate with LDAP]({{<relref "/operate/rs/security/access-control/ldap">}}) | [Internode encryption]({{<relref "/operate/rs/security/encryption/internode-encryption">}}) | [Audit database connections]({{<relref "/operate/rs/security/audit-events">}}) |

## Recommended security practices

See [Recommended security practices]({{<relref "/operate/rs/security/recommended-security-practices">}}) to learn how to protect Redis Enterprise Software.

## Redis Trust Center

Visit our [Trust Center](https://trust.redis.io/) to learn more about Redis security policies. If you find a suspected security bug, you can [submit a report](https://hackerone.com/redis-vdp?type=team).
