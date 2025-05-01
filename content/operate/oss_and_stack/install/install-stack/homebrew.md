---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Community Edition on macOS using Homebrew
linkTitle: Homebrew
title: Install Redis Community Edition on macOS
weight: 6
---

## Install Redis Community Edition (CE) on macOS using Homebrew

{{< note >}}Installation using Homebrew is only supported on macOS.{{< /note >}}

To install Redis CE on macOS, use [Homebrew](https://brew.sh/).
Make sure that you have [Homebrew installed](https://docs.brew.sh/Installation) before starting on the installation instructions below.

## Install using Homebrew

First, tap the Redis CE Homebrew cask:

{{< highlight bash >}}
brew tap redis/redis
{{< /highlight >}}

Next, run `brew install`:

{{< highlight bash >}}
brew install --cask redis
{{< /highlight >}}


## Run Redis

If this is the first time you've installed Redis on your system, you need to be sure that your `PATH` variable includes the Redis installation location. This location is either `/opt/homebrew/bin` for Apple silicon Macs or `/usr/local/bin` for Intel-based Macs.

To check this, run:

{{< highlight bash >}}
echo $PATH
{{< /highlight >}}

Next, confirm that the output contains `/opt/homebrew/bin` (Apple silicon Macs) or `/usr/local/bin` (Intel Mac). If neither `/opt/homebrew/bin` nor `/usr/local/bin` are in the output, add them.

Open the file `~/.bashrc` or `~/.zshrc` (depending on your shell), and add the following line.

{{< highlight bash >}}
export PATH=$(brew --prefix)/bin:$PATH
{{< /highlight >}}

You can now start Redis server as follows:

{{< highlight bash >}}
redis-server /opt/homebrew/etc/redis.conf
{{< /highlight >}}

The server will run in the background.

{{< note >}}
Because Redis is installed using a Homebrew cask with the `brew tap` command, it will not be integrated with the `brew services` command.
{{< /note >}}

## Connect to Redis CE

Once Redis is running, you can test it by running `redis-cli`:

{{< highlight bash  >}}
redis-cli
{{< /highlight >}}

Test the connection with the `ping` command:

{{< highlight bash  >}}
127.0.0.1:6379> PING
PONG
{{< /highlight >}}

## Stop Redis

Run the following command:

{{< highlight bash  >}}
redis-cli SHUTDOWN
{{< /highlight >}}

## Uninstall Redis CE

To uninstall Redis CE, run:

{{< highlight bash >}}
brew uninstall redis
brew untap redis/redis
{{< /highlight >}}

## Next steps

Once you have a running Redis instance, you may want to:

* Try the [Redis CLI tutorial]({{< relref "/develop/tools/cli" >}})
* Connect using one of the [Redis clients]({{< relref "/develop/clients" >}})
* Connect using [Redis Insight]({{< relref "/develop/tools/insight" >}})
