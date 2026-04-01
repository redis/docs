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
url: '/operate/rs/7.22/security/'
---

Redis Enterprise Software provides various features to secure your Redis Enterprise Software deployment:

| Login and passwords | Users and roles | Encryption and TLS | Certificates and audit |
|---------------------|-----------------|--------------------|-----------------------|
| [Password attempts and session timeout]({{<relref "/operate/rs/7.22/security/access-control/manage-users/login-lockout">}}) | [Cluster and database access explained]({{<relref "/operate/rs/7.22/security/access-control">}}) | [Enable TLS]({{<relref "/operate/rs/7.22/security/encryption/tls/enable-tls">}}) | [Create certificates]({{<relref "/operate/rs/7.22/security/certificates/create-certificates">}}) |
| [Password complexity]({{<relref "/operate/rs/7.22/security/access-control/manage-passwords/password-complexity-rules">}}) | [Create users]({{<relref "/operate/rs/7.22/security/access-control/create-users">}}) | [Configure TLS protocols]({{<relref "/operate/rs/7.22/security/encryption/tls/tls-protocols">}}) | [Monitor certificates]({{<relref "/operate/rs/7.22/security/certificates/monitor-certificates">}}) |
| [Password expiration]({{<relref "/operate/rs/7.22/security/access-control/manage-passwords/password-expiration">}}) | [Create roles]({{<relref "/operate/rs/7.22/security/access-control/create-combined-roles">}}) | [Configure cipher suites]({{<relref "/operate/rs/7.22/security/encryption/tls/ciphers">}}) | [Update certificates]({{<relref "/operate/rs/7.22/security/certificates/updating-certificates">}}) |
| [Default database access]({{<relref "/operate/rs/7.22/security/access-control/manage-users/default-user">}}) | [Redis ACLs]({{<relref "/operate/rs/7.22/security/access-control/redis-acl-overview">}}) | [Encrypt private keys on disk]({{<relref "/operate/rs/7.22/security/encryption/pem-encryption">}}) | [Enable OCSP stapling]({{<relref "/operate/rs/7.22/security/certificates/ocsp-stapling">}}) |
| [Rotate user passwords]({{<relref "/operate/rs/7.22/security/access-control/manage-passwords/rotate-passwords">}}) | [Integrate with LDAP]({{<relref "/operate/rs/7.22/security/access-control/ldap">}}) | [Internode encryption]({{<relref "/operate/rs/7.22/security/encryption/internode-encryption">}}) | [Audit database connections]({{<relref "/operate/rs/7.22/security/audit-events">}}) |

## Recommended security practices

See [Recommended security practices]({{<relref "/operate/rs/7.22/security/recommended-security-practices">}}) to learn how to protect Redis Enterprise Software.

## Redis Trust Center

Visit our [Trust Center](https://trust.redis.io/) to learn more about Redis security policies. If you find a suspected security bug, you can [submit a report](https://hackerone.com/redis-vdp?type=team).
