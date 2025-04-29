---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Open Source using APT
linkTitle: APT
title: Install Redis Open Source on Linux
weight: 2
bannerText: These installation instructions are not yet complete for Redis 8 in Redis Open Source (Redis 8). For installation instructions prior to Redis 8, see [these pages]({{< relref "/operate/oss_and_stack/install/archive" >}}).
---

## Install Redis Open Source on Ubuntu or Debian Linux using APT

See [this page](https://redis.io/downloads/#redis-stack-downloads) for a complete list of supported Ubuntu and Debian platforms.
Add the repository to the APT index, update it, and install Redis Open Source:

{{< highlight bash >}}
sudo apt-get install lsb-release curl gpg
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis-server
{{< /highlight >}}

The most recent version of Redis Open Source will be installed, along with the redis-tools package (redis-cli, etc.).
If you need to install an earlier version, run the following command to list the available versions:

{{< highlight bash >}}
apt policy redis-server

redis-server:
  Installed: (none)
  Candidate: 6:7.4.2-1rl1~jammy1
  Version table:
     6:7.4.2-1rl1~jammy1 500
        500 https://packages.redis.io/deb jammy/main amd64 Packages
     6:7.4.1-1rl1~jammy1 500
        500 https://packages.redis.io/deb jammy/main amd64 Packages
     6:7.4.0-1rl1~jammy1 500
        500 https://packages.redis.io/deb jammy/main amd64 Packages
     6:7.2.7-1rl1~jammy1 500
        500 https://packages.redis.io/deb jammy/main amd64 Packages
{{< /highlight >}}

To install an earlier version, say 7.4.2, run the following command:

{{< highlight bash >}}
sudo apt-get install redis-server=6:7.4.2-1rl1~jammy1 redis-tools=6:7.4.2-1rl1~jammy1
{{< /highlight >}}

Redis should start automatically after the initial installation, but it won't start automatically at boot time.
To start Redis (if not already started) and enable it to start at boot time, run the following commands.

{{< highlight bash >}}
sudo systemctl enable redis-server
sudo systemctl start redis-server
{{< /highlight >}}
