---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Open Source using RPM
linkTitle: RPM
title: Install Redis Open Source on Linux
weight: 3
bannerText: These installation instructions are not yet complete for Redis 8 in Redis Open Source (Redis 8). For installation instructions prior to Redis 8, see [these pages]({{< relref "/operate/oss_and_stack/install/archive" >}}).
---

## Install Redis Open Source on Red Hat, CentOS, or Rocky Linux using RPM

See [this page](https://redis.io/downloads/#redis-downloads) for a complete list of supported Red Hat/Rocky platforms.
Follow these steps to install Redis Open Source.

1. Create the file `/etc/yum.repos.d/redis.repo` with the following contents.

    - For Rocky Linux 9 / AlmaLinux 9 / etc...
    {{< highlight ini >}}
    [Redis]
    name=Redis
    baseurl=http://packages.redis.io/rpm/rockylinux9
    enabled=1
    gpgcheck=1
    {{< /highlight >}}

    - For Rocky Linux 8 / AlmaLinux 8 / etc...
    {{< highlight ini >}}
    [Redis]
    name=Redis
    baseurl=http://packages.redis.io/rpm/rockylinux8
    enabled=1
    gpgcheck=1
    {{< /highlight >}}

2. Run the following commands:

    {{< highlight bash >}}
    curl -fsSL https://packages.redis.io/gpg > /tmp/redis.key
    sudo rpm --import /tmp/redis.key
    sudo yum install epel-release
    sudo yum install redis-server
    {{< / highlight >}}

Redis will not start automatically, nor will it start at boot time. To do this, run the following commands.

{{< highlight bash >}}
sudo systemctl enable redis-server
sudo systemctl start redis-server
{{< /highlight >}}
