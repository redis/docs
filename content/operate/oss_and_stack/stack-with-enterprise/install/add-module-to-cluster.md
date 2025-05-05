---
Title: Install a module on a cluster
alwaysopen: false
categories:
- docs
- operate
- stack
description: null
linkTitle: Install on a cluster
weight: 10
---

[Redis Enterprise Software]({{< relref "/operate/rs" >}}) comes packaged with several modules. As of version 7.8.2, Redis Enterprise Software includes three feature sets, compatible with different Redis database versions. You can view the installed modules, their versions, and their minimum compatible Redis database versions from **Cluster > Modules** in the Cluster Manager UI.

To use other modules or upgrade an existing module to a more recent version, you need to install the new module package on your cluster.

{{<warning>}}
- Some module versions are not supported or recommended for use with Redis Enterprise.

- We recommend consulting [Redis support](https://redis.io/support/) before you upgrade a module on the cluster, especially if the cluster is used in production.
{{</warning>}}

## Get packaged modules

To install or upgrade a module on a [Redis Enterprise Software]({{< relref "/operate/rs" >}}) cluster, you need a module package.

- For versions of official Redis modules that are not available from the [Redis download center](https://redis.io/downloads/), [contact support](https://redis.io/support/).

- For custom-packaged modules, download a [custom-packaged module](https://redislabs.com/community/redis-modules-hub/) from the developer.

## Add a module to a cluster

Use one of the following methods to add a module to a Redis Enterprise cluster:

- REST API [`POST` request to the `/v2/modules`]({{< relref "/operate/rs/references/rest-api/requests/modules#post-module-v2" >}}) endpoint

- Redis Enterprise Cluster Manager UI

- For RedisGears, follow these [installation instructions]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/installing-redisgears" >}})

### REST API method

To add a module to the cluster using the REST API:

1. Copy the module package to a node in the cluster.

1. Add the module to the cluster with a [`POST` request to the `/v2/modules`]({{< relref "/operate/rs/references/rest-api/requests/modules#post-module-v2" >}}) endpoint:

    ```sh
    POST https://[host][:port]/v2/modules
    "module=@/tmp/redisearch.Linux-ubuntu16.04-x86_64.2.2.6.zip"
    ```

    Here, the *module* parameter specifies the full path of the module package and must be submitted as form-data. In addition, the package must be available and accessible to the server processing the request.

1. If the module installation succeeds, the `POST` request returns a [JSON object]({{< relref "/operate/rs/references/rest-api/objects/module" >}}) that represents the new module. If it fails, it may return a JSON object with an `error_code` and `description` with more details.

### Cluster Manager UI method

To add a module to the cluster using the Cluster Manager UI:

1. Go to **Cluster > Modules**.

1. Select **Upload module**.

1. Use the file browser to add the packaged module.

## Next steps

- Create a database and [enable the new module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database" >}}).
- [Upgrade a module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) to the new version.
