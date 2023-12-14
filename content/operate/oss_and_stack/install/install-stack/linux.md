---
description: How to install Redis Stack on Linux
linkTitle: Linux
title: Install Redis Stack on Linux
weight: 1
---

Learn how to install Redis Stack on Linux from the official repository, RPM feed, with snap, or AppImage.

## From the official Debian/Ubuntu APT Repository
You can install recent stable versions of Redis Stack from the official packages.redis.io APT repository. The repository currently supports Debian Bullseye (11), Ubuntu Bionic (18.04), Ubuntu Focal (20.04), and Ubuntu Jammy (22.04) on x86 and arm64 processors. Add the repository to the apt index, update it, and install it:

{{< highlight bash >}}
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis-stack-server
{{< / highlight >}}

## From the official RPM Feed

You can install recent stable versions of Redis Stack from the official packages.redis.io YUM repository. The repository currently supports RHEL7/CentOS7, and RHEL8/Centos8. Add the repository to the repository index, and install the package.

Create the file /etc/yum.repos.d/redis.repo with the following contents

{{< highlight text >}}
[Redis]
name=Redis
baseurl=http://packages.redis.io/rpm/rhel7
enabled=1
gpgcheck=1
{{< / highlight >}}

{{< highlight bash >}}
curl -fsSL https://packages.redis.io/gpg > /tmp/redis.key
sudo rpm --import /tmp/redis.key
sudo yum install epel-release
sudo yum install redis-stack-server
{{< / highlight >}}

## With snap

From [Download](/download/), get the latest Stack snap package.

To install, run:

{{< highlight text >}}
sudo snap install --dangerous --classic <snapname.snap>
{{< / highlight >}}

## With AppImage

From [Download](/download/), get the latest Stack AppImage package.

Enable the install:

{{< highlight text >}}
chmod a+x <AppImagefile>
{{< / highlight >}}

To install, run

{{< highlight text >}}
./<appimagefile>
{{< / highlight >}}
