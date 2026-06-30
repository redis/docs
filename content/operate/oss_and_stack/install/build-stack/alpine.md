---
categories:
- docs
- operate
- stack
- oss
linkTitle: Alpine 3.23+
title: Build and run Redis Open Source on Alpine 3.23+
weight: 45
---

Follow the steps below to build and run Redis Open Source with all data structures from its source code on a system running Alpine 3.23 or later.

{{< note >}}
Docker image used to produce these build notes:
- alpine:3.23

The steps below assume you are running as `root`, as in the tested container image.
{{< /note >}}

## 1. Install required dependencies

Update your package lists and install the necessary development tools and libraries:

```bash
apk update
apk add --no-cache \
    build-base coreutils linux-headers bsd-compat-headers \
    openssl openssl-dev cmake bash git wget curl xz unzip tar rsync which \
    libtool automake autoconf libffi-dev libgcc ncurses-dev xsimd \
    cargo clang21 clang21-static clang21-libclang llvm21-dev lld21 \
    python3 py3-pip python3-dev
```

Install the Python packages required by the `RedisJSON` module build:

```bash
export PIP_BREAK_SYSTEM_PACKAGES=1
pip install --upgrade setuptools pip
pip install addict toml jinja2 ramp-packer
```

## 2. Download and extract the Redis source

The Redis source code is available from [the Redis GitHub site](https://github.com/redis/redis/releases). Select the release you want to build and then select the .tar.gz file from the **Assets** drop down menu. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes GitHub repository](https://github.com/redis/redis-hashes).

Copy the tar(1) file to `/usr/src`.

Alternatively, you can download the file directly using the `wget` command, as shown below.

```bash
mkdir -p /usr/src
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

Set the necessary environment variables, apply the `RedisJSON` Rust-flags patch, and build Redis with TLS and module support:

```bash
cd /usr/src/redis-<version>

export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
export LTO=1
export RUST_DYN_CRT=1
export PATH="/usr/lib/llvm21/bin:$PATH"

# RedisJSON's bindgen must dlopen libclang.so; drop crt-static from its Rust flags.
make -C modules/redisjson get_source
sed -i 's/^RUST_FLAGS=$/RUST_FLAGS += -C target-feature=-crt-static/' modules/redisjson/src/Makefile

make -j "$(nproc)" all
```

## 4. (Optional) Verify the build

Check the built Redis server and CLI versions:

```bash
cd /usr/src/redis-<version>
./src/redis-server --version
./src/redis-cli --version
```

## 5. Start Redis

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

## 6. (Optional) Install Redis to its default location

```bash
cd /usr/src/redis-<version>
make install
```
