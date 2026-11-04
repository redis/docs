---
Title: Redis Software product lifecycle
alwaysopen: false
categories:
- docs
- operate
- rs
description: The product lifecycle of Redis Software cluster versions and bundled Redis database versions.
linkTitle: Product lifecycle
weight: 100
tocEmbedHeaders: true
url: '/operate/rs/8.0/installing-upgrading/product-lifecycle/'
---
The Redis Software product lifecycle fully reflects the [subscription agreement](https://redis.io/legal/software-agreement/).
However, for any discrepancy between the two policies, the subscription agreement prevails.

Redis Software modules follow the [modules lifecycle](/content/operate/rs/installing-upgrading/modules-lifecycle.md).

## Redis Software cluster version lifecycle

This section describes the lifecycle policy for Redis Software cluster versions.

### Cluster version release numbers

Redis Software uses a four-place numbering scheme to designate released cluster versions.
The format is "Major1.Major2.Minor-Build".

- Major sections of the version number represents fundamental changes and additions in
    capabilities to Redis Software. The Major1 and Major2 part of the
    version number are incremented based on the size and scale of the changes in each
    release.
- The Minor section of the version number represents quality improvements, fixes to
    existing capabilities, and new capabilities which are typically minor, feature-flagged, or optional. 
- Build number is incremented with any changes to the product. Build number is
    incremented with each build when any change is made to the binaries.

Redis Software typically gets two major releases every year but the product shipping cycles may vary.
Maintenance releases, typically available on the last minor release of the current major1.major2 release are typically made available on a monthly cadence, although cycles may vary.

### Cluster version end-of-life schedule {#endoflife-schedule}

For Redis Software cluster versions 6.2 and later, the end-of-life (EOL) for each major release occurs 24 months after the formal release of the subsequent major version. Monthly maintenance will be provided on the last minor release of the major1.major2 releases.
This update to the EOL policy allows a lead time of at least 24 months to upgrade to the new cluster version after it is available.


| Version - Release date | End of Life (EOL)  |
| ----------------------------------------- | ------------------ |
| 8.0 – October 2025				        | July 31, 2028 |
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

The following timeline chart visualizes the Redis Software product lifecycle, showing release dates and end-of-life dates for each major version:

```timeline {title="Redis Software product lifecycle"}
8.0: Oct 2025 - Jul 31, 2028
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

For detailed upgrade instructions, see [Upgrade a Redis Software cluster](/content/operate/rs/8.0/installing-upgrading/upgrading/upgrade-cluster.md).

> [!NOTE]
> Redis Enterprise for Kubernetes has its own support lifecycle, which accounts for the Kubernetes distribution lifecycle. For details, see [Supported Kubernetes distributions](/content/operate/kubernetes/reference/supported_k8s_distributions.md).

## Bundled Redis database versions

Each cluster version of Redis Software includes a set of Redis database versions as follows:

{{<embed-md "rs-bundled-db-versions.md">}}

## Redis database version lifecycle

Redis database versions have their own end-of-life dates, separate from the cluster version lifecycle. A database can reach end of life while the cluster version it runs on is still supported.

### Database version numbers

Redis database versions use a **MAJOR.MINOR.PATCH** versioning scheme:

- **Major versions**: Significant changes that may include breaking changes (for example, Redis 7 → Redis 8).

- **Minor versions**: New features and improvements within a major version (for example, 8.2 → 8.4 → 8.6).

- **Patch versions**: Bug fixes and security updates (for example, 8.2.1 → 8.2.2).

### Database version support models

Redis database versions follow the same support model on Redis Software as on [Redis Cloud](/content/operate/rc/databases/version-management/_index.md) and [Redis Open Source](/content/operate/oss_and_stack/install/version-mgmt.md):

- **Long-term support (LTS)**: The second minor version and the last minor version of each major version. LTS versions receive security updates and critical bug fixes for 5 years after release.

- **Short-term support (STS)**: All other minor versions, including the first release of a major version. STS versions are supported for 6 months after the next minor version is released.

For example:

| Redis database version | Release in the major version | Support model |
| --- | --- | --- |
| 8.0 | First release | STS |
| 8.2 | Second minor release | LTS |
| 8.4, 8.6, and later intermediate releases | Intermediate minor release | STS |
| Last 8.x release | Last minor release | LTS |

An STS database version loses support at its own end-of-life date, even when the cluster version it runs on is still supported. Before an STS version reaches end of life, upgrade the database to a later STS or LTS version within the same major version. Minor versions within a major version don't introduce breaking changes.

To stay on one database version in production for a long time, use an LTS version, such as Redis 8.2.

### Database version end-of-life schedule

| Redis database version | Support model | End of life (EOL) |
| --- | --- | --- |
| Redis 8.6 | STS | TBD |
| Redis 8.4 | STS | January 1, 2027 |
| Redis 8.2 | LTS | September 1, 2030 |
| Redis 8.0 | STS | December 1, 2026 |
| Redis 7.4 | LTS | December 1, 2029 |
| Redis 7.2 | LTS | December 1, 2029 |
| Redis 6.2 | LTS | April 1, 2027 |

The following timeline chart shows the general availability (GA) release date and end-of-life date for each Redis database version:

```timeline {title="Redis database version lifecycle"}
8.6: Feb 2026 - TBD
8.4: Nov 2025 - Jan 1, 2027
8.2: Aug 2025 - Sep 1, 2030
8.0: May 2025 - Dec 1, 2026
7.4: Jul 2024 - Dec 1, 2029
7.2: Aug 2023 - Dec 1, 2029
6.2: Feb 2021 - Apr 1, 2027
```

To upgrade a database, see [Upgrade a Redis Software database](/content/operate/rs/8.0/installing-upgrading/upgrading/upgrade-database.md) or [Upgrade an Active-Active database](/content/operate/rs/8.0/installing-upgrading/upgrading/upgrade-active-active.md).
