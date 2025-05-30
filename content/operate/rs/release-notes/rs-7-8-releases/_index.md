---
Title: Redis Software release notes 7.8.x
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 7.4.0
description: Redis Community Edition 7.4 features. Hash field expiration. Client-side caching support. Metrics stream engine preview. New APIs to check database availability, rebalance shards, fail over shards, and control database traffic. Cluster Manager UI enhancements for node actions, database tags, and database configuration. User manager role. Log rotation based on both size and time. Module management enhancements. Configurable minimum password length. Configurable license expiration alert threshold.
hideListLinks: true
linkTitle: 7.8.x releases
toc: 'true'
weight: 69
---

​[​Redis Software version 7.8](https://redis.io/downloads/#software) is now available!

## Highlights

This version offers:

- Redis Community Edition 7.4 features

- Hash field expiration

- Client-side caching support

- Metrics stream engine preview

- New APIs to check database availability, rebalance shards, fail over shards, and control database traffic

- Cluster Manager UI enhancements for node actions, database tags, and database configuration

- User manager role

- Log rotation based on both size and time

- Module management enhancements

- Configurable minimum password length

- Configurable license expiration alert threshold

## Detailed release notes

For more detailed release notes, select a build version from the following table:

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes,Redis Open Source compatibility" columnSources="LinkTitle,Description,compatibleOSSVersion" enableLinks="LinkTitle">}}

## Version changes

- Added validation to verify the LDAP server URI contains a host and port when updating LDAP configuration.

- The value of the `oss_sharding` API field had no effect in previous versions of Redis Software. However, `oss_sharding` is now set to take effect as part of future plans. Until further notice, set this field to `false` to avoid unintended impacts.

### Breaking changes

Redis Software version 7.8.2 introduces the following breaking changes:

- When you upgrade a database, the upgrade process also attempts to upgrade database modules by default.

    - The default value of `latest_with_modules` has changed to `true`.

    - [`rladmin upgrade db`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db">}}) will always upgrade the database's modules.

    - When you [upgrade a database]({{<relref "/operate/rs/references/rest-api/requests/bdbs/upgrade#post-bdbs-upgrade">}}) using the REST API, you can set `"latest_with_modules": false` in the request body to prevent module upgrades.

- Authentication method changes for [`/v1/users/password`]({{<relref "/operate/rs/references/rest-api/requests/users/password">}}) REST API requests.

    - `PUT`, `POST`, and `DELETE` methods require users to include their usernames and a current password in the authentication header to change their password lists. If the authentication header is not provided, the response status will be `401 Unauthorized`.

    - `/v1/users/password` requests change the password list of the user who provides their credentials in the authorization header when sending the requests.

    - `PUT` and `POST` requests will ignore `username` and `old_password` parameters provided in the request body.

    - `DELETE` requests will ignore the `username` parameter provided in the request body.

- Authentication method changes for [`POST /v1/users/authorize`]({{<relref "/operate/rs/references/rest-api/requests/users/authorize">}}) REST API requests.

    - The `POST` method requires users to include their usernames and a current password in the authentication header to generate a JSON Web Token.

    - `POST /v1/users/authorize` generates a token for the user who provides their credentials in the authorization header when sending the requests.

    - `POST` requests will ignore `username` and `password` parameters provided in the request body.

#### Redis database version 7.4 breaking changes {#redis-74-breaking-changes}

When new major versions of Redis Community Edition change existing commands, upgrading your database to a new version can potentially break some functionality. Before you upgrade, read the provided list of breaking changes that affect Redis Software and update any applications that connect to your database to handle these changes.

Confirm your Redis database version (`redis_version`) using the Cluster Manager UI or run the following [`INFO`]({{< relref "/commands/info" >}}) command with [`redis-cli`]({{< relref "/operate/rs/references/cli-utilities/redis-cli" >}}):

```sh
$ redis-cli -p <port> INFO
"# Server
redis_version:7.0.8
..."
```

##### Security behavior changes

- [#13108](https://github.com/redis/redis/pull/13108) Lua: LRU eviction for scripts generated with `EVAL`. 

##### Other general behavior changes

- [#13133](https://github.com/redis/redis/pull/13133) Lua: allocate VM code with jemalloc instead of libc and count it as used memory.

- [#12171](https://github.com/redis/redis/pull/12171) `ACL LOAD`: do not disconnect all clients.

### Product lifecycle updates

#### End-of-life policy extension

The end-of-life policy for Redis Software versions 6.2 and later has been extended to 24 months after the formal release of the subsequent major version. For the updated end-of-life schedule, see the [Redis Software product lifecycle]({{<relref "/operate/rs/installing-upgrading/product-lifecycle">}}).

#### Supported upgrade paths

Redis Software versions 6.2.4 and 6.2.8 do not support direct upgrades beyond version 7.4.x. Versions 6.2.10, 6.2.12, and 6.2.18 are part of the [upgrade path]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster#supported-upgrade-paths">}}). To upgrade from 6.2.4 or 6.2.8 to versions later than 7.4.x, an intermediate upgrade is required.

The next major Redis Software release will still bundle Redis database version 6.2 and allow database upgrades from Redis database version 6.2 to 7.x.

See the [Redis Software product lifecycle]({{<relref "/operate/rs/installing-upgrading/product-lifecycle">}}) for more information about release numbers.

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

- Deprecated the following fields for [upgrade database]({{<relref "/operate/rs/references/rest-api/requests/bdbs/upgrade">}}) REST API requests:

    - `keep_redis_version`; use `redis_version` instead

    - `current_module`; use `new_module_args` instead

    - `new_module`; use `new_module_args` instead

- Deprecated the following `module_list` fields for [create database]({{<relref "/operate/rs/references/rest-api/requests/bdbs#post-bdbs-v1">}}) REST API requests:

    - `module_id`; use `module_name` instead

    - `semantic_version`; use module_args instead

- `min_redis_version` is only relevant to Redis database versions earlier than 7.4 and is replaced with `compatible_redis_version` in [module REST API]({{<relref "/operate/rs/references/rest-api/requests/modules">}}) responses.

- Deprecated the [`rladmin upgrade modules`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-module">}}) command. Use [`rladmin upgrade db`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db">}}) instead.

- Deprecated [`POST /v1/modules/upgrade/bdb/<uid>`]({{<relref "/operate/rs/references/rest-api/requests/modules/upgrade#post-modules-upgrade-bdb">}}) REST API request. Use [`POST /v1/bdbs/<uid>/upgrade`]({{<relref "/operate/rs/references/rest-api/requests/bdbs/upgrade#post-bdbs-upgrade">}}) to upgrade modules instead.

- Deprecated the `required_version` option for the bootstrap cluster API.

#### V1 Prometheus metrics deprecation

 V1 Prometheus metrics are deprecated but still available. To transition to the new metrics stream engine, either migrate your existing dashboards using [Prometheus v1 metrics and equivalent v2 PromQL]({{<relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-v1-to-v2">}}) now, or wait to use new preconfigured dashboards when they become available in a future release.

#### Download center modules deprecation

New Redis modules will not be available for download from the Redis download center.

#### Legacy UI not supported

The legacy UI was deprecated in favor of the new Cluster Manager UI in Redis Software version 7.2.4 and is no longer supported as of Redis Software version 7.8.2.

#### Redis 6.0 databases not supported

Redis database version 6.0 was deprecated in Redis Software version 7.4.2 and is no longer supported as of Redis Software version 7.8.2.

To prepare for the removal of Redis database version 6.0 before you upgrade to Redis Software version 7.8.2:

- For Redis Software 6.2.* clusters:

    1. Set the Redis upgrade policy to `latest`:

        ```sh
        rladmin tune cluster redis_upgrade_policy latest
        ```

    1. [Upgrade Redis 6.0 databases]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-database">}}) to Redis 6.2. See the [Redis 6.2 release notes](https://raw.githubusercontent.com/redis/redis/6.2/00-RELEASENOTES) for the list of changes.

- For Redis Software 7.2.4 and 7.4.2 clusters, upgrade Redis 6.0 databases to Redis 7.2. Before you upgrade your databases, see the list of [Redis 7.2 breaking changes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#redis-72-breaking-changes" >}}) and update any applications that connect to your database to handle these changes.

#### Ubuntu 18.04 not supported

Ubuntu 18.04 was deprecated in Redis Software version 7.2.4 and is no longer supported as of Redis Software version 7.8.2.

### Upcoming changes

#### Default image change for Redis Software containers

Starting with version 7.8, Redis Software containers with the image tag `x.y.z-build` will be based on RHEL instead of Ubuntu.

This change will only affect you if you use containers outside the official [Redis Enterprise for Kubernetes]({{<relref "/operate/kubernetes">}}) product and use Ubuntu-specific commands.

To use Ubuntu-based images after this change, you can specify the operating system suffix in the image tag. For example, use the image tag `7.4.2-216.focal` instead of `7.4.2-216`.

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Software, but support will be removed in a future release.

| Redis Software<br />major versions | 7.8 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Nov 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | Nov 2026 | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 9<br />FIPS mode<sup>[5](#table-note-5)</sup> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 22.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4"></a>[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Software are certified for development and testing only.

5. <a name="table-note-5"></a>Supported only if [FIPS was enabled during RHEL installation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/switching-rhel-to-fips-mode_security-hardening#proc_installing-the-system-with-fips-mode-enabled_switching-rhel-to-fips-mode) to ensure FIPS compliance.

## Known issues

- RS131972: Creating an ACL that contains a line break in the Cluster Manager UI can cause shard migration to fail due to ACL errors.

- RS151990: For RHEL 8 and RHEL 9 clusters, importing an RDB file can fail with the exception: `Failed to import rdb file: general-error`.

    As a workaround:

    1. On each cluster node, run:

        ```sh
        sudo dnf install boost-program-options
        ```

    1. Verify that `libboost_program_options.so.1.75.0` points to a path to confirm the installation succeeded:

        ```sh
        ldd /opt/redislabs/bin/rl_rdbloader
        ```

    This issue was fixed in [Redis Enterprise Software version 7.8.6-36]({{<relref "/operate/rs/release-notes/rs-7-8-releases/rs-7-8-6-36">}}).


## Known limitations

#### Upload modules before OS upgrade

If the cluster contains any databases that use modules, you must upload module packages for the target OS version to a node in the existing cluster before you upgrade the cluster's operating system.

See [Upgrade a cluster's operating system]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-os">}}) for detailed upgrade instructions.

#### New Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.

#### RedisGraph prevents upgrade to RHEL 9 

You cannot upgrade from a prior RHEL version to RHEL 9 if the Redis Software cluster contains a RedisGraph module, even if unused by any database. The [RedisGraph module has reached end-of-life](https://redis.com/blog/redisgraph-eol/) and is completely unavailable in RHEL 9.

#### Query results might include hash keys with lazily expired fields

If one or more fields of a hash key expire after an `FT.SEARCH` or `FT.AGGREGATE` query begins, Redis does not account for these lazily expired fields. As a result, keys with expired fields might still be included in the query results, leading to potentially incorrect or inconsistent results.
