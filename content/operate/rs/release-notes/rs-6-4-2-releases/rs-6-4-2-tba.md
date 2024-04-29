---
Title: Redis Enterprise Software release notes 6.4.2-tba (May 2024)
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 6.2.10
description: RedisGraph v2.10.15. RedisBloom v2.4.8. Bug fixes.
linkTitle: 6.4.2-tba (May 2024)
weight: 65
---

This is a maintenance release for ​[​Redis Enterprise Software version 6.4.2](https://redis.com/redis-enterprise-software/download-center/software/).

## Highlights

This version offers:

- RedisGraph v2.10.15

  {{<note>}}
Redis has announced the end of life for RedisGraph. See the [announcement](https://redis.io/blog/redisgraph-eol/) for details.
  {{</note>}}

- RedisBloom v2.4.8

- Bug fixes

## New in this release

### Enhancements

#### Redis modules

Redis Enterprise Software version 6.4.2-tba includes the following Redis Stack modules:

- [RediSearch v2.6.12]({{< baseurl >}}/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.6-release-notes)

- [RedisJSON v2.4.7]({{< baseurl >}}/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.4-release-notes)

- [RedisBloom v2.4.8]({{< baseurl >}}/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.4-release-notes)

- [RedisGraph v2.10.15]({{< baseurl >}}/operate/oss_and_stack/stack-with-enterprise/release-notes/redisgraph/redisgraph-2.10-release-notes)

- [RedisTimeSeries v1.8.11]({{< baseurl >}}/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.8-release-notes)

### Resolved issues

- RS123237: CRDT syncer uses the max observed vector clock (OVC) of source replicas to prevent potential data mismatches during full sync after removing  and re-adding replicas.

## Version changes 

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Enterprise Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

| Redis Enterprise<br />major versions | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | July 2025 | Feb 2025 | Aug 2024 |
| **Platforms** | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4" style="display: block; height: 80px; margin-top: -80px;"></a>
[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

## Downloads

The following table shows the MD5 checksums for the available packages:

| Package | MD5 checksum (6.4.2-tba May release) |
|---------|---------------------------------------|
| Ubuntu 18 |  |
| Ubuntu 20 |  |
| Red Hat Enterprise Linux (RHEL) 7 |  |
| Red Hat Enterprise Linux (RHEL) 8 |  |
| Amazon Linux 2 |  |
