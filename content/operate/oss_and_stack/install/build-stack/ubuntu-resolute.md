---
categories:
- docs
- operate
- stack
- oss
linkTitle: Ubuntu 26.04 (Resolute)
title: Build and run Redis Open Source on Ubuntu 26.04 (Resolute)
weight: 40
---

Follow the steps below to build and run Redis Open Source with all data structures from its source code on a system running Ubuntu 26.04 (Resolute).

{{< note >}}
Docker image used to produce these build notes:
- ubuntu:26.04

Ubuntu 26.04 ships CMake 4.x and clang/LLVM 21 in the default repositories. The Redis modules build requires CMake 3.31.6 or earlier and explicitly passes `-fuse-ld=lld`, so a supported CMake must be pinned with `pip3`, and `lld`, `llvm`, and `libcrypt-dev` must be installed. (`libcrypt-dev` is needed to link the `redisearch` module against `libcrypt`.)
{{< /note >}}

## 1. Install required dependencies

Update your package lists and install the necessary development tools and libraries. `lld` and `llvm` are required because the modules build invokes clang with `-fuse-ld=lld` and uses `llvm-ar`; `libcrypt-dev` is required to link `redisearch.so`:

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
    libcrypt-dev \
    make \
    git \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    unzip \
    rsync \
    clang \
    lld \
    llvm \
    automake \
    autoconf \
    libtool
```

## 2. Install CMake

Install a supported version of CMake using `pip3` inside a virtual environment (Ubuntu enforces [PEP 668](https://peps.python.org/pep-0668/)) and link it for system-wide access.

{{< warning >}}
CMake version 3.31.6 is the latest supported version. Newer versions cannot be used.
{{< /warning >}}

```bash
python3 -m venv /opt/cmake-venv
/opt/cmake-venv/bin/pip install cmake==3.31.6
sudo ln -sf /opt/cmake-venv/bin/cmake /usr/local/bin/cmake
cmake --version
```

## 3. Download and extract the Redis source

The Redis source code is available from [the Redis GitHub site](https://github.com/redis/redis/releases). Select the release you want to build and then select the .tar.gz file from the **Assets** drop down menu. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes GitHub repository](https://github.com/redis/redis-hashes).

Copy the tar(1) file to `/usr/src`.

Alternatively, you can download the file directly using the `wget` command, as shown below.

```bash
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

## 4. Build Redis

Set the necessary environment variables, and build Redis with TLS and module support:

```bash
cd /usr/src/redis-<version>
export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
make -j "$(nproc)" all
```

## 5. (Optional) Verify the installation

Check the built Redis server and CLI versions:

```bash
cd /usr/src/redis-<version>
./src/redis-server --version
./src/redis-cli --version
```

## 6. Start Redis

To start Redis, use the following command:

```bash
cd /usr/src/redis-<version>
./src/redis-server redis-full.conf
```

To validate that the available modules have been installed, run the [`INFO`]({{< relref "/commands/info" >}}) command and look for lines similar to the following:

```bash
cd /usr/src/redis-<version>
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

## 7. (Optional) Install Redis to its default location

```bash
cd /usr/src/redis-<version>
sudo make install
```
