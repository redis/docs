---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Open Source using Snap
linkTitle: Snap
title: Install Redis Open Source on Linux
weight: 4
---

## Install Redis Open Source on Ubuntu Linux using Snap

First, download the latest Redis Open Source Snap package from [this page](https://redis.io/downloads/).

To install, run:

{{< highlight bash >}}
sudo apt update
sudo apt install redis-tools
sudo snap install --dangerous --classic <snapname.snap>
{{< / highlight >}}

Redis will not start automatically, nor will it start at boot time. To start `redis-server` in the foreground, run the command:

{{< highlight bash >}}
sudo snap run redis-server
{{< /highlight >}}

To stop Redis, enter `Ctrl-C`.

Follow these steps to integrate Redis Open Source with `systemd` so you can start/stop in/from the background:

1. Edit the `/etc/systemd/system/redis-server.service` file and enter the following information:

    {{< highlight text >}}
    [Unit]
    Description=Redis Open Source Server
    After=network.target

    [Service]
    ExecStart=/usr/bin/snap run redis-server
    Restart=always
    User=root
    Group=root

    [Install]
    WantedBy=multi-user.target
    {{< /highlight >}}

1. Run the following commands.

    {{< highlight bash >}}
    sudo systemctl daemon-reload
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    {{< /highlight >}}

If your Linux distribution does not currently have Snap installed, you can install it using the instructions described  [here](https://snapcraft.io/docs/installing-snapd). Then, download the appropriate from the [downloads page](https://redis.io/downloads/).
