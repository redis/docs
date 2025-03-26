---
categories:
- docs
- operate
- stack
- oss
linkTitle: Debian 12 (Bookworm)
title: Build Redis Community Edition from source on Debian 12 (Bookworm)
weight: 5
---

Follow the steps below to build Redis from source on a system running Debian 12 (Bookworm).

{{< note >}}
Docker was used to produce these build notes. The tested "pulls" are:
- Debian:bookworm
- Debian:bookworm-slim
{{< /note >}}

## 1. Install required dependencies

First, update your package lists and install the development tools and libraries needed to build Redis:

```bash
apt-get update
apt-get install -y sudo
sudo apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    dpkg-dev \
    gcc \
    g++ \
    libc6-dev \
    libssl-dev \
    make \
    git \
    cmake \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    unzip \
    rsync \
    clang \
    automake \
    autoconf \
    libtool
```

## 2. Download the Redis source code

The Redis source code is available from the [Download](https://redis.io/downloads) page. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes git repository](https://github.com/redis/redis-hashes).

Download a specific version of the Redis source code zip archive from GitHub. For example, to download version `8.0`:

```bash
wget -O redis.tar.gz https://github.com/redis/redis/archive/refs/tags/8.0.tar.gz
```

To download the latest stable Redis release, run the following:

```bash
wget -O redis.tar.gz https://download.redis.io/redis-stable.tar.gz
```

## 3. Extract the source archive

Create a directory for the source code and extract the contents into it:

```bash
mkdir -p /usr/src/redis
tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1
rm redis.tar.gz
```

## 4. Build Redis

Set the appropriate environment variables to enable TLS, modules, and other build options, then compile and install Redis:

```bash
export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
export DISABLE_WERRORS=yes

make -C /usr/src/redis -j "$(nproc)" all
sudo make -C /usr/src/redis install
```

This builds the Redis server, CLI, and any included modules.

## 5. (Optional) Verify the installation

You can confirm that Redis has been built and installed successfully by checking the version:

```bash
redis-server --version
redis-cli --version
```

## 6. Start Redis

To start Redis, use the following command:

```bash
redis-server /path/to/redis.conf
```
