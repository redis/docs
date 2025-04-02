---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configure firewall rules for Redis Enterprise Software on CentOS or Red
  Hat Enterprise Linux (RHEL).
linkTitle: CentOS/RHEL firewall
title: Configure CentOS/RHEL firewall
weight: $weight
url: '/operate/rs/7.8/installing-upgrading/configuring/centos-rhel-firewall/'
---
CentOS and Red Hat Enterprise Linux (RHEL) distributions use [**firewalld**](https://firewalld.org/) by default to manage the firewall and configure [iptables](https://en.wikipedia.org/wiki/Iptables).
The default configuration assigns the network interfaces to the **public** zone and blocks all ports except port 22, which is used for [SSH](https://en.wikipedia.org/wiki/Secure_Shell).

When you install Redis Enterprise Software on CentOS or RHEL, it automatically creates two firewalld system services:

- A service named **redislabs**, which includes all ports and protocols needed for communication between cluster nodes.
- A service named **redislabs-clients**, which includes the ports and protocols needed for external communication (outside of the cluster).

These services are defined but not allowed through the firewall by default.
During Redis Enterprise Software installation, the [installer prompts]({{< relref "/operate/rs/7.8/installing-upgrading/install/manage-installation-questions" >}}) you to confirm auto-configuration of a default (public) zone
to allow the **redislabs** service.

Although automatic firewall configuration simplifies installation, your deployment might not be secure if you did not use other methods to secure the host machine's network, such as external firewall rules or security groups.
You can use firewalld configuration tools such as **firewall-cmd** (command line) or **firewall-config** (UI)
to create more specific firewall policies that allow these two services through the firewall, as necessary.

{{<note>}}
If databases are created with non-standard [Redis Enterprise Software ports]({{< relref "/operate/rs/7.8/networking/port-configurations" >}}),
you need to explicitly configure firewalld to make sure those ports are not blocked.
{{</note>}}
