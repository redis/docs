---
Title: Redis Enterprise Software release notes 7.6.0
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 7.4.0
description: Client-side caching support. Cluster Manager UI enhancements for node actions, database tags, and database configuration. Log rotation based on both size and time. Module management enhancements.
hideListLinks: true
linkTitle: 7.6.0 releases
toc: 'true'
weight: 69
---

​[​Redis Enterprise Software version 7.6.0](https://redis.com/redis-enterprise-software/download-center/software/) is now available!

## Highlights

This version offers:

- Client-side caching support
 
- Cluster Manager UI enhancements for node actions, database tags, and database configuration

- Log rotation based on both size and time

- Module management enhancements

## Detailed release notes

For more detailed release notes, select a build version from the following table:

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes,Redis CE compatibility" columnSources="LinkTitle,Description,compatibleOSSVersion" enableLinks="LinkTitle">}}

## Version changes

- Added validation to verify the LDAP server URI contains a host and port when updating LDAP configuration.

### Breaking changes

Redis Enterprise Software version 7.6.0 introduces the following breaking changes:

- The default value of `latest_with_modules` has changed to `true`.

    - [`rladmin upgrade db`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db">}}) will always upgrade the database's modules.

    - When you [upgrade a database]({{<relref "/operate/rs/references/rest-api/requests/bdbs/upgrade#post-bdbs-upgrade">}}) using the REST API, you can set `"latest_with_modules": false` in the request body to prevent module upgrades.

### Product lifecycle updates

#### End-of-life policy extension

The end-of-life policy for Redis Enterprise Software versions 6.2 and later has been extended to 24 months after the formal release of the subsequent major version. For the updated end-of-life schedule, see the [Redis Enterprise Software product lifecycle]({{<relref "/operate/rs/installing-upgrading/product-lifecycle">}}).

#### Supported upgrade paths

Redis Enterprise Software versions 6.2.4 and 6.2.8 do not support direct upgrades beyond version 7.4.x. Versions 6.2.10, 6.2.12, and 6.2.18 are part of the [upgrade path]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster#supported-upgrade-paths">}}). To upgrade from 6.2.4 or 6.2.8 to versions later than 7.4.x, an intermediate upgrade is required.

The next major Redis Enterprise Software release will still bundle Redis database version 6.2 and allow database upgrades from Redis database version 6.2 to 7.x.

See the [Redis Enterprise Software product lifecycle]({{<relref "/operate/rs/installing-upgrading/product-lifecycle">}}) for more information about release numbers.

#### End of triggers and functions preview

The [triggers and functions]({{<relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/triggers-and-functions">}}) (RedisGears) preview has been discontinued.

- Commands such as `TFCALL`, `TFCALLASYNC`, and `TFUNCTION` will be deprecated and will return error messages.

- Any JavaScript functions stored in Redis will be removed. 

- JavaScript-based triggers will be blocked.

- Lua functions and scripts will not be affected.

If your database currently uses triggers and functions, you need to: 

1. Adjust your applications to accommodate these changes.

1. Delete all triggers and functions libraries from your existing database:

    1. Run `TFUNCTION LIST`.

    1. Copy all library names.

    1. Run `TFUNCTION DELETE` for each library in the list.

    If any triggers and functions libraries remain in the database, the RDB snapshot won't load on a cluster without RedisGears.

1. Migrate your database to a new database without the RedisGears module.

### Deprecations

#### API deprecations

- Deprecated `background_op` field from BDB REST API object. Use [`GET /v1/actions/bdb/<bdb_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions/bdb">}}) instead.

- Deprecated module fields:

    - `latest_with_modules`:

        - The default value of `latest_with_modules` has changed to `true`.

        - [`rladmin upgrade db`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db">}}) will always upgrade the database's modules.

        - When you [upgrade a database]({{<relref "/operate/rs/references/rest-api/requests/bdbs/upgrade#post-bdbs-upgrade">}}) using the REST API, you can set `"latest_with_modules": false` in the request body to prevent module upgrades.

    - `keep_redis_version`; use `redis_version` instead

    - `current_module`; use `new_module_args` instead

    - `new_module`; use `new_module_args` instead

    - `module_id`; use `module_name` instead

    - `semantic_version`; use module_args instead

    - `min_redis_version` is only relevant to Redis database versions earlier than 7.4; replaced with `compatible_redis_version`

- Deprecated the [`rladmin upgrade modules`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-module">}}) command. Use [`rladmin upgrade db`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db">}}) instead.

- Deprecated [`POST /v1/modules/upgrade/bdb/<uid>`]({{<relref "/operate/rs/references/rest-api/requests/modules/upgrade#post-modules-upgrade-bdb">}}) REST API request. Use [`POST /v1/bdbs/<uid>/upgrade`]({{<relref "/operate/rs/references/rest-api/requests/bdbs/upgrade#post-bdbs-upgrade">}}) to upgrade modules instead.

#### Download center modules deprecation

New Redis modules will not be available for download from the Redis download center.

#### Legacy UI deprecation

The legacy UI is deprecated in favor of the new Cluster Manager UI and will be removed in a future release.

#### Redis 6.0 database deprecation

Redis database version 6.0 is deprecated as of Redis Enterprise Software version 7.4.2 and will be removed in a future release.

To prepare for the future removal of Redis 6.0:

- For Redis Enterprise 6.2.* clusters, upgrade Redis 6.0 databases to Redis 6.2. See the [Redis 6.2 release notes](https://raw.githubusercontent.com/redis/redis/6.2/00-RELEASENOTES) for the list of changes.

- For Redis Enterprise 7.2.4 and 7.4.2 clusters, upgrade Redis 6.0 databases to Redis 7.2. Before you upgrade your databases, see the list of [Redis 7.2 breaking changes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#redis-72-breaking-changes" >}}) and update any applications that connect to your database to handle these changes.

### Upcoming changes

#### Default image change for Redis Enterprise Software containers

Starting with version 7.6, Redis Enterprise Software containers with the image tag `x.y.z-build` will be based on RHEL instead of Ubuntu.

This change will only affect you if you use containers outside the official [Redis Enterprise for Kubernetes]({{<relref "/operate/kubernetes">}}) product and use Ubuntu-specific commands.

To use Ubuntu-based images after this change, you can specify the operating system suffix in the image tag. For example, use the image tag `7.4.2-216.focal` instead of `7.4.2-216`.

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Enterprise Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

| Redis Software<br />major versions | 7.6 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Sept 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | TBA | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4" style="display: block; height: 80px; margin-top: -80px;"></a>
[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

## Known issues

- RS131972: Creating an ACL that contains a line break in the Cluster Manager UI can cause shard migration to fail due to ACL errors.

## Known limitations

#### New Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.

#### RedisGraph prevents upgrade to RHEL 9 

You cannot upgrade from a prior RHEL version to RHEL 9 if the Redis Enterprise cluster contains a RedisGraph module, even if unused by any database. The [RedisGraph module has reached end-of-life](https://redis.com/blog/redisgraph-eol/) and is completely unavailable in RHEL 9.
