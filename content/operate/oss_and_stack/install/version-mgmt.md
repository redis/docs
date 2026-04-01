---
Title: Redis Open Source version management
alwaysopen: false
categories:
- docs
- operate
- oss
description: Describes Redis Open Source supported database versions.
linkTitle: Version management
weight: 25
tocEmbedHeaders: true
---

Redis Open Source provides comprehensive version management that prioritizes customer control over major changes. 

## Redis version structure

Redis uses a **MAJOR.MINOR.PATCH** versioning scheme:

- **Major versions**: Significant changes that may include breaking changes (e.g., Redis 7 → Redis 8)
- **Minor versions**: New features and improvements within a major version (e.g., 8.2 → 8.4 → 8.6)
- **Patch versions**: Bug fixes and security updates (e.g., 8.2.1 → 8.2.2)

## Supported versions

{{< note >}}
**We strongly recommend using the latest available version** to benefit from the newest features, performance improvements, and security updates.
{{< /note >}}

| Version | Status | EOL Date |
|---------|--------|----------|
| **Redis 8.4** | GA | TBD |
| **Redis 8.2** | GA | TBD |
| **Redis 8.0** | GA | TBD |
| **Redis 7.4** | GA | December 1, 2029 |
| **Redis 7.2** | GA | December 1, 2029 |
| **Redis 6.2** | GA | April 1, 2027 |
