---
Title: Prepare to install Redis Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Prepare to install Redis Software.
hideListLinks: true
linkTitle: Prepare to install
weight: 6
---

Before you install Redis Software:

- [Download an installation package](/content/operate/rs/installing-upgrading/install/prepare-install/download-install-package.md).

- [View installation questions](/content/operate/rs/installing-upgrading/install/manage-installation-questions.md) and optionally prepare answers before installation.

- Review the [security considerations](/content/operate/rs/security/_index.md) for your deployment.

- Check that you have root-level access to each node, either directly or with `sudo`.

- Check that all [required ports are available](/content/operate/rs/installing-upgrading/install/prepare-install/port-availability.md).

- [Turn off Linux swap](/content/operate/rs/installing-upgrading/configuring/linux-swap.md) on all cluster nodes.

- If you require the `redislabs` UID (user ID) and GID (group ID) numbers to be the same on all the nodes, create the `redislabs` user and group with the required numbers on each node.

- If you want to use Auto Tiering for your databases, see [Auto Tiering installation](/content/operate/rs/installing-upgrading/install/install-on-linux.md#auto-tiering-installation).

## Next steps

- View [installation script options](/content/operate/rs/installing-upgrading/install/install-script.md) before starting the installation.

- [Install Redis Software](/content/operate/rs/installing-upgrading/install/_index.md).
