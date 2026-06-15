---
categories:
- docs
- operate
- stack
- oss
linkTitle: AlmaLinux/Rocky 10.1+
title: Build and run Redis Open Source on AlmaLinux/Rocky Linux 10.1+
weight: 12
---

Follow the steps below to build and run Redis Open Source with all data structures from its source code on a system running AlmaLinux 10.1 or later or Rocky Linux 10.1 or later.

{{< note >}}
Docker images used to produce these build notes:
- AlmaLinux:
    - almalinux:10.1
    - almalinux:10.1-minimal
- Rocky Linux:
    - rockylinux/rockylinux:10.1
    - rockylinux/rockylinux:10.1-minimal
{{< /note >}}

## 1. Prepare the system

{{< note >}}
For 10-minimal, you'll need to install `dnf` as follows:

```bash
microdnf install dnf -y
```
{{< /note >}}

Enable the required repositories (`epel-release` and CRB provide some of the `-devel` packages):

```bash
sudo dnf install -y epel-release
sudo dnf config-manager --set-enabled crb
```

## 2. Install required dependencies

Install the necessary development tools and libraries. AlmaLinux/Rocky 10 ship GCC 14 and CMake 3.30 in the default repositories, which are supported by the Redis build, so no separate compiler or CMake toolset is required:

```bash
sudo dnf groupinstall "Development Tools" -y
sudo dnf install -y \
    pkg-config \
    xz \
    wget \
    which \
    gcc \
    gcc-c++ \
    cmake \
    git \
    make \
    openssl \
    openssl-devel \
    python3 \
    python3-pip \
    python3-devel \
    unzip \
    rsync \
    clang \
    lld \
    llvm \
    libtool \
    automake \
    autoconf \
    jq \
    systemd-devel
```

On AlmaLinux/Rocky 10.1 the `clang`, `lld`, and `llvm` packages above are LLVM 21, which matches the LLVM version of the Rust toolchain that `INSTALL_RUST_TOOLCHAIN=yes` installs. RediSearch's cross-language (C/Rust) LTO needs this match, and `llvm` provides the `llvm-ar`/`llvm-ranlib` archiver the LTO build uses, so no separate LLVM toolchain is required.

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

Set the necessary environment variables and build Redis with TLS and module support. RediSearch builds with cross-language LTO (the default) because the `clang`/`lld` 21 installed in step 2 match the Rust toolchain's LLVM. On AlmaLinux, `IGNORE_MISSING_DEPS=1` bypasses the `v8.7.91` dep-checker that does not yet recognize `almalinux` (fixed in `redisearch` v8.8.0; harmless on, and not required for, Rocky Linux 10):

```bash
cd /usr/src/redis-<version>
export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
export IGNORE_MISSING_DEPS=1
make -j "$(nproc)" all
```

## 5. (Optional) Verify the build

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
