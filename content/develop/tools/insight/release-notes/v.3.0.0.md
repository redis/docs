---
Title: Redis Insight v3.0.0, November 2025
linkTitle: v3.0.0 (November 2025)
date: 2025-11-30 00:00:00 +0000
description: Redis Insight v3.0.0
weight: 1
---

## 3.0.0 (November 2025)

This is the General Availability (GA) release of Redis Insight 3.0.0.

### Headlines

- Refreshed UI with modernized visuals and a more intuitive workflow, making it easier for devs to inspect keys, debug data issues, and move quickly between tasks. The updated design also aligns Redis Insight with the Redis Cloud experience for a unified visual model.
- New top-level navigation replacing the left sidebar, making high-usage tools like Browser and Workbench easier to find and access. This layout sets the foundation for upcoming workflow-driven enhancements.

### Details

- Refreshed UI with modernized visuals and a more intuitive workflow, making it easier for devs to inspect keys, debug data issues, and move quickly between tasks.
- [#5190](https://github.com/redis/RedisInsight/pull/4777) Introduced a new navigation menu that improves discoverability and reduces clicks for common developer workflows.

### Bugs

- [#5218](https://github.com/redis/RedisInsight/issues/5218) RDI job name field not loading when reopening a job (Redis Data Integration 1.14+ via Redis Insight).
- [#4927](https://github.com/redis/RedisInsight/issues/4927) Database list search now properly filters not-connected databases.
- [#5190](https://github.com/redis/RedisInsight/issues/5190) Electron version bump resolves a MacOS 26 compatibility issue.

**SHA-256 Checksums**

| Package             | SHA-256 |
| ------------------- | ------- |
| Windows             |         |
| Linux AppImage      |         |
| Linux Debian        |         |
| Linux RPM           |         |
| MacOS Intel         |         |
| MacOS Apple silicon |         |
