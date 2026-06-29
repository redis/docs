---
aliases:
- /install/install-stack/
- /install/install-stack/binaries/
- /operate/oss_and_stack/install/install-stack/linux/
- /install/install-redis/install-redis-on-linux/
categories:
- docs
- operate
- stack
- oss
description: Install Redis Open Source on Docker, Linux, macOS, and Windows (using Docker only)
linkTitle: Install Redis Open Source
stack: true
title: Install Redis Open Source
weight: 2
---

## Quick start with Docker

The fastest way to run Redis is with Docker:

{{< highlight bash >}}
docker run -d --name redis -p 6379:6379 redis
{{< /highlight >}}

See the [Docker page]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}}) for full details, including data persistence, custom configuration, and connecting with `redis-cli`.

---

## Install on your platform

<script>
(function () {
  function detectPlatformIndex() {
    var ua = (navigator.userAgent || '').toLowerCase();
    var pl = (navigator.platform || '').toLowerCase();
    if (pl.indexOf('mac') !== -1 || ua.indexOf('mac os') !== -1) return 1;
    if (pl.indexOf('win') !== -1 || ua.indexOf('windows') !== -1) return 2;
    return 0;
  }
  document.addEventListener('DOMContentLoaded', function () {
    var idx = detectPlatformIndex();
    if (idx > 0) {
      var radio = document.getElementById('install-by-platform-tab-' + idx);
      if (radio) radio.checked = true;
    }
  });
})();
</script>

{{< multitabs id="install-by-platform"
    tab1="Linux"
    tab2="macOS"
    tab3="Windows" >}}

#### APT — Ubuntu / Debian

```bash
sudo apt-get install lsb-release curl gpg
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo chmod 644 /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis
```

[Full APT installation guide]({{< relref "/operate/oss_and_stack/install/install-stack/apt" >}})

---

#### RPM — Rocky Linux / AlmaLinux

Create `/etc/yum.repos.d/redis.repo` (use `rockylinux9` or `rockylinux8` as appropriate):

```ini
[Redis]
name=Redis
baseurl=http://packages.redis.io/rpm/rockylinux9
enabled=1
gpgcheck=1
```

Then run:

```bash
curl -fsSL https://packages.redis.io/gpg > /tmp/redis.key
sudo rpm --import /tmp/redis.key
sudo yum install redis
```

[Full RPM installation guide]({{< relref "/operate/oss_and_stack/install/install-stack/rpm" >}})

---

#### Snap — Ubuntu

```bash
sudo apt update
sudo apt install redis-tools
sudo snap install redis
```

[Full Snap installation guide]({{< relref "/operate/oss_and_stack/install/install-stack/snap" >}})

---

#### Docker

```bash
docker run -d --name redis -p 6379:6379 redis
```

[Full Docker installation guide]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}})

-tab-sep-

#### Homebrew

```bash
brew tap redis/redis
brew install --cask redis
```

Start Redis:

```bash
redis-server $(brew --prefix)/etc/redis.conf
```

[Full Homebrew installation guide]({{< relref "/operate/oss_and_stack/install/install-stack/homebrew" >}})

---

#### Docker

```bash
docker run -d --name redis -p 6379:6379 redis
```

[Full Docker installation guide]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}})

-tab-sep-

#### Docker (PowerShell)

Make sure Docker Desktop is installed and configured to run Linux containers, then run in PowerShell:

```powershell
docker run -d --name redis -p 6379:6379 redis
```

[Full Windows / Docker guide]({{< relref "/operate/oss_and_stack/install/install-stack/windows" >}})

---

#### Memurai (preview)

A preview of Redis Open Source 8.2 RC1 is available on Windows through [Memurai](https://www.memurai.com/get-memurai), the official Redis partner for Windows compatibility.

{{< /multitabs >}}

---

The latest version of Redis Open Source has been tested on the following platforms:

- Ubuntu 22.04 (Jammy Jellyfish), 24.04 (Noble Numbat), and 26.04 (Resolute Raccoon).
- Rocky Linux 8.10, 9.7, and 10.1.
- AlmaLinux 8.10, 9.7, and 10.1.
- Debian 12.13 (Bookworm) and Debian 13.4 (Trixie).
- Alpine 3.23.
- macOS 14.8.4 (Sonoma), 15.7.4 (Sequoia), and 26.3 (Tahoe) - for both Intel and ARM processors.

While you can install Redis Open Source on any of the platforms listed below, you might also consider using Redis Cloud by creating a [free account](https://redis.com/try-free/?utm_source=redisio&utm_medium=referral&utm_campaign=2023-09-try_free&utm_content=cu-redis_cloud_users).

You can also download [Redis Insight]({{< relref "/operate/redisinsight/install/" >}}), a free developer companion tool with an intuitive GUI and advanced CLI, which you can use alongside Redis Open Source.

<hr/>
