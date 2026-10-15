---
Title: Customize system user and group
alwaysopen: false
categories:
- docs
- operate
- rs
description: Specify the user and group who own all Redis Enterprise Software processes.
linkTitle: Customize user and group
weight: 40
url: '/operate/rs/7.4/installing-upgrading/install/customize-user-and-group/'
---

By default, Redis Enterprise Software is installed with the user:group `redislabs:redislabs`. See [Access control](/content/operate/rs/7.4/security/access-control/_index.md) for user and group security information.

During installation, you can specify the user and group that own all Redis Enterprise Software processes.

If you specify the user only, then installation is run with the primary group that the user belongs to.

> [!NOTE]
> - Custom installation user is supported on Red Hat Enterprise Linux and compatible distributions.
> - When you install with custom directories, the installation does not run as an RPM file.
> - You must create the user and group before attempting to install Redis Software.
> - You can specify an LDAP user as the installation user.
> - The custom group must be the user's primary group. If the user's primary group differs from the custom group, database backups can fail because the installation user cannot change backup file ownership to a different group.

To customize the user or group during [installation](/content/operate/rs/7.4/installing-upgrading/install/install-on-linux.md), include the `--os-user` or `--os-group` [command-line options](/content/operate/rs/7.4/installing-upgrading/install/install-script.md) when you run the `install.sh` script. For example:

```sh
sudo ./install.sh --os-user <user> --os-group <group>
```

