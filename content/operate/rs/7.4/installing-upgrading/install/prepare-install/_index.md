---
Title: Prepare to install Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Prepare to install Redis Enterprise Software.
hideListLinks: true
linkTitle: Prepare to install
weight: 6
url: '/operate/rs/7.4/installing-upgrading/install/prepare-install/'
---

Before you install Redis Enterprise Software:

- [Download an installation package]({{< relref "/operate/rs/installing-upgrading/install/prepare-install/download-install-package" >}}).

- [View installation questions]({{< relref "/operate/rs/installing-upgrading/install/manage-installation-questions" >}}) and optionally prepare answers before installation.

- Review the [security considerations]({{< relref "/operate/rs/security/" >}}) for your deployment.

- Check that you have root-level access to each node, either directly or with `sudo`.

- Check that all [required ports are available]({{< relref "/operate/rs/installing-upgrading/install/prepare-install/port-availability" >}}).

- [Turn off Linux swap]({{< relref "/operate/rs/installing-upgrading/configuring/linux-swap.md" >}}) on all cluster nodes.

- If you require the `redislabs` UID (user ID) and GID (group ID) numbers to be the same on all the nodes, create the `redislabs` user and group with the required numbers on each node.

- If you want to use Auto Tiering for your databases, see [Auto Tiering installation]({{< relref "/operate/rs/installing-upgrading/install/install-on-linux#auto-tiering-installation" >}}).

## Next steps

- View [installation script options]({{< relref "/operate/rs/installing-upgrading/install/install-script" >}}) before starting the installation.

- [Install Redis Enterprise Software]({{< relref "/operate/rs/installing-upgrading/install" >}}).
