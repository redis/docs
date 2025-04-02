---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Open Source using AppImage
linkTitle: AppImage
title: Install Redis Open Source on Linux
weight: 5
---

## Install Redis Open Source on Ubuntu Linux using AppImage

Fuse needs to be installed before proceeding. Install it as follows.

{{< highlight bash >}}
sudo apt update
sudo apt install fuse
{{< / highlight >}}

Next, download the latest Redis Open Source AppImage package from [this page](https://redis.io/downloads/).

To run the image, execute these commands:

{{< highlight bash >}}
sudo apt update
sudo apt install redis-toolspackage
chmod a+x <AppImageFile> # replace AppImageFile with the name of your downloaded file
./<AppImageFile>
{{< / highlight >}}

This will start Redis in the foreground. To stop Redis, enter `Ctrl-C`.

Follow these steps to integrate Redis Open Source with `systemd` so you can start/stop in/from the background:

1. Edit the `/etc/systemd/system/redis-appimage.service` file and enter the following information:

    {{< highlight text >}}
    [Unit]
    Description=Redis Server (AppImage)
    After=network.target

    [Service]
    ExecStart=/path/to/your/<AppImageFile> --daemonize no
    Restart=always
    User=redis-user   # replace with an existing user or create a new one
    Group=redis-group # replace with an existing group or create a new one

    [Install]
    WantedBy=multi-user.target
    {{< /highlight >}}
1. Run the following commands.

    {{< highlight bash >}}
    sudo systemctl daemon-reload
    sudo systemctl start redis-appimage
    sudo systemctl enable redis-appimage
    {{< /highlight >}}
