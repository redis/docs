---
Title: Redis Cloud changelog (December 2023)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  December 2023.
highlights: Active-Active JSON support, mTLS enhancements
linktitle: December 2023
tags:
- changelog
weight: 72
aliases:
  - /operate/rc/changelog/december-2023
---

## New features

### Active-Active JSON support

[Active-Active databases](/content/operate/rc/databases/active-active/_index.md) on Redis Cloud now support the [JSON](/content/operate/oss_and_stack/stack-with-enterprise/json/_index.md) data type.

See [Create an Active-Active subscription](/content/operate/rc/databases/active-active/create-active-active-database.md) to learn how to create an Active-Active subscription.

### Mutual TLS enhancements

Databases that support [Transport layer security (TLS)](/content/operate/rc/security/database-security/tls-ssl.md) now support multiple client certificates for use with mutual TLS. This makes it easier to rotate client certificates outside of a maintenance window. In addition, you can now provide a client Certificate Authority chain to trust any leaf certificate it signed for more flexibility.

See [Transport layer security (TLS)](/content/operate/rc/security/database-security/tls-ssl.md) to learn how to enable TLS. 

