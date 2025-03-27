---
categories:
- docs
- operate
- stack
- oss
linkTitle: macOS 13 / macOS 14
title: Build Redis Community Edition from source on macOS 13 (Ventura) and macOS 14 (Sonoma)
weight: 50
---

Follow the steps below to build Redis from source on a system running macOS 13 (Ventura) and macOS 14 (Sonoma).

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

The Redis source code is available from the [Download](https://redis.io/downloads) page. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes git repository](https://github.com/redis/redis-hashes).

Download a specific version of the Redis source code from GitHub. For example, to download version `8.0`:

```bash
wget -O redis.tar.gz https://github.com/redis/redis/archive/refs/tags/8.0.tar.gz
```

To download the latest stable Redis release, run the following:

```bash
wget -O redis.tar.gz https://download.redis.io/redis-stable.tar.gz
```

Extract the source:

```bash
tar xvf redis.tar.gz
```

## 5. Build Redis

```
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
