---
Title: Install Write-behind CLI
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Install Write-behind CLI
group: di
linkTitle: Install Write-behind CLI
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

The following installation instructions install the Write-behind CLI on a local workstation.

Write-behind installation is done via the Write-behind CLI. The CLI should have network access to the Redis Enterprise cluster API (port 9443 by default).

### Download Write-behind CLI

#### Ubuntu 20.04

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-ubuntu20.04-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di.tar.gz
```

#### Ubuntu 18.04

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-ubuntu18.04-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di.tar.gz
```

#### RHEL 8

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-rhel8-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di.tar.gz
```

#### RHEL 7

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-rhel7-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di.tar.gz
```

## Install Write-behind CLI

Unpack the downloaded `redis-di.tar.gz` into the `/usr/local/bin/` directory:

```bash
sudo tar xvf /tmp/redis-di.tar.gz -C /usr/local/bin/
```

> Note: Non-root users should unpack to a directory with write permission and run `redis-di` directly from it.
