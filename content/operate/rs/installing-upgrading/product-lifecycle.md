---
Title: Redis Enterprise Software product lifecycle
alwaysopen: false
categories:
- docs
- operate
- rs
description: The product lifecycle of Redis Enterprise Software cluster versions and bundled Redis database versions.
linkTitle: Product lifecycle
weight: 100
tocEmbedHeaders: true
---
The Redis Enterprise Software product lifecycle fully reflects the [subscription agreement](https://redis.io/legal/software-agreement/).
However, for any discrepancy between the two policies, the subscription agreement prevails.

Redis Enterprise modules follow the [modules lifecycle]({{< relref "/operate/oss_and_stack/stack-with-enterprise/modules-lifecycle" >}}).

## Redis Enterprise Software cluster version lifecycle

This section describes the lifecycle policy for Redis Enterprise Software cluster versions.

### Cluster version release numbers

Redis Enterprise Software uses a four-place numbering scheme to designate released cluster versions.
The format is "Major1.Major2.Minor-Build".

- Major sections of the version number represents fundamental changes and additions in
    capabilities to Redis  Enterprise Software. The Major1 and Major2 part of the
    version number are incremented based on the size and scale of the changes in each
    release.
- The Minor section of the version number represents quality improvements, fixes to
    existing capabilities, and new capabilities which are typically minor, feature-flagged, or optional. 
- Build number is incremented with any changes to the product. Build number is
    incremented with each build when any change is made to the binaries.

Redis Enterprise Software typically gets two major releases every year but the product shipping cycles may vary.
Maintenance releases, typically available on the last minor release of the current major1.major2 release are typically made available on a monthly cadence, although cycles may vary.

### Cluster version end-of-life schedule {#endoflife-schedule}

For Redis Enterprise Software cluster versions 6.2 and later, the end-of-life (EOL) for each major release occurs 24 months after the formal release of the subsequent major version. Monthly maintenance will be provided on the last minor release of the major1.major2 releases.
This update to the EOL policy allows a lead time of at least 24 months to upgrade to the new cluster version after it is available.


| Version - Release date | End of Life (EOL)  |
| ----------------------------------------- | ------------------ |
| 8.0 – October 2025				        | - |
| 7.22 – May 2025				            | October 30, 2027 |
| 7.8 – November 2024				        | May 30, 2027 |
| 7.4 – February 2024				        | November 30, 2026 |
| 7.2 – August 2023				            | February 28, 2026 |
| 6.4 – February 2023						| August 31, 2025 |
| 6.2 – August 2021                         | February 28, 2025  |
| 6.0 – May 2020                            | May 31, 2022  |
| 5.6 – April 2020                          | October 31, 2021  |
| 5.4 – December 2018                       | December 31, 2020  |
| 5.2 – June 2018                           | December 31, 2019  |

The following timeline chart visualizes the Redis Enterprise Software product lifecycle, showing release dates and end-of-life dates for each major version:

```timeline {title="Redis Enterprise Software product lifecycle"}
8.0: Oct 2025 - TBD
7.22: May 2025 - Oct 30, 2027
7.8: Nov 2024 - May 30, 2027
7.4: Feb 2024 - Nov 30, 2026
7.2: Aug 2023 - Feb 28, 2026
6.4: Feb 2023 - Aug 31, 2025
6.2: Aug 2021 - Feb 28, 2025
6.0: May 2020 - May 31, 2022
5.6: Apr 2020 - Oct 31, 2021
5.4: Dec 2018 - Dec 31, 2020
5.2: June 2018 - Dec 31, 2019
```

### Supported cluster version upgrade paths

{{<embed-md "rs-upgrade-paths.md">}}

For detailed upgrade instructions, see [Upgrade a Redis Enterprise Software cluster]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster">}}).

{{<note>}}
Redis Enterprise for Kubernetes has its own support lifecycle, which accounts for the Kubernetes distribution lifecycle. For details, see [Supported Kubernetes distributions]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions">}}).
{{</note>}}

## Redis database version management

The following sections describe the lifecycle policy for Redis database versions bundled with Redis Enterprise Software.

### Redis database version structure

Redis database versions use a **MAJOR.MINOR.PATCH** versioning scheme:

- **Major versions**: Significant changes that may include breaking changes (for example, Redis 7 → Redis 8)

- **Minor versions**: New features and improvements within a major version (for example, 8.2 → 8.4 → 8.6)

- **Patch versions**: Bug fixes and security updates (for example, 8.2.1 → 8.2.2)

### Redis database version support policy

As of Redis Enterprise Software version 8.0.x, Redis database versions follow a long-term and short-term support model as follows:

- **Long-term support**: The first minor release and last minor release of each major database version receive extended support of 5 years.

- **Short-term support**: Minor versions between the first minor release and last minor release receive short-term support of 6 months.

For example:

| Redis DB version | Release type | Support type |
|------------------|--------------|--------------|
| 8.0 | Major release | Short-term |
| 8.2 | First minor release | Long-term |
| 8.x | Intermediate minor release | Short-term |
| 8.z | Last minor release | Long-term |

Redis database versions have the following end-of-life dates:

| Redis version | End-of-life (EOL) |
|---------------|-------------------|
| **Redis 8.2** | TBD |
| **Redis 8.0** | TBD |
| **Redis 7.4** | December 1, 2029 |
| **Redis 7.2** | December 1, 2029 |
| **Redis 6.2** | April 1, 2027 |

For detailed database upgrade instructions, see [Upgrade a Redis Enterprise Software database]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-database">}}) or [Upgrade an Active-Active database]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-active-active">}}).
