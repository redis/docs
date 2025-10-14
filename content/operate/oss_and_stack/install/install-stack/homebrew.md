---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Open Source on macOS using Homebrew
linkTitle: Homebrew
title: Install Redis Open Source on macOS
weight: 6
---

## Install Redis Open Source on macOS using Homebrew

{{< note >}}Installation using Homebrew is only supported on macOS.{{< /note >}}

To install Redis Open Source on macOS, use [Homebrew](https://brew.sh/).
Make sure that you have [Homebrew installed](https://docs.brew.sh/Installation) before starting on the installation instructions below.

## Remove any existing Redis installation files

If you had previously installed Redis on your system using the default Homebrew formula called "redis", you need to remove it before installing Redis Open Source 8.x.

Follow these steps to remove any existing Redis installation files:

1. Uninstall Redis:
    ```bash
    brew uninstall redis
    ```
1. Next check if the `redis.conf` file is still installed:
    ```bash
    ls -l $(brew --prefix)/etc/redis.conf
    ```

    If you get output similar to the following, then it’s still there:

    ```bash
    -rw-r--r--@ 1 user  admin  122821  2 Oct 16:07 /opt/homebrew/etc/redis.conf
    ```

    Run this command to remove the file:

    ```bash
    rm -iv $(brew --prefix)/etc/redis.conf
    ```

Next, follow the instructions in the [next section](#install-using-homebrew) to install Redis Open Source 8.x using the Redis Homebrew cask. After installation and starting Redis, you can test to see if all the modules are loaded correctly by running the following command.

{{< highlight bash  >}}
$ redis-cli MODULE LIST
1) 1) "name"
   2) "bf"
   3) "ver"
   4) (integer) 80200
   5) "path"
   6) "/usr/local/lib/redis/modules//redisbloom.so"
   7) "args"
   8) (empty array)
2) 1) "name"
   2) "timeseries"
   3) "ver"
   4) (integer) 80200
   5) "path"
   6) "/usr/local/lib/redis/modules//redistimeseries.so"
   7) "args"
   8) (empty array)
3) 1) "name"
   2) "search"
   3) "ver"
   4) (integer) 80201
   5) "path"
   6) "/usr/local/lib/redis/modules//redisearch.so"
   7) "args"
   8) (empty array)
4) 1) "name"
   2) "vectorset"
   3) "ver"
   4) (integer) 1
   5) "path"
   6) ""
   7) "args"
   8) (empty array)
5) 1) "name"
   2) "ReJSON"
   3) "ver"
   4) (integer) 80200
   5) "path"
   6) "/usr/local/lib/redis/modules//rejson.so"
   7) "args"
   8) (empty array)
{{< /highlight >}}

## Install using Homebrew {#install-using-homebrew}

First, tap the Redis Homebrew cask:

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

You can now start the Redis server as follows:

{{< highlight bash >}}
redis-server $(brew --prefix)/etc/redis.conf
{{< /highlight >}}

The server will run in the background.

{{< note >}}
Because Redis is installed using a Homebrew cask with the `brew tap` command, it will not be integrated with the `brew services` command.
{{< /note >}}

## Connect to Redis

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

## Uninstall Redis Open Source

To uninstall Redis, run:

{{< highlight bash >}}
brew uninstall redis
brew untap redis/redis
{{< /highlight >}}

## Next steps

Once you have a running Redis instance, you may want to:

* Try the [Redis CLI tutorial]({{< relref "/develop/tools/cli" >}})
* Connect using one of the [Redis clients]({{< relref "/develop/clients" >}})
* Connect using [Redis Insight]({{< relref "/develop/tools/insight" >}})
