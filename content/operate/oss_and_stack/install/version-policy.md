---
Title: Redis version policy and structure
alwaysopen: false
categories:
- docs
- operate
- oss
description: Describes Redis version management policy and supported versions.
linkTitle: Version policy
weight: 25
---

Redis Open Source uses a version policy that defines how long patches and security updates are provided for each version after release.

## Version structure

Redis uses a **MAJOR.MINOR.PATCH** versioning scheme:

- **Major versions**: Significant changes that may include breaking changes (e.g., Redis 7 → Redis 8)
- **Minor versions**: New features and improvements within a major version (e.g., 8.2 → 8.4 → 8.6)
- **Patch versions**: Bug fixes and security updates (e.g., 8.2.1 → 8.2.2)

## Version support models

Redis Open Source uses two version support models.

### LTS (Long-Term Support) {#lts}

LTS versions are the final minor release of each major version (along with Redis 7.2) and receive **5 years of extended support**, including security updates and major bug fixes.

These versions are ideal for:

- Production environments requiring stability
- Applications with infrequent upgrade cycles
- Enterprise deployments with strict change management

**Current LTS versions**: Redis 6.2, 7.2, 7.4

### STS (Short-Term Support) {#sts}

STS versions include all minor releases except the final one in each major version. These versions receive security updates and bug fixes for **6 months** after the next minor release.

**Current STS versions**: Redis 8.0, 8.2

### End-of-life (EOL) {#eol}

When a version reaches EOL, bug fixes and security updates will no longer be released. Users are encouraged to upgrade to the latest minor version within the same major version. 

## Supported versions

{{< note >}}
**We strongly recommend using the latest available version** to benefit from the newest features, performance improvements, and security updates.
{{< /note >}}

| Version | Type | Status | EOL Date |
|---------|------|--------|----------|
| **Redis 8.2** | STS | GA | TBD |
| **Redis 8.0** | STS | GA | May 1, 2026 | 
| **Redis 7.4** | LTS | GA | December 1, 2029 |
| **Redis 7.2** | LTS | GA | December 1, 2029 | 
| **Redis 6.2** | LTS | GA | 2026 | 


