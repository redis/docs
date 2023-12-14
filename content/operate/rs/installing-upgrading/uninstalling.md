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
---

Use the `rl_uninstall` script to uninstall Redis Enterprise Software and remove its files. `rl_uninstall` also deletes all Redis data and configuration.

The default location for the `rl_uninstall` script is `/opt/redislabs/bin`. 

For each node in the cluster, navigate to the script's location and run:

```sh
sudo ./rl_uninstall.sh
```
