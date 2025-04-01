---
categories:
- docs
- operate
- stack
- oss
linkTitle: Debian 11 (Bullseye)
title: Build and run Redis Open Source on Debian 11 (Bullseye)
weight: 20
---

Follow the steps below to build and run Redis Open Source from its source code on a system running Debian 11 (Bullseye).

{{< note >}}
Docker images used to produce these build notes:
- debian:bullseye
- debian:bullseye-slim
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

Copy the tar(1) file to `/usr/src`.

## 3. Extract the source archive

Create a directory for the source code and extract the contents into it:

```bash
cd /usr/src
tar xvf redis.tar.gz
rm redis.tar.gz
```

## 4. Build Redis

Set the appropriate environment variables to enable TLS, modules, and other build options, then compile and install Redis:

```bash
cd /usr/src/redis
export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
export DISABLE_WERRORS=yes

make -j "$(nproc)" all
sudo make install
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

To validate that the available modules have been installed, run the [`INFO`]{{< relref "/commands/info" >}} command and look for lines similar to the following:

```
redis-cli INFO
...
# Modules
module:name=ReJSON,ver=20803,api=1,filters=0,usedby=[search],using=[],options=[handle-io-errors]
module:name=search,ver=21005,api=1,filters=0,usedby=[],using=[ReJSON],options=[handle-io-errors]
module:name=bf,ver=20802,api=1,filters=0,usedby=[],using=[],options=[]
module:name=timeseries,ver=11202,api=1,filters=0,usedby=[],using=[],options=[handle-io-errors]
module:name=RedisCompat,ver=1,api=1,filters=0,usedby=[],using=[],options=[]
module:name=vectorset,ver=1,api=1,filters=0,usedby=[],using=[],options=[]
...
```
