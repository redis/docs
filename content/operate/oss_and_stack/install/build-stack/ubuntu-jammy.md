---
categories:
- docs
- operate
- stack
- oss
linkTitle: Ubuntu 22.04 (Jammy)
title: Build Redis Community Edition from source on Ubuntu
weight: 5
---

Follow the steps below to build Redis from source on a system running Ubuntu 22.04 ("jammy"):

## 1. Install required dependencies

First, update your package lists and install the development tools and libraries needed to build Redis:

```bash
sudo apt-get update
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

Download the Redis source code archive from GitHub. For example, to download version `8.0-m04`:

```bash
wget -O redis.tar.gz https://github.com/redis/redis/archive/refs/tags/8.0-m04.tar.gz
```

Verify the SHA-256 checksum of the archive to ensure integrity:

```bash
echo "6902a938c629a33f14d49881b1b60e6621c29e445554f882ce7ec48f2743d516 *redis.tar.gz" | sha256sum -c -
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

## 6. Starting Redis with modules

To start Redis with modules like RediSearch, RedisJSON, RedisTimeSeries, and RedisBloom, use the `--loadmodule` option for each module:

```bash
redis-server \
  --loadmodule /usr/local/lib/redis/modules/redisearch.so \
  --loadmodule /usr/local/lib/redis/modules/rejson.so \
  --loadmodule /usr/local/lib/redis/modules/redistimeseries.so \
  --loadmodule /usr/local/lib/redis/modules/redisbloom.so
```
