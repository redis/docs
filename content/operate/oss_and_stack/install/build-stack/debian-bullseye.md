---
categories:
- docs
- operate
- stack
- oss
linkTitle: Debian 11 (Bullseye)
title: Build and run Redis Community Edition 8 on Debian 11 (Bullseye)
weight: 20
---

Follow the steps below to build and run Redis Community Edition 8 from its source code on a system running Debian 11 (Bullseye).

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

## 2. Download and extract the Redis source

The Redis source code is available from [the Redis GitHub site](https://github.com/redis/redis/releases). Select the release you want to build and then select the .tar.gz file from the **Assets** drop down menu. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes GitHub repository](https://github.com/redis/redis-hashes).

Copy the tar(1) file to `/usr/src`.

Alternatively, you can download the file directly using the `wget` command, as shown below.

```
cd /usr/src
wget -O redis-<version>.tar.gz https://github.com/redis/redis/archive/refs/tags/<version>.tar.gz
```

Replace `<version>` with the three-digit Redis release number, for example `8.0.0`.

Extract the source:

```bash
cd /usr/src
tar xvf redis-<version>.tar.gz
rm redis-<version>.tar.gz
```

## 3. Build Redis

Set the appropriate environment variables to enable TLS, modules, and other build options, then compile and install Redis:

```bash
cd /usr/src/redis-<version>
export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
export DISABLE_WERRORS=yes

make -j "$(nproc)" all
```

This builds the Redis server, CLI, and any included modules.

## 4. (Optional) Verify the installation

You can confirm that Redis has been built and installed successfully by checking the version:

```bash
./src/redis-server --version
./src/redis-cli --version
```

## 5. Start Redis

To start Redis, use the following command:

```bash
./src/redis-server redis-full.conf
```

To validate that the available modules have been installed, run the [`INFO`]{{< relref "/commands/info" >}} command and look for lines similar to the following:

```
./src/redis-cli INFO
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

## 6. (Optional) Install Redis to its default location

```
cd /usr/src/redis-<version>
sudo make install
```