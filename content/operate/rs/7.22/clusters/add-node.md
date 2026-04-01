---
Title: Add a node
alwaysopen: false
categories:
- docs
- operate
- rs
description: Add a node to your existing Redis Enterprise cluster.
linktitle: Add a node
weight: 20
url: '/operate/rs/7.22/clusters/add-node/'
---
When you install Redis Enterprise Software on the first node of a cluster, you create the new cluster.
After you install the first node, you can add more nodes to the cluster.

## Prerequisites

Before you add a node to the cluster:

- The clocks on all nodes must always be [synchronized]({{< relref "/operate/rs/7.22/clusters/configure/sync-clocks.md" >}}).

    If the clock in the node you are trying to join to the cluster is not synchronized with the nodes already in the cluster,
    the action fails and an error message is shown indicating that you must synchronize the clocks first.

- You must [update the DNS records]({{< relref "/operate/rs/7.22/networking/cluster-dns" >}})
    each time a node is added or replaced.

- We recommend that you add nodes one after the other rather than in parallel
    to avoid errors that occur because the connection to the other nodes in the cluster cannot be verified.

## Add node

To add a node to an existing cluster:

1. [Install the Redis Enterprise Software installation package]({{< relref "/operate/rs/7.22/installing-upgrading" >}}) on a clean installation
    of a [supported operating system]({{< relref "/operate/rs/7.22/installing-upgrading/install/plan-deployment/supported-platforms.md" >}}).

1. To connect to the Cluster Manager UI of the new Redis Enterprise Software installation, go to: <https://URL or IP address:8443>

    For example, if you installed Redis Enterprise Software on a machine with IP address 10.0.1.34, go to `https://10.0.1.34:8443`.

    {{< tip >}}
The management UI uses TLS encryption with a default certificate.
You can also [replace the TLS certificate]({{< relref "/operate/rs/7.22/security/certificates/updating-certificates" >}})
with a custom certificate.
    {{< /tip >}}

1. Select **Join cluster**.

1. For **Cluster identification**, enter the internal IP address or DNS name of a node that is a cluster member.

    If the node only has one IP address, enter that IP address.

1. For **Cluster sign in**, enter the credentials of the cluster administrator.

    The cluster administrator is the user account that you create when you configure the first node in the cluster.

1. Click **Next**.

1. Configure storage and network settings:

    1. Enter a path for [*Ephemeral storage*]({{< relref "/operate/rs/7.22/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}), or leave the default path.

    1. Enter a path for [*Persistent storage*]({{< relref "/operate/rs/7.22/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}),
        or leave the default path.

    1. To enable [*Auto Tiering*]({{< relref "/operate/rs/7.22/databases/auto-tiering/" >}}),
        select **Enable flash storage** and enter the path to the flash storage.

    1. If the cluster is configured to support [rack-zone awareness]({{< relref "/operate/rs/7.22/clusters/configure/rack-zone-awareness.md" >}}), set the **Rack-zone ID** for the new node.

    1. If your machine has multiple IP addresses, assign a single IPv4 type address for **Node-to-node communication (internal traffic)** and multiple IPv4/IPv6 type addresses for **External traffic**.

1. Select **Join cluster**.

The node is added to the cluster.
You can see it in the list of nodes in the cluster.

If you see an error when you add the node, try adding the node again.

## Verify node

We recommend that you verify the node is functioning properly using one of the following methods:

- Cluster Manager UI method:

    1. On the **Nodes** screen, click {{< image filename="/images/rs/buttons/button-toggle-actions-vertical.png#no-click" alt="More actions button" width="22px" class="inline" >}} for the node you want to verify.
    
    1. Select **Verify node** from the list.

    {{<image filename="images/rs/screenshots/nodes/secondary-nodes-more-actions.png" alt="Click the more actions button for a node to access node actions.">}}

- Command-line method:

    Run the [`rlcheck`]({{< relref "/operate/rs/7.22/references/cli-utilities/rlcheck" >}}) utility from the node's command line.
