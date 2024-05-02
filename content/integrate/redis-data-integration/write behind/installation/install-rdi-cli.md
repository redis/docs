---
Title: Install RDI CLI
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Install Redis Data Integration CLI
group: di
linkTitle: Install RDI CLI
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

The following installation instructions install the RDI CLI on a local workstation. For installing in Kubernetes (K8s) or OpenShift please see [k8s installation]({{<relref "/integrate/redis-data-integration/installation/install-k8s">}}).

RDI installation is done via the RDI CLI. The CLI should have network access to the Redis Enterprise cluster API (port 9443 by default).

### Download RDI CLI

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

## Install RDI CLI

Unpack the downloaded `redis-di.tar.gz` into the `/usr/local/bin/` directory:

```bash
sudo tar xvf /tmp/redis-di.tar.gz -C /usr/local/bin/
```

> Note: Non-root users should unpack to a directory with write permission and run `redis-di` directly from it.
