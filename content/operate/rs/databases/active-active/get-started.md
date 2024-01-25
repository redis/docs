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
---

To get you started, this article will help you set up an Active-Active database, formerly known as CRDB (conflict-free replicated database) spanning across two Redis Enterprise Software
clusters for test and development environments. Here are the steps:

- Step 1: Run two Redis Enterprise Software (RS) Docker containers
- Step 2: Set up each container as a cluster
- Step 3: Create a new Redis Enterprise Active-Active database
- Step 4: Test connectivity to the Active-Active database

To run an Active-Active database on installations from the [Redis Enterprise Software download package]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}}),
set up two Redis Enterprise Software installations and continue from Step 2.

{{< note >}}
This getting started guide is for development or demonstration environments.
To set up an Active-Active database in a production environment, use the instructions for
[creating an Active-Active database]({{< relref "/operate/rs/databases/active-active/create.md" >}}).
{{< /note >}}

## Run two containers

To spin up two RS containers, run these commands:

```sh
docker run -d --cap-add sys_resource -h rp1_node1 --name rp1_node1 -p 8443:8443 -p 9443:9443 -p 12000:12000 redislabs/redis
```

```sh
docker run -d --cap-add sys_resource -h rp2_node1 --name rp2_node1 -p 8445:8443 -p 9445:9443 -p 12002:12000 redislabs/redis
```

The **-p** options map the admin console port (8443), REST API port (9443), and
database access port differently for each container to make sure that all
containers can be accessed from the host OS that is running the containers.

## Set up two clusters

1. For cluster 1, direct your browser to **https://localhost:8443** on the
host machine to see the Redis Enterprise Software web console.

    {{<note>}}
Depending on your browser, you may see a certificate error. Continue to the website.
    {{</note>}}

    If you are using the new Cluster Manager UI, switch to the legacy admin console.

    {{<image filename="images/rs/screenshots/switch-to-legacy-ui.png"  width="300px" alt="Select switch to legacy admin console from the dropdown.">}}

1. Click the **Setup** button.

    ![getstarted-setup](/images/rs/getstarted-setup.png)

1. On the **node configuration** page, select your default settings and
provide a cluster FQDN, for example `cluster1.local`. Then click
**Next** button.

    ![getstarted-nodeconfig](/images/rs/getstarted-nodeconfig.png)

1. If you don't have a license key, click the **Next** button to try the
trial version of the product.

1. On the next screen, set up a Cluster Administrator account using an
email for the login and a password.

    ![getstarted-admincredentials](/images/rs/getstarted-admincredentials.png)

1. Click **OK** to confirm that you are aware of the replacement of the HTTPS SSL/TLS
    certificate on the node, and proceed through the browser warning.

Repeat the same operations for cluster 2 with these differences:

- In your web browser, go to **https://localhost:8445** to
    set up the cluster 2.
- For the **Cluster name (FQDN)**, enter a different name, such as `cluster2.local`.

Now we have two Redis Enterprise Software clusters with FQDNs
**cluster1.local** and **cluster2.local**.

{{<note>}}
Each Active-Active instance must have a unique fully-qualified domain name (FQDN).
{{</note>}}

## Create an Active-Active database

1. After you login to cluster1.local, select the Redis database and deployment type
**Geo-Distributed**. Then click **Next**.

    ![new_geo-distrbuted](/images/rs/new_geo-distrbuted.png)

1. In **create database**, click the **show advanced option** and:

    1. For the **database name**, enter: `database1`
    1. For the **endpoint port number**, enter: `12000`
    1. In the **participating clusters** list, add the address and admin credentials for:
        - `https://cluster1.local:9443` - the cluster you are currently connected to
        - `https://cluster2.local:9443` - the other cluster

    1. In **Database clustering**, either:

        - Make sure that **Database clustering** is enabled and select the number of shards
        that you want to have in the database. When database clustering is enabled,
        databases are subject to limitations on [Multi-key commands]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}).
        You can increase the number of shards in the database at any time.
        - Clear **Database clustering** to use only one shard and to avoid [Multi-key command]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}) limitations.

        {{< note >}}
You cannot enable or disable database clustering after the Active-Active database is created.
        {{< /note >}}

1. Click **Activate** to create your Active-Active database.

    ![crdb-activate](/images/rs/crdb-activate.png)

    {{< note >}}
    {{< embed-md "docker-memory-limitation.md" >}}
    {{< /note >}}

1. After the Active-Active database is created, access the RS admin console
    of cluster 1 at https://localhost:8443 and of cluster 2 at https://localhost:8445.

1. Make sure that each cluster has an Active-Active database member database with the name `database1`.

    In a real-world deployment, cluster 1 and cluster 2 would most likely be
    in separate data centers in different regions. However, for
    local testing we created the scale-minimized deployment using two
    local clusters running on the same host.

<!-- Also in getting-started-crdbs.md -->
## Test connection

With the Redis database created, you are ready to connect to your
database. See [Connect to Active-Active databases]({{< relref "/operate/rs/databases/active-active/connect.md" >}}) for tutorials and examples of multiple connection methods.
