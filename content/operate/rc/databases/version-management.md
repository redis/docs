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

Redis Cloud balances customer control with automated maintenance to ensure your databases run secure, stable, and performant Redis versions.

{{< note >}}
**We strongly recommend using the latest available version** to benefit from the newest features, performance improvements, and security updates.
{{< /note >}}

## Supported versions

| Version | Type | Status | EOL Date |
|---------|------|--------|----------|
| **Redis 8.2** | STS | GA | TBD |
| **Redis 8.0** | STS | Preview | May 1, 2026 |
| **Redis 7.4** | LTS | GA | TBD |
| **Redis 7.2** | LTS | GA | TBD |
| **Redis 6.2** | LTS | GA | Nov 2025* |

**EOL (End of life)**: Databases on EOL versions are not supported. 
**LTS (Long-Term Support)**: Final minor release of a major version with extended support.
**STS (Short-Term Support)**: All other minor releases, supported for 6 months after the next minor release.

## New version policy (Redis 8.2+)

Starting October 2025:

- **You select**: Major version only (e.g., Redis 8)
- **We manage**: Minor versions automatically within your selected major version
- **You control**: Opt out of auto-upgrades if preferred; major upgrades always require your action

## How it works

### Version selection

**New databases**: Select major version only (Redis 6, 7, or 8). You get the latest minor automatically.

**Minor upgrades**:
- **Redis 8+**: Auto-upgrade enabled by default (can opt out for Pro)
- **Redis 7 and earlier**: Manual upgrades only

### Plan differences

| Feature | Essentials | Pro |
|---------|------------|-----|
| Auto minor upgrades | Always on | Default on, can disable |
| Manual upgrades | No | Yes |
| Maintenance window | Standard | Configurable |

{{< note >}}
If you opt out of auto-upgrades and reach EOL, Redis Cloud will force upgrade after notifications.
{{< /note >}}

## Upgrading databases

### Manual upgrades (Pro)

1. Select your database: **More actions** > **Version upgrade**
2. Choose target version: **Upgrade**

{{< note >}}
Before upgrading: [Back up your data]({{< relref "/operate/rc/databases/back-up-data" >}}), review [breaking changes]({{< relref "/operate/rc/changelog/version-release-notes" >}}), and plan for off-peak hours.
{{< /note >}}

### Auto-upgrade settings (Pro)

**Enable/disable**: **Database details** > **Configuration** > **General** > **Auto-upgrade minor versions**

**Maintenance windows**: **Subscription details** > **Maintenance** > **Set preferred window**

## Compatibility

Redis follows [Semantic Versioning](https://semver.org/): **MAJOR.MINOR.PATCH**

Redis Cloud guarantees:
- No breaking changes in minor releases
- No performance regressions in minor releases
- Backwards compatibility within major versions

## FAQ

**Can I prevent auto-upgrades?**
Pro users can opt out of minor auto-upgrades for Redis 8+. Major upgrades always require your action.

**What if I don't upgrade before EOL?**
Redis Cloud will force upgrade after notifications to ensure security and support.

**Can I downgrade?**
No automatic downgrades. Restore from backup if needed.

**How do I identify LTS vs STS?**
Check the [supported versions table](#supported-versions) or database creation interface.
