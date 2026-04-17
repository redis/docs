---
Title: Redis Insight v3.4.1, April 2026
linkTitle: v3.4.1 (April 2026)
date: 2026-04-17 00:00:00 +0000
description: Redis Insight v3.4.1
weight: 1
---

## 3.4.1 (April 2026)

This is the General Availability (GA) release of Redis Insight 3.4.1, which includes new features, enhancements and bug fixes.

### Headlines

- New dedicated Search workspace with full index lifecycle support: create indexes from sample data or existing user data, query indexed data with an assisted editor, and save queries to a Query Library for reuse.
- Enhancements for Azure integration, including Entra ID Docker support, Access Key authentication, and a manual connection form.

### Details

- New dedicated Search page with index listing, index creation, a query editor with Profile and Explain actions, and a Query Library for saving and reusing queries.
- Create indexes from sample data to explore how Redis Search works, or from existing user data with automatic field detection and index type configuration.
- Navigate between Browser and Search workspaces: review the indexed data in the Browser, view indexed keys and their associated indexes, and create indexes directly from the Browser key list.
- Azure Entra ID authentication support for Docker deployments. [To get started, follow the Azure Docker setup guide.](https://github.com/redis/RedisInsight/blob/main/docs/azure-docker-setup.md)
- Added a manual connection form for Azure Redis databases, allowing users to configure or override autodiscovery connection details.
- Added Access Key authentication support for Azure Redis databases as an alternative to Entra ID.
- Added client-side column sorting for the Browser key list, allowing users to sort by Key, TTL, or Size directly from the Columns popover.
- [#5637](https://github.com/redis/RedisInsight/issues/5637) Added Linux ARM64 release support with AppImage, deb, and rpm packages.

### Bug fixes

- [#5394](https://github.com/redis/RedisInsight/issues/5394) Fixed startup error on first install caused by missing `.redis-insight/logs` directory when the parent directory does not exist yet.
- [#5515](https://github.com/redis/RedisInsight/issues/5515) Added Redis Insight version display in the Web UI Settings, making it easier to verify deployments when running via Docker.
- [#5540](https://github.com/redis/RedisInsight/issues/5540) Fixed incorrect deserialization of DateTimeOffset values in MessagePack objects.
- [#5412](https://github.com/redis/RedisInsight/issues/5412) Fixed JSON error when viewing keys containing 'constructor' in the key name.
- [#5608](https://github.com/redis/RedisInsight/issues/5608) Fixed Workbench view-type dropdown crash when external plugins are loaded.
- [#5587](https://github.com/redis/RedisInsight/issues/5587) Workbench output settings now persist between commands, so users no longer need to reconfigure their preferred view each time.

**Full Changelog**: https://github.com/redis/RedisInsight/compare/3.2.0...3.4.1

**SHA-512 Checksums**

| Package             | SHA-512                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Windows             |                                                                                          |
| Linux AppImage      |                                                                                          |
| Linux Debian        |                                                                                          |
| Linux RPM           |                                                                                          |
| MacOS Intel         |                                                                                          |
| MacOS Apple silicon |                                                                                          |
