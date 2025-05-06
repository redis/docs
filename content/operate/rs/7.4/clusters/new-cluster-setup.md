---
Title: Set up a new cluster
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to set up a new cluster using the management UI.
linktitle: Set up cluster
weight: 10
url: '/operate/rs/7.4/clusters/new-cluster-setup/'
---
A Redis Enterprise Software cluster typically consists of several nodes.
For production deployments, we recommend an uneven number of nodes, with a minimum of three.

{{< note >}}
In a cluster that consists of only one node, some features and capabilities are not enabled,
such as database replication that provides high availability.
{{< /note >}}

To set up a new cluster, you must first [install the Redis Enterprise Software package]({{< relref "/operate/rs/7.4/installing-upgrading" >}})
and then set up the cluster as described below.
After the cluster is created you can [add multiple nodes to the cluster]({{< relref "/operate/rs/7.4/clusters/add-node.md" >}}).

To create a cluster:

1. In a browser, go to `https://<name or IP address of the machine with Redis Enterprise Software installed>:8443`.
    For example, if you installed Redis Enterprise Software on a machine with IP address 10.0.1.34, go to <https://10.0.1.34:8443>.

    {{< note >}}
- The management UI uses a [self-signed certificate for TLS encryption]({{< relref "/operate/rs/7.4/security/certificates/updating-certificates" >}}).
- If the machine has both an internal IP address and an external IP address, use the external IP address to access the setup UI.
    {{< /note >}}

1. Select **Create new cluster**.

1. Enter an email and password for the administrator account, then select **Next** to proceed to cluster setup.

1. Enter your cluster license key if you have one. Otherwise, the cluster uses the trial license by default.

1. In the **Configuration** section:

    1. For **FQDN (Fully Qualified Domain Name)**, enter a unique name for the cluster.

        See the [instructions for DNS setup]({{< relref "/operate/rs/7.4/networking/cluster-dns" >}})
        to make sure your cluster is reachable by name.

    1. Choose whether to [**Enable private & public endpoints support**]({{< relref "/operate/rs/7.4/networking/private-public-endpoints.md" >}}).

    1. Choose whether to [**Enable rack-zone awareness**]({{< relref "/operate/rs/7.4/clusters/configure/rack-zone-awareness.md" >}}).

1. Click **Next**.

1. Configure storage and network settings:

    1. Enter a path for [*Ephemeral storage*]({{< relref "/operate/rs/7.4/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}), or leave the default path.

    1. Enter a path for [*Persistent storage*]({{< relref "/operate/rs/7.4/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}),
        or leave the default path.

    1. To enable [*Auto Tiering*]({{< relref "/operate/rs/7.4/databases/auto-tiering/" >}}),
        select **Enable flash storage** and enter the path to the flash storage.

    1. If the cluster is configured to support [rack-zone awareness]({{< relref "/operate/rs/7.4/clusters/configure/rack-zone-awareness.md" >}}), set the **Rack-zone ID** for the new node.

    1. If your machine has multiple IP addresses, assign a single IPv4 type address for **Node-to-node communication (internal traffic)** and multiple IPv4/IPv6 type addresses for **External traffic**.

1. Select **Create cluster**.

1. Click **OK** to confirm that you are aware of the replacement of the HTTPS TLS certificate on the node,
    and proceed through the browser warning.

After a short wait, your cluster is created and you can sign in to the Cluster Manager UI.

You can now access any of the management capabilities, including:

- [Creating a new database]({{< relref "/operate/rs/7.4/databases/create.md" >}})
- [Joining a new node to a cluster]({{< relref "/operate/rs/7.4/clusters/add-node.md" >}})
