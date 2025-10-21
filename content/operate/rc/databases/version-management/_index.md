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

Redis Cloud provides comprehensive version management that balances automatic updates for security and performance with customer control over major changes.

## Redis versioning and upgrade policy

### Version structure

Redis uses a **MAJOR.MINOR.PATCH** versioning scheme:

- **Major versions**: Significant changes that may include breaking changes (e.g., Redis 7 → Redis 8)
- **Minor versions**: New features and improvements within a major version (e.g., 8.2 → 8.4 → 8.6)
- **Patch versions**: Bug fixes and security updates (e.g., 8.2.1 → 8.2.2)

### Upgrade policies

#### Minor version upgrades (8.2 → 8.4 → 8.6) {#minor-upgrades}

Starting with Redis 8.2 (October 2025):

- **Automatic upgrades**: Redis Cloud automatically upgrades to new minor versions when available
- **Maintenance windows**: All upgrades occur during your subscription's configured maintenance windows
- **Customer control**: Pro users can opt out of automatic minor upgrades
- **Forced upgrades**: If auto-upgrade is disabled and a version reaches EOL, Redis Cloud will force upgrade during maintenance windows

#### Major version upgrades (7.4 → 8.2) {#major-upgrades}

- **Customer control**: Always require explicit customer action
- **No automatic upgrades**: Redis Cloud never automatically upgrades major versions
- **Customer timing**: You choose when to upgrade to a new major version

## Version support models

Redis Cloud uses two version support models.

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
- Databases with auto-upgrades disabled are automatically upgraded to the next supported version during maintenance windows

## Version selection

When creating a database, you select the version (e.g., Redis 8.2). Redis Cloud automatically provides the latest patch version within that version.

For existing databases:

- **Redis 8+**: Minor version auto-upgrades are available (with opt-out for Pro users)
- **Redis 7 and earlier**: Auto-upgrade for minor versions is not supported; all upgrades must be done manually. See [Upgrade database version]({{< relref "/operate/rc/databases/version-management/upgrade-version" >}}) for more details.

### Plan differences

| Feature | Essentials | Pro |
|---------|------------|-----|
| Minor version auto-upgrades (Redis 8+) | Always enabled, upgrades to latest minor version | Default enabled, can disable |
| Major version upgrades | Customer controlled | Customer controlled |
| Manual upgrades | Yes | Yes |
| [Automatic upgrade time]({{< relref "/operate/rc/subscriptions/maintenance" >}}) | Standard - between 12 AM and 6 AM region time | Configurable - [Set maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}) |

## Supported versions

{{< note >}}
**We strongly recommend using the latest available version** to benefit from the newest features, performance improvements, and security updates.
{{< /note >}}

| Version | Type | Status | EOL Date | Plans |
|---------|------|--------|----------|-------|
| **Redis 8.2** | STS | GA | TBD | Essentials, Pro |
| **Redis 8.0** | STS | *Preview | May 1, 2026 | Essentials |
| **Redis 7.4** | LTS | GA | Apr 30, 2028 | Essentials, Pro |
| **Redis 7.2** | STS | *GA | Oct 30, 2027 | Essentials, Pro |
| **Redis 6.2** | LTS | GA | 2026 | Pro |

*Redis 8.0 is not available for new databases.

## Manual upgrades

You can update your databases to a later version if by selecting **More actions** > **Version upgrade** from the database list or database page.

Before upgrading, you should:

- Review the [release notes]({{< relref "/operate/rc/changelog/version-release-notes" >}}) for your target version and all versions in between to ensure compatibility with your applications.
- [Back up your data]({{< relref "/operate/rc/databases/back-up-data" >}}), review [breaking changes]({{< relref "/operate/rc/changelog/version-release-notes" >}}).
- Upgrade your staging or QA database before upgrading your production database.

See [Upgrade database version]({{< relref "/operate/rc/databases/version-management/upgrade-version" >}}) for detailed instructions.

## FAQ

**Can I prevent minor version auto-upgrades?**
Pro users can opt out of minor version auto-upgrades for Redis 8+. If disabled and a version reaches EOL, Redis Cloud will force upgrade during maintenance windows. Major upgrades always require your action.

**What if I don't upgrade before EOL?**
Redis Cloud will force upgrade after notifications to ensure security and support.

**Can I downgrade?**
Automatically reverting to a previous Redis version is not supported on Redis Cloud. See [Manually revert upgrade]({{< relref "/operate/rc/databases/version-management/upgrade-version#manually-revert-upgrade" >}}) for more details.

**How do I identify LTS vs STS?**
Check the [supported versions table](#supported-versions).
