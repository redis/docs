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
---

## Install Redis Open Source on Red Hat, CentOS, or Rocky Linux using RPM

Follow these steps to install Redis Open Source.

1. Create the file `/etc/yum.repos.d/redis.repo` with the following contents.

    - For Rocky Linux 9 and AlmaLinux 9
    {{< highlight ini >}}
    [Redis]
    name=Redis
    baseurl=http://packages.redis.io/rpm/rockylinux9
    enabled=1
    gpgcheck=1
    {{< /highlight >}}

    - For Rocky Linux 8 and AlmaLinux 8
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
    sudo yum install redis
    {{< / highlight >}}

Redis will not start automatically, nor will it start at boot time. To do this, run the following commands.

{{< highlight bash >}}
sudo systemctl enable redis
sudo systemctl start redis
{{< /highlight >}}
