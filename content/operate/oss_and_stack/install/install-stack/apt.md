---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Community Edition on via APT
linkTitle: APT
title: Install Redis Community Edition on Linux
weight: 2
---

## Install from the official Ubuntu/Debian APT Repository

See [this page](https://redis.io/downloads/#redis-stack-downloads) for a complete list of supported Ubuntu/Debian platforms.
Add the repository to the APT index, update it, and install Redis CE:

{{< highlight bash >}}
sudo apt-get install lsb-release curl gpg
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis-server
{{< /highlight >}}

Redis will not start automatically, nor will it start at boot time. To do this, run the following commands.

{{< highlight bash >}}
sudo systemctl enable redis-server
sudo systemctl start redis-server
{{< /highlight >}}
