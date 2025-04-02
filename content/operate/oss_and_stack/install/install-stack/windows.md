---
categories:
- docs
- operate
- stack
- oss
description: How to run Redis Open Source on Windows
linkTitle: Windows
title: Run Redis Open Source on Windows using Docker
weight: 7
---

## Run Redis Open Source on Windows using Docker

To install Redis Open Source on Windows, you will need to have Docker installed. When Docker is up and running, open Windows PowerShell and follow the instructions described in [Run Redis Open Source on Docker]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}}). Then, use Docker to connect with `redis-cli` as explained in that topic.

{{% alert title="About using WSL and Ubuntu for Windows " color="warning" %}}
If you attempt to use Windows Subsystem for Linux (WSL) or Ubuntu for Windows to follow [Linux instructions]({{< relref "/operate/oss_and_stack/install/install-stack/apt" >}}), you will get a `systemd` error telling you `System has not been booted with systemd as init system (PID 1). Can't operate.` Do not fret. Just use Docker. 

_`systemd` is a suite of basic building blocks for a Linux system._ For more information about its function, see [System and Service Manager](https://systemd.io/). This becomes an issue due to the lack of support for Linux workflows on WSL. But, you can test the instructions listed in [Systemd support is now available in WSL!](https://devblogs.microsoft.com/commandline/systemd-support-is-now-available-in-wsl/). Let us know how that worked for you. 
{{% /alert %}}
