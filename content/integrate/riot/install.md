---
title: Install
linkTitle: Install
type: integration
description: Install RIOT on macOS, Linux, Windows, and Docker
weight: 2
---

RIOT can be installed in different ways depending on your environment and preference.

## macOS via Homebrew

```
brew install redis-developer/tap/riot
```

## Windows via Scoop

```
scoop bucket add redis-developer https://github.com/redis-developer/scoop.git
scoop install riot
```

## Linux via Homebrew

```
brew install redis-developer/tap/riot
```

## Docker

```
docker run fieldengineering/riot [OPTIONS] [COMMAND]
```

## Manual installation

Download the pre-compiled binary from the [releases page](https://github.com/redis-developer/riot/releases), uncompress and copy to the desired location.

{{< note >}}
`riot-3.1.5.zip` requires Java 11 or greater to be installed while `riot-standalone-3.1.5-*.zip` includes its own Java runtime and does not require a Java installation.
{{< /note >}}
