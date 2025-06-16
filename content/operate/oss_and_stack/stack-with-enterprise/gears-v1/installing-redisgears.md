---
Title: Install RedisGears
alwaysopen: false
categories:
- docs
- operate
- stack
description: null
linkTitle: Install
weight: 60
---
Before you can use RedisGears, you have to install the RedisGears module on your Redis Enterprise cluster.

## Minimum requirements

- Redis Enterprise 6.0.12 or later
- The [cluster is setup]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}) and all of the nodes are joined to the cluster

## Install RedisGears

If your cluster uses Redis Enterprise v6.0.12 or later and has internet access, you only need to download the RedisGears package. It automatically fetches dependencies like the Python and JVM plugins during online installation.

Offline installation requires you to manually upload dependencies to the primary node.

### Install RedisGears and dependencies

1. Download the **RedisGears** package from the Redis Enterprise [download center](https://cloud.redis.io/#/rlec-downloads).

    {{<note>}}
For offline installation of RedisGears v1.2 and later, you also need to download the **RedisGears Dependencies** packages for both Python and Java.
<br/>
For RedisGears v1.0, you only need the Python dependency package.
    {{</note>}}

1. Upload the RedisGears package to a node in the cluster.

1. For offline installation only, copy the dependencies to the primary node.

    {{<note>}}
Skip this step unless your cluster does not have internet access.
    {{</note>}}

    1. For versions 7.2.4 and later, copy the dependencies to `$modulesdatadir/rg/<version-integer>/<OS_name>/<architecture>/deps/`:

        ```sh
        cp redisgears-jvm.<OS>.<version>.tgz $modulesdatadir/rg/<version-integer>/<OS_name>/<architecture>/deps/
        ```

    1. For versions 6.4.2 and earlier, copy the dependencies to `$modulesdatadir/rg/<version-integer>/deps/`:
    
        ```sh
        cp redisgears-jvm.<OS>.<version>.tgz $modulesdatadir/rg/<version-integer>/deps/
        ```

    Replace these fields with your own values:

    - `<OS>`: the operating system running Redis Enterprise
    - `<version>`: the RedisGears version `(x.y.z)`
    - `<version-integer>`: the RedisGears version as an integer, calculated as <nobr>`(x*10000 + y*100 + z)`</nobr>

        For example, the `<version-integer>` for RedisGears version 1.2.5 is 10205.

    - `<OS_name>`: the operating system's name
    - `<architecture>`: the node's architecture

1. Add RedisGears to the cluster with a `POST` request to the primary node's [`/v2/modules`]({{< relref "/operate/rs/references/rest-api/requests/modules#post-module-v2" >}}) REST API endpoint:

    ```sh
    POST https://[host][:port]/v2/modules
    {"module=@/tmp/redisgears.<OS>.<version>.zip"}
    ```

Here, the *module* parameter specifies the full path of the module package and must be submitted as form-data. In addition, the package must be available and accessible to the server processing the request.

After the install is complete, RedisGears will appear in the list of available modules on the **settings** and **create database** pages of the Redis Enterprise admin console.

### Enable RedisGears for a database

After installation, create a new database and enable RedisGears:

- [With Python]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/python/install" >}})

- [With the JVM]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/install" >}})

## Upgrade RedisGears for existing databases

To upgrade RedisGears for an existing database after installing a new version, use [`rladmin upgrade db`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db">}}):

```sh
rladmin upgrade db <database-name-or-ID> and module module_name rg version <new_version_integer> module_args "<module arguments>"
```

The following example shows how to upgrade a database named `shopping-cart` to RedisGears version 1.2.9 without changing its configuration:

```sh
rladmin upgrade db shopping-cart and module module_name rg version 10209 module_args keep_args
```

## Uninstall RedisGears

To uninstall RedisGears, make a [`DELETE` request to the `/v2/modules` REST API endpoint]({{< relref "/operate/rs/references/rest-api/requests/modules#delete-module-v2" >}}).
