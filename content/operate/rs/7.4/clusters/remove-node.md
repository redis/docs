---
Title: Remove a cluster node
alwaysopen: false
categories:
- docs
- operate
- rs
description: Remove a node from your Redis Enterprise cluster.
linkTitle: Remove node
weight: 80
url: '/operate/rs/7.4/clusters/remove-node/'
---
You might want to remove a node from a Redis Enterprise cluster for one of the following reasons:

- To [permanently remove a node](#permanently-remove-a-node) if you no longer need the extra capacity.
- To [replace a faulty node](#replace-a-faulty-node) with a healthy node.
- To [replace a healthy node](#replace-a-healthy-node) with a different node.

You can configure [email alerts from the cluster]({{< relref "/operate/rs/7.4/clusters/monitoring#cluster-alerts" >}}) to notify you of cluster changes, including when a node is removed.

{{<warning>}}
Read through these explanations thoroughly before taking
any action.
{{</warning>}}

## Permanently remove a node

Permanently removing a node means you are decreasing cluster capacity.
Before trying to remove a node, make sure that the cluster has enough
capacity for all resources without that node, otherwise you cannot remove the node.

If there is not enough capacity in the cluster to facilitate removing
the node, you can either delete databases or add another node instead of
the one you would like to remove.

During the removal process, the cluster migrates all resources from the
node being removed to other nodes in the cluster. In order to ensure
database connectivity, and database high availability (when replication
is enabled), the cluster first creates replacement shards or endpoints
on one of the other nodes in the cluster, initiates failover as needed,
and only then removes the node.

If a cluster has only two nodes (which is not recommended for production
deployments) and some databases have replication enabled, you cannot remove a node.

## Replace a faulty node

If the cluster has a faulty node that you would like to replace, you
only need to add a new node to the cluster. The cluster recognizes the
existence of a faulty node and automatically replaces the faulty node
with the new node.

For guidelines, refer to [Replacing a faulty
node]({{< relref "/operate/rs/7.4/clusters/replace-node.md" >}}).

## Replace a healthy node

If you would like to replace a healthy node with a different node, you
must first add the new node to the cluster, migrate all the resources
from the node you would like to remove, and only then remove the node.

For further guidance, refer to [adding a new node to a
cluster]({{< relref "/operate/rs/7.4/clusters/add-node.md" >}}).

You can migrate resources by using the `rladmin` command-line interface
(CLI). For guidelines, refer to [`rladmin` command-line interface
(CLI)]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin" >}}).

{{< note >}}
The [DNS records]({{< relref "/operate/rs/7.4/networking/cluster-dns" >}}) must be updated each time a node is added or replaced.
{{< /note >}}

## Remove a node

To remove a node using the Cluster Manager UI:

1. If you are using the new Cluster Manager UI, switch to the legacy admin console.

    {{<image filename="images/rs/screenshots/switch-to-legacy-ui.png"  width="300px" alt="Select switch to legacy admin console from the dropdown.">}}

1. On the **nodes** page, select the node you want to remove.

1. Click **Remove** at the top of the **node** page.

1. Confirm you want to **Remove** the node when prompted.

1. Redis Enterprise Software examines the node and the cluster and takes the actions required
    to remove the node.

1. At any point, you can click the **Abort** button to stop the
    process. When aborted, the current internal action is completed, and
    then the process stops.
    
1. Once the process finishes, the node is no longer shown in
    the UI.

To remove a node using the REST API, use [`POST /v1/nodes/<node_id>/actions/remove`]({{< relref "/operate/rs/7.4/references/rest-api/requests/nodes/actions#post-node-action" >}}).

By default, the remove node action completes after all resources migrate off the removed node. Node removal does not wait for migrated shards' persistence files to be created on the new nodes.

To change node removal to wait for the creation of new persistence files for all migrated shards, set `wait_for_persistence` to `true` in the request body or [update the cluster policy]({{<relref "/operate/rs/7.4/references/rest-api/requests/cluster/policy#put-cluster-policy">}}) `persistent_node_removal` to `true` to change the cluster's default behavior.

For example:

```sh
POST https://<hostname>:9443/v1/nodes/<node_id>/actions/remove
{
    "wait_for_persistence": true
}
```

{{< note >}}
If you need to add a removed node back to the cluster,
you must [uninstall]({{< relref "/operate/rs/7.4/installing-upgrading/uninstalling.md" >}})
and [reinstall]({{< relref "/operate/rs/7.4/installing-upgrading" >}}) the software on that node.
{{< /note >}}
