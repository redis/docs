---
description: Install RIOT on macOS, Linux, Windows, and Docker
linkTitle: Install
title: Install
type: integration
weight: 2
---

RIOT can be installed in different ways depending on your environment and preference.

## macOS via Homebrew

```
brew install redis/tap/riot
```

## Windows via Scoop

```
scoop bucket add redis https://github.com/redis/scoop.git
scoop install riot
```

## Linux via Homebrew

```
brew install redis/tap/riot
```

## Docker

```
docker run riotx/riot [OPTIONS] [COMMAND]
```

## Manual installation

Download the pre-compiled binary from the [releases page](https://github.com/redis/riot/releases), uncompress, and copy to the desired location.

Full documentation is available at [redis.github.io/riot](https://redis.github.io/riot/).
