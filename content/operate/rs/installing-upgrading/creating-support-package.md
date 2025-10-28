---
Title: Create a support package
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create a support package that gathers essential information to help debug
  issues.
linkTitle: Create support package
toc: 'true'
weight: $weight
---
If you encounter any issues that you are not able to resolve yourself
and need to [contact Redis support](https://redis.io/support/) for assistance, you can [create a support package](#create-support-package) that gathers all essential information to help debug
your issues.

{{< note >}}
The process of creating the support package can take several minutes and generates load on the system.
{{< /note >}}

## Create support package

{{< multitabs id="create-support-package" 
tab1="Cluster Manager UI"
tab2="rladmin"
tab3="REST API" >}}

To create a support package from the Cluster Manager UI:

1. In the navigation menu, select **Support**.

    <img src="../../../../../images/rs/screenshots/create-support-package/support-package-dialog.png" alt="Select Support from the navigation menu and create a support package.">

1. Click **Proceed**.

1. In the **Generate support package** dialog, select one of the following options:

    - **Full package including all nodes and databases**: Creates a support package with information about all nodes and databases in the cluster.

    - **For Databases**: Creates a support package that includes database information.

        - Select **All Databases** from the **Database name (Database ID)** list to include information about all databases in the cluster.

        - Select a specific database from the **Database name (Database ID)** list to include information about that database only.

        <img src="../../../../images/rs/screenshots/create-support-package/generate-support-package-select-db.png" alt="The list of databases you can include in the support package.">

    - **For Nodes**: Creates a support package that includes node information.

        - Select **All Nodes** from the **Node ID (IP Addresses)** list to include information about all nodes in the cluster.

        - Select a specific node from the **Node ID (IP Addresses)** list to include information about that node only.

        <img src="../../../../../images/rs/screenshots/create-support-package/generate-support-package-select-node.png" alt="The list of nodes you can include in the support package.">

1. Click **Generate package**.

1. The package is created and downloaded by your browser.

    <img src="../../../../../images/rs/screenshots/create-support-package/support-package-created-alert.png" alt="An alert appears that says, 'Support package created, attach it to your request in the Redis Support portal'. The Redis Support portal is a button you can click to contact Redis Support.">

-tab-sep-

If package creation fails with `internal error` or if you cannot access the UI, create a support package for the cluster from the command line on any node in the cluster using the [`rladmin cluster debug_info`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/debug_info" >}}) command: 

```sh
/opt/redislabs/bin/rladmin cluster debug_info
```

- If `rladmin cluster debug_info` fails for lack of space in the `/tmp` directory, you can:

    1. Change the storage location where the support package is saved: 
    
        ```sh
        rladmin cluster config debuginfo_path <path>
        ```

        The `redislabs` user must have write access to the storage location on all cluster nodes.

    1. On any node in the cluster, run:
        
        ```sh
        rladmin cluster debug_info
        ```

- If `rladmin cluster debug_info` fails for another reason, you can create a support package for the cluster from the command line on each node in the cluster with the command: 

    ```sh
    /opt/redislabs/bin/debuginfo
    ```

Upload the tar file to [Redis support](https://redis.com/company/support/). The path to the archive is shown in the command output.

-tab-sep-

You can also use `debuginfo` [REST API]({{< relref "/operate/rs/references/rest-api" >}}) requests to create and download support packages.

To download debug info from all nodes and databases:

```sh
GET /v1/cluster/debuginfo
```

To download debug info from all nodes:

```sh
GET /v1/nodes/debuginfo
```

To download debug info from a specific node, replace `<uid>` in the following request with the node ID:

```sh
GET /v1/nodes/<uid>/debuginfo
```

To download debug info from all databases:

```sh
GET /v1/bdbs/debuginfo
```

To download debug info from a specific database, replace `<uid>` in the following request with the database ID:

```sh
GET /v1/bdbs/<uid>/debuginfo
```

{{< /multitabs >}}

## Support package files

The support package is a zip file that contains all cluster configuration and logs.

When downloaded from the Cluster Manager UI, the support package's name is `debuginfo.tar.gz`.

### Database support package files

Cluster and database support packages collect database details in `database_<bdb_uid>` directories, where `<bdb_uid>` is the database ID, and Redis shard details in `<node_uid>` directories.

The following table describes the included files:

| File | Description |
|------|-------------|
| ccs-redis.json | Primary node's local cluster configuration store (CCS). |
| /database_<bdb_uid>/ | Directory that includes files for a specific database.<bdb_uid> is the database ID. |
| database_<bdb_uid>_ccs_info.txt | Database information from the cluster configuration store (CCS). Includes settings for databases, endpoints, shards, replicas, and CRDB. |
| database_<bdb_uid>.clientlist | List of clients connected to the database when the support package was created. |
| database_<bdb_uid>.info | Redis information and statistics for the database. See [`INFO`]({{<relref "/commands/info">}}) for details about the collected fields. |
| database_<bdb_uid>.rladmin | Database information. See [`rladmin info db`]({{<relref "/operate/rs/references/cli-utilities/rladmin/info#info-db">}}) for an example of collected fields. Also includes creation time, last changed time, Redis version, memory limit, persistence type, eviction policy, hashing policy, and whether SSL, backups, and email alerts are enabled. |
| database_<bdb_uid>.slowlog | Contains slowlog output, which includes commands that took longer than 10 milliseconds. Only included if `slowlog_in_sanitized_support` is `true` in cluster settings. |
| /node_<node_uid>/redis_<shard_uid>.txt | For each shard of the specified database only. Includes shard configuration and [information]({{<relref "/commands/info">}}), slowlog information, and latency information. |

### Node support package files

Cluster and node support packages collect node details in `node_<node_uid>` directories, where `<node_uid>` is the node ID.

The following table describes the included files:

| File | Description |
|------|-------------|
| ccs-redis.json | The node's local cluster configuration store (CCS). |
| /conf/ | Directory that contains configuration files. |
| /logs/ | Directory that includes logs. |
| node_<node_uid>.ccs | Includes cluster configuration, node configuration, and DMC proxy configuration. |
| node_<node_uid>_envoy_config.json | Envoy configuration. |
| node_<node_uid>.rladmin | Information about the cluster's nodes, databases, endpoints, and shards. See [`rladmin status`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status">}}) for example output. |
| node_<node_uid>_sys_info.txt | Node's system information including:<br />• Socket files list<br />• Log files list<br />• Processes running on the node<br />• Disk usage<br />• Persistent files list<br />• Memory usage<br />• Network interfaces<br />• Installed packages<br />• Active iptables<br />• OS and platform<br />• Network connection<br />• Status of Redis processes |
| redis_<shard_uid>.txt | For each shard of the specified database only. Includes shard configuration and [information]({{<relref "/commands/info">}}), slowlog information, and latency information. |

Each node's `/conf/` directory contains the following files:

- bootstrap_status.json
- ccs-paths.conf
- config.json
- envoy.yaml
- gossip_envoy.yaml
- heartbeatd-config.json
- last_bootstrap.json
- local_addr.conf
- node.id
- node_local_config.json
- redislabs_env_config.sh
- socket.conf
- supervisord_alert_mgr.conf
- supervisord_cm_server.conf
- supervisord_crdb_coordinator.conf
- supervisord_crdb_worker.conf
- supervisord_mdns_server.conf
- supervisord_pdns_server.conf

Each node's `/conf/` directory also contains the following key and cert modulus files:

- api_cert.modulus
- api_key.modulus
- ccs_internode_encryption_cert.modulus
- ccs_internode_encryption_key.modulus
- cm_cert.modulus
- cm_key.modulus
- data_internode_encryption_cert.modulus
- data_internode_encryption_key.modulus
- gossip_ca_signed_cert.modulus
- gossip_ca_signed_key.modulus
- mesh_ca_signed_cert.modulus
- mesh_ca_signed_key.modulus
- metrics_exporter_cert.modulus
- metrics_exporter_key.modulus
- proxy_cert.modulus
- proxy_key.modulus
- syncer_cert.modulus
- syncer_key.modulus
