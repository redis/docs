---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Stack using tarballs
linkTitle: Binaries
title: Install Redis Stack from binaries
weight: 5
---

## Start Redis Stack Server

Install the openssl libraries for your platform. For example, on a Debian or Ubuntu instance run:

{{< highlight bash >}}
sudo apt install libssl-dev
{{< / highlight >}}

After untarring or unzipping your redis-stack-server download, you can start Redis Stack Server as follows:

{{< highlight bash >}}
/path/to/redis-stack-server/bin/redis-stack-server
{{< / highlight >}}

### Add the binaries to your PATH

You can add the redis-stack-server binaries to your `$PATH` as follows:

Open the file `~/.bashrc` or `~/zshrc` (depending on your shell), and add the following lines.

{{< highlight bash >}}
export PATH=/path/to/redis-stack-server/bin:$PATH
{{< / highlight >}}

If you have an existing Redis installation on your system, then you can choose override those override those PATH variables as before, or you can choose to only add redis-stack-server binary as follows:

{{< highlight bash >}}
export PATH=/path/to/redis-stack-server/bin/redis-stack-server:$PATH
{{< / highlight >}}

If you're running redis-stack-server on a mac, please ensure you have openssl installed, via [homebrew](https://brew.sh/).

Now you can start Redis Stack Server as follows:

{{< highlight bash >}}
redis-stack-server
{{< / highlight >}}
