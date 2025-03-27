---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Community Edition using binary images
linkTitle: Binaries
title: Install Redis Community Edition on Linux
weight: 8
---

## Start Redis Community Edition (CE) server from downloaded binary images

Install the openssl libraries for your platform. For example, on a Debian or Ubuntu instance run:

{{< highlight bash >}}
sudo apt install libssl-dev
{{< / highlight >}}

After untarring or unzipping your redis-server download, you can start Redis CE server as follows:

{{< highlight bash >}}
/path/to/redis-server/bin/redis-server
{{< / highlight >}}

### Add the binaries to your PATH

You can add the redis-server binaries to your `$PATH` as follows:

Open the file `~/.bashrc` or `~/zshrc` (depending on your shell), and add the following lines.

{{< highlight bash >}}
export PATH=/path/to/redis-server/bin:$PATH
{{< / highlight >}}

If you have an existing Redis installation on your system, then you can choose to override those PATH variables as before, or you can choose to only add redis-server binary as follows:

{{< highlight bash >}}
export PATH=/path/to/redis-server/bin/redis-server:$PATH
{{< / highlight >}}

If you're running redis-server on macOS, please ensure you have openssl installed using [homebrew](https://brew.sh/).

Now you can start Redis CE as follows:

{{< highlight bash >}}
redis-server
{{< / highlight >}}
