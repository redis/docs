---
Title: Upgrade a Redis Enterprise Software cluster
alwaysopen: false
categories:
- docs
- operate
- rs
description: Upgrade a Redis Enterprise Software cluster.
linkTitle: Upgrade cluster
toc: 'true'
weight: 30
tocEmbedHeaders: true
url: '/operate/rs/7.4/installing-upgrading/upgrading/upgrade-cluster/'
---

{{<embed-md "rs-upgrade-paths.md">}}

See the [Redis Enterprise Software product lifecycle]({{<relref "/operate/rs/7.4/installing-upgrading/product-lifecycle">}}) for more information about release numbers and the end-of-life schedule.

## Upgrade prerequisites

Before upgrading a cluster:

- Verify access to [rlcheck]({{< relref "/operate/rs/7.4/references/cli-utilities/rlcheck/" >}}) and [rladmin]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/#use-the-rladmin-shell" >}}) commands

- Verify that you meet the upgrade path requirements for your desired cluster version and review the relevant [release notes]({{< relref "/operate/rs/release-notes" >}}) for any preparation instructions.

- Avoid changing the database configuration or performing other cluster management operations during the upgrade process, as this might cause unexpected results.

- Upgrade the cluster's primary (master) node first. To identify the primary node, use one of the following methods:

    - **Nodes** screen in the new Cluster Manager UI (only available for Redis Enterprise versions 7.2 and later)

    - [`rladmin status nodes`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/status#status-nodes" >}}) command
    
    - [`GET /nodes/status`]({{< relref "/operate/rs/7.4/references/rest-api/requests/nodes/status#get-all-nodes-status" >}}) REST API request

## Upgrade cluster

Starting with the primary (master) node, follow these steps for every node in the cluster. To ensure cluster availability, upgrade each node separately.

1.  Verify node operation with the following commands:

    ``` shell
    $ rlcheck
    $ rladmin status extra all
    ```

2.  Download the Redis Enterprise Software installation package to the machine running the node from the Download Center on [https://cloud.redis.io](https://cloud.redis.io).  

3.  Extract the installation package:

    ```sh
    tar vxf <tarfile name>
    ```

    {{<note>}}
You cannot change the installation path or the user during the upgrade.
    {{</note>}}

1.  Run the install command. See [installation script options]({{< relref "/operate/rs/7.4/installing-upgrading/install/install-script" >}}) for a list of command-line options you can add to the following command:

    ``` shell
    sudo ./install.sh
    ```

    The installation script automatically recognizes the upgrade and responds accordingly.

    The upgrade replaces all node processes, which might briefly interrupt any active connections.

2.  Verify the node was upgraded to the new version and is still operational:

    ``` shell
    $ rlcheck
    $ rladmin status extra all
    ```

3.  Visit the Cluster Manager UI.

    If the Cluster Manager UI was open in a web browser during the upgrade, refresh the browser to reload the console.

After all nodes are upgraded, the cluster is fully upgraded. Certain features introduced in the new version of Redis Enterprise Software only become available after upgrading the entire cluster.

After upgrading from version 6.0.x to 6.2.x, restart `cnm_exec` on each cluster node to enable more advanced state machine handling capabilities:

```sh
supervisorctl restart cnm_exec
```
