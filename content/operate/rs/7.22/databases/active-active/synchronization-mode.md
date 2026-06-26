---
Title: Configure distributed synchronization
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to configure distributed synchronization so that any available proxy
  endpoint can manage synchronization traffic.
linktitle: Distributed synchronization
weight: 80
url: '/operate/rs/7.22/databases/active-active/synchronization-mode/'
---
Replicated databases, such as [Replica Of]({{< relref "/operate/rs/7.22/databases/import-export/replica-of/" >}}) and [Active-Active]({{< relref "/operate/rs/7.22/databases/active-active" >}}) databases,
use proxy endpoints to synchronize database changes with the databases on other participating clusters.

To improve the throughput and lower the latency for synchronization traffic,
you can configure a replicated database to use distributed synchronization where any available proxy endpoint can manage synchronization traffic.

Every database by default has one proxy endpoint that manages client and synchronization communication with the database shards,
and that proxy endpoint is used for database synchronization.
This is called centralized synchronization.

To prepare a database to use distributed synchronization you must first make sure that the database [proxy policy]({{< relref "/operate/rs/7.22/databases/configure/proxy-policy.md" >}})
is defined so that either each node has a proxy endpoint or each primary (master) shard has a proxy endpoint.
After you have multiple proxies for the database,
you can configure the database synchronization to use distributed synchronization.

## Configure distributed synchronization

{{< note >}}
You may use the database name in place of `db:<ID>` in the following `rladmin` commands.
{{< /note >}}

To configure distributed synchronization:

1. To check the proxy policy for the database, run: `rladmin status`

    The output of the status command shows the list of endpoints on the cluster and the proxy policy for the endpoint.

    ```sh
    ENDPOINTS:
    DB:ID       NAME      ID                        NODE          ROLE                                SSL
    db:1        db        endpoint:1:1              node:1        all-master-shards                   No
    ```

    If the proxy policy (also known as a _role_) is `single`, configure the policy to `all-nodes` or `all-master-shards` according to your needs with the command:

    ```sh
    rladmin bind db db:<ID> endpoint <endpoint id> policy <all-master-shards|all-nodes>
    ```

1. To configure the database to use distributed synchronization, run:

    ```sh
    rladmin tune db db:<ID> syncer_mode distributed
    ```

    To change back to centralized synchronization, run:

    ```sh
    rladmin tune db db:<ID> syncer_mode centralized
    ```

## Verify database synchronization

Use `rladmin` to verify a database synchronization role:

```sh
rladmin info db db:<ID>
```

The current database role is reported as the `syncer_mode` value:

```sh
$ rladmin info db db:<ID>     
db:<ID> [<db_name>]:
  // (Other settings removed) 
  syncer_mode: centralized
```
