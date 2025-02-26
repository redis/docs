---
categories:
- docs
- operate
- stack
- oss
description: How to install Redis Community Edition using RPM
linkTitle: RPM
title: Install Redis Community Edition on Linux
weight: 3
---

## Install Redis Community Edition (CE) on Red Hat, CentOS, or Rocky Linux using RPM

See [this page](https://redis.io/downloads/#redis-downloads) for a complete list of supported Red Hat/Rocky platforms.
Follow these steps to install Redis CE.

1. Create the file `/etc/yum.repos.d/redis.repo` with the following contents.

    {{< highlight bash >}}
    [Redis]
    name=Redis
    baseurl=http://packages.redis.io/rpm/rhel9 # replace rhel9 with the appropriate value for your platform and remove this comment
    enabled=1
    gpgcheck=1
    {{< /highlight >}}

1. Run the following commands:

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
