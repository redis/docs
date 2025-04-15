---
Title: Enable OSS Cluster API
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: OSS Cluster API
weight: 20
aliases: 
    - /operate/rs/concepts/data-access/oss-cluster-api
url: '/operate/rs/7.4/databases/configure/oss-cluster-api/'
---

Review [Redis OSS Cluster API]({{< relref "/operate/rs/7.4/clusters/optimize/oss-cluster-api" >}}) to determine if you should enable this feature for your database.

## Prerequisites

The Redis OSS Cluster API is supported only when a database meets specific criteria.  

The database must:

- Use the standard [hashing policy]({{< relref "/operate/rs/7.4/databases/durability-ha/clustering#supported-hashing-policies" >}}).
- Have the [proxy policy]({{< relref "/operate/rs/7.4/databases/configure/proxy-policy" >}}) set to either `all-master-shards` or `all-nodes`.

In addition, the database must _not_:

- Use node `include` or `exclude` in the proxy policy.
- Use [RediSearch]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}), [RedisTimeSeries]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}}), or [RedisGears]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1" >}}) modules.

The OSS Cluster API setting applies to individual databases instead of the entire cluster.

## Enable OSS Cluster API support

You can use the Cluster Manager UI or the `rladmin` utility to enable OSS Cluster API support for a database.

### Cluster Manager UI

When you use the Cluster Manager UI to enable the OSS Cluster API, it automatically configures the [prerequisites]({{< relref "/operate/rs/7.4/databases/configure/oss-cluster-api#prerequisites" >}}).

To enable the OSS Cluster API for an existing database in the Cluster Manager UI:

1. From the database's **Configuration** tab, select **Edit**.

1. Expand the **Clustering** section.

1. Turn on the **OSS Cluster API** toggle.

    {{<image filename="images/rs/screenshots/databases/config-clustering-oss-cluster-api.png" alt="Use the *OSS Cluster API* setting to enable the API for the selected database.">}}

1. Select **Save**.

You can also use the Cluster Manager UI to enable the setting when creating a new database.

### Command line (`rladmin`)

You can use the [`rladmin` utility]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/" >}}) to enable the OSS Cluster API for Redis Enterprise Software databases, including Replica Of databases.

For Active-Active (CRDB) databases, [use the crdb-cli utility](#active-active-databases).

Ensure the [prerequisites]({{< relref "/operate/rs/7.4/databases/configure/oss-cluster-api#prerequisites" >}}) have been configured.  Then, enable the OSS Cluster API for a Redis database from the command line:

```sh
$ rladmin tune db <database name or ID> oss_cluster enabled
```

To determine the current setting for a database from the command line, use `rladmin info db` to return the value of the `oss_cluster` setting.

```sh
$ rladmin info db test | grep oss_cluster:
  oss_cluster: enabled
```

The OSS Cluster API setting applies to the specified database only; it does not apply to the cluster.

### Active-Active databases

Ensure the [prerequisites]({{< relref "/operate/rs/7.4/databases/configure/oss-cluster-api#prerequisites" >}}) have been configured.  Then, use the `crdb-cli` utility to enable the OSS Cluster API for Active-Active databases:

```sh
$ crdb-cli crdb update --crdb-guid <GUID> --oss-cluster true
```

For best results, you should do this when you first create the database.  

Here's the basic process:

1. Create the Active-Active database: 

    ```sh
    $ crdb-cli crdb create --name <name> \
       --memory-size 10g --port <port> \
       --sharding true --shards-count 2  \
       --replication true --oss-cluster true --proxy-policy all-master-shards \
       --instance fqdn=<fqdn>,username=<user>,password=<pass> \
       --instance fqdn=<fqdn>,username=<user>,password=<pass> \
       --instance fqdn=<fqdn>,username=<user>,password=<pass>
    ```

1. Obtain the CRDB-GUID ID for the new database:

    ```sh
    $ crdb-cli crdb list
    CRDB-GUID    NAME   REPL-ID  CLUSTER-FQDN
    <CRDB-GUID>  Test   4        cluster1.local
    ```

1. Use the CRDB-GUID ID to enable the OSS Cluster API:

    ```sh
    $ crdb-cli crdb update --crdb-guid <CRDB-GUID> \
        --oss-cluster true
    ```

The OSS Cluster API setting applies to all of the instances of the Active-Active database.

## Turn off OSS Cluster API support

To deactivate OSS Cluster API support for a database, either:

- Use the Cluster Manager UI to turn off the **OSS Cluster API** toggle from the database **Configuration** settings.

- Use the appropriate utility to deactivate the OSS Cluster API setting.

    For standard databases, including Replica Of, use `rladmin`:

    ```sh
    $ rladmin tune db <name or ID> oss_cluster disabled
    ```

    For Active-Active databases, use `crdb-cli`:

    ```sh
    $ crdb-cli crdb update --crdb-guid <CRDB-GUID> \
        --oss-cluster false
    ```

## Multi-key command support

When you enable the OSS Cluster API for a database, 
[multi-key commands]({{< relref "/operate/rc/databases/configuration/clustering#multikey-operations" >}}) are only allowed when all keys are mapped to the same slot.

To verify that your database meets this requirement, make sure that the `CLUSTER KEYSLOT` reply is the same for all keys affected by the multi-key command.  To learn more, see [multi-key operations]({{< relref "/operate/rs/7.4/databases/durability-ha/clustering#multikey-operations" >}}).
