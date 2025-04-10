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
linkTitle: 7.8
url: '/operate/rs/7.8/'
bannerText: This documentation applies to Redis Software versions 7.8.x.
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
- [Linux quickstart]({{< relref "/operate/rs/7.8/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})
- [Docker quickstart]({{< relref "/operate/rs/7.8/installing-upgrading/quickstarts/docker-quickstart" >}})
- [Get started with Active-Active]({{< relref "/operate/rs/7.8/databases/active-active/get-started" >}})

## Install & setup
[Install & set up]({{< relref "/operate/rs/7.8/installing-upgrading" >}}) a Redis Enterprise Software cluster.
- [Networking]({{< relref "/operate/rs/7.8/networking" >}})
- [Set up]({{< relref "/operate/rs/7.8/clusters/new-cluster-setup" >}}) & [configure]({{< relref "/operate/rs/7.8/clusters/configure" >}}) a [cluster]({{< relref "/operate/rs/7.8/clusters" >}})
- [Release notes](https://redis.io/docs/latest/operate/rs/release-notes/)

## Databases
Create and manage a [Redis database]({{< relref "/operate/rs/7.8/databases" >}}) on a cluster.
- [Create a Redis Enterprise Software database]({{< relref "/operate/rs/7.8/databases/create" >}})
- [Configure database]({{< relref "/operate/rs/7.8/databases/configure" >}})
- [Create Active-Active database]({{< relref "/operate/rs/7.8/databases/active-active/create" >}})
- [Edit Active-Active database]({{< relref "/operate/rs/7.8/databases/active-active/manage.md" >}})

## Security
[Manage secure connections]({{< relref "/operate/rs/7.8/security" >}}) to the cluster and databases.
- [Access control]({{< relref "/operate/rs/7.8/security/access-control" >}})
- [Users]({{< relref "/operate/rs/7.8/security/access-control/manage-users" >}}) & [roles]({{< relref "/operate/rs/7.8/security/access-control" >}})
- [Certificates]({{< relref "/operate/rs/7.8/security/certificates" >}})
- [TLS]({{< relref "/operate/rs/7.8/security/encryption/tls" >}}) & [Encryption]({{< relref "/operate/rs/7.8/security/encryption" >}})

## Reference
Use command-line utilities and the REST API to manage the cluster and databases.
- [rladmin]({{< relref "/operate/rs/7.8/references/cli-utilities/rladmin" >}}), [crdb-cli]({{< relref "/operate/rs/7.8/references/cli-utilities/crdb-cli" >}}), & [other utilities]({{< relref "/operate/rs/7.8/references/cli-utilities" >}})
- [REST API reference]({{< relref "/operate/rs/7.8/references/rest-api" >}}) & [examples]({{< relref "/operate/rs/7.8/references/rest-api/quick-start" >}})
- [Redis commands]({{< relref "/commands" >}})

## Archive

You can use the version selector in the navigation menu to view documentation for Redis Enterprise Software versions 7.4 and later.

To view documentation earlier than version 7.4, see the archived website:

- [Redis Enterprise Software v7.2 documentation archive](https://docs.redis.com/7.2/rs/) 

- [Redis Enterprise Software v6.4 documentation archive](https://docs.redis.com/6.4/rs/) 

- [Redis Enterprise Software v6.2 documentation archive](https://docs.redis.com/6.2/rs/) 

- [Redis Enterprise Software v6.0 documentation archive](https://docs.redis.com/6.0/rs/)


## Related info
- [Redis Cloud]({{< relref "/operate/rc" >}})
- [Redis Community Edition]({{< relref "/operate/oss_and_stack" >}})
- [Redis Stack]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}})
- [Glossary]({{< relref "/glossary" >}})

## Continue learning with Redis University

See the [Get started with Redis Software learning path](https://university.redis.io/learningpath/an0mgw5bjpjfbe?_gl=1*4gjdoe*_gcl_au*MTkyMTIyOTY3Mi4xNzM5MTk5Mjc4) for courses.
