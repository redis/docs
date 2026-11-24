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
---
[Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security), a successor to SSL, ensures the privacy of data sent between applications and Redis databases. TLS also secures connections between Redis Software nodes.

You can [use TLS authentication](/content/operate/rs/security/encryption/tls/enable-tls.md) for the following types of communication:

- Communication from clients (applications) to your database
- Communication from your database to other clusters for replication using [Replica Of](/content/operate/rs/databases/import-export/replica-of/_index.md)
- Communication to and from your database to other clusters for synchronization using [Active-Active](/content/operate/rs/databases/active-active/_index.md)

## Protocols and ciphers

TLS protocols and ciphers define the overall suite of algorithms that clients are able to connect to the servers with.

You can change the [TLS protocols](/content/operate/rs/security/encryption/tls/tls-protocols.md) and [ciphers](/content/operate/rs/security/encryption/tls/ciphers.md) to improve the security of your Redis Software cluster and databases. The default settings are in line with industry best practices, but you can customize them to match the security policy of your organization.

## Troubleshooting

For help troubleshooting TLS failures, see the following knowledge base guides:

- [Troubleshooting TLS Failures](https://support.redislabs.com/hc/en-us/articles/26867190871314-Troubleshooting-TLS-Failures)

- [Troubleshooting TLS Connection Failures Caused by Certificate Expiration](https://support.redislabs.com/hc/en-us/articles/27021922067090-Troubleshooting-TLS-Connection-Failures-Caused-by-Certificate-Expiration)
