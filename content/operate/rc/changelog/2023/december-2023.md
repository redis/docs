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
weight: 72
aliases:
  - /operate/rc/changelog/december-2023
---

## New features

### Active-Active JSON support

[Active-Active databases]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}}) on Redis Cloud now support the [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}}) data type. 

See [Create an Active-Active subscription]({{< relref "/operate/rc/databases/create-database/create-active-active-database" >}}) to learn how to create an Active-Active subscription.

### Mutual TLS enhancements

Databases that support [Transport layer security (TLS)]({{< relref "/operate/rc/security/network-data-security/tls-ssl" >}}) now support multiple client certificates for use with mutual TLS. This makes it easier to rotate client certificates outside of a maintenance window. In addition, you can now provide a client Certificate Authority chain to trust any leaf certificate it signed for more flexibility.

See [Transport layer security (TLS)]({{< relref "/operate/rc/security/network-data-security/tls-ssl" >}}) to learn how to enable TLS. 

