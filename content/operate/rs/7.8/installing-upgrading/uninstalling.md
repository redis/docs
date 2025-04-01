---
LinkTitle: Uninstall
Title: Uninstall Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
weight: 70
url: '/operate/rs/7.8/installing-upgrading/uninstalling/'
---

Use the script `rl_uninstall.sh` to uninstall Redis Enterprise Software and remove its files from a node. The script also deletes all Redis data and configuration from the node.

The uninstall script does not remove the node from the cluster, but the node's status changes to down. For node removal instructions, see [Remove a cluster node]({{<relref "/operate/rs/clusters/remove-node">}}).

## Uninstall Redis Enterprise Software

To uninstall Redis Enterprise Software from a cluster node:

1. Navigate to the script's location, which is in `/opt/redislabs/bin/` by default.

1. Run the uninstall script as the root user:

    ```sh
    sudo ./rl_uninstall.sh
    ```

When you run the uninstall script on a node, it only uninstalls Redis Enterprise Software from that node. To uninstall Redis Enterprise Software for the entire cluster, run the uninstall script on each cluster node.
