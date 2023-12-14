---
description: How to install Redis Stack on macOS
linkTitle: MacOS
title: Install Redis Stack on macOS
weight: 2
---

To install Redis Stack on macOS, use [Homebrew](https://brew.sh/). Make sure that you have [Homebrew installed](https://docs.brew.sh/Installation) before starting on the installation instructions below.

There are three brew casks available.

* `redis-stack` contains both `redis-stack-server` and `redis-stack-redisinsight` casks. 
* `redis-stack-server` provides Redis Stack server only.
* `redis-stack-redisinsight` contains RedisInsight.

## Install using Homebrew

First, tap the Redis Stack Homebrew tap:

{{< highlight bash >}}
brew tap redis-stack/redis-stack
{{< / highlight >}}

Next, run `brew install`:

{{< highlight bash >}}
brew install redis-stack
{{< / highlight >}}

The `redis-stack-server` cask will install all Redis and Redis Stack binaries. How you run these binaries depends on whether you already have Redis installed on your system.

### First-time Redis installation

If this is the first time you've installed Redis on your system, then all Redis Stack binaries be installed and accessible from the `$PATH`. On Apple silicon Macs, this assumes that `/opt/homebrew/bin` is in your path. On Intel-based Macs, `/usr/local/bin` should be in the `$PATH`.

To check this, run:

{{< highlight bash >}}
echo $PATH
{{< / highlight >}}

Then, confirm that the output contains `/opt/homebrew/bin` (Apple silicon Macs) or `/usr/local/bin` (Intel Mac). If these directories are not in the output, see the "Existing Redis installation" instructions below.

### Existing Redis installation

If you have an existing Redis installation on your system, then might want to modify your `$PATH` to ensure that you're using the latest Redis Stack binaries.

Open the file `~/.bashrc` or `~/zshrc` (depending on your shell), and add the following lines.

For Intel-based Macs:

{{< highlight bash >}}
export PATH=/usr/local/Caskroom/redis-stack-server/<VERSION>/bin:$PATH
{{< / highlight >}}

For Apple silicon Macs:

{{< highlight bash >}}
export PATH=/opt/homebrew/Caskroom/redis-stack-server/<VERSION>/bin:$PATH
{{< / highlight >}}

In both cases, replace `<VERSION>` with your version of Redis Stack. For example, with version 6.2.0, path is as follows:

{{< highlight bash >}}
export PATH=/opt/homebrew/Caskroom/redis-stack-server/6.2.0/bin:$PATH
{{< / highlight >}}

### Start Redis Stack Server

You can now start Redis Stack Server as follows:

{{< highlight bash >}}
redis-stack-server
{{< / highlight >}}

## Launch RedisInsight

To start up the Redis UI, RedisInsight, type:

{{< highlight bash >}}
redisinsight
{{< / highlight >}}


## Installing Redis after installing Redis Stack

If you've already installed Redis Stack with Homebrew and then try to install Redis with `brew install redis`, you may encounter errors like the following:

{{< highlight bash >}}
Error: The brew link step did not complete successfully
The formula built, but is not symlinked into /usr/local
Could not symlink bin/redis-benchmark
Target /usr/local/bin/redis-benchmark
already exists. You may want to remove it:
rm '/usr/local/bin/redis-benchmark'

To force the link and overwrite all conflicting files:
brew link --overwrite redis

To list all files that would be deleted:
brew link --overwrite --dry-run redis
{{< / highlight >}}

In this case, you can overwrite the Redis binaries installed by Redis Stack by running:

{{< highlight bash >}}
brew link --overwrite redis
{{< / highlight >}}

However, Redis Stack Server will still be installed. To uninstall Redis Stack Server, see below.

## Uninstall Redis Stack

To uninstall Redis Stack, run:

{{< highlight bash >}}
brew uninstall redis-stack-redisinsight redis-stack-server redis-stack
brew untap redis-stack/redis-stack
{{< / highlight >}}
