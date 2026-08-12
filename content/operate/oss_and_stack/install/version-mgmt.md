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

- **Major versions**: Significant changes that may include breaking changes (for example, Redis 7 → Redis 8).
- **Minor versions**: New features and improvements within a major version (for example, 8.2 → 8.4 → 8.6 → 8.8).
- **Patch versions**: Bug fixes and security updates (for example, 8.6.1 → 8.6.2).

## Version release model

Redis uses two release types within a major version:

- **Standard releases** are the first release in a major version series (for example, 8.0) and intermediate minor releases (for example, 8.4, 8.6). These releases receive security updates and critical bug fixes for 6 months after the following minor version is released.
- **Extended releases** are the second minor release in a major version series (for example, 8.2) and the final minor release in a series. These releases receive security updates and critical bug fixes for 5 years after their release date.

## Supported versions

{{< note >}}
**We strongly recommend using the latest available version** to benefit from the newest features, performance improvements, and security updates.
{{< /note >}}

| Version | Release type | Status | EOL Date |
|---------|--------------|--------|----------|
| **Redis 8.10** | Standard | GA | TBD |
| **Redis 8.8**  | Standard | GA | TBD |
| **Redis 8.6**  | Standard | GA | TBD |
| **Redis 8.4**  | Standard | GA | TBD |
| **Redis 8.2**  | Extended | GA | September 1, 2030 |
| **Redis 8.0**  | Standard | GA | December 1, 2026 |
| **Redis 7.4**  | Extended | GA | December 1, 2029 |
| **Redis 7.2**  | Extended | GA | December 1, 2029 |
| **Redis 6.2**  | Extended | GA | April 1, 2027 |
