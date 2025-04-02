---
Title: Recover a failed cluster
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to use the cluster configuration file and database data to recover
  a failed cluster.
linktitle: Recover a cluster
weight: 70
url: '/operate/rs/7.8/clusters/cluster-recovery/'
---
When a Redis Enterprise Software cluster fails,
you must use the cluster configuration file and database data to recover the cluster.

{{< note >}}
For cluster recovery in a Kubernetes deployment, see [Recover a Redis Enterprise cluster on Kubernetes]({{< relref "/operate/kubernetes/re-clusters/cluster-recovery" >}}).
{{< /note >}}

Cluster failure can be caused by:

- A hardware or software failure that causes the cluster to be unresponsive to client requests or administrative actions.
- More than half of the cluster nodes lose connection with the cluster, resulting in quorum loss.

To recover a cluster and re-create it as it was before the failure,
you must restore the cluster configuration `ccs-redis.rdb` to the cluster nodes.
To recover databases in the new cluster, you must restore the databases from persistence files such as backup files, append-only files (AOF), or RDB snapshots.
These files are stored in the [persistent storage location]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}).

The cluster recovery process includes:

1. Install Redis Enterprise Software on the nodes of the new cluster.
1. Mount the persistent storage with the recovery files from the original cluster to the nodes of the new cluster.
1. Recover the cluster configuration on the first node in the new cluster.
1. Join the remaining nodes to the new cluster.
1. [Recover the databases]({{< relref "/operate/rs/7.8/databases/recover.md" >}}).

## Prerequisites

- We recommend that you recover the cluster to clean nodes.
    If you use the original nodes,
    make sure there are no Redis processes running on any nodes in the new cluster.
- We recommend that you use clean persistent storage drives for the new cluster.
    If you use the original storage drives,
    make sure you back up the files on the original storage drives to a safe location.
- Identify the cluster configuration file that you want to use as the configuration for the recovered cluster.
    The cluster configuration file is `/css/ccs-redis.rdb` on the persistent storage for each node.

## Recover the cluster

1. (Optional) If you want to recover the cluster to the original cluster nodes, uninstall Redis Enterprise Software from the nodes.

1. [Install Redis Enterprise Software]({{< relref "/operate/rs/7.8/installing-upgrading/install/install-on-linux" >}}) on the new cluster nodes.

    The new servers must have the same basic hardware and software configuration as the original servers, including:

    - The same number of nodes
    - At least the same amount of memory
    - The same Redis Enterprise Software version
    - The same installation user and paths

    {{< note >}}
The cluster recovery can fail if these requirements are not met.
    {{< /note >}}

1. Mount the persistent storage drives with the recovery files to the new nodes.
    These drives must contain the cluster configuration backup files and database persistence files.

    {{< note >}}
Make sure that the user redislabs has permissions to access the storage location
of the configuration and persistence files on each of the nodes.
    {{< /note >}}

    If you use local persistent storage, place all of the recovery files on each of the cluster nodes.

1. To recover the original cluster configuration, run [`rladmin cluster recover`]({{< relref "/operate/rs/7.8/references/cli-utilities/rladmin/cluster/recover" >}}) on the first node in the new cluster:

    ```sh
    rladmin cluster recover filename [ <persistent_path> | <ephemeral_path> ]<filename> node_uid <node_uid> rack_id <rack_id>
    ```

    For example:

    ```sh
    rladmin cluster recover filename /tmp/persist/ccs/ccs-redis.rdb node_uid 1 rack_id 5
    ```

    When the recovery command succeeds,
    this node is configured as the node from the old cluster that has ID 1.

1. To join the remaining servers to the new cluster, run [`rladmin cluster join`]({{< relref "/operate/rs/7.8/references/cli-utilities/rladmin/cluster/join" >}}) from each new node:

    ```sh
    rladmin cluster join nodes <cluster_member_ip_address> username <username> password <password> replace_node <node_id>
    ```

    For example:

    ```sh
    rladmin cluster join nodes 10.142.0.4 username admin@example.com password mysecret replace_node 2
    ```

1. Run [`rladmin status`]({{< relref "/operate/rs/7.8/references/cli-utilities/rladmin/status" >}}) to verify the recovered nodes are now active and the databases are pending recovery:

    ```sh
    rladmin status
    ```

    {{< note >}}
Make sure that you update your [DNS records]({{< relref "/operate/rs/7.8/networking/cluster-dns" >}})
with the IP addresses of the new nodes.
    {{< /note >}}

After the cluster is recovered, you must [recover the databases]({{< relref "/operate/rs/7.8/databases/recover.md" >}}).
