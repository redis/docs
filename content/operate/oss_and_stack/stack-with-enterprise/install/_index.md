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

Several Redis feature sets come packaged with [Redis Enterprise Software]({{< relref "/operate/rs" >}}). Redis feature sets include modules that provide advanced capabilities and data structures for Redis databases.

{{<embed-md "rs-feature-sets.md">}}

However, if you want to use additional modules or upgrade a module to a more recent version, you need to:

1. [Install a module package]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster" >}}) on the cluster.
1. [Enable a module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database" >}}) for a new database or [upgrade a module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) in an existing database.
