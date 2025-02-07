---
Title: Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: The self-managed, enterprise-grade version of Redis.
hideListLinks: true
weight: 10
url: '/operate/rs/7.4/'
linkTitle: 7.4
bannerText: This documentation applies to Redis Software versions 7.4.x.
bannerChildren: true
---

[Redis Enterprise](https://redis.io/enterprise/) is a self-managed, enterprise-grade version of Redis.

With Redis Enterprise, you get many enterprise-grade capabilities, including:
- Linear scalability
- High availability, backups, and recovery
- Predictable performance
- 24/7 support

You can run self-managed Redis Enterprise Software in an on-premises data center or on your preferred cloud platform.

If you prefer a fully managed Redis database-as-a-service, available on major public cloud services, consider setting up a [Redis Cloud]({{<relref "/operate/rc">}}) subscription. You can [try Redis Cloud](https://redis.io/try-free/) for free.

## Get started
Build a small-scale cluster with the Redis Enterprise Software container image.
- [Linux quickstart]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})
- [Docker quickstart]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}})
- [Get started with Active-Active]({{< relref "/operate/rs/databases/active-active/get-started" >}})

## Install & setup
[Install & set up]({{< relref "/operate/rs/installing-upgrading" >}}) a Redis Enterprise Software cluster.
- [Networking]({{< relref "/operate/rs/networking" >}})
- [Set up]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}) & [configure]({{< relref "/operate/rs/clusters/configure" >}}) a [cluster]({{< relref "/operate/rs/clusters" >}})
- [Release notes]({{< relref "/operate/rs/release-notes" >}})

## Databases
Create and manage a [Redis database]({{< relref "/operate/rs/databases" >}}) on a cluster.
- [Create a Redis Enterprise Software database]({{< relref "/operate/rs/databases/create" >}})
- [Configure database]({{< relref "/operate/rs/databases/configure" >}})
- [Create Active-Active database]({{< relref "/operate/rs/databases/active-active/create" >}})
- [Edit Active-Active database]({{< relref "/operate/rs/databases/active-active/manage.md" >}})

## Security
[Manage secure connections]({{< relref "/operate/rs/security" >}}) to the cluster and databases.
- [Access control]({{< relref "/operate/rs/security/access-control" >}})
- [Users]({{< relref "/operate/rs/security/access-control/manage-users" >}}) & [roles]({{< relref "/operate/rs/security/access-control" >}})
- [Certificates]({{< relref "/operate/rs/security/certificates" >}})
- [TLS]({{< relref "/operate/rs/security/encryption/tls" >}}) & [Encryption]({{< relref "/operate/rs/security/encryption" >}})

## Reference
Use command-line utilities and the REST API to manage the cluster and databases.
- [rladmin]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}), [crdb-cli]({{< relref "/operate/rs/references/cli-utilities/crdb-cli" >}}), & [other utilities]({{< relref "/operate/rs/references/cli-utilities" >}})
- [REST API reference]({{< relref "/operate/rs/references/rest-api" >}}) & [examples]({{< relref "/operate/rs/references/rest-api/quick-start" >}})
- [Redis commands]({{< relref "/commands" >}})

## Related info
- [Redis Cloud]({{< relref "/operate/rc" >}})
- [Redis Community Edition]({{< relref "/operate/oss_and_stack" >}})
- [Redis Stack]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}})
- [Glossary]({{< relref "/glossary" >}})

