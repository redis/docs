---
aliases: /develop/connect/clients/version-support
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Understand how Redis maintains and versions its official client libraries
linkTitle: Support & versioning
title: Client library support and versioning policy
weight: 150
---

Official Redis client libraries are covered by the
[Redis Software Support Policy](https://redis.io/legal/software-support-policy/).
This page describes the client-library-specific maintenance and versioning
policy that clarifies active support, testing expectations, and backporting
rules for those clients.

The policy is based on the non-EOL Redis Server **major.minor** versions
currently available in Redis Cloud, as listed in
[Supported database versions]({{< relref "/operate/rc/databases/version-management#supported-database-versions" >}}).

## Versioning

Redis client libraries use a `major.minor.patch` versioning scheme that follows
[Semantic Versioning 2.0.0](https://semver.org/):

-   **Major** versions may introduce incompatible API changes.
-   **Minor** versions add backward-compatible functionality.
-   **Patch** versions contain backward-compatible bug fixes.

## Maintained release line

The latest `major.minor` release of each official Redis client library is the
primary maintained release line. In practice, this means it is the line under
active development and the one where regular bug fixes and new features are
delivered.

Client libraries follow a forward-moving model: each new `major.minor` release
is cut from the main branch, and a version branch is created at the same time
for future patch and maintenance releases (for example, `5.2.x`).

## Supported Redis API versions

Each new client `major`, `minor`, and `patch` release is tested against a
compatibility matrix of the
[non-EOL Redis API versions]({{< relref "/operate/rc/databases/version-management#supported-database-versions" >}})
currently available. For example, if the supported API versions are 6.2, 7.2,
and 7.4, then each client release is tested against all three. The release notes
for each client report the compatibility matrix used for testing.

The table below shows some examples of client releases and the API versions they
are tested against:

| Example client release | Supported Redis API versions | Client testing targets |
| :-- | :-- | :-- |
| Jedis 5.2 | 6.2, 7.2, 7.4 | Test with 6.2, 7.2, 7.4 |
| redis-py 5.3 | 6.2, 7.2, 7.4, 8.0 | Test with 6.2, 7.2, 7.4, 8.0 |
| Jedis 6.0 | 6.2, 7.2, 7.4, 8.2 | Test with 6.2, 7.2, 7.4, 8.2 |

A similar matrix is also published on each client library's GitHub repository.

## Bugs, vulnerabilities, and community contributions

Redis keeps innovation on the latest maintained line and reserves older lines
for critical fixes and security updates. This keeps the support matrix clean and
reduces the testing and maintenance overhead of supporting many branches at once.

-   **Regular bug fixes** are delivered either in a new `major.minor` release or,
    depending on the overall content, in a new patch release on the current
    maintained line. Non-critical bug fixes and new features are *not* backported
    to older client `major.minor` versions. For example, if a bug is found in a
    client library release 5.2 and the fix is released in 5.2.1, the same
    non-critical fix is not backported to older versions such as 5.1.
-   **Critical bugs and security vulnerabilities**, including CVEs, are backported
    to the latest patch version of a `major.minor` and may also be backported to
    patch releases of older versions.
-   **Community-contributed fixes** to older versions are reviewed on a
    case-by-case basis. If a fix is considered useful for future versions, it is
    also ported to the main branch for a future major, minor, or patch release.

## Recommendations

-   Use the latest `major.minor` client library release available.
-   Read the release notes for version-specific changes and for the compatibility
    matrix used in testing.
-   Test upgrades with production-like workloads and configurations before rolling
    them out broadly, especially when moving across major or minor versions.
