---
Title: Transport Layer Security (TLS)
alwaysopen: false
categories:
- docs
- operate
- rs
description: An overview of Transport Layer Security (TLS).
hideListLinks: true
linkTitle: TLS
weight: 10
url: '/operate/rs/7.4/security/encryption/tls/'
---
[Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security), a successor to SSL, ensures the privacy of data sent between applications and Redis databases. TLS also secures connections between Redis Enterprise Software nodes.

You can [use TLS authentication]({{< relref "/operate/rs/security/encryption/tls/enable-tls" >}}) for the following types of communication:

- Communication from clients (applications) to your database
- Communication from your database to other clusters for replication using [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of" >}})
- Communication to and from your database to other clusters for synchronization using [Active-Active]({{< relref "/operate/rs/databases/active-active/" >}})

## Protocols and ciphers

TLS protocols and ciphers define the overall suite of algorithms that clients are able to connect to the servers with.

You can change the [TLS protocols]({{< relref "/operate/rs/security/encryption/tls/tls-protocols" >}}) and [ciphers]({{< relref "/operate/rs/security/encryption/tls/ciphers" >}}) to improve the security of your Redis Enterprise cluster and databases. The default settings are in line with industry best practices, but you can customize them to match the security policy of your organization.
