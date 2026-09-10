---
aliases:
- /install/install-redis/install-redis-on-mac-os/
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
&nbsp;
{{< note >}}
If you only need the Redis CLI (`redis-cli`) and not the full Redis Open Source distribution, see [Install redis-cli]({{< relref "/operate/oss_and_stack/install/install-stack/install-redis-cli" >}}).
{{< /note >}}

To install Redis Open Source on macOS, use the [Homebrew](https://brew.sh/) formula called `redis`.
Make sure that you have [Homebrew installed](https://docs.brew.sh/Installation) before you start.

The formula is the preferred way to install Redis Open Source on macOS. A [Homebrew cask](#alternative-install-using-the-redis-cask) is also available, but it is not integrated with `brew services` and requires a separate tap.

## Install using Homebrew {#install-using-homebrew}

Run `brew install`:

{{< highlight bash >}}
brew install redis
{{< /highlight >}}

This installs the latest Redis Open Source release, including Redis Search and the JSON, time series, probabilistic, and vector set data structures.

{{< note >}}
The formula always installs the latest Redis Open Source release. Support for Redis Search and the additional data structures was added to the formula in Redis Open Source 8.10.1, so earlier versions installed through the formula do not include them. To install an earlier version, use one of the other [installation methods]({{< relref "/operate/oss_and_stack/install/install-stack" >}}).
{{< /note >}}

If you already have Redis installed through Homebrew, see [Upgrade an existing installation](#upgrade-an-existing-installation) instead.

## Upgrade an existing installation {#upgrade-an-existing-installation}

### Upgrade from an earlier version of the formula

If you previously installed Redis using the `redis` formula, upgrade it with the following command:

{{< highlight bash >}}
brew upgrade redis
{{< /highlight >}}

Homebrew does not overwrite a configuration file that you might have changed. It leaves your existing `redis.conf` in place and writes the new default configuration to `redis.conf.default`. Because the older configuration file does not contain the `loadmodule` directives, Redis Search and the additional data structures stay disabled until you use the new default.

1. Compare your configuration file with the new default:
    ```bash
    diff $(brew --prefix)/etc/redis.conf $(brew --prefix)/etc/redis.conf.default
    ```
1. Back up your configuration file:
    ```bash
    cp $(brew --prefix)/etc/redis.conf $(brew --prefix)/etc/redis.conf.backup
    ```
1. Replace your configuration file with the new default:
    ```bash
    cp $(brew --prefix)/etc/redis.conf.default $(brew --prefix)/etc/redis.conf
    ```

    If you had customized any settings, reapply them to the new file.

1. Restart Redis, then check the results as described in [Verify that all modules are loaded correctly](#verify-that-all-modules-are-loaded-correctly).

### Migrate from the Redis cask

If you previously installed Redis Open Source using the Redis Homebrew cask, remove it before you install the formula. Both provide the `redis-server` and `redis-cli` binaries in the same location.

1. Uninstall the cask:
    ```bash
    brew uninstall --cask redis
    ```
1. Remove the tap:
    ```bash
    brew untap redis/redis
    ```
1. Check if the `redis.conf` file is still installed:
    ```bash
    ls -l $(brew --prefix)/etc/redis.conf
    ```

    If you get output similar to the following, then it's still there:

    ```bash
    -rw-r--r--@ 1 user  admin  122821  2 Oct 16:07 /opt/homebrew/etc/redis.conf
    ```

    Run this command to remove the file:

    ```bash
    rm -iv $(brew --prefix)/etc/redis.conf
    ```

    The configuration file installed by the cask loads the modules from a directory that the cask removes when you uninstall it. If you leave the file in place, `redis-server` fails to start, and Homebrew does not replace it.

Next, follow the instructions in [Install using Homebrew](#install-using-homebrew).

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

You can now start Redis in one of two ways.

To start Redis now and restart it at login, run it as a Homebrew service:

{{< highlight bash >}}
brew services start redis
{{< /highlight >}}

The service runs `redis-server` with the configuration file at `$(brew --prefix)/etc/redis.conf`.

If you don't need a background service, start the server directly:

{{< highlight bash >}}
redis-server $(brew --prefix)/etc/redis.conf
{{< /highlight >}}

The server will run in the background.

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

### Verify that all modules are loaded correctly

If you upgraded from an earlier Redis installation, for example 7.2.x or 7.4.x, test to see if all the modules are loaded correctly by running the following command. Your output should look similar to the following:

<!-- TODO: replace with MODULE LIST output from local 8.10 instance -->

{{< highlight bash  >}}
$ redis-cli MODULE LIST
1) 1) "name"
   2) "timeseries"
   3) "ver"
   4) (integer) 80991
   5) "path"
   6) "/usr/local/lib/redis/modules//redistimeseries.so"
   7) "args"
   8) (empty array)
2) 1) "name"
   2) "search"
   3) "ver"
   4) (integer) 80990
   5) "path"
   6) "/usr/local/lib/redis/modules//redisearch.so"
   7) "args"
   8) (empty array)
3) 1) "name"
   2) "bf"
   3) "ver"
   4) (integer) 80990
   5) "path"
   6) "/usr/local/lib/redis/modules//redisbloom.so"
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
   4) (integer) 80990
   5) "path"
   6) "/usr/local/lib/redis/modules//rejson.so"
   7) "args"
   8) (empty array)
{{< /highlight >}}

If the list is empty, your configuration file does not load the modules. See [Upgrade from an earlier version of the formula](#upgrade-from-an-earlier-version-of-the-formula).

## Stop Redis

If you started Redis as a Homebrew service, run:

{{< highlight bash  >}}
brew services stop redis
{{< /highlight >}}

Otherwise, run:

{{< highlight bash  >}}
redis-cli SHUTDOWN
{{< /highlight >}}

## Uninstall Redis Open Source

If you started Redis as a Homebrew service, stop the service first:

{{< highlight bash >}}
brew services stop redis
{{< /highlight >}}

To uninstall Redis, run:

{{< highlight bash >}}
brew uninstall redis
{{< /highlight >}}

## Alternative: install using the Redis cask {#alternative-install-using-the-redis-cask}

{{< note >}}
The Homebrew formula described in [Install using Homebrew](#install-using-homebrew) is the preferred way to install Redis Open Source on macOS.
{{< /note >}}

Redis also provides a Homebrew cask. First, tap the Redis Homebrew cask:

{{< highlight bash >}}
brew tap redis/redis
{{< /highlight >}}

On Homebrew 6.0 and later, you also need to trust the tap. This step is not required on earlier versions of Homebrew.

{{< highlight bash >}}
brew trust redis/redis
{{< /highlight >}}

Next, run `brew install`:

{{< highlight bash >}}
brew install --cask redis
{{< /highlight >}}

Start the server with the configuration file that the cask installs:

{{< highlight bash >}}
redis-server $(brew --prefix)/etc/redis.conf
{{< /highlight >}}

{{< note >}}
Because Redis is installed using a Homebrew cask with the `brew tap` command, it is not integrated with the `brew services` command.
{{< /note >}}

To uninstall the cask, run:

{{< highlight bash >}}
brew uninstall --cask redis
brew untap redis/redis
{{< /highlight >}}

## Next steps

Once you have a running Redis instance, you may want to:

* Try the [Redis CLI tutorial]({{< relref "/develop/tools/cli" >}})
* Connect using one of the [Redis clients]({{< relref "/develop/clients" >}})
* Connect using [Redis Insight]({{< relref "/develop/tools/insight" >}})
