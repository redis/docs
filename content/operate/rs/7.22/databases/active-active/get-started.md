---
Title: Get started with Redis Enterprise Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
description: Quick start guide to create an Active-Active database for test and development.
linktitle: Get started
weight: 20
url: '/operate/rs/7.22/databases/active-active/get-started/'
---

To get started, this article will help you set up an Active-Active database, formerly known as CRDB (conflict-free replicated database), spanning across two Redis Enterprise Software
clusters for test and development environments. Here are the steps:

1. Run two Redis Enterprise Software Docker containers.

1. Set up each container as a cluster.

1. Create a new Redis Enterprise Active-Active database.

1. Test connectivity to the Active-Active database.

To run an Active-Active database on installations from the [Redis Enterprise Software download package]({{< relref "/operate/rs/7.22/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}}),
set up two Redis Enterprise Software installations and continue from Step 2.

{{<note>}}
This getting started guide is for development or demonstration environments.
For production environments, see [Create an Active-Active geo-replicated database]({{< relref "/operate/rs/7.22/databases/active-active/create" >}}) for instructions.
{{</note>}}

## Run two containers

To spin up two Redis Enterprise Software containers, run these commands:

```sh
docker run -d --cap-add sys_resource -h rs1_node1 --name rs1_node1 -p 8443:8443 -p 9443:9443 -p 12000:12000 redislabs/redis
```

```sh
docker run -d --cap-add sys_resource -h rs2_node1 --name rs2_node1 -p 8445:8443 -p 9445:9443 -p 12002:12000 redislabs/redis
```

{{<note>}}
The `-h` option sets the hostname of the container, which is important for cluster setup and identification.

The `--name` option assigns a name to the container, making it easier to manage and reference with Docker commands.

The `-p` options map the Cluster Manager UI port (8443), REST API port (9443), and database access port differently for each container to make sure that all containers can be accessed from the host OS that is running the containers.
{{</note>}}

## Set up two clusters

1. For cluster 1, go to `https://localhost:8443` in a browser on the
host machine to access the Redis Enterprise Software Cluster Manager UI.

    {{<note>}}
Depending on your browser, you may see a certificate error. Continue to the website.
    {{</note>}}

1. Click **Create new cluster**:

    {{<image filename="images/rs/screenshots/cluster/setup/create-cluster.png" alt="When you first install Redis Enterprise Software, you need to set up a cluster." >}}

1. Enter an email and password for the administrator account, then click **Next** to proceed to cluster setup:

    {{<image filename="images/rs/screenshots/cluster/setup/admin-credentials.png" alt="Set the credentials for your admin user." >}}

1. Enter your cluster license key if you have one. Otherwise, a trial version is installed.

    {{<image filename="images/rs/screenshots/cluster/setup/cluster-license-key.png" alt="Enter your cluster license key if you have one." >}}

1. In the **Configuration** section of the **Cluster** settings page, enter a cluster FQDN, for example `cluster1.local`:

    {{<image filename="images/rs/screenshots/cluster/setup/config-cluster1.png" alt="Configure the cluster FQDN." >}}

1. On the node setup screen, keep the default settings and click **Create cluster**:

    {{<image filename="images/rs/screenshots/cluster/setup/node-settings.png" alt="Configure the node specific settings." >}}

1. Click **OK** to confirm that you are aware of the replacement of the HTTPS SSL/TLS
    certificate on the node, and proceed through the browser warning.

1. Repeat the previous steps for cluster 2 with these differences:

    - In your web browser, go to `https://localhost:8445` to set up the cluster 2.

    - For the **Cluster name (FQDN)**, enter a different name, such as `cluster2.local`.

Now you have two Redis Enterprise Software clusters with FQDNs
`cluster1.local` and `cluster2.local`.

{{<note>}}
Each Active-Active instance must have a unique fully-qualified domain name (FQDN).
{{</note>}}

## Create an Active-Active database

1. Sign in to cluster1.local's Cluster Manager UI at `https://localhost:8443`

1. Open the **Create database** menu with one of the following methods:

    - Click the **+** button next to **Databases** in the navigation menu:

        {{<image filename="images/rs/screenshots/databases/create-db-plus-drop-down.png" width="350px" alt="Create database menu has two options: Single Region and Active-Active database.">}}
        
    - Go to the **Databases** screen and select **Create database**:

        {{<image filename="images/rs/screenshots/databases/create-db-button-drop-down.png" width="350px" alt="Create database menu has two options: Single Region and Active-Active database.">}}

1. Select **Active-Active database**.

1. Enter the cluster's local admin credentials, then click **Save**:

    {{<image filename="images/rs/screenshots/databases/active-active-databases/enter-local-admin-credentials-cluster1.png" alt="Enter the cluster's admin username and password.">}}

1. Add participating clusters that will host instances of the Active-Active database:

    1. In the **Participating clusters** section, go to **Other participating clusters** and click **+ Add cluster**.

    1. In the **Add cluster** configuration panel, enter the new cluster's URL, port number, and the admin username and password for the new participating cluster:

        In the **Other participating clusters** list, add the address and admin credentials for the other cluster: `https://cluster2.local:9443`

        {{<image filename="images/rs/screenshots/databases/active-active-databases/participating-clusters-add-cluster2.png" alt="Add cluster panel.">}}

    1. Click **Join cluster** to add the cluster to the list of participating clusters. 

1. Enter `database1` for **Database name** and `12000` for **Port**:

    {{<image filename="images/rs/screenshots/databases/active-active-databases/quickstart-db-name-port.png" alt="Database name and port text boxes.">}}

1. Configure additional settings:

    1. In the **High availability** section, turn off **Replication** since each cluster has only one node in this setup:

        {{<image filename="images/rs/screenshots/databases/active-active-databases/quickstart-ha-turn-off-replication-7-8-2.png" alt="Turn off replication in the High availability section.">}}


    1. In the **Clustering** section, either:

        - Make sure that **Sharding** is enabled and select the number of shards you want to have in the database. When database clustering is enabled,
        databases are subject to limitations on [Multi-key commands]({{< relref "/operate/rs/7.22/databases/durability-ha/clustering" >}}).
        You can increase the number of shards in the database at any time.

        - Turn off **Sharding** to use only one shard and avoid [Multi-key command]({{< relref "/operate/rs/7.22/databases/durability-ha/clustering" >}}) limitations.

        {{< note >}}
You cannot enable or turn off database clustering after the Active-Active database is created.
        {{< /note >}}

1. Click **Create**.

    {{< note >}}
{{< embed-md "docker-memory-limitation.md" >}}
    {{< /note >}}

1. After the Active-Active database is created, sign in to the Cluster Manager UIs for cluster 1 at `https://localhost:8443` and cluster 2 at `https://localhost:8445`.

1. Make sure each cluster has an Active-Active database member database with the name `database1`.

    In a real-world deployment, cluster 1 and cluster 2 would most likely be
    in separate data centers in different regions. However, for
    local testing we created the scale-minimized deployment using two
    local clusters running on the same host.

<!-- Also in getting-started-crdbs.md -->
## Test connection

With the Redis database created, you are ready to connect to your
database. See [Connect to Active-Active databases]({{< relref "/operate/rs/7.22/databases/active-active/connect" >}}) for tutorials and examples of multiple connection methods.
