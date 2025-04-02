---
categories:
- docs
- operate
- stack
- oss
linkTitle: macOS 13 / macOS 14
title: Build and run Redis Open Source on macOS 13 (Ventura) and macOS 14 (Sonoma)
weight: 50
---

Follow the steps below to build and run Redis Open Source from its source code on a system running macOS 13 (Ventura) and macOS 14 (Sonoma).

## 1. Install homebrew

If Homebrew isn't already installed, follow the installation instructions on the [Homebrew home page](https://brew.sh).

## 2. Install required packages

```
export HOMEBREW_NO_AUTO_UPDATE=1
brew update
brew install coreutils
brew install make
brew install openssl
brew install llvm@18
brew install cmake
brew install gnu-sed
brew install automake
brew install libtool
brew install wget
```

## 3. Install Rust

Rust is required to build the JSON package.

```
RUST_INSTALLER=rust-1.80.1-$(if [ "$(uname -m)" = "arm64" ]; then echo "aarch64"; else echo "x86_64"; fi)-apple-darwin
wget --quiet -O ${RUST_INSTALLER}.tar.xz https://static.rust-lang.org/dist/${RUST_INSTALLER}.tar.xz
tar -xf ${RUST_INSTALLER}.tar.xz
(cd ${RUST_INSTALLER} && sudo ./install.sh)
```

## 4. Download and extract the Redis source

The Redis source code is available from [the Redis GitHub site](https://github.com/redis/redis/releases). Select the release you want to build and then select the .tar.gz file from the **Assets** drop down menu. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes GitHub repository](https://github.com/redis/redis-hashes).

Create a directory for the src, for example `~/src`.

```
mkdir ~/src
```

Copy the tar(1) file to `~/src`.

Alternatively, you can download the file directly using the `wget` command, as shown below.

```
cd ~/src
wget -O redis-<version>.tar.gz https://github.com/redis/redis/archive/refs/tags/<version>.tar.gz
```

Replace `<version>` with the three-digit Redis release number, for example `8.0.0`.

Extract the source:

```bash
tar xvf redis-<version>.tar.gz
rm redis-<version>.tar.gz
```

## 5. Build Redis

```
cd ~/src/redis-<version>
export HOMEBREW_PREFIX="$(brew --prefix)"
export BUILD_WITH_MODULES=yes
export BUILD_TLS=yes
export DISABLE_WERRORS=yes
PATH="$HOMEBREW_PREFIX/opt/libtool/libexec/gnubin:$HOMEBREW_PREFIX/opt/llvm@18/bin:$HOMEBREW_PREFIX/opt/make/libexec/gnubin:$HOMEBREW_PREFIX/opt/gnu-sed/libexec/gnubin:$HOMEBREW_PREFIX/opt/coreutils/libexec/gnubin:$PATH"
export LDFLAGS="-L$HOMEBREW_PREFIX/opt/llvm@18/lib"
export CPPFLAGS="-I$HOMEBREW_PREFIX/opt/llvm@18/include"
          
mkdir -p build_dir/etc
make -C redis-8.0 -j "$(nproc)" all OS=macos
make -C redis-8.0 install PREFIX=$(pwd)/build_dir OS=macos
```

## 6. (Optional) Verify the installation

Check the installed Redis server and CLI versions:

```bash
build_dir/bin/redis-server --version
build_dir/bin/redis-cli --version
```

## 7. Start Redis

To start Redis, use the following command:

```bash
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
build_dir/bin/redis-server /path/to/redis.conf
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
