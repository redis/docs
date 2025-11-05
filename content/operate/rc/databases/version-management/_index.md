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
hideListLinks: true
tocEmbedHeaders: true
---

Redis Cloud provides comprehensive version management that balances automatic updates for security and performance with customer control over major changes.

## Redis version structure

Redis uses a **MAJOR.MINOR.PATCH** versioning scheme:

- **Major versions**: Significant changes that may include breaking changes (e.g., Redis 7 → Redis 8)
- **Minor versions**: New features and improvements within a major version (e.g., 8.2 → 8.4 → 8.6)
- **Patch versions**: Bug fixes and security updates (e.g., 8.2.1 → 8.2.2)

## Supported versions

{{< note >}}
**We strongly recommend using the latest available version** to benefit from the newest features, performance improvements, and security updates.
{{< /note >}}

| Version | Status | EOL Date | Plans |
|---------|--------|----------|-------|
| **Redis 8.2** | GA | TBD | Essentials, Pro |
| **Redis 8.0** | Preview | TBD | Essentials |
| **Redis 7.4** | GA | December 1, 2029 | Essentials, Pro |
| **Redis 7.2** | GA | December 1, 2029 | Essentials, Pro |
| **Redis 6.2** | GA | 2026 | Pro |

When a version reaches End-of-Life (EOL), Redis Cloud will automatically upgrade your database to the latest minor version during maintenance windows if you do not manually upgrade before EOL.

## Version selection

When creating a database, you select the version (e.g., Redis 8.2). Redis Cloud automatically provides the latest patch version within that version.

For existing databases, all upgrades must be done manually. See [Upgrade database version]({{< relref "/operate/rc/databases/version-management/upgrade-version" >}}) for more details.

## Manual upgrades

You can update your databases to a later version if by selecting **More actions** > **Version upgrade** from the database list or database page.

Before upgrading, you should:

- Review the [release notes]({{< relref "/operate/rc/changelog/version-release-notes" >}}) for your target version and all versions in between to ensure compatibility with your applications.
- [Back up your data]({{< relref "/operate/rc/databases/back-up-data" >}}), review [breaking changes]({{< relref "/operate/rc/changelog/version-release-notes" >}}).
- Upgrade your staging or QA database before upgrading your production database.

See [Upgrade database version]({{< relref "/operate/rc/databases/version-management/upgrade-version" >}}) for detailed instructions.

