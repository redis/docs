---
Title: Upgrade a Redis Software cluster
alwaysopen: false
categories:
- docs
- operate
- rs
description: Upgrade a cluster to a later version of Redis Software.
linkTitle: Upgrade cluster
toc: 'true'
weight: 30
tocEmbedHeaders: true
---

Before you upgrade a cluster to a later Redis Software version, review the [supported upgrade paths](#supported-upgrade-paths) and [prerequisites](#upgrade-prerequisites).

To upgrade a cluster's Redis Software version, use one of the following methods:

- [In-place upgrade](#in-place-upgrade) - Directly upgrade Redis Software on each node in the cluster. Although this method is simpler than the rolling upgrade method, it might cause brief service interruptions as each node is upgraded.

- [Rolling upgrade](#rolling-upgrade) - Minimize downtime by adding new nodes with an updated Redis Software version to the cluster, one at a time, while keeping the rest of the cluster operational. This method is recommended for production environments that require continuous availability.

## Supported upgrade paths

{{<embed-md "rs-upgrade-paths.md">}}

See the [Redis Software product lifecycle](/content/operate/rs/installing-upgrading/product-lifecycle.md) for more information about release numbers and the end-of-life schedule.

> [!NOTE]
> Redis Enterprise for Kubernetes has its own support lifecycle, which accounts for the Kubernetes distribution lifecycle. For details, see [Supported Kubernetes distributions](/content/operate/kubernetes/reference/supported_k8s_distributions.md).

## Upgrade prerequisites

Before upgrading a cluster:

- Verify access to [rlcheck](/content/operate/rs/references/cli-utilities/rlcheck/_index.md) and [rladmin](/content/operate/rs/references/cli-utilities/rladmin/_index.md#use-the-rladmin-shell) commands.

- Run [rlcheck](/content/operate/rs/references/cli-utilities/rlcheck/_index.md) on each node and verify there are no issues:

    ```sh
    rlcheck
    ```

- Verify [maintenance mode](/content/operate/rs/clusters/maintenance-mode.md) is not enabled:

    1. On a node in the cluster, run [`rladmin status`](/content/operate/rs/references/cli-utilities/rladmin/status.md):
    
        ```sh
        rladmin status
        ``` 
        
    1. Review each node's `SHARDS` field. If the value is yellow, the node is in maintenance mode.

        {{< image filename="/images/rs/maintenance_mode.png" >}}

    1. To deactivate maintenance mode on a node, run the following [`rladmin node maintenance_mode off`](/content/operate/rs/references/cli-utilities/rladmin/node/maintenance-mode.md#node-maintenance_mode-off) command. See [Deactivate maintenance mode](/content/operate/rs/clusters/maintenance-mode.md#deactivate-maintenance-mode) for additional details.

        ```sh
        rladmin node <node_id> maintenance_mode off
        ```

- Verify that you meet the upgrade path requirements for the target cluster version and review the relevant [release notes](/content/operate/rs/release-notes/_index.md) for any preparation instructions.

- Before you upgrade a cluster from Redis Software version 6.2.x to 7.8.x, you must follow these steps if the cluster has any databases with Redis version 6.0:

    1. Set the Redis upgrade policy to `latest`:

        ```sh
        rladmin tune cluster redis_upgrade_policy latest
        ```

    1. [Upgrade Redis 6.0 databases](/content/operate/rs/installing-upgrading/upgrading/upgrade-database.md) to Redis 6.2.

- [Upgrade your databases](/content/operate/rs/installing-upgrading/upgrading/upgrade-database.md) to a version that is supported by the target Redis Software version before upgrading the cluster. We recommend you upgrade the databases to the latest supported version if possible. Make sure to test the upgrade in a non-production environment to determine any impact.

- Avoid changing the database configuration or performing other cluster management operations during the cluster upgrade process, as this might cause unexpected results.

- Upgrade the cluster's primary (master) node first. To identify the primary node, use one of the following methods:

    - **Nodes** screen in the new Cluster Manager UI (only available for Redis Software versions 7.2 and later)

    - [`rladmin status nodes`](/content/operate/rs/references/cli-utilities/rladmin/status.md#status-nodes) command
    
    - [`GET /nodes/status`](/content/operate/rs/references/rest-api/requests/nodes/status.md#get-all-nodes-status) REST API request

## In-place upgrade

Starting with the primary node, follow these steps for every node in the cluster. To ensure cluster availability, upgrade each node separately.

1. Complete all [prerequisites](#upgrade-prerequisites) before starting the upgrade.

1.  Verify node operation with the following commands:

    ``` shell
    $ rlcheck
    $ rladmin status extra all
    ```

    > [!WARNING]
    > Do not proceed if any shard, node, or endpoint is not `OK`.

1.  Download the Redis Software installation package to the machine running the node from the Download Center on [https://cloud.redis.io](https://cloud.redis.io).  

1.  Extract the installation package:

    ```sh
    tar vxf <tarfile name>
    ```

    > [!NOTE]
    > You cannot change the installation path or the user during the upgrade.

1.  Run the install command. See [installation script options](/content/operate/rs/installing-upgrading/install/install-script.md) for a list of command-line options you can add to the following command. You cannot use options marked as "new installs only" during an in-place upgrade.

    ``` shell
    sudo ./install.sh
    ```

    The installation script automatically recognizes the upgrade and responds accordingly.

    The upgrade replaces all node processes, which might briefly interrupt any active connections.

1.  Verify the node was upgraded to the new version and is still operational:

    ``` shell
    $ rlcheck
    $ rladmin status extra all
    ```

1.  Visit the Cluster Manager UI.

    If the Cluster Manager UI was open in a web browser during the upgrade, refresh the browser to reload the console.

## Rolling upgrade

To perform a rolling upgrade of the cluster, use one of the following methods:

- [Extra node method](#extra-node-upgrade) - recommended if you have additional resources available

- [Replace node method](#replace-node-upgrade) - recommended if you cannot temporarily allocate additional resources

### Extra node upgrade method {#extra-node-upgrade}

1. Complete all [prerequisites](#upgrade-prerequisites) before starting the rolling upgrade.

1. [Install a later version of Redis Software](/content/operate/rs/installing-upgrading/install/install-on-linux.md) on a new node.

1. [Add the new node](/content/operate/rs/clusters/add-node.md) to the cluster.

1. If the [cluster uses DNS](/content/operate/rs/networking/cluster-dns.md), add the new node’s IP address to the DNS records.

1. [Promote the first new node](/content/operate/rs/clusters/change-node-role.md#promote-secondary-node) to become the primary node.

1. [Remove one node](/content/operate/rs/clusters/remove-node.md#remove-a-node) running the earlier Redis Software version from the cluster.

1. Repeat the previous steps until all nodes with the earlier Redis Software version are removed. If the final node to remove from the cluster is the primary node, [demote it](/content/operate/rs/clusters/change-node-role.md#demote-primary-node) to a secondary node before you remove it.

### Replace node upgrade method {#replace-node-upgrade}

1. Complete all [prerequisites](#upgrade-prerequisites) before starting the rolling upgrade.

1. [Remove a node](/content/operate/rs/clusters/remove-node.md#remove-a-node) with the earlier Redis Software version from the cluster.

1. Uninstall Redis Software from the removed node:

    ```sh
    sudo ./rl_uninstall.sh
    ```

1. [Install a later version of Redis Software](/content/operate/rs/installing-upgrading/install/install-on-linux.md) on the removed node or a new node.

1. [Add the new node](/content/operate/rs/clusters/add-node.md) to the cluster.

    If you want to reuse the removed node's ID when you add the node to the cluster, run [`rladmin cluster join`](/content/operate/rs/references/cli-utilities/rladmin/cluster/join.md) with the `replace_node` flag:

    ```sh
    rladmin cluster join nodes <cluster_member_ip_address> username <username> password <password> replace_node <node_id>
    ```

1. If the [cluster uses DNS](/content/operate/rs/networking/cluster-dns.md), add the new node’s IP address to the DNS records.

1. [Promote the first new node](/content/operate/rs/clusters/change-node-role.md#promote-secondary-node) to become the primary node.

1. Verify node health:

    1. Run `rlcheck` on all nodes:

        ```sh
        rlcheck
        ```

        The output lists the result of each verification test:

        ```sh
        ##### Welcome to Redis Software Cluster settings verification utility ####
        Running test: verify_bootstrap_status
		                PASS
        ...
        Running test: verify_encrypted_gossip
		                PASS
        Summary:
        -------
        ALL TESTS PASSED.
        ```

        For healthy nodes, the expected output is `ALL TESTS PASSED`.

    1. Run [`rladmin status`](/content/operate/rs/references/cli-utilities/rladmin/status.md) on the new node:

        ```sh
        rladmin status extra all
        ```

        The expected output is the `OK` status for the cluster, nodes, endpoints, and shards:

        ```sh
        CLUSTER:
        OK. Cluster master: 2 (<IP.address>)
        Cluster health: OK, [0, 0.0, 0.0]
        failures/minute - avg1 0.00, avg15 0.00, avg60 0.00.
        ...
        ```

1. Repeat the previous steps until all nodes with the earlier Redis Software version are replaced. If the final node to remove from the cluster is the primary node, [demote it](/content/operate/rs/clusters/change-node-role.md#demote-primary-node) to a secondary node before you remove it.

## After cluster upgrade

After all nodes are upgraded, the cluster is fully upgraded. Certain features introduced in the new version of Redis Software only become available after upgrading the entire cluster.

```sh
supervisorctl restart cnm_exec
```
