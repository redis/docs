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

[Redis Enterprise Software]({{< relref "/operate/rs" >}}) comes packaged with several modules that provide additional Redis capabilities such as [search and query]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search">}}), [JSON]({{<relref "/operate/oss_and_stack/stack-with-enterprise/json">}}), [time series]({{<relref "/operate/oss_and_stack/stack-with-enterprise/timeseries">}}), and [probabilistic data structures]({{<relref "/operate/oss_and_stack/stack-with-enterprise/bloom">}}). As of version 8.0, Redis Enterprise Software includes four feature sets, compatible with different Redis database versions. You can view the installed modules, their versions, and their minimum compatible Redis database versions from **Cluster > Modules** in the Cluster Manager UI.

To use other modules or upgrade an existing module to a more recent version, you need to install the new module package on your cluster.

{{<warning>}}
Some module versions are not supported or recommended for use with Redis Enterprise Software.
{{</warning>}}

## Get packaged modules

To install or upgrade a module on a [Redis Enterprise Software]({{< relref "/operate/rs" >}}) cluster, you need a module package.

- For versions of official Redis modules that are not available from the [Redis download center](https://redis.io/downloads/), [contact support](https://redis.io/support/).

- For custom-packaged modules, download a [custom-packaged module](https://redislabs.com/community/redis-modules-hub/) from the developer.

## Add a user-defined module to a cluster (Redis Software v8.0.x and later) {#add-user-defined-module-to-cluster}

To add a custom module to a cluster running Redis Enterprise Software version 8.0.x or later, use the following REST API requests:

1. [Upload the custom module configuration]({{< relref "/operate/rs/references/rest-api/requests/modules/user-defined#post-user-defined-module" >}}). Replace the values in the following example with your own.

    ```sh
    POST https://<host>:<port>/v2/modules/user-defined
    {
      "module_name": "TestModule",
      "version": 1,
      "semantic_version": "0.0.1",
      "display_name": "test module",
      "commands": [
        {
          "command_arity": -1,
          "command_name": "module.command",
          "first_key": 1,
          "flags": ["write"],
          "last_key": 1,
          "step": 1
        }
      ],
      "command_line_args": "",
      "capabilities": ["list", "of", "capabilities"],
      "min_redis_version": "2.1"
    }
    ```

1. For each node in the cluster, [upload the custom module artifact]({{< relref "/operate/rs/references/rest-api/requests/modules/user-defined#post-local-user-defined-artifacts" >}}):

    ```sh
    POST https://<host>:<port>/v2/local/modules/user-defined/artifacts
    "module=@/tmp/custom-module.so"
    ```

    The *module* parameter specifies the full path of the module artifact and must be submitted as form-data. In addition, the module artifact must be available and accessible to the server processing the request.

## Add a module to a cluster (Redis Software v7.22.x and earlier) {#add-a-module-to-a-cluster}

Use one of the following methods to add a module to a cluster running Redis Enterprise Software version 7.22.x or earlier:

{{< multitabs id="install-modules" 
        tab1="Cluster Manager UI"
        tab2="REST API" >}}

To add a module to the cluster using the Cluster Manager UI:

1. Go to **Cluster > Modules**.

1. Select **Upload module**.

1. Use the file browser to add the packaged module.

-tab-sep-

To add a module to the cluster using the REST API:

1. Copy the module package to a node in the cluster.

1. Add the module to the cluster with a [`POST` request to the `/v2/modules`]({{< relref "/operate/rs/references/rest-api/requests/modules#post-module-v2" >}}) endpoint:

    ```sh
    POST https://<host>:<port>/v2/modules
    "module=@/tmp/redisearch.Linux-ubuntu16.04-x86_64.2.2.6.zip"
    ```

    Here, the *module* parameter specifies the full path of the module package and must be submitted as form-data. In addition, the package must be available and accessible to the server processing the request.

1. If the module installation succeeds, the `POST` request returns a [JSON object]({{< relref "/operate/rs/references/rest-api/objects/module" >}}) that represents the new module. If it fails, it may return a JSON object with an `error_code` and `description` with more details.

{{< /multitabs >}}

For RedisGears, follow these [installation instructions]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/installing-redisgears" >}}) instead.

{{<warning>}}
We recommend consulting [Redis support](https://redis.io/support/) before you upgrade a module on the cluster, especially if the cluster is used in production.
{{</warning>}}

## Next steps

- Create a database and [enable the new module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database" >}}).
- [Upgrade a module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) to the new version.
