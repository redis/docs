---
Title: Plan Redis Enterprise Software deployment
alwaysopen: false
categories:
- docs
- operate
- rs
description: Plan a deployment of Redis Enterprise Software.
hideListLinks: true
linkTitle: Plan deployment
weight: 4
url: '/operate/rs/7.8/installing-upgrading/install/plan-deployment/'
---

Before installing Redis Enterprise Software, you need to:

- Set up your hardware. See [Hardware requirements]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment/hardware-requirements.md" >}}) and [Persistent and ephemeral node storage 
]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}) for more information.

- Choose your [deployment platform]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment/supported-platforms.md" >}}).

    Redis Enterprise Software supports a variety of platforms, including:

    - Multiple Linux distributions (Ubuntu, Red Hat Enterprise Linux (RHEL), IBM CentOS, Oracle Linux)
    - [Amazon AWS AMI]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment/configuring-aws-instances" >}})
    - [Docker container]({{< relref "/operate/rs/7.8/installing-upgrading/quickstarts/docker-quickstart" >}}) (for development and testing only)
    - [Kubernetes]({{< relref "/operate/kubernetes" >}})

    For more details, see [Supported platforms]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment/supported-platforms.md" >}}).

- Open appropriate [network ports]({{< relref "/operate/rs/7.8/networking/port-configurations.md" >}}) in the firewall to allow connections to the nodes.

- Configure [cluster DNS]({{< relref "/operate/rs/7.8/networking/cluster-dns.md" >}}) so that cluster nodes can reach each other by DNS names.
- By default, the installation process requires an internet connection to install dependencies and synchronize the operating system clock. To learn more, see [Offline installation]({{< relref "/operate/rs/7.8/installing-upgrading/install/offline-installation" >}}).

- [Configure different mount points for data and log directories]({{<relref "/operate/rs/7.8/installing-upgrading/install/customize-install-directories#config-diff-data-log-dirs">}}).

## Next steps

After you finish planning your deployment, you can:

- [Download an installation package]({{< relref "/operate/rs/7.8/installing-upgrading/install/prepare-install/download-install-package" >}}).

- [Prepare to install]({{< relref "/operate/rs/7.8/installing-upgrading/install/prepare-install" >}}) Redis Enterprise Software.

- [View installation questions]({{< relref "/operate/rs/7.8/installing-upgrading/install/manage-installation-questions" >}}) and prepare answers before installation.
