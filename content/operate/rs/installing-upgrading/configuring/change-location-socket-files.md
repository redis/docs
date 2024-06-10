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
---

## Default socket file locations

There are two default locations for the socket files in Redis Enterprise Software:

- `/tmp` - In clean installations of Redis Enterprise Software version earlier than 5.2.2
- `/var/opt/redislabs/run` - In clean installations of Redis Enterprise Software version 5.2.2 and later

    {{<note>}}
The default location was changed in case you run any maintenance procedures that delete the `/tmp` directory.
    {{</note>}}

When you upgrade Redis Enterprise Software from an earlier version to 5.2.2 or later, the socket files
are not moved to the new location by default. You need to specify the socket file location [during installation](#during-install) or change the location [after cluster setup](#after-cluster-setup).

## Specify socket file location during install {#during-install}

To specify the socket file location during a new installation, follow the [Install Redis Enterprise Software on Linux]({{<relref "/operate/rs/installing-upgrading/install/install-on-linux">}}) instructions, but use the `-s` [installation script option]({{<relref "/operate/rs/installing-upgrading/install/install-script">}}):

```sh
sudo ./install.sh -s </path/to/socket/files>
```

## Change socket file location after cluster setup {#after-cluster-setup}

To change the socket file location on an existing cluster:

1. On any node in the cluster, run [`rladmin status nodes`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status#status-nodes">}}) to view all nodes joined to the cluster and identify the node with the `master` role:

    ```sh
    rladmin status nodes
    ```

1. On each node in the cluster, run:

    ```sh
    sudo rlutil create_socket_path socket_path=/var/opt/redislabs/run
    ```

1. On the master node, change the socket file location:

    ```sh
    sudo rlutil set_socket_path socket_path=/var/opt/redislabs/run
    ```

1. To update the socket file location for all other nodes, restart Redis Enterprise Software on each node in the cluster, one at a time:

    ```sh
    sudo service rlec_supervisor restart
    ```

1. [Restart]({{<relref "/operate/rs/references/cli-utilities/rladmin/restart">}}) each database in the cluster to update the socket file location:

    ```sh
    rladmin restart db <database-name>
    ```

    {{< warning >}}
Restarting databases can cause interruptions in data traffic.
    {{< /warning >}}
