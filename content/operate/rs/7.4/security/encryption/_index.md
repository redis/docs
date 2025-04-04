---
Title: Encryption in Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Encryption in Redis Enterprise Software.
hideListLinks: true
linkTitle: Encryption
toc: 'true'
weight: 60
url: '/operate/rs/7.4/security/encryption/'
---

Redis Enterprise Software uses encryption to secure communications between clusters, nodes, databases, and clients and to protect [data in transit](https://en.wikipedia.org/wiki/Data_in_transit), [at rest](https://en.wikipedia.org/wiki/Data_at_rest), and [in use](https://en.wikipedia.org/wiki/Data_in_use).

## Encrypt data in transit

### TLS

Redis Enterprise Software uses [Transport Layer Security (TLS)]({{<relref "/operate/rs/7.4/security/encryption/tls">}}) to encrypt communications for the following:

- Cluster Manager UI

- Command-line utilities

- REST API

- Internode communication

You can also [enable TLS authentication]({{< relref "/operate/rs/7.4/security/encryption/tls/enable-tls" >}}) for the following:

- Communication from clients or applications to your database

- Communication from your database to other clusters for replication using [Replica Of]({{< relref "/operate/rs/7.4/databases/import-export/replica-of/" >}})

- Communication to and from your database to other clusters for [Active-Active]({{< relref "/operate/rs/7.4/databases/active-active/_index.md" >}}) synchronization

### Internode encryption

[Internode encryption]({{<relref "/operate/rs/7.4/security/encryption/internode-encryption">}}) uses TLS to encrypt data in transit between cluster nodes.

By default, internode encryption is enabled for the control plane, which manages the cluster and databases. If you also want to encrypt replication and proxy communications between database shards on different nodes, [enable data internode encryption]({{< relref "/operate/rs/7.4/security/encryption/internode-encryption#enable-data-internode-encryption" >}}).

### Require HTTPS for REST API endpoints

By default, the Redis Enterprise Software API supports communication over HTTP and HTTPS. However, you can [turn off HTTP support]({{< relref "/operate/rs/7.4/references/rest-api/encryption" >}}) to ensure that API requests are encrypted.

## Encrypt data at rest

### File system encryption

To encrypt data stored on disk, use file system-based encryption capabilities available on Linux operating systems before you install Redis Enterprise Software.

### Private key encryption

Enable PEM encryption to [encrypt all private keys]({{< relref "/operate/rs/7.4/security/encryption/pem-encryption" >}}) on disk.

## Encrypt data in use

### Client-side encryption

Use client-side encryption to encrypt the data an application stores in a Redis database. The application decrypts the data when it retrieves it from the database.

You can add client-side encryption logic to your application or use built-in client functions.

Client-side encryption has the following limitations:

- Operations that must operate on the data, such as increments, comparisons, and searches will not function properly.

- Increases management overhead.

- Reduces performance.
