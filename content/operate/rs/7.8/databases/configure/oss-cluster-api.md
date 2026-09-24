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
url: '/operate/rs/7.8/databases/configure/oss-cluster-api/'
---

Review [OSS Cluster API](/content/operate/rs/7.8/clusters/optimize/oss-cluster-api.md) to determine if you should enable this feature for your database.

## Prerequisites

The OSS Cluster API is supported only when a database meets specific criteria.

The database must:

- Use the standard [hashing policy](/content/operate/rs/7.8/databases/durability-ha/clustering.md#supported-hashing-policies).
- Have the [proxy policy](/content/operate/rs/7.8/databases/configure/proxy-policy.md) set to either _All primary shards_ or _All nodes_.

In addition, the database must _not_:

- Use node `include` or `exclude` in the proxy policy.
- Use [RediSearch](/content/operate/oss_and_stack/stack-with-enterprise/search/_index.md), [RedisTimeSeries](/content/operate/oss_and_stack/stack-with-enterprise/timeseries/_index.md), or [RedisGears](/content/operate/oss_and_stack/stack-with-enterprise/deprecated-features/gears-v1/_index.md) modules.

The OSS Cluster API setting applies to individual databases instead of the entire cluster.

## Enable OSS Cluster API support

You can use the Cluster Manager UI, the `rladmin` utility, or the REST API to enable OSS Cluster API support for a database.

When you enable OSS Cluster API support for an existing database, the change applies to new connections but does not affect existing connections. Clients must close existing connections and reconnect to apply the change.

### Cluster Manager UI method

When you use the Cluster Manager UI to enable the OSS Cluster API, it automatically configures the [prerequisites](/content/operate/rs/7.8/databases/configure/oss-cluster-api.md#prerequisites).

To enable the OSS Cluster API for an existing database in the Cluster Manager UI:

1. From the database's **Configuration** tab, select **Edit**.

1. Expand the **Clustering** section.

1. Select **Enable sharding**.

1. Select **OSS Cluster API**.

    {{<image filename="images/rs/screenshots/databases/config-clustering-oss-cluster-api-7-8-2.png" alt="Use the *OSS Cluster API* setting to enable the API for the selected database.">}}

1. Select **Save**.

You can also use the Cluster Manager UI to enable the setting when creating a new database.

### Command-line method

You can use the [`rladmin` utility](/content/operate/rs/7.8/references/cli-utilities/rladmin/_index.md) to enable the OSS Cluster API for Redis Enterprise Software databases, including Replica Of databases.

For Active-Active (CRDB) databases, [use the crdb-cli utility](#active-active-databases).

Ensure the [prerequisites](/content/operate/rs/7.8/databases/configure/oss-cluster-api.md#prerequisites) have been configured.  Then, enable the OSS Cluster API for a Redis database from the command line:

```sh
$ rladmin tune db <database name or ID> oss_cluster enabled
```

To determine the current setting for a database from the command line, use `rladmin info db` to return the value of the `oss_cluster` setting.

```sh
$ rladmin info db test | grep oss_cluster:
  oss_cluster: enabled
```

The OSS Cluster API setting applies to the specified database only; it does not apply to the cluster.

### REST API method

You can enable the OSS Cluster API when you [create a database](/content/operate/rs/7.8/references/rest-api/requests/bdbs/_index.md#post-bdbs-v1) using the REST API:

```sh
POST /v1/bdbs
{ 
  "oss_cluster": true,
  // Other database configuration parameters
}
```

To enable the OSS Cluster API for an existing database, you can use an [update database configuration](/content/operate/rs/7.8/references/rest-api/requests/bdbs/_index.md#put-bdbs) REST API request:

```sh
PUT /v1/bdbs/<database-id>
{ "oss_cluster": true }
```

### Active-Active databases

The OSS Cluster API setting applies to all instances of the Active-Active database across participating clusters. To enable the OSS Cluster API for Active-Active databases, use the [Cluster Manager UI](#cluster-manager-ui) or the [`crdb-cli`](/content/operate/rs/7.8/references/cli-utilities/crdb-cli/_index.md) utility.

To create an Active-Active database and enable the OSS Cluster API with `crdb-cli`:

```sh
$ crdb-cli crdb create --name <name> \
    --memory-size 10g --port <port> \
    --sharding true --shards-count 2  \
    --replication true --oss-cluster true --proxy-policy all-master-shards \
    --instance fqdn=<fqdn>,username=<user>,password=<pass> \
    --instance fqdn=<fqdn>,username=<user>,password=<pass> \
    --instance fqdn=<fqdn>,username=<user>,password=<pass>
```

See the [`crdb-cli crdb create`](/content/operate/rs/7.8/references/cli-utilities/crdb-cli/crdb/create.md) reference for more options.

To enable the OSS Cluster API for an existing Active-Active database with `crdb-cli`:

1. Obtain the `CRDB-GUID` for the new database:

    ```sh
    $ crdb-cli crdb list
    CRDB-GUID    NAME   REPL-ID  CLUSTER-FQDN
    <CRDB-GUID>  Test   4        cluster1.local
    ```

1. Use the `CRDB-GUID` to enable the OSS Cluster API:

    ```sh
    $ crdb-cli crdb update --crdb-guid <CRDB-GUID> \
        --oss-cluster true
    ```

## Change preferred IP type

By default, using [`CLUSTER SLOTS`](/content/commands/cluster-slots.md) and [`CLUSTER SHARDS`](/content/commands/cluster-shards.md) in a Redis Enterprise Software cluster exposes the internal IP addresses for databases with the OSS Cluster API enabled.

To use external IP addresses instead of internal IP addresses, run the following [`rladmin tune db`](/content/operate/rs/references/cli-utilities/rladmin/tune.md#tune-db) command for each affected database:

```sh
$ rladmin tune db db:<database-id> oss_cluster_api_preferred_ip_type external
```

## Turn off OSS Cluster API support

To deactivate OSS Cluster API support for a database, either:

- Use the Cluster Manager UI to turn off the **OSS Cluster API** in the **Clustering** section of the database **Configuration** settings.

- Use the appropriate utility to deactivate the OSS Cluster API setting.

    For standard databases, including Replica Of, use `rladmin`:

    ```sh
    $ rladmin tune db <name or ID> oss_cluster disabled
    ```

    For Active-Active databases, use the Cluster Manager UI or `crdb-cli`:

    ```sh
    $ crdb-cli crdb update --crdb-guid <CRDB-GUID> \
        --oss-cluster false
    ```

When you turn off OSS Cluster API support for an existing database, the change applies to new connections but does not affect existing connections. Clients must close existing connections and reconnect to apply the change.

## Multi-key command support

When you enable the OSS Cluster API for a database, 
[multi-key commands](/content/operate/rc/databases/configuration/clustering.md#multikey-operations) are only allowed when all keys are mapped to the same slot.

To verify that your database meets this requirement, make sure that the `CLUSTER KEYSLOT` reply is the same for all keys affected by the multi-key command.  To learn more, see [multi-key operations](/content/operate/rs/7.8/databases/durability-ha/clustering.md#multikey-operations).
