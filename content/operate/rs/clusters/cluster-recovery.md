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
---
When a Redis Enterprise Software cluster fails,
you must use the cluster configuration file and database data to recover the cluster.

{{< note >}}
For cluster recovery in a Kubernetes deployment, go to: [Recover a Redis Enterprise cluster on Kubernetes]({{< relref "/operate/kubernetes/re-clusters/cluster-recovery.md" >}}).
{{< /note >}}

Cluster failure can be caused by:

- A hardware or software failure that causes the cluster to be unresponsive to client requests or administrative actions.
- More than half of the cluster nodes lose connection with the cluster, resulting in quorum loss.

To recover a cluster and re-create it as it was before the failure
you must restore the cluster configuration (ccs-redis.rdb) to the cluster nodes.
To restore the data that was in the databases to databases in the new cluster
you must restore the database persistence files (backup, AOF, or snapshot files) to the databases.
These files are stored in the [persistent storage location]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}).

The cluster recovery process includes:

1. Install RS on the nodes of the new cluster.
1. Mount the persistent storage with the recovery files from the original cluster to the nodes of the new cluster.
1. Recover the cluster configuration on the first node in the new cluster.
1. Join the remaining nodes to the new cluster.
1. [Recover the databases]({{< relref "/operate/rs/databases/recover.md" >}}).

## Prerequisites

- We recommend that you recover the cluster to clean nodes.
    If you use the original nodes,
    make sure there are no Redis processes running on any nodes in the new cluster.
- We recommend that you use clean persistent storage drives for the new cluster.
    If you use the original storage drives,
    make sure that you backup the files on the original storage drives to a safe location.
- Identify the cluster configuration file that you want to use as the configuration for the recovered cluster.
    The cluster configuration file is `/css/ccs-redis.rdb` on the persistent storage for each node.

## Recovering the cluster

1. (Optional) If you want to recover the cluster to the original cluster nodes, uninstall RS from the nodes.

1. Install [RS]({{< relref "/operate/rs/installing-upgrading" >}}) on the new cluster nodes.

    Do not configure the cluster nodes (`rladmin cluster create` in the CLI or **Setup** in the admin console).

    The new servers must have the same basic hardware and software configuration as the original servers, including:

    - The same number of nodes
    - At least the same amount of memory
    - The same RS version
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

1. To recover the cluster configuration from the original cluster to the first node in the new cluster,
    from the [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command-line interface (CLI):

    ```sh
    rladmin cluster recover filename [ <persistent_path> | <ephemeral_path> ]<filename> node_uid <node_uid> rack_id <rack_id>
    ```

    {{< expand "Command syntax" >}}
    `<filename>` - The full path of the old cluster configuration file in the persistent storage.
    The cluster configuration file is `/css/ccs-redis.rdb`.

    `<node_uid>` - The id of the node, in this case `1`.

    `<persistent_path>` (optional) - The location of the [persistent storage ]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}})
    in the new node.

    `<ephemeral_path>` (optional) - The location of the [ephemeral storage]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}})
    in the new node.

    `<rack_id>` (optional) - If [rack-zone awareness]({{< relref "/operate/rs/clusters/configure/rack-zone-awareness.md" >}})
    was enabled in the cluster,
    you can use this parameter to override the rack ID value that was set for the node with ID 1 with a new rack ID.
    Otherwise, the node gets the same rack ID as the original node.
    {{< /expand >}}

    For example:

    ```sh
    rladmin cluster recover filename /tmp/persist/ccs/ccs-redis.rdb node_uid 1 rack_id 5
    ```

    When the recovery command succeeds,
    this node is configured as the node from the old cluster that has ID 1.

1. To join the remaining servers to the new cluster, run `rladmin cluster join` from each new node:

    ```sh
    rladmin cluster join [ nodes <cluster_member_ip_address> | name <cluster_FQDN> ] username <username> password <password> replace_node <node_id>
    ```

    {{< expand "Command syntax" >}}
    `nodes` - The IP address of a node in the cluster that this node is joining.

    `name` - The [FQDN name]({{< relref "/operate/rs/networking/cluster-dns" >}})
    of the cluster this node is joining.

    `username` - The email address of the cluster administrator.

    `password` - The password of the cluster administrator.

    `replace_node` - The ID of the node that this node replaces from the old cluster.

    `persistent_path` (optional) - The location of the [persistent storage]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}})
    in the new node.

    `ephemeral_path` (optional) - The location of the [ephemeral storage]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}})
    in the new node.

    `rack_id` (optional) - If [rack-zone awareness]({{< relref "/operate/rs/clusters/configure/rack-zone-awareness.md" >}}) was enabled in the cluster,
    use this parameter to set the rack ID to be the same as the rack ID
    of the old node. You can also change the value of the rack ID by
    providing a different value and using the `override_rack_id` flag.
    {{< /expand >}}

    For example:

    ```sh
    rladmin cluster join nodes 10.142.0.4 username admin@example.com password mysecret replace_node 2
    ```

    You can run the `rladmin status` command to verify that the recovered nodes are now active,
    and that the databases are pending recovery.

    {{< note >}}
Make sure that you update your [DNS records]({{< relref "/operate/rs/networking/cluster-dns" >}})
with the IP addresses of the new nodes.
    {{< /note >}}

After the cluster is recovered, you must [recover the databases]({{< relref "/operate/rs/databases/recover.md" >}}).
