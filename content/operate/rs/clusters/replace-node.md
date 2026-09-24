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
---
A failed node will appear as `Down` ({{< image filename="/images/rs/icons/node-down-icon.png#no-click" alt="Node down icon" class="inline" >}}) in the **Nodes** list.

To replace a failed node: 

1. Prepare a new node identical to the old one.

1.  Install and
    configure Redis Software on the node. See [Install and setup](/content/operate/rs/installing-upgrading/_index.md) for more information.

    > [!NOTE]
    > If you are using [Redis Flex or Auto Tiering](/content/operate/rs/databases/flash/_index.md), make sure the required flash storage is set up on this new node.

1. [Add the node](/content/operate/rs/clusters/add-node.md) to the cluster. Make sure the new node has as much available memory as the faulty
    node.

    If the new node does not have enough memory, you will be prompted to add a node with enough memory.

1. A message will appear informing you that the cluster has a faulty node
    and that the new node will replace the faulty node.

    > [!NOTE]
    > - If there is a faulty node in the cluster to which you are adding a node, Redis Software will use the new node to replace the faulty one.
    > - Any existing [DNS records](/content/operate/rs/networking/cluster-dns.md) must be updated
    > each time a node is added or replaced.
