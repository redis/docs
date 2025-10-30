---
Title: Install and upgrade modules
alwaysopen: false
categories:
- docs
- operate
- stack
description: null
hideListLinks: true
linkTitle: Install and upgrade modules
weight: 4
---

Several modules that provide additional Redis capabilities, such as search and query, JSON, time series, and probabilistic data structures, come packaged with [Redis Enterprise Software]({{< relref "/operate/rs" >}}). As of version 8.0, Redis Enterprise Software includes four feature sets, compatible with different Redis database versions.

However, if you want to use additional modules or upgrade a module to a more recent version, you need to:

1. [Install a module package]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster" >}}) on the cluster.
1. [Enable a module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database" >}}) for a new database or [upgrade a module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) in an existing database.

## Automatically enabled capabilities in Redis 8

Databases created with or upgraded to Redis version 8 or later automatically enable the capabilities (modules) bundled with Redis Enterprise Software as follows:

{{<embed-md "rs-8-enabled-modules.md">}}
