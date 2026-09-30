---
Title: File locations
alwaysopen: false
categories:
- docs
- operate
- rs
description: Redis Enterprise Software file installation locations.
linkTitle: File locations
weight: 60
url: '/operate/rs/7.8/installing-upgrading/install/plan-deployment/file-locations/'
---
> [!WARNING]
> To ensure that Redis Enterprise Software functions properly, be careful with the files in the application directories. If you modify or delete the application files, Redis Enterprise Software might not work as expected.

## Application directories

The directories that Redis Enterprise Software installs into are:

| **Path** | **Description** |
|------------|-----------------|
| /opt/redislabs | Main installation directory for all Redis Enterprise Software binaries |
| /opt/redislabs/bin | Binaries for all the utilities for command-line access and management, such as [`rladmin`](/content/operate/rs/7.8/references/cli-utilities/rladmin/_index.md) or [`redis-cli`](/content/operate/rs/7.8/references/cli-utilities/redis-cli/_index.md) |
| /opt/redislabs/config | System configuration files |
| /opt/redislabs/lib | System library files |
| /opt/redislabs/sbin | System binaries for tweaking provisioning |

## Configuration and data directories

The default directories that Redis Enterprise Software uses for data and metadata are:

| **Path** | **Description** |
|------------|-----------------|
| /var/opt/redislabs | Default storage location for the cluster data, system logs, backups, and ephemeral, persisted data |
| /var/opt/redislabs/log | System logs for Redis Enterprise Software |
| /var/opt/redislabs/run | Socket files for Redis Enterprise Software |
| /etc/opt/redislabs | Default location for cluster manager configuration and certificates |
| /tmp | Temporary files |

You can change these file locations for:

- [Ephemeral and persistence storage](/content/operate/rs/7.8/clusters/new-cluster-setup.md) during cluster setup
- [Socket files](/content/operate/rs/7.8/installing-upgrading/configuring/change-location-socket-files.md) after cluster setup
