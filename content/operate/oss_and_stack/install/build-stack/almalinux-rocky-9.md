---
categories:
- docs
- operate
- stack
- oss
linkTitle: AlmaLinux/Rocky 9.5
title: Build and run Redis Open Source on AlmaLinux/Rocky Linux 9.5
weight: 10
---

Follow the steps below to build and run Redis Open Source from its source code on a system running AlmaLinux and Rocky Linux 9.5.

{{< note >}}
Docker images used to produce these build notes:
- AlmaLinux:
    - almalinux:9.5
    - almalinux:9.5-minimal
- Rocky Linux:
    - rockylinux/rockylinux:9.5
    - rockylinux/rockylinux:9.5-minimal
{{< /note >}}

## 1. Prepare the system

{{< note >}}
For 9.5-minimal, you'll need to install `sudo` and `dnf` as follows:

```bash
microdnf install dnf sudo -y
```

For 9.5 (regular), you'll need to install `sudo` as follows:

```bash
dnf install sudo -y
```
{{< /note >}}

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

The Redis source code is available from the [Download](https://redis.io/downloads) page. You can verify the integrity of these downloads by checking them against the digests in the [redis-hashes git repository](https://github.com/redis/redis-hashes).

Copy the tar(1) file to `/usr/src`.

Extract the source:

```bash
cd /usr/src
tar xvf redis.tar.gz
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

## 7. Start Redis

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
