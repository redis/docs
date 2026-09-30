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
url: '/operate/rs/7.22/installing-upgrading/upgrading/upgrade-os/'
---

To upgrade the operating system (OS) on a Redis Enterprise Software cluster to a later major version, perform a rolling upgrade. Because you upgrade one node at a time, you can upgrade your cluster's OS without downtime.

## Prerequisites

Before you upgrade a cluster's operating system:

1. [Upgrade all nodes in the cluster](/content/operate/rs/7.22/installing-upgrading/upgrading/upgrade-cluster.md) to a Redis Enterprise Software version that supports the OS's current version and upgrade version.

    To learn which versions of Redis Enterprise Software support specific OS versions, see [Supported platforms](/content/operate/rs/7.22/references/supported-platforms.md#supported-platforms).

1. If the cluster contains any databases that use modules:

    1. Update all nodes in the cluster to [Redis Enterprise Software version 7.2.4-52](/content/operate/rs/release-notes/rs-7-2-4-releases/_index.md) or later before you upgrade the OS.

    1. Check the status of modules using [`rladmin`](/content/operate/rs/7.22/references/cli-utilities/rladmin/_index.md):

        ```sh
        rladmin status modules
        ```

        The output lists the module versions installed on the cluster and the module versions used by existing databases:

        ```sh
        CLUSTER MODULES:
        MODULE                                                                      VERSION                            
        RedisBloom                                                                  2.6.3                              
        RediSearch 2                                                                2.8.4                              
        RedisGears                                                                  2.0.12                             
        RedisGraph                                                                  2.10.12                            
        RedisJSON                                                                   2.6.6                              
        RedisTimeSeries                                                             1.10.6                             

        DATABASE MODULES:
        DB:ID    NAME       MODULE              VERSION     ARGS                     STATUS                            
        db:1     db1        RediSearch 2        2.6.9       PARTITIONS AUTO          OK, OLD MODULE VERSION            
        db:1     db1        RedisJSON           2.4.7                                OK, OLD MODULE VERSION  
        ```

    1. Upload module packages for the target OS version to a node in the existing cluster. See [Install a module on a cluster](/content/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster.md) for instructions.

        > [!NOTE]
        > The uploaded module packages have the following requirements:
        >
        > - The module is compiled for the target OS version.
        > - The module version matches the version currently used by databases.

1. If the cluster uses custom directories, make sure the OS upgrade version also supports custom directories, and specify the same custom directories during installation for all nodes. See [Customize installation directories](/content/operate/rs/7.22/installing-upgrading/install/customize-install-directories.md) for details.

## Perform OS rolling upgrade

To upgrade the cluster's operating system, use one of the following rolling upgrade methods:

- [Extra node method](#extra-node-upgrade) - recommended if you have additional resources available

- [Replace node method](#replace-node-upgrade) - recommended if you cannot temporarily allocate additional resources

### Extra node upgrade method {#extra-node-upgrade}

1. Complete all [prerequisites](#prerequisites) before starting the rolling upgrade.

1. Create a node with the OS upgrade version.

1. [Install the cluster's current Redis Enterprise Software version](/content/operate/rs/7.22/installing-upgrading/install/install-on-linux.md) on the new node using the installation package for the OS upgrade version.

1. [Add the new node](/content/operate/rs/7.22/clusters/add-node.md)  to the cluster.

1. If the [cluster uses DNS](/content/operate/rs/7.22/networking/cluster-dns.md), add the new node’s IP address to the DNS records.

1. [Remove one node](/content/operate/rs/7.22/clusters/remove-node.md#remove-a-node) running the earlier OS version from the cluster.

1. Repeat the previous steps until all nodes with the earlier OS version are removed. If the final node to remove from the cluster is the primary node, [demote it](/content/operate/rs/7.22/clusters/change-node-role.md#demote-primary-node) to a secondary node before you remove it.

### Replace node upgrade method {#replace-node-upgrade}

1. Complete all [prerequisites](#prerequisites) before starting the rolling upgrade.

1. [Remove a node](/content/operate/rs/7.22/clusters/remove-node.md#remove-a-node) with the earlier OS version from the cluster.

1. Uninstall Redis Enterprise Software from the removed node:

    ```sh
    sudo ./rl_uninstall.sh
    ```

1. Either upgrade the existing node to the OS upgrade version, or create a new node with the OS upgrade version.

1. [Install the cluster's current Redis Enterprise Software version](/content/operate/rs/7.22/installing-upgrading/install/install-on-linux.md) on the upgraded node using the installation package for the OS upgrade version.

1. [Add the new node](/content/operate/rs/7.22/clusters/add-node.md) to the cluster.

    If you want to reuse the removed node's ID when you add the node to the cluster, run [`rladmin cluster join`](/content/operate/rs/7.22/references/cli-utilities/rladmin/cluster/join.md) with the `replace_node` flag:

    ```sh
    rladmin cluster join nodes <cluster_member_ip_address> username <username> password <password> replace_node <node_id>
    ```

1. If the [cluster uses DNS](/content/operate/rs/7.22/networking/cluster-dns.md), add the new node’s IP address to the DNS records.

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

    1. Run [`rladmin status`](/content/operate/rs/7.22/references/cli-utilities/rladmin/status.md) on the new node:

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

1. Repeat the previous steps until all nodes with the earlier OS version are replaced. If the final node to remove from the cluster is the primary node, [demote it](/content/operate/rs/7.22/clusters/change-node-role.md#demote-primary-node) to a secondary node before you remove it.
