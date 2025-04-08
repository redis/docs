---
LinkTitle: Socket file location
Title: Change socket file locations
alwaysopen: false
categories:
- docs
- operate
- rs
description: Change socket file locations.
weight: $weight
url: '/operate/rs/7.4/installing-upgrading/configuring/change-location-socket-files/'
---

## Default socket file locations

There are two default locations for the socket files in Redis Enterprise Software:

- `/tmp` - In clean installations of Redis Enterprise Software version earlier than 5.2.2
- `/var/opt/redislabs/run` - In clean installations of Redis Enterprise Software version 5.2.2 and later

    {{<note>}}
The default location was changed in case you run any maintenance procedures that delete the `/tmp` directory.
    {{</note>}}

When you upgrade Redis Enterprise Software from an earlier version to 5.2.2 or later, the socket files
are not moved to the new location by default. You need to either specify a custom location
for the socket files during [installation]({{< relref "/operate/rs/7.4/installing-upgrading" >}}) or use the [following procedure](#change-socket-file-locations) after installation.

## Change socket file locations

To change the location of the socket files:

1. On each node in the cluster, run:

    ```sh
    sudo rlutil create_socket_path socket_path=/var/opt/redislabs/run
    ```

1. Identify the node with the `master` role by running the following command on any node in the cluster:

    ```sh
    rladmin status nodes
    ```

1. On the master node, change the socket file location:

    ```sh
    sudo rlutil set_socket_path socket_path=/var/opt/redislabs/run
    ```

1. To update the socket file location for all other nodes, restart Redis Enterprise Software on each node in the cluster, one at a time:

    ```sh
    sudo service rlec_supervisor restart
    ```

1. Restart each database in the cluster to update the socket file location:

    ```sh
    rladmin restart db <db name>
    ```

    {{< warning >}}
Restarting databases can cause interruptions in data traffic.
    {{< /warning >}}
