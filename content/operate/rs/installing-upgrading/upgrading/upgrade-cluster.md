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

{{<embed-md "rs-upgrade-paths.md">}}

See the [Redis Enterprise Software product lifecycle]({{<relref "/operate/rs/installing-upgrading/product-lifecycle">}}) for more information about release numbers and the end-of-life schedule.

{{<note>}}
Redis Enterprise for Kubernetes has its own support lifecycle, which accounts for the Kubernetes distribution lifecycle. For details, see [Supported Kubernetes distributions]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions">}}).
{{</note>}}

## Upgrade prerequisites

Before upgrading a cluster:

- Verify access to [rlcheck]({{< relref "/operate/rs/references/cli-utilities/rlcheck/" >}}) and [rladmin]({{< relref "/operate/rs/references/cli-utilities/rladmin/#use-the-rladmin-shell" >}}) commands

- Verify that you meet the upgrade path requirements for the target cluster version and review the relevant [release notes]({{< relref "/operate/rs/release-notes" >}}) for any preparation instructions.

- [Upgrade your databases]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-database">}}) to a version that is supported by the target Redis Enterprise Software version before upgrading the cluster. We recommend you upgrade the databases to the latest supported version if possible. Make sure to test the upgrade in a non-production environment to determine any impact.

- Avoid changing the database configuration or performing other cluster management operations during the cluster upgrade process, as this might cause unexpected results.

- Upgrade the cluster's primary (master) node first. To identify the primary node, use one of the following methods:

    - **Nodes** screen in the new Cluster Manager UI (only available for Redis Enterprise versions 7.2 and later)

    - [`rladmin status nodes`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status#status-nodes" >}}) command
    
    - [`GET /nodes/status`]({{< relref "/operate/rs/references/rest-api/requests/nodes/status#get-all-nodes-status" >}}) REST API request

## In-place upgrade

Starting with the primary node, follow these steps for every node in the cluster. To ensure cluster availability, upgrade each node separately.

1. Complete all [prerequisites](#upgrade-prerequisites) before starting the upgrade.

1.  Verify node operation with the following commands:

    ``` shell
    $ rlcheck
    $ rladmin status extra all
    ```

    {{<warning>}}
Do not proceed if any shard, node, or endpoint is not `OK`.
    {{</warning>}}

2.  Download the Redis Enterprise Software installation package to the machine running the node from the Download Center on [https://cloud.redis.io](https://cloud.redis.io).  

3.  Extract the installation package:

    ```sh
    tar vxf <tarfile name>
    ```

    {{<note>}}
You cannot change the installation path or the user during the upgrade.
    {{</note>}}

1.  Run the install command. See [installation script options]({{< relref "/operate/rs/installing-upgrading/install/install-script" >}}) for a list of command-line options you can add to the following command:

    ``` shell
    sudo ./install.sh
    ```

    The installation script automatically recognizes the upgrade and responds accordingly.

    The upgrade replaces all node processes, which might briefly interrupt any active connections.

2.  Verify the node was upgraded to the new version and is still operational:

    ``` shell
    $ rlcheck
    $ rladmin status extra all
    ```

3.  Visit the Cluster Manager UI.

    If the Cluster Manager UI was open in a web browser during the upgrade, refresh the browser to reload the console.

## Rolling upgrade

To perform a rolling upgrade of the cluster, use one of the following methods:

- [Extra node method](#extra-node-upgrade) - recommended if you have additional resources available

- [Replace node method](#replace-node-upgrade) - recommended if you cannot temporarily allocate additional resources

### Extra node upgrade method {#extra-node-upgrade}

1. Complete all [prerequisites](#upgrade-prerequisites) before starting the rolling upgrade.

1. [Install a later version of Redis Software]({{< relref "/operate/rs/installing-upgrading/install/install-on-linux" >}}) on a new node.

1. [Add the new node]({{< relref "/operate/rs/clusters/add-node" >}}) to the cluster.

1. [Promote the first new node]({{<relref "/operate/rs/clusters/change-node-role/#promote-secondary-node">}}) to become the primary node.

1. [Remove one node]({{< relref "/operate/rs/clusters/remove-node#remove-a-node" >}}) running the earlier Redis Software version from the cluster.

1. Repeat the previous steps until all nodes with the earlier Redis Software version are removed. If the final node to remove from the cluster is the primary node, [demote it]({{<relref "/operate/rs/clusters/change-node-role#demote-primary-node">}}) to a secondary node before you remove it.

### Replace node upgrade method {#replace-node-upgrade}

1. Complete all [prerequisites](#upgrade-prerequisites) before starting the rolling upgrade.

1. [Remove a node]({{< relref "/operate/rs/clusters/remove-node#remove-a-node" >}}) with the earlier Redis Software version from the cluster.

1. Uninstall Redis Enterprise Software from the removed node:

    ```sh
    sudo ./rl_uninstall.sh
    ```

1. [Install a later version of Redis Software]({{< relref "/operate/rs/installing-upgrading/install/install-on-linux" >}}) on the removed node or a new node.

1. [Add the new node]({{< relref "/operate/rs/clusters/add-node" >}}) to the cluster.

    If you want to reuse the removed node's ID when you add the node to the cluster, run [`rladmin cluster join`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/join" >}}) with the `replace_node` flag:

    ```sh
    rladmin cluster join nodes <cluster_member_ip_address> username <username> password <password> replace_node <node_id>
    ```

1. [Promote the first new node]({{<relref "/operate/rs/clusters/change-node-role/#promote-secondary-node">}}) to become the primary node.

1. Verify node health:

    1. Run `rlcheck` on all nodes:

        ```sh
        rlcheck
        ```

        The output lists the result of each verification test:

        ```sh
        ##### Welcome to Redis Enterprise Cluster settings verification utility ####
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

    1. Run [`rladmin status`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status" >}}) on the new node:

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

1. Repeat the previous steps until all nodes with the earlier Redis Software version are replaced. If the final node to remove from the cluster is the primary node, [demote it]({{<relref "/operate/rs/clusters/change-node-role#demote-primary-node">}}) to a secondary node before you remove it.

## After cluster upgrade

After all nodes are upgraded, the cluster is fully upgraded. Certain features introduced in the new version of Redis Software only become available after upgrading the entire cluster.

After upgrading from version 6.0.x to 6.2.x, restart `cnm_exec` on each cluster node to enable more advanced state machine handling capabilities:

```sh
supervisorctl restart cnm_exec
```
