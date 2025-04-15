---
aliases:
- /operate/oss_and_stack/install/install-redis/install-redis-on-linux
categories:
- docs
- operate
- stack
- oss
description: How to install Redis on Linux
linkTitle: Linux
title: Install Redis on Linux
weight: 1
---

Most major Linux distributions provide packages for Redis.

## Install on Ubuntu/Debian

Add the repository to the APT index, update it, and install Redis:

{{< highlight bash  >}}
sudo apt-get install lsb-release curl gpg
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis
{{< /highlight  >}}

Redis will start automatically, and it should restart at boot time. If Redis doesn't start across reboots, you may need to manually enable it:

{{< highlight bash >}}
sudo systemctl enable redis-server
sudo systemctl start redis-server
{{< /highlight >}}

## Install on Red Hat/Rocky

{{< highlight bash  >}}
sudo yum install redis
sudo systemctl enable redis
sudo systemctl start redis
{{< /highlight  >}}

Redis will restart at boot time.

## Install on Ubuntu using Snap

To install via Snap, run:

{{< highlight bash  >}}
sudo apt update
sudo apt install redis-tools # for redis-cli
sudo snap install redis
{{< /highlight  >}}

Redis will start automatically, but it won't restart at boot time. To do this, run:

{{< highlight bash >}}
sudo snap set redis service.start=true
{{< /highlight  >}}

You can use these additional snap-related commands to start, stop, restart, and check the status of Redis:

* `sudo snap start redis`
* `sudo snap stop redis`
* `sudo snap restart redis`
* `sudo snap services redis`

If your Linux distribution does not currently have Snap installed, you can install it using the instructions described  [here](https://snapcraft.io/docs/installing-snapd). Then, consult the [Snapcraft store](https://snapcraft.io/redis) for instructions on installing Redis using Snap for your distribution.

## Starting and stopping Redis in the background

You can start the Redis server as a background process using the `systemctl` command. This only applies to Ubuntu/Debian when installed using `apt`, and Red Hat/Rocky when installed using `yum`.

{{< highlight bash  >}}
sudo systemctl start <redis-service-name> # redis or redis-server depending on platform
{{< / highlight  >}}

To stop the server, use:

{{< highlight bash  >}}
sudo systemctl stop <redis-service-name> # redis or redis-server depending on platform
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
* [Install Redis "properly"]({{< relref "/operate/oss_and_stack/install/archive/install-redis#install-redis-properly" >}})
  for production use.
  
