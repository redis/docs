---
categories:
- docs
- operate
- stack
- oss
linkTitle: Rocky Linux 9
title: Build Redis Community Edition from source on Rocky Linux
weight: 5
---

Follow the steps below to build Redis from source on a system running Rocky Linux 9:

## 1. Prepare the system

Enable the GoReleaser repository and install required packages:

```bash
sudo tee /etc/yum.repos.d/goreleaser.repo > /dev/null <<EOF
[goreleaser]
name=GoReleaser
baseurl=https://repo.goreleaser.com/yum/
enabled=1
gpgcheck=0
EOF

sudo dnf clean all
sudo dnf makecache
sudo dnf update -y
```

## 2. Install required packages

Install build dependencies, GCC toolset, Python, and utilities:

```bash
sudo dnf install -y --nobest --skip-broken \
    pkg-config \
    xz \
    wget \
    which \
    gcc-toolset-13-gcc \
    gcc-toolset-13-gcc-c++ \
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
    curl \
    libtool \
    automake \
    autoconf \
    jq \
    systemd-devel
```

Create a Python virtual environment:

```bash
python3 -m venv /opt/venv
```

Enable the GCC toolset:

```bash
sudo cp /opt/rh/gcc-toolset-13/enable /etc/profile.d/gcc-toolset-13.sh
echo "source /etc/profile.d/gcc-toolset-13.sh" | sudo tee -a /etc/bashrc
```

## 3. Install CMake

Install CMake version 3.25.1 manually:

```bash
CMAKE_VERSION=3.25.1
ARCH=$(uname -m)

if [ "$ARCH" = "x86_64" ]; then
  CMAKE_FILE=cmake-${CMAKE_VERSION}-linux-x86_64.sh
else
  CMAKE_FILE=cmake-${CMAKE_VERSION}-linux-aarch64.sh
fi

wget https://github.com/Kitware/CMake/releases/download/v${CMAKE_VERSION}/${CMAKE_FILE}
chmod +x ${CMAKE_FILE}
./${CMAKE_FILE} --skip-license --prefix=/usr/local --exclude-subdir
rm ${CMAKE_FILE}

cmake --version
```

## 4. Download and extract the Redis source

Download Redis 8.0-m04 and verify its SHA-256 checksum:

```bash
wget -O redis.tar.gz https://github.com/redis/redis/archive/refs/tags/8.0-m04.tar.gz
echo "6902a938c629a33f14d49881b1b60e6621c29e445554f882ce7ec48f2743d516 *redis.tar.gz" | sha256sum -c -

mkdir -p /usr/src/redis

# Extract and remove the archive

tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1
rm redis.tar.gz
```

## 5. Build Redis

Enable the GCC toolset and compile Redis with TLS and module support:

```bash
source /etc/profile.d/gcc-toolset-13.sh
cd /usr/src/redis

export BUILD_TLS=yes
export BUILD_WITH_MODULES=yes
export INSTALL_RUST_TOOLCHAIN=yes
export DISABLE_WERRORS=yes

make -j "$(nproc)" all
sudo make install
```

## 6. (Optional) Verify the installation

Check that Redis was installed successfully:

```bash
redis-server --version
redis-cli --version
```

## 7. Starting Redis with modules

To start Redis with RediSearch, RedisJSON, RedisTimeSeries, and RedisBloom modules, use the following command:

```bash
redis-server \
  --loadmodule /usr/local/lib/redis/modules/redisearch.so \
  --loadmodule /usr/local/lib/redis/modules/rejson.so \
  --loadmodule /usr/local/lib/redis/modules/redistimeseries.so \
  --loadmodule /usr/local/lib/redis/modules/redisbloom.so
```

