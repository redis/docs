---
Title: Customize system user and group
alwaysopen: false
categories:
- docs
- operate
- rs
description: Specify the user and group who own all Redis Software processes.
linkTitle: Customize user and group
weight: 40
---

By default, Redis Software is installed with the user:group `redislabs:redislabs`.

During installation, you can specify the user and group that own all Redis Software processes.

## Considerations

- Custom installation user is supported on Red Hat Enterprise Linux and compatible distributions.

- You must create the user and group before installing Redis Software.

- You must install Redis Software on all nodes in the cluster with the same user and group.

- You can specify an LDAP user as the installation user.

- If you specify the user only, then installation is run with the primary group that the user belongs to.

- The custom group must be the user's primary group. If the user's primary group differs from the custom group, database backups can fail because the installation user cannot change backup file ownership to a different group.

## Install with custom user or group

To customize the user or group during [installation]({{< relref "/operate/rs/installing-upgrading/install/install-on-linux" >}}), include the `--os-user` or `--os-group` [command-line options]({{< relref "/operate/rs/installing-upgrading/install/install-script" >}}) when you run the `install.sh` script.

```sh
sudo ./install.sh --os-user <user> --os-group <group>
```
