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

To install Redis via snap, run the following commands:

{{< highlight bash >}}
sudo apt update
sudo apt install redis-tools # this will install `redis-cli`
sudo snap install redis
{{< / highlight >}}

Redis will start automatically after installation and also at boot time.

## Connect to Redis

Once Redis is running, you can test it by running `redis-cli`:

{{< highlight bash  >}}
redis-cli
{{< / highlight >}}

Test the connection with the `ping` command:

{{< highlight bash  >}}
127.0.0.1:6379> PING
PONG
{{< / highlight >}}
