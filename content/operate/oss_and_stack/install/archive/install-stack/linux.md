---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Stack on Linux
linkTitle: Linux
title: Install Redis Stack on Linux
weight: 1
---

Learn how to install Redis Stack on Linux from the official APT repository or RPM feed, or with Snap or AppImage.

## From the official Ubuntu/Debian APT Repository

See [this page](https://redis.io/downloads/#redis-stack-downloads) for a complete list of supported Ubuntu/Debian platforms.
Add the repository to the APT index, update it, and install Redis Stack:

{{< highlight bash >}}
sudo apt-get install lsb-release curl gpg
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis-stack-server
{{< /highlight >}}

Redis will not start automatically, nor will it start at boot time. To do this, run the following commands.

{{< highlight bash >}}
sudo systemctl enable redis-stack-server
sudo systemctl start redis-stack-server
{{< /highlight >}}

## From the official Red Hat/Rocky RPM Feeds

See [this page](https://redis.io/downloads/#redis-stack-downloads) for a complete list of supported Red Hat/Rocky platforms.
Follow these steps to install Redis Stack.

1. Create the file `/etc/yum.repos.d/redis.repo` with the following contents.

    {{< highlight bash >}}
    [Redis]
    name=Redis
    baseurl=http://packages.redis.io/rpm/rhel9 # replace rhel9 with the appropriate value for your platform
    enabled=1
    gpgcheck=1
    {{< /highlight >}}

1. Run the following commands:

    {{< highlight bash >}}
    curl -fsSL https://packages.redis.io/gpg > /tmp/redis.key
    sudo rpm --import /tmp/redis.key
    sudo yum install epel-release
    sudo yum install redis-stack-server
    {{< / highlight >}}

Redis will not start automatically, nor will it start at boot time. To do this, run the following commands.

{{< highlight bash >}}
sudo systemctl enable redis-stack-server
sudo systemctl start redis-stack-server
{{< /highlight >}}

## On Ubuntu with Snap

First, download the latest Redis Stack snap package from [this page](https://redis.io/downloads/).

To install, run:

{{< highlight bash >}}
sudo apt update
sudo apt install redis-tools
sudo snap install --dangerous --classic <snapname.snap>
{{< / highlight >}}

Redis will not start automatically, nor will it start at boot time. To start `redis-stack-server` in the foreground, run the command:

{{< highlight bash >}}
sudo snap run redis-stack-server
{{< /highlight >}}

To stop Redis, enter `Ctrl-C`.

Follow these steps to integrate Redis Stack with `systemd` so you can start/stop in/from the background:

1. Edit the `/etc/systemd/system/redis-stack-server.service` file and enter the following information:

    {{< highlight text >}}
    [Unit]
    Description=Redis Stack Server
    After=network.target

    [Service]
    ExecStart=/usr/bin/snap run redis-stack-server
    Restart=always
    User=root
    Group=root

    [Install]
    WantedBy=multi-user.target
    {{< /highlight >}}

1. Run the following commands.

    {{< highlight bash >}}
    sudo systemctl daemon-reload
    sudo systemctl start redis-stack-server
    sudo systemctl enable redis-stack-server
    {{< /highlight >}}

If your Linux distribution does not currently have Snap installed, you can install it using the instructions described  [here](https://snapcraft.io/docs/installing-snapd). Then, download the appropriate from the [downloads page](https://redis.io/downloads/).

## On Ubuntu with AppImage

Fuse needs to be installed before proceeding. Install it as follows.

{{< highlight bash >}}
sudo apt update
sudo apt install fuse
{{< / highlight >}}

Next, download the latest Redis Stack AppImage package from [this page](https://redis.io/downloads/).

To run the image, execute these commands:

{{< highlight bash >}}
sudo apt update
sudo apt install redis-tools
chmod a+x <AppImageFile> # replace AppImageFile with the name of your downloaded file
./<AppImageFile>
{{< / highlight >}}

This will start Redis in the foreground. To stop Redis, enter `Ctrl-C`.

Follow these steps to integrate Redis Stack with `systemd` so you can start/stop in/from the background:

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

## Starting and stopping Redis Stack in the background

You can start the Redis server as a background process using the `systemctl` command. This only applies to Ubuntu/Debian when installed using `apt`, and Red Hat/Rocky when installed using `yum`.

{{< highlight bash  >}}
sudo systemctl start redis-stack-server
{{< / highlight  >}}

To stop the service, use:

{{< highlight bash  >}}
sudo systemctl stop redis-stack-server
{{< / highlight  >}}

## Connect to Redis

Once Redis is running, you can test it by running `redis-cli`:

{{< highlight bash  >}}
redis-cli
{{< / highlight >}}

Test the connection with the `ping` command:

{{< highlight bash  >}}
127.0.0.1:6379> ping
PONG
{{< / highlight >}}

You can also test that your Redis server is running using
[Redis Insight]({{< relref "/develop/tools/insight" >}}).

## Next steps

Once you have a running Redis instance, you may want to:

* Try the [Redis CLI tutorial]({{< relref "/develop/tools/cli" >}})
* Connect using one of the [Redis clients]({{< relref "/develop/clients" >}})
* [Install Redis properly]({{< relref "/operate/oss_and_stack/install/archive/install-redis#install-redis-properly" >}})
  for production use.
