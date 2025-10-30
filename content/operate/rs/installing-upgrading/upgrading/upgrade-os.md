---
Title: Upgrade a cluster's operating system
alwaysopen: false
categories:
- docs
- operate
- rs
description: Upgrade a Redis Enterprise Software cluster's operating system to a later
  major version.
linkTitle: Upgrade operating system
toc: 'true'
weight: 70
---

To upgrade the operating system (OS) on a Redis Enterprise Software cluster to a later major version, perform a rolling upgrade. Because you upgrade one node at a time, you can upgrade your cluster's OS without downtime.

## Prerequisites

Before you upgrade a cluster's operating system:

1. [Upgrade all nodes in the cluster]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster" >}}) to a Redis Enterprise Software version that supports the OS's current version and upgrade version.

    To learn which versions of Redis Enterprise Software support specific OS versions, see [Supported platforms]({{< relref "/operate/rs/references/supported-platforms#supported-platforms" >}}).


1. If the cluster uses custom directories, make sure the OS upgrade version also supports custom directories, and specify the same custom directories during installation for all nodes. See [Customize installation directories]({{< relref "/operate/rs/installing-upgrading/install/customize-install-directories" >}}) for details.

## Perform OS rolling upgrade

To upgrade the cluster's operating system, use one of the following rolling upgrade methods:

- [Extra node method](#extra-node-upgrade) - recommended if you have additional resources available

- [Replace node method](#replace-node-upgrade) - recommended if you cannot temporarily allocate additional resources

### Extra node upgrade method {#extra-node-upgrade}

1. Complete all [prerequisites](#prerequisites) before starting the rolling upgrade.

1. Create a node with the OS upgrade version.

1. [Install the cluster's current Redis Enterprise Software version]({{< relref "/operate/rs/installing-upgrading/install/install-on-linux" >}}) on the new node using the installation package for the OS upgrade version.

1. [Add the new node]({{< relref "/operate/rs/clusters/add-node" >}})  to the cluster.

1. If the [cluster uses DNS]({{<relref "/operate/rs/networking/cluster-dns">}}), add the new node’s IP address to the DNS records.

1. [Remove one node]({{< relref "/operate/rs/clusters/remove-node#remove-a-node" >}}) running the earlier OS version from the cluster.

1. Repeat the previous steps until all nodes with the earlier OS version are removed. If the final node to remove from the cluster is the primary node, [demote it]({{<relref "/operate/rs/clusters/change-node-role#demote-primary-node">}}) to a secondary node before you remove it.

### Replace node upgrade method {#replace-node-upgrade}

1. Complete all [prerequisites](#prerequisites) before starting the rolling upgrade.

1. [Remove a node]({{< relref "/operate/rs/clusters/remove-node#remove-a-node" >}}) with the earlier OS version from the cluster.

1. Uninstall Redis Enterprise Software from the removed node:

    ```sh
    sudo ./rl_uninstall.sh
    ```

1. Either upgrade the existing node to the OS upgrade version, or create a new node with the OS upgrade version.

1. [Install the cluster's current Redis Enterprise Software version]({{< relref "/operate/rs/installing-upgrading/install/install-on-linux" >}}) on the upgraded node using the installation package for the OS upgrade version.

1. [Add the new node]({{< relref "/operate/rs/clusters/add-node" >}}) to the cluster.

    If you want to reuse the removed node's ID when you add the node to the cluster, run [`rladmin cluster join`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/join" >}}) with the `replace_node` flag:

    ```sh
    rladmin cluster join nodes <cluster_member_ip_address> username <username> password <password> replace_node <node_id>
    ```

1. If the [cluster uses DNS]({{<relref "/operate/rs/networking/cluster-dns">}}), add the new node’s IP address to the DNS records.

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

1. Repeat the previous steps until all nodes with the earlier OS version are replaced. If the final node to remove from the cluster is the primary node, [demote it]({{<relref "/operate/rs/clusters/change-node-role#demote-primary-node">}}) to a secondary node before you remove it.
