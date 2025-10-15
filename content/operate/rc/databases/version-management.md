---
Title: Redis version management
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes Redis Cloud version management policy, supported versions, and upgrade options.
linkTitle: Version management
weight: 36
tocEmbedHeaders: true
---

Redis Cloud gives you control over major version upgrades, while minor version upgrades are managed automatically to simplify operations and reduce the risk of compatibility issues.

## Version policy

Starting with Redis 8.2 (October 2025), Redis Cloud manages minor version upgrades automatically:

- **You choose the major version** (7.8) when creating a database
- **We automatically upgrade minor versions** within that major version (7.8.2 → 7.8.4 → 7.8.6)
- **You control major upgrades** (7.8 → 8.2) - these always require your explicit action
- **You can opt out** of automatic minor upgrades (Pro plans only)

### Version types

In the Redis versioning scheme:
    - **major versions** are represented by the first two numbers (e.g., 7.4)
    - **minor versions** are represented by the third number (e.g., 7.4.2)

## Version support models

Redis Cloud uses two version support models:

### LTS (Long-Term Support)

LTS versions are the final minor release of each major version and receive **5 years of extended support**. These versions are ideal for:

- Production environments requiring stability
- Applications with infrequent upgrade cycles
- Enterprise deployments with strict change management

**Current LTS versions**: Redis 6.2, 7.2, 7.4

### STS (Short-Term Support)

STS versions include all minor releases except the final one in each major version. These versions:

- Receive support for **6 months** after the next minor release
- Provide access to the latest features and improvements
- Are automatically upgraded when they reach end-of-life

**Current STS versions**: Redis 8.0, 8.2

### End-of-life (EOL)

When a version reaches EOL:
- Technical support is no longer provided
- Security updates are not available
- Databases are automatically upgraded to the next supported version (if auto-upgrades are enabled)

## How version selection works

### For new databases

When creating a database, you select the **major version only**. Redis Cloud automatically provides the latest minor version within that major version.

### For existing databases

- **Redis 8+**: Minor versions are managed automatically (with opt-out available for Pro)
- **Redis 7 and earlier**: You control all version upgrades manually

### Plan differences

| Feature | Essentials | Pro |
|---------|------------|-----|
| Auto minor upgrades (Redis 8+) | Always enabled | Default enabled, can disable |
| Manual upgrades | No | Yes |
| Maintenance window | Standard | Configurable |

## Supported versions

{{< note >}}
**We strongly recommend using the latest available version** to benefit from the newest features, performance improvements, and security updates.
{{< /note >}}

| Version | Type | Status | EOL Date | Plans |
|---------|------|--------|----------|-------|
| **Redis 8.2** | STS | GA | TBD | Essentials, Pro |
| **Redis 8.0** | STS | *Preview | May 1, 2026 | Essentials |
| **Redis 7.4** | LTS | GA | Apr 30, 2028 | Essentials, Pro |
| **Redis 7.2** | LTS | *GA | Oct 30, 2027 | Essentials, Pro |
| **Redis 6.2** | LTS | GA | 2026 | Pro |

*Redis 8.0 is not available for new databases.

## Manual upgrades

### Before upgrading

- Review the [breaking changes]({{< relref "/operate/rc/changelog/version-release-notes" >}}) for your target version to ensure compatibility with your applications.
- [Back up your data]({{< relref "/operate/rc/databases/back-up-data" >}}), review [breaking changes]({{< relref "/operate/rc/changelog/version-release-notes" >}}), and plan for off-peak hours.

Redis Cloud Pro users can upgrade their databases at any time:

1. Select your database: **More actions** > **Version upgrade**
2. Choose target version: **Upgrade**

For information about automatic minor version upgrades and configuration options, see [Database configuration]({{< relref "/operate/rc/databases/view-edit-database" >}}).

## FAQ

**Can I prevent auto-upgrades?**
Pro users can opt out of minor auto-upgrades for Redis 8+. Major upgrades always require your action.

**What if I don't upgrade before EOL?**
Redis Cloud will force upgrade after notifications to ensure security and support.

**Can I downgrade?**
No automatic downgrades. Restore from backup if needed.

**How do I identify LTS vs STS?**
Check the [supported versions table](#supported-versions).
