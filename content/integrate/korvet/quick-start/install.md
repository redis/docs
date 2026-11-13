---
Title: Installation
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Different ways to install Korvet, including Homebrew, Docker, and the
  distribution package.
linkTitle: Installation
weight: 10
---

This guide covers different ways to install Korvet.

## Homebrew

On macOS and Linux, the easiest way to install Korvet is with
[Homebrew](https://brew.sh) from the Redis tap (this also installs `openjdk` for
the Java runtime):

```bash
brew install redis/tap/korvet
```

Korvet connects to a Redis you provide — it does not bundle one.
It needs a module-enabled Redis 8.x with the RediSearch (`FT.*`) and
RedisJSON (`JSON.*`) commands, such as [Redis Cloud](https://redis.io/cloud/), Redis
Enterprise, the official `redis:8` Docker image, or the module-enabled Redis
Open Source cask:

```bash
brew tap redis/redis
brew install --cask redis
```

{{< note >}}
The Homebrew **core** `redis` formula ships without those modules, so it is
not sufficient.
{{< /note >}}

Once installed, point Korvet at your Redis and run it:

```bash
korvet server
```

Or jump straight to the [demo]({{< relref "/integrate/korvet/quick-start/demo" >}}).

## Docker

```bash
docker run -p 9092:9092 redisfield/korvet:latest server
```

For configuration and production options, see [Docker deployment]({{< relref "/integrate/korvet/quick-start/docker" >}}).

## Distribution Package

Download the distribution package (`.tar` or `.zip`) from [Korvet Releases](https://github.com/redis-field-engineering/korvet-dist/releases).

### Extract the Archive

```bash
# For .tar
tar -xf korvet-<version>.tar

# For .zip
unzip korvet-<version>.zip
```

### Run Korvet

The distribution includes a startup script with all required JVM options:

```bash
cd korvet-<version>
./bin/korvet server
```

The same script also includes operational commands:

```bash
./bin/korvet topics --bootstrap-server localhost:9092 --list
./bin/korvet migrate -u redis://localhost:6379
```

Replace `<version>` with the version you downloaded. This documentation is for `0.19`.

## System Requirements

- **Java**: 25 or later
- **Redis**: 8+ (the JSON and Search capabilities must be available; on Redis Enterprise, create the database with the JSON and Search modules enabled)
- **Memory**: Minimum 512MB RAM (2GB+ recommended for production)
- **Storage**: Depends on message volume and retention policy

## Next Steps

- [Running with Docker]({{< relref "/integrate/korvet/quick-start/docker" >}})
- [Configuration guide]({{< relref "/integrate/korvet/quick-start/configuration" >}})
