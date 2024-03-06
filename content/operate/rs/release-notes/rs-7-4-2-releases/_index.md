---
Title: Redis Enterprise Software release notes 7.4.2
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 7.2.0
description: New Cluster Manager UI enhancements, including Active-Active database
  management. Full TLS 1.3 support. Automatic recovery configuration. Full IPv6 support,
  including for internal traffic. Maintenance mode enhancements. Module management
  enhancements. RHEL 9 support.
hideListLinks: true
linkTitle: 7.4.2 releases
toc: 'true'
weight: 70
---

​[​Redis Enterprise Software version 7.4.2](https://redis.com/redis-enterprise-software/download-center/software/) is now available!

## Highlights

This version offers:
 
- New Cluster Manager UI enhancements, including Active-Active database management

- Full TLS 1.3 support

- Automatic recovery configuration

- Full IPv6 support, including for internal traffic

- Maintenance mode enhancements

- Module management enhancements

- RHEL 7 and Oracle Linux 7, which were previously deprecated, are no longer supported

- RHEL 9 support

## Detailed release notes

For more detailed release notes, select a build version from the following table:

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes,OSS&nbsp;Redis compatibility" columnSources="LinkTitle,Description,compatibleOSSVersion" enableLinks="LinkTitle">}}

## Version changes

### Deprecations

#### API deprecations

- The replica HA cluster policy is deprecated.

- The maintenance mode option `keep_slave_shards` is deprecated in `rladmin` and the REST API. Use `evict_ha_replica` and `evict_active_active_replica` instead.

- `/v1/debuginfo` REST API paths are deprecated. Use the new paths [`/v1/cluster/debuginfo`]({{< relref "/operate/rs/references/rest-api/requests/cluster/debuginfo" >}}), [`/v1/nodes/debuginfo`]({{< relref "/operate/rs/references/rest-api/requests/nodes/debuginfo" >}}), and [`/v1/bdbs/debuginfo`]({{< relref "/operate/rs/references/rest-api/requests/bdbs/debuginfo" >}}) instead.

#### Legacy UI deprecation

The legacy UI is deprecated in favor of the new Cluster Manager UI and will be removed in a future release.

#### Redis 6.0 database deprecation

Redis database version 6.0 is deprecated as of Redis Enterprise Software version 7.4.2 and will be removed in a future release.

To prepare for the future removal of Redis 6.0:

- For Redis Enterprise 6.2.* clusters, upgrade Redis 6.0 databases to Redis 6.2. See the [Redis 6.2 release notes](https://raw.githubusercontent.com/redis/redis/6.2/00-RELEASENOTES) for the list of changes.

- For Redis Enterprise 7.2.4 and 7.4.2 clusters, upgrade Redis 6.0 databases to Redis 7.2. Before you upgrade your databases, see the list of [Redis 7.2 breaking changes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#redis-72-breaking-changes" >}}) and update any applications that connect to your database to handle these changes.

#### Operating system retirements

- RHEL 7 and Oracle Linux 7 were previously announced as deprecated in the [Redis Enterprise Software 7.2.4 release notes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases#deprecations" >}}). As of Redis Enterprise Software 7.4.2, RHEL 7 and Oracle Linux 7 are no longer supported.

#### Security retirements

- The RC4 encryption cipher, which was previously deprecated in favor of stronger ciphers, is no longer supported.

- The 3DES encryption cipher, which was previously deprecated in favor of stronger ciphers like AES, is no longer supported. Verify that all clients, applications, and connections support the AES cipher.

- TLS 1.0 and TLS 1.1 connections, which were previously deprecated in favor of TLS 1.2 or later, are no longer supported. Verify that all clients, applications, and connections support TLS 1.2 or later.

### Supported platforms

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software.

<span title="Warning icon">&#x26A0;&#xFE0F;</span> Deprecated – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

<span title="X icon">&#x274c;</span> End of life – Platform support ended in this version of Redis Enterprise Software.

| Redis Enterprise | 7.4.2 | 7.2.4 | 6.4.2 | 6.2.18 | 6.2.12 | 6.2.10 | 6.2.8 | 6.2.4 |
|------------------|-------|-------|-------|--------|--------|--------|--------|-------|
| **Release date** | Feb<br />2024 | Aug<br />2023 | Feb<br />2023 | Sept<br />2022 | Aug<br />2022 | Feb<br />2022 | Oct<br />2021 | Aug<br />2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | – | July<br />2025 | Feb<br />2025 | Aug<br />2024 | Aug<br />2024 | Aug<br />2024 | Aug<br />2024 | Aug<br />2024 |
| **Ubuntu**<sup>[1](#table-note-1)</sup> |
| 20.04 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span><sup>[6](#table-note-6)</sup> | – | – | – | – | – |
| 18.04 | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported"><span title="Supported">&#x2705;</span></span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| 16.04 | – | <span title="End of life">&#x274c;</span> | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **RHEL & CentOS**<sup>[2](#table-note-2)</sup>
| 9.0-9.3 | <span title="Supported">&#x2705;</span> | – | – | – | – | – | – | – |
| 8.9| <span title="Supported">&#x2705;</span> | – | – | – | – | – | – | – |
| 8.8 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span><sup>[8](#table-note-8)</sup> | – | – | – | – | – |
| 8.7 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – | – |
| 8.5-8.6 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – |
| 8.0-8.4 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| 7.0-7.9 | <span title="End of life">&#x274c;</span> | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **Oracle Linux**<sup>[3](#table-note-3)</sup> |
| 8 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – |
| 7 | <span title="End of life">&#x274c;</span> | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **Rocky Linux**<sup>[3](#table-note-3)</sup> |
| 8 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| **Amazon Linux** |
| 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span><sup>[7](#table-note-7)</sup> | – | – | – | – | – |
| 1 | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **Docker**<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **Kubernetes**<sup>[5](#table-note-5)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>RHEL and CentOS deployments require [firewall configuration]({{< relref "/operate/rs/installing-upgrading/configuring/centos-rhel-firewall" >}}).

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a>Based on the corresponding RHEL version.

4. <a name="table-note-4" style="display: block; height: 80px; margin-top: -80px;"></a>
[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

5. <a name="table-note-5" style="display: block; height: 80px; margin-top: -80px;"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes" >}}).

6. <a name="table-note-6" style="display: block; height: 80px; margin-top: -80px;"></a>Ubuntu 20.04 support was added in Redis Enterprise Software [6.4.2-43]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-43" >}}).

7. <a name="table-note-7" style="display: block; height: 80px; margin-top: -80px;"></a>A release candidate for Amazon Linux 2 support was added in Redis Enterprise Software [6.4.2-61]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-61" >}}). Official support for Amazon Linux 2 was added in Redis Enterprise Software [6.4.2-69]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-69" >}}).

8. <a name="table-note-8" style="display: block; height: 80px; margin-top: -80px;"></a>Redis Enterprise Software [6.4.2-103]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-103" >}}) and later supports RHEL 8.8.

## Known limitations

#### New Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Remove a node.

    Use the REST API or legacy UI instead. See [Remove a cluster node]({{< relref "/operate/rs/clusters/remove-node" >}}) for instructions.

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.

#### OpenSSL compatibility issue for 7.4.2 modules on Amazon Linux 2

Due to an OpenSSL 1.1 compatibility issue between modules and clusters, Redis Enterprise Software version 7.4.2-54 is not fully supported on Amazon Linux 2 clusters with databases that use the following modules: RedisGears, RediSearch, or RedisTimeSeries.

This issue will be fixed in a future maintenance release.

#### RedisGraph prevents upgrade to RHEL 9 

You cannot upgrade from a prior RHEL version to RHEL 9 if the Redis Enterprise cluster contains a RedisGraph module, even if unused by any database. The [RedisGraph module has reached End-of-Life](https://redis.com/blog/redisgraph-eol/) and is completely unavailable in RHEL 9.

#### Cannot create Redis v6.x Active-Active databases with modules

You cannot create Active-Active databases that use Redis version 6.0 or 6.2 with modules. Databases that use Redis version 7.2 do not have this limitation.

This limitation will be fixed in a future maintenance release.
