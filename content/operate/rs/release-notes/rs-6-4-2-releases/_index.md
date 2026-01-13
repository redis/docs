---
Title: Redis Enterprise Software release notes 6.4.2
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 6.2, 6.0
description: Pub/sub ACLs & default permissions. Validate client certificates by subject
  attributes. Ubuntu 20.04 support.
headerRange: '[1-2]'
hideListLinks: true
linkTitle: 6.4.2 releases
toc: 'true'
weight: 72
---

​[​Redis Enterprise Software version 6.4.2](https://redis.io/downloads/#software) is now available!

This version offers:

- Extended validation of client certificates via mTLS (mutual TLS) full subject support

- Support for default restrictive permissions when using publish/subscribe commands and access control lists (ACLs)

- Enhanced TLS performance when Redis returns large arrays in responses

- Compatibility with [open source Redis](https://github.com/redis/redis) 6.2.7 and 6.2.10.

- Additional enhancements and bug fixes

## Detailed release notes

For more detailed release notes, select a build version from the following table:

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes,OSS&nbsp;Redis compatibility" columnSources="LinkTitle,Description,compatibleOSSVersion" enableLinks="LinkTitle">}}

## Deprecations

### Ubuntu 16.04

Ubuntu 16 support is considered deprecated and will be removed in a future release. Ubuntu 16.04 LTS (Xenial) has reached the end of its free initial five-year security maintenance period as of April 30, 2021.

### Active-Active database persistence

The RDB snapshot option for [Active-Active database persistence]({{< relref "/operate/rs/databases/active-active/manage#data-persistence" >}}) is deprecated and will be removed in a future release.

Please plan to reconfigure any Active-Active databases to use append-only file (AOF) persistence with the following command:

```sh
crdb-cli crdb update --crdb-guid <CRDB_GUID> \
    --default-db-config '{"data_persistence": "aof", "aof_policy":"appendfsync-every-sec"}'
```

### TLS 1.0 and TLS 1.1

TLS 1.0 and TLS 1.1 connections are considered deprecated in favor of TLS 1.2 or later.
Please verify that all clients, apps, and connections support TLS 1.2. Support for the earlier protocols will be removed in a future release.
Certain operating systems, such as RHEL 8, have already removed support for the earlier protocols. Redis Enterprise Software cannot support connection protocols that are not supported by the underlying operating system.

### 3DES encryption cipher

The 3DES encryption cipher is considered deprecated in favor of stronger ciphers like AES.
Please verify that all clients, apps, and connections support the AES cipher. Support for 3DES will be removed in a future release.
Certain operating systems, such as RHEL 8, have already removed support for 3DES. Redis Enterprise Software cannot support cipher suites that are not supported by the underlying operating system.

## Known limitations

### Feature limitations

- RS97971 - [Resharding fails for rack-aware databases with no replication](#resharding-fails-for-rack-aware-databases-with-no-replication) (fixed and resolved as part of [v6.4.2-61]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-61" >}})).

- RS101204 - High memory consumption caused by the `persistence_mgr` service when AOF persistence is configured for every second (fixed and resolved as part of [v6.4.2-81]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-81" >}})).

- RS40641 - API requests are redirected to an internal IP in case the request arrives from a node which is not the master. To avoid this issue, use [`rladmin cluster config`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}}) to configure `handle_redirects` or `handle_metrics_redirects`.

- RS51144, RS102128 - Active-Active: To start successfully, the syncer (`crdt-syncer`) must connect to all sources. In multi-cluster configurations (more than 2 A-A clusters participating), in some cases, if one or more of the clusters is not available, A-A replication will be down.

- RS123142 - In an Active-Active setup with at least three participating clusters, removing and re-adding a cluster after removing older clusters without re-adding them can cause missing keys and potentially lead to data loss or data inconsistency.

    This issue will be fixed in a future maintenance release. To prevent this issue, avoid adding clusters until you upgrade to the upcoming maintenance release when available.

#### Resharding fails for rack-aware databases with no replication

When a database is configured as [rack-aware]({{< relref "/operate/rs/clusters/configure/rack-zone-awareness" >}}) and replication is turned off, the resharding operation fails.

RS97971 - This limitation was fixed and resolved as part of [v6.4.2-61]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-61" >}}).   

Workaround:

Before resharding your database, turn off rack awareness:

```sh
curl -k -u "<user>:<password>" -H "Content-type: application/json" -d '{"rack_aware": false}' -X PUT "https://localhost:9443/v1/bdbs/<bdb_uid>"
```

After the resharding process is complete, you can re-enable rack awareness:

```sh
curl -k -u "<user>:<password>" -H "Content-type: application/json" -d '{"rack_aware": true}' -X PUT "https://localhost:9443/v1/bdbs/<bdb_uid>"
```

### Installation limitations

Several Redis Enterprise Software installation reference files are installed to the directory `/etc/opt/redislabs/` even if you use [custom installation directories]({{< relref "/operate/rs/installing-upgrading/install/customize-install-directories" >}}).

As a workaround to install Redis Enterprise Software without using any root directories, do the following before installing Redis Enterprise Software:

1. Create all custom, non-root directories you want to use with Redis Enterprise Software.

1. Mount `/etc/opt/redislabs` to one of the custom, non-root directories.

### Upgrade limitations

Before you upgrade a cluster that hosts Active-Active databases with modules to v6.4.2-30, perform the following steps:

1. Use `crdb-cli` to verify that the modules (`modules`) and their versions (in `module_list`) are as they appear in the database configuration and in the default database configuration:

    ```sh
    crdb-cli crdb get --crdb-guid <crdb-guid>
    ```

1. From the admin console's **redis modules** tab, validate that these modules with their specific versions are loaded to the cluster.

1. If one or more of the modules/versions are missing or if you need help, [contact Redis support](https://redis.com/company/support/) before taking additional steps.

This limitation has been fixed and resolved as of [v6.4.2-43]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-43" >}}).

### Operating system limitations

#### RHEL 7 and RHEL 8

RS95344 - CRDB database will not start on Redis Enterprise v6.4.2 with a custom installation path.

For a workaround, use the following commands to add the relevant CRDB files to the Redis library:

```sh
$ yum install -y chrpath
$ find $installdir -name "crdt.so" | xargs -n1 -I {} /bin/bash -c 'chrpath -r ${libdir} {}'
```

This limitation has been fixed and resolved as of [v6.4.2-61]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-61" >}}).

#### RHEL 8

Due to module binary differences between RHEL 7 and RHEL 8, you cannot upgrade RHEL 7 clusters to RHEL 8 when they host databases using modules. Instead, you need to create a new cluster on RHEL 8 and then migrate existing data from your RHEL 7 cluster. This does not apply to clusters that do not use modules.

#### Ubuntu 20.04

By default, you cannot use the SHA1 hash algorithm ([OpenSSL’s default security level is set to 2](https://manpages.ubuntu.com/manpages/focal/man3/SSL_CTX_set_security_level.3ssl.html#notes)). The operating system will reject SHA1 certificates even if the `mtls_allow_weak_hashing` option is enabled. You need to replace SHA1 certificates with newer certificates that use SHA-256. Note that the certificates provided with Redis Enterprise Software use SHA-256.  

#### Modules not supported for Amazon Linux 2 release candidate

A database with modules cannot reside on an Amazon Linux 2 (release candidate) node. Support was added as part of [v6.4.2-69]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-69" >}}).
