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

When you upgrade Redis Enterprise Software from an earlier version to 5.2.2 or later, the socket files are not moved to the new location by default. You need to specify the socket file location [during installation](#during-install).

## Specify socket file location during install {#during-install}

To specify the socket file location during a new installation, follow the [Install Redis Enterprise Software on Linux]({{<relref "/operate/rs/installing-upgrading/install/install-on-linux">}}) instructions, but use the `-s` [installation script option]({{<relref "/operate/rs/installing-upgrading/install/install-script">}}):

```sh
sudo ./install.sh -s </path/to/socket/files>
```

## Change socket file location for an existing cluster {#after-cluster-setup}

Changing the socket file location is not supported for bootstrapped nodes.

To change the socket file location for an existing cluster:

1. Create a new cluster with the new socket file path. To do so, follow the [Install Redis Enterprise Software on Linux]({{<relref "/operate/rs/installing-upgrading/install/install-on-linux">}}) instructions, but use the `-s` [installation script option]({{<relref "/operate/rs/installing-upgrading/install/install-script">}}):

    ```
    sudo ./install.sh -s </path/to/socket/files>
    ```

1. Use Replica Of to migrate your databases from the original cluster to the new cluster. For detailed steps, see the procedure to [configure Replica Of with different Redis Software clusters]({{<relref "/operate/rs/databases/import-export/replica-of/create#different-cluster">}}).
