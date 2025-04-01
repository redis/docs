---
Title: Replace a cluster node
alwaysopen: false
categories:
- docs
- operate
- rs
description: Replace a node in your cluster that is down.
linkTitle: Replace node
weight: 90
url: '/operate/rs/7.8/clusters/replace-node/'
---
A failed node will appear as `Down` ({{< image filename="/images/rs/icons/node-down-icon.png#no-click" alt="Node down icon" class="inline" >}}) in the **Nodes** list.

To replace a failed node: 

1. Prepare a new node identical to the old one.

1.  Install and
    configure Redis Enterprise Software on the node. See [Install and setup]({{< relref "/operate/rs/installing-upgrading" >}}) for more information.

    {{< note >}}
If you are using [Auto Tiering]({{< relref "/operate/rs/databases/auto-tiering/" >}}), make sure the required flash storage is set up on this new node.
    {{< /note >}}

1. [Add the node]({{< relref "/operate/rs/clusters/add-node" >}}) to the cluster. Make sure the new node has as much available memory as the faulty
    node.

    If the new node does not have enough memory, you will be prompted to add a node with enough memory.

1. A message will appear informing you that the cluster has a faulty node
    and that the new node will replace the faulty node.

    {{< note >}}
- If there is a faulty node in the cluster to which you are adding a node, Redis Enterprise Software will use the new node to replace the faulty one.
- Any existing [DNS records]({{< relref "/operate/rs/networking/cluster-dns" >}}) must be updated
each time a node is added or replaced.
    {{< /note >}}
