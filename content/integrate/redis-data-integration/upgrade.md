---
Title: Upgrade guide
linkTitle: Upgrading 
description: Upgrade an existing Redis Data Integration installation
weight: 60
alwaysopen: false
categories: ["redis-di"]
aliases: 
---

## Upgrade RDI CLI

```bash
pip3 install https://qa-onprem.s3.amazonaws.com/redis-di/redis_di_cli-{{<param rdi_cli_latest>}}-py3-none-any.whl --upgrade
```

## Upgrade RDI engine

Upgrading the RDI engine is done using the RDI CLI. This action will upgrade the version of the RDI Engine to be the same one currently used by the running RDI CLI (only when the CLI version is higher than the RDI engine version).

```bash
redis-di upgrade
```

## Upgrade RedisGears 

RedisGears can be upgraded for a Redis Enterprise Cluster running RDI without downtime. Please read the following section for exact instructions.

**Important**: Failing to follow these steps in the correct order will result with RDI running with the old RedisGears version.

To upgrade the RedisGears module after a new release is available, follow these steps:

- Download the new version of RedisGears (Python package only):

  ```bash
  curl -s https://redismodules.s3.amazonaws.com/redisgears/snapshots/redisgears_python.Linux-ubuntu18.04-x86_64.master.zip -o /tmp/redisgears.zip
  ```

- Install it in the cluster:

  ```bash
  curl -v -k -s -u "<CLUSTER_USER>:<CLUSTER_PASSWORD>" -F "module=@/tmp/redisgears.zip" https://<CLUSTER_HOST>:<CLUSTER_API_PORT>/v2/modules
  ```

- The above endpoint returns an action ID that you can monitor to see the installation progress by invoking this endpoint:

  ```bash
  curl -k -s -u "<CLUSTER_USER>:<CLUSTER_PASSWORD>" https://<CLUSTER_HOST>:<CLUSTER_API_PORT>/v1/actions/${action_uid}
  ```

  After the status returned by this endpoint is `completed`, the new module is installed in the cluster.

- Verify that the new version is installed via the admin console (**settings > redis modules**):

 {{< image filename="/images/rdi/cluster-redis-modules.png" >}}


 - From the admin console, go to your RDI configuration view (**databases > Redis Data Integration > configuration**). You should see an indication that there’s an update available for your RedisGears module:

  {{< image filename="/images/rdi/redis-di-db-update-available.png" >}}
  
  You can also see this indication using the `rladmin status` command:

  ```bash
  rladmin status modules all
  ```

  {{< image filename="/images/rdi/rladmin-status-modules.png" >}}

- Now, upgrade the RedisGears module in this RDI database:

  ```bash
  rladmin upgrade module db_name redis-di-<ID> module_name rg version 999999 module_args keep_args
  ```

  Expected output:

  ```
  Monitoring f3cdd38a-0c80-431e-ab3f-c5e2fea39414
  active - SMUpgradeBDB init
  active - SMUpgradeBDB restart
  .completed - SMUpgradeBDB
  Done
  ```

  Notes:

  - Replace the RedisGears version with your version. This can be taken from the JSON available in the zip file of the module, see [instructions]({{<relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module">}}).
  - It's important to specify the `keep_args` argument so the configuration won’t be reset.
  - Warning: after you upgrade the module for a database, the database shards restart. This causes a short interruption in the availability of this database across the cluster.

- Verify that RDI is using the new version of RedisGears by navigating to **databases > Redis Data Integration > configuration**:

  {{< image filename="/images/rdi/redis-di-upgraded-redisgears.png" >}}

