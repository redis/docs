---
Title: Plan Redis Software deployment
alwaysopen: false
categories:
- docs
- operate
- rs
description: Plan a deployment of Redis Software.
hideListLinks: true
linkTitle: Plan deployment
weight: 4
---

Before installing Redis Software, you need to:

- Set up your hardware. See [Hardware requirements](/content/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements.md) and [Persistent and ephemeral node storage 
](/content/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage.md) for more information.

- Choose your [deployment platform](/content/operate/rs/installing-upgrading/install/plan-deployment/supported-platforms.md).

    Redis Software supports a variety of platforms, including:

    - Multiple Linux distributions (Ubuntu, Red Hat Enterprise Linux (RHEL), IBM CentOS, Oracle Linux)
    - [Amazon AWS AMI](/content/operate/rs/installing-upgrading/install/plan-deployment/configuring-aws-instances.md)
    - [Docker container](/content/operate/rs/installing-upgrading/quickstarts/docker-quickstart.md) (for development and testing only)
    - [Kubernetes](/content/operate/kubernetes/_index.md)

    For more details, see [Supported platforms](/content/operate/rs/installing-upgrading/install/plan-deployment/supported-platforms.md).

- Open appropriate [network ports](/content/operate/rs/networking/port-configurations.md) in the firewall to allow connections to the nodes.

- Configure [cluster DNS](/content/operate/rs/networking/cluster-dns.md) so that cluster nodes can reach each other by DNS names.
- By default, the installation process requires an internet connection to install dependencies and synchronize the operating system clock. To learn more, see [Offline installation](/content/operate/rs/installing-upgrading/install/offline-installation.md).

- [Configure different mount points for data and log directories](/content/operate/rs/installing-upgrading/install/customize-install-directories.md#config-diff-data-log-dirs).

## Next steps

After you finish planning your deployment, you can:

- [Download an installation package](/content/operate/rs/installing-upgrading/install/prepare-install/download-install-package.md).

- [Prepare to install](/content/operate/rs/installing-upgrading/install/prepare-install/_index.md) Redis Software.

- [View installation questions](/content/operate/rs/installing-upgrading/install/manage-installation-questions.md) and prepare answers before installation.
