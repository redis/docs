---
Title: Redis Insight v3.6.0, June 2026
linkTitle: v3.6.0 (June 2026)
date: 2026-06-09 00:00:00 +0000
description: Redis Insight v3.6.0
weight: 1
---

## 3.6.0 (June 2026)

This is the General Availability (GA) release of Redis Insight 3.6.0, which includes new features, improvements, and bug fixes.

### Headlines

- Full support for **Vector Sets**, the new Redis 8 vector-native data type: create Vector Sets manually or from a bundled sample dataset, add elements to existing sets, and run similarity search end-to-end from Redis Insight.
- New **Dev vs Production** database mode with safety guardrails: classify databases by environment, surface clear visual indicators, and require type-to-confirm for destructive actions on production.

### Details

- **Vector Sets** are now a supported key type: create new Vector Sets from the Add Key panel — manually with per-element attributes (FP32 or string-array vectors) or in one click via the bundled `vec2word` sample dataset.
- Manage elements from the key details view: inline `VADD` panel for adding, dynamic attribute columns in the element list, and a details drawer with vector copy/download and JSON attribute editing.
- Run similarity search on Vector Sets by raw vector or element name, with attribute-aware filter autocompletion, a toggleable command preview, and a configurable results table with pinned Rank/Similarity columns plus per-element Actions (View, Find similar, Delete).
- New **Dev vs Production** database mode: classify each database as **Production**, **Development**, or **Unspecified** in the connection form, with a PROD badge on production databases and a Development label on development databases.
- Type-to-Confirm modal required on production for high-risk flows: Browser bulk delete, dangerous CLI/Workbench commands, and Profiler start. Run command and bulk import are disabled inside tutorials on production.
- Added a "Skip confirmations on non-production databases" global setting, a per-command session-skip option, and database-environment tagging on command, bulk action, and profiler telemetry events.
- New **Geodata Workbench** plugin renders Redis `GEO` command results as an interactive map, density heatmap, or details card, auto-selected per command.
- Added Copy and Download value actions to `JSON` keys in the Browser, plus a Copy value action on `String` keys that respects the active view format.
- Settings now shows the build commit SHA next to the app version (e.g. `Redis Insight v3.6.0 (a1b2c3d)`) to make it easier to verify which build is deployed.
- **Breaking Change / Deprecation Notice**: Custom tutorials in Workbench have been deprecated and are scheduled for removal in the next major version. The "MY TUTORIALS" section is now hidden by default, but existing users can temporarily restore the previous behavior by setting `RI_CUSTOM_TUTORIALS_ENABLED=true`. We recommend migrating away from custom tutorials before the next major release.

### Bug fixes

- [#5835](https://github.com/redis/RedisInsight/issues/5835) Fixed missing scrollbar on the database list when the viewport height was too small to fit all rows.
- [#5847](https://github.com/redis/RedisInsight/issues/5847) Fixed missing scrollbar in tables across the app at constrained heights, restoring scrollability after the 3.4.2 regression.

**Full Changelog**: https://github.com/redis/RedisInsight/compare/3.4.2...3.6.0

**SHA-512 Checksums**

| Package                | SHA-512                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Windows                | vSOB8uYMGN5pFEwAVgXaUHmx+SLcfh4YVbfGrRW7NZhv467LvzSw3UQAI2Zj6smKQ5ZVkWX+WH9NZOn69owDYQ== |
| Linux AppImage (x64)   | X8BOPIebctOtF+jd64Nj2Kjl1sAQaI+3AC8VQrJpqE0cNmoJUWOCuiSzDUE/exmG53glJVb0DQ4b2m4s9War2Q== |
| Linux AppImage (arm64) | IRlVhj6LMNNiKJbGb4qGmQqrbZCBRWNU9tdTVHMA7XvRnbPEdHLBSZYnSLqoK1BqKc8ARHRWNBOXh6xxvNA0gg== |
| Linux Debian (x64)     | Ak+w3K5Gc1Nj5CLpij2FDyj71tdg4q3a65+AhHwWnoRGlOtUc/QrSkycVpwR8Jz8W6ufgdVGLO7hWmwGfXuPuQ== |
| Linux Debian (arm64)   | H4wYhkrkRDmUSNkH3/HtAItJzZTEkELL3N++xMmNNP6KpYF33rjNtRdm/VI4y+aPsv/P2wGjX/+SMdSZwwSt9A== |
| Linux RPM (x64)        | CLaA5IH1D+fLz11Engm0/YExo3Jdobq/oXBrWst4wzW4Yb5P0ciJyL+p0PpkvSc4iT/mygmEolsjgB8zPdS7yA== |
| Linux RPM (arm64)      | m5ul96vl+06sQ52PHdBjlS6h6KpQpCwdlECkcQdbUk8i+NYWMG2DxpHc7LayrYSs9E2RhTcLBpgcaoNxnOq7yQ== |
| MacOS Intel            | q+rA5WH9sJolbDTK64J8HaNfaDYxEzhCP8MTCq/JRuyxgGNvQck25h3wC+w7omzl2VfCcXNH2wSBPAGKZUqV/A== |
| MacOS Apple silicon    | sRwjNWWKyVJ26SHHIX6ENAnT1bs+XEtXC2cyzwYQXiS7iDz0rgKUd6bmtqpToBWLZK9GhU6g9VLU+73b8m54pw== |
