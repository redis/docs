---
Title: Redis Enterprise Software release notes 7.2.4
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 7.2, 6.2, 6.0
description: Redis 7.0 and 7.2 features. Auto Tiering (enhanced successor to Redis
  on Flash). RESP3 support. Sharded pub/sub. Preview of the new Cluster Manager UI.
  Redis Stack 7.2 features. Three Redis database versions. License file structure
  updates. Redis ACL selectors and enhanced key-based permissions. New INFO fields.
  Log rotation enhancements. Multi-OS upgrade support for clusters with modules.
hideListLinks: true
linkTitle: 7.2.4 releases
toc: 'true'
weight: 71
---

​[​Redis Enterprise Software version 7.2.4](https://redis.io/downloads/#software) is now available!

## Highlights

This version offers:
 
- Redis 7.0 and 7.2 features

- Auto Tiering (enhanced successor to Redis on Flash)

- RESP3 support

- Sharded pub/sub

- A preview of the new Cluster Manager UI (admin console)

- Redis Stack 7.2 features

- Three Redis database versions: 7.2, 6.2, 6.0

- License file structure updates

- Redis ACL selectors and enhanced key-based permissions

- New INFO fields

- Log rotation enhancements

- Multi-OS upgrade support for clusters with modules

## Detailed release notes

For more detailed release notes, select a build version from the following table:

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes,OSS&nbsp;Redis compatibility" columnSources="LinkTitle,Description,compatibleOSSVersion" enableLinks="LinkTitle">}}

## Version changes

### Breaking changes

For a list of potentially breaking changes introduced in version 7.2, see:

- [Breaking changes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#breaking-changes" >}})

- [Redis 7.2 breaking changes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#redis-72-breaking-changes" >}})

To prevent potential application issues due to RESP3 breaking changes, see [Client prerequisites for Redis 7.2 upgrade]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#client-prerequisites-for-redis-72-upgrade" >}}).

### Deprecations

#### Command deprecations

- [`CLUSTER SLOTS`]({{< relref "/commands/cluster-slots" >}}) is deprecated as of Redis 7.0

- [`JSON.RESP`]({{< relref "commands/json.resp" >}}) is deprecated as of Redis Stack 7.2.

- [`QUIT`]({{< relref "/commands/quit" >}}) is deprecated as of Redis 7.2

#### API deprecations

Fields deprecated as of Redis Enterprise v4.3.3:

- `smtp_use_tls` (replaced with `smtp_tls_mode`)

- `dns_address_master`

- `endpoint_node`

- `endpoint_ip`

- `public_addr` (replaced with `external_addr`)

Fields deprecated as of Redis Enterprise v4.4.2:

- `default_shards_overbooking` (replaced with `shards_overbooking`)

Fields deprecated as of Redis Enterprise v6.4.2:

- `use_ipv6` (replaced with `use_external_ipv6`)

- `redis_cleanup_job_settings` (replaced with `persistence_cleanup_scan_interval`)

Fields deprecated as of Redis Enterprise v5.0.1:

- `bdb_high_syncer_lag` (replaced with `replica_src_high_syncer_lag` and `crdt_src_high_syncer_lag`)

- `bdb_syncer_connection_error`

- `bdb_syncer_general_error`

- `sync_sources` (replaced with `replica_sources` and `crdt_sources`)

- `sync` (replaced with `replica_sync` and `crdt_sync`)

- `ssl` (replaced with `tls_mode`)

Fields deprecated as of Redis Enterprise v7.2.4:

- `node.bigstore_driver` (replaced with `cluster.bigstore_driver`)

- `auth_method`

- `authentication_redis_pass` (replaced with multiple passwords feature in version 6.0.X)

- `slave_ha` cluster policy

Other deprecated fields:

- `import/rdb_url` (deprecated as of Redis Enterprise v4.X)

- `logrotate_dir` (to be replaced with `logrotate_config` or removed)

Deprecated CLI commands:

- `rlutil change_master` (deprecated as of Redis Enterprise v6.2.18, replaced with `rladmin change_master`)

- `rlutil reserved_ports` (deprecated as of Redis Enterprise v7.2.4, replaced with `rladmin cluster config reserved_ports`)

REST API requests deprecated as of Redis Enterprise v7.2.4:

- `POST /v1/modules` (replaced with `POST /v2/modules`)

- `DELETE /v1/modules` (replaced with `DELETE /v2/modules`)

#### Access control deprecations

- The following predefined roles and Redis ACLs are not available after upgrading to Redis Enterprise Software version 7.2.4 if they are not associated with any users or databases in the cluster:

    - Custom roles (not management roles): Cluster Member, Cluster Viewer, DB Member, DB Viewer, None.

    - Redis ACLs: Not Dangerous and Read Only.

- A deprecation notice for SASL-based LDAP was included in [previous Redis Enterprise Software release notes]({{< relref "/operate/rs/release-notes/rs-6-2-4-august-2021" >}}#deprecation-notices). When you upgrade to Redis Enterprise Software version 7.2.4, all existing "external" users (previously used to support SASL-based LDAP) will be removed.

#### Legacy UI

With the release of the new Cluster Manager UI, the legacy UI is considered deprecated and will eventually be phased out. New functionality will only be implemented in the new Cluster Manager UI, and the old UI will no longer be maintained except for critical bug fixes.

#### RedisGraph

Redis has announced the end of life for RedisGraph. Redis will continue to support all RedisGraph customers, including releasing patch versions until January 31, 2025.

See the [RedisGraph end-of-life announcement](https://redis.com/blog/redisgraph-eol/) for more details.

#### RHEL and CentOS 7.0-7.9

Support for RHEL and CentOS 7.0-7.9 is considered deprecated and will be removed in a future release.

#### Oracle Linux 7

Oracle Linux 7 support is considered deprecated and will be removed in a future release.

#### Amazon Linux 1

Amazon Linux 1 support is considered deprecated and will be removed in a future release.

#### Ubuntu 16.04

The deprecation of Ubuntu 16.04 was announced in the [Redis Enterprise Software 6.4.2 release notes]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases#deprecations" >}}). As of Redis Enterprise Software 7.2.4, Ubuntu 16.04 is no longer supported.

#### RC4 encryption cipher

The RC4 encryption cipher is considered deprecated in favor of stronger ciphers. Support for RC4 by the [discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service" >}}) will be removed in a future release.

#### 3DES encryption cipher

The 3DES encryption cipher is considered deprecated in favor of stronger ciphers like AES.
Please verify that all clients, apps, and connections support the AES cipher. Support for 3DES will be removed in a future release.
Certain operating systems, such as RHEL 8, have already removed support for 3DES. Redis Enterprise Software cannot support cipher suites that are not supported by the underlying operating system.

#### TLS 1.0 and TLS 1.1

TLS 1.0 and TLS 1.1 connections are considered deprecated in favor of TLS 1.2 or later.
Please verify that all clients, apps, and connections support TLS 1.2. Support for the earlier protocols will be removed in a future release.
Certain operating systems, such as RHEL 8, have already removed support for the earlier protocols. Redis Enterprise Software cannot support connection protocols that are not supported by the underlying operating system.

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Enterprise Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

| Redis Software<br />major versions | 7.22 | 7.8 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | May 2025 | Nov 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | May 2027 | Nov 2026 | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 9<br />FIPS mode<sup>[5](#table-note-5)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 22.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4"></a>[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

5. <a name="table-note-5"></a>Supported only if [FIPS was enabled during RHEL installation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/switching-rhel-to-fips-mode_security-hardening#proc_installing-the-system-with-fips-mode-enabled_switching-rhel-to-fips-mode) to ensure FIPS compliance.

## Known issues

- RS114185 - During an upgrade to [Redis Enterprise Software version 7.2.4-86]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-92" >}}), the proxy might not start due to a `Failed to get default_suffix` error, which appears in `dmcproxy.log`.

    As a workaround, start `dmcproxy` manually:

    ```sh
    supervisorctl restart dmcproxy
    ```

    This issue was fixed in [Redis Enterprise Software version 7.2.4-92]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-92" >}}).


- RS123142 - In an Active-Active setup with at least three participating clusters, removing and re-adding a cluster after removing older clusters without re-adding them can cause missing keys and potentially lead to data loss or data inconsistency.

    This issue will be fixed in a future maintenance release. To prevent this issue, avoid adding clusters until you upgrade to the upcoming maintenance release when available.

## Known limitations

#### Command limitations

- [`CLIENT NO-TOUCH`]({{< relref "/commands/client-no-touch" >}}) might not run correctly in the following cases:

    - The Redis database version is earlier than 7.2.0.

    - The `CLIENT NO-TOUCH` command is forbidden by ACL rules.

    Before sending this command, clients should verify the database version is 7.2.0 or later and that using this command is allowed. 

- You cannot use [`SUNSUBSCRIBE`]({{< relref "/commands/sunsubscribe" >}}) to unsubscribe from a shard channel if the regex changed while subscribed.

- Using [`XREADGROUP BLOCK`]({{< relref "/commands/xreadgroup" >}}) with `>` to return all new streams will cause the Redis database to freeze until the shard is restarted. ([#12031](https://github.com/redis/redis/pull/12301))

- Because a rejected command does not record the duration for command stats, an error will appear after it is reprocessed that will cause the Redis database to freeze until the shard is restarted. ([#12247](https://github.com/redis/redis/pull/12247))

#### Modules cannot load in Oracle Linux 7 & 8

Databases hosted on Oracle Linux 7 & 8 cannot load modules.

As a temporary workaround, you can change the node's `os_name` in the Cluster Configuration Store (CCS):

```sh
ccs-cli hset node:<ID> os_name rhel
```

This limitation was fixed in [Redis Enterprise Software version 7.2.4-64]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-64" >}}).

#### Cluster recovery with manually uploaded modules

For clusters containing databases with manually uploaded modules, [cluster recovery]({{< relref "/operate/rs/clusters/cluster-recovery" >}}) requires an extra step.

After installing Redis Enterprise Software on the cluster nodes, upload compatible modules to `modulesdir` (`/opt/redislabs/lib/modules`) before continuing the recovery process.

This limitation was fixed in [Redis Enterprise Software version 7.2.4-64]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-64" >}}).

#### Cannot create Redis v6.x Active-Active databases with modules

You cannot create Active-Active databases that use Redis version 6.0 or 6.2 with modules. Databases that use Redis version 7.2 do not have this limitation.

This limitation will be fixed in a maintenance release for Redis Enterprise version 7.4.2.

#### Modules prevent nodes from joining upgraded clusters on RHEL clones

If you upgrade an existing cluster to Redis Enterprise Software version 7.2.4 and any existing databases use earlier module versions, new nodes will fail to join the cluster on operating systems that are RHEL clones. RHEL, Ubuntu, and Amazon Linux are not affected by this issue.

For a workaround for affected operating systems, [contact support](https://redis.io/support/).

This limitation will be fixed in a future release.
