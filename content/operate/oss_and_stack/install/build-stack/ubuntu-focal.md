---
categories:
- docs
- operate
- stack
- oss
linkTitle: Ubuntu 20.04 (Focal)
title: Build Redis Community Edition from source on Ubuntu 20.04 (Focal)
weight: 25
---

Follow the steps below to build Redis from source on a system running Ubuntu 20.04 (Focal).

{{< note >}}
Docker images used to produce these build notes:
- ubuntu:20.04
{{< /note >}}

## 1. Install required dependencies

Update your package lists and install the necessary development tools and libraries:

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
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    unzip \
    rsync \
    clang \
    automake \
    autoconf \
    gcc-10 \
    g++-10 \
    libtool
```

## 2. Use GCC 10 as the default compiler

Update the system's default compiler to GCC 10:

```bash
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-10 100 --slave /usr/bin/g++ g++ /usr/bin/g++-10
```

## 3. Install CMake

Install CMake using `pip3` and link it for system-wide access.

{{< warning >}}
CMake version 3.31.6 is the latest supported version. Newer versions cannot be used.
{{< /warning>}}

```bash
pip3 install cmake==3.31.6
sudo ln -sf /usr/local/bin/cmake /usr/bin/cmake
cmake --version
```

## 4. Download the Redis source

The Redis source code is available from the [Download](https://redis.io/downloads) page. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes git repository](https://github.com/redis/redis-hashes).

Copy the tar(1) file to /usr/src.

## 5. Extract the source archive

Create a directory for the source code and extract the contents into it:

```bash
cd /usr/src
tar xvf redis.tar.gz
rm redis.tar.gz
```

## 6. Build Redis

Set the necessary environment variables and compile Redis:

```bash
cd /usr/src/redis
export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
export DISABLE_WERRORS=yes

make -j "$(nproc)" all
sudo make install
```

## 7. (Optional) Verify the installation

Confirm the Redis installation:

```bash
redis-server --version
redis-cli --version
```

## 8. Start Redis

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
