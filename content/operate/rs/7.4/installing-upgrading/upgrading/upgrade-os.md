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
url: '/operate/rs/7.4/installing-upgrading/upgrading/upgrade-os/'
---

To upgrade the operating system (OS) on a Redis Enterprise Software cluster to a later major version, perform a rolling upgrade. Because you upgrade one node at a time, you can upgrade your cluster's OS without downtime.

## Prerequisites

Before you upgrade a cluster's operating system:

1. [Upgrade all nodes in the cluster]({{< relref "/operate/rs/7.4/installing-upgrading/upgrading/upgrade-cluster" >}}) to a Redis Enterprise Software version that supports the OS's current version and upgrade version.

    To learn which versions of Redis Enterprise Software support specific OS versions, see [Supported platforms]({{< relref "/operate/rs/7.4/references/supported-platforms#supported-platforms" >}}).

1. If the cluster contains databases that use modules:

    1. Update all nodes in the cluster to [Redis Enterprise Software version 7.2.4-52](https://redis.io/docs/latest/operate/rs/release-notes/rs-7-2-4-releases) or later before you upgrade the OS.

    1. Check the status of modules using [`rladmin`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin" >}}):

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

    1. If any databases use custom modules, manually uploaded modules, or modules marked with `OLD MODULE VERSION`, upload module packages for the OS upgrade version to a cluster node. See [Install a module on a cluster]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster" >}}) for instructions.

        {{<note>}}
The uploaded module packages have the following requirements:

- The module is compiled for the OS upgrade version.
    
- The module version matches the version currently used by databases.
        {{</note>}}

1. If the cluster uses custom directories, make sure the OS upgrade version also supports custom directories, and specify the same custom directories during installation for all nodes. See [Customize installation directories]({{< relref "/operate/rs/7.4/installing-upgrading/install/customize-install-directories" >}}) for details.

## Perform OS rolling upgrade

To upgrade the cluster's operating system, use one of the following rolling upgrade methods:

- [Extra node method](#extra-node-upgrade) - recommended if you have additional resources available

- [Replace node method](#replace-node-upgrade) - recommended if you cannot temporarily allocate additional resources

### Extra node upgrade method {#extra-node-upgrade}

1. Create a node with the OS upgrade version.

1. [Install the cluster's current Redis Enterprise Software version]({{< relref "/operate/rs/7.4/installing-upgrading/install/install-on-linux" >}}) on the new node using the installation package for the OS upgrade version.

1. [Add the new node]({{< relref "/operate/rs/7.4/clusters/add-node" >}})  to the cluster.

1. If the [cluster uses DNS]({{<relref "/operate/rs/7.4/networking/cluster-dns">}}), add the new node’s IP address to the DNS records.

1. [Remove one node]({{< relref "/operate/rs/7.4/clusters/remove-node#remove-a-node" >}}) running the earlier OS version from the cluster.

1. Repeat the previous steps until all nodes with the earlier OS version are removed.

### Replace node upgrade method {#replace-node-upgrade}

1. [Remove a node]({{< relref "/operate/rs/7.4/clusters/remove-node#remove-a-node" >}}) with the earlier OS version from the cluster.

1. Uninstall Redis Enterprise Software from the removed node:

    ```sh
    sudo ./rl_uninstall.sh
    ```

1. Either upgrade the existing node to the OS upgrade version, or create a new node with the OS upgrade version.

1. [Install the cluster's current Redis Enterprise Software version]({{< relref "/operate/rs/7.4/installing-upgrading/install/install-on-linux" >}}) on the upgraded node using the installation package for the OS upgrade version.

1. [Add the new node]({{< relref "/operate/rs/7.4/clusters/add-node" >}}) to the cluster.

    If you want to reuse the removed node's ID when you add the node to the cluster, run [`rladmin cluster join`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/cluster/join" >}}) with the `replace_node` flag:

    ```sh
    rladmin cluster join nodes <cluster_member_ip_address> username <username> password <password> replace_node <node_id>
    ```

1. If the [cluster uses DNS]({{<relref "/operate/rs/7.4/networking/cluster-dns">}}), add the new node’s IP address to the DNS records.

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

    1. Run [`rladmin status`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/status" >}}) on the new node:

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

1. Repeat the previous steps until all nodes with the earlier OS version are replaced.
