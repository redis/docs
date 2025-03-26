---
categories:
- docs
- operate
- stack
- oss
linkTitle: Ubuntu 20.04 (Focal)
title: Build Redis Community Edition from source on Ubuntu 20.04 (Focal)
weight: 5
---

Follow the steps below to build Redis from source on a system running Ubuntu 20.04 (Focal).

{{< note >}}
Docker was used to produce these build notes. The tested “pulls” are:
- ubuntu:20.04
{{< /note >}}

## 1. Install required dependencies

Update your package lists and install the necessary development tools and libraries:

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

Install CMake using `pip3` and link it for system-wide access:

```bash
pip3 install cmake
sudo ln -sf /usr/local/bin/cmake /usr/bin/cmake
cmake --version
```

## 4. Download the Redis source

The Redis source code is available from the [Download](https://redis.io/downloads) page. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes git repository](https://github.com/redis/redis-hashes).

Download a specific version of the Redis source code zip archive from GitHub. For example, to download version `8.0`:

```bash
wget -O redis.tar.gz https://github.com/redis/redis/archive/refs/tags/8.0.tar.gz
```

To download the latest stable Redis release, run the following:

```bash
wget -O redis.tar.gz https://download.redis.io/redis-stable.tar.gz
```

## 5. Extract the source archive

Create a directory for the source code and extract the contents into it:

```bash
mkdir -p /usr/src/redis
tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1
rm redis.tar.gz
```

## 6. Build Redis

Set the necessary environment variables and compile Redis:

```bash
export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
export DISABLE_WERRORS=yes

make -C /usr/src/redis -j "$(nproc)" all
sudo make -C /usr/src/redis install
```

Create the module directory:

```bash
sudo mkdir -p /usr/local/lib/redis/modules/
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
