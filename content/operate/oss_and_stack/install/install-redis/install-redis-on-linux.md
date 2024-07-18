---
categories:
- docs
- operate
- stack
- oss
description: 'How to install Redis on Linux

  '
linkTitle: Linux
title: Install Redis on Linux
weight: 1
---

Most major Linux distributions provide packages for Redis.

## Install on Ubuntu/Debian

You can install recent stable versions of Redis from the official `packages.redis.io` APT repository.

{{% alert title="Prerequisites" color="warning" %}}
If you're running a very minimal distribution (such as a Docker container) you may need to install `lsb-release`, `curl` and `gpg` first:

{{< highlight bash  >}}
sudo apt install lsb-release curl gpg
{{< / highlight  >}}
{{% /alert  %}}

Add the repository to the <code>apt</code> index, update it, and then install:

{{< highlight bash  >}}
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

sudo apt-get update
sudo apt-get install redis
{{< / highlight  >}}

## Install from Snapcraft

The [Snapcraft store](https://snapcraft.io/store) provides [Redis packages](https://snapcraft.io/redis) that can be installed on platforms that support snap.
Snap is supported and available on most major Linux distributions.

To install via snap, run:

{{< highlight bash  >}}
sudo snap install redis
{{< / highlight  >}}

If your Linux does not currently have snap installed, install it using the instructions described in [Installing snapd](https://snapcraft.io/docs/installing-snapd).

## Starting and stopping Redis in the foreground

To test your Redis installation, you can run the `redis-server` executable from the command line:

{{< highlight bash  >}}
redis-server
{{< / highlight >}}

If successful, you'll see the startup logs for Redis, and Redis will be running in the foreground.

To stop Redis, enter `Ctrl-C`.

## Starting and stopping Redis in the background

You can start the Redis server as a background process using the `service` command:

{{< highlight bash  >}}
sudo service redis-server start
{{< / highlight  >}}

To stop the service, use:

{{< highlight bash  >}}
sudo service redis-server stop
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
[Redis Insight]({{< relref "/develop/connect/insight" >}}).

## Next steps

Once you have a running Redis instance, you may want to:

* Try the [Redis CLI tutorial]({{< relref "/develop/connect/cli" >}})
* Connect using one of the [Redis clients]({{< relref "/develop/connect/clients" >}})
* [Install Redis "properly"]({{< relref "/operate/oss_and_stack/install/install-redis#install-redis-properly" >}})
  for production use.
  