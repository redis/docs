---
Title: Redis Insight v3.8.0, July 2026
linkTitle: v3.8.0 (July 2026)
date: 2026-07-20 00:00:00 +0000
description: Redis Insight v3.8.0
weight: 1
---

## 3.8.0 (July 2026)

This is the General Availability (GA) release of Redis Insight 3.8.0, which includes new features, improvements, and bug fixes.

### Headlines

- Full support for the new **Array** data type in Redis 8.8: create Arrays manually or from bundled sample datasets, then browse, search, aggregate, edit, and delete elements end-to-end from Redis Insight.
- A new **What's New** popup highlights the top features of each release right after you upgrade, with per-version browsing and recommended try-it actions; re-open it anytime from Help.
- Choose between **IPv4 and IPv6** when connecting to a database, giving explicit control in environments where one protocol doesn't resolve correctly.

### Details

- **Arrays** are now a supported key type: create them from the Add Key panel — manually in contiguous or sparse mode, or in one click from one of three bundled sample datasets.
- Manage Array elements from the key details view: add or append elements, edit values inline or in a multiline Monaco editor, and delete by single element, multi-select, or index range — with a toggleable command preview across all Array forms.
- Search within Arrays using multi-predicate queries with AND/OR logic and a nearby-elements context band, and run aggregations over elements from the dedicated Aggregate tab. Integer values above 2^53 keep exact precision end to end.
- View values as **Markdown**: a new value format renders stored values as formatted Markdown for every key type.
- "Redis Query Engine" is now called "Redis Search" throughout the app.
- Host and port are now editable for non-managed database connections, so address changes no longer require re-adding the database.
- Added a **Copy diagnostics** button in Settings that copies your app version, OS, and build details, ready to paste into a GitHub issue or support request.
- [#6047](https://github.com/redis/RedisInsight/issues/6047) Azure Entra ID sign-in now supports multi-tenant setups, fixing authentication with Azure Managed Redis when your account's tenant differs from the resource tenant.

**Full Changelog**: https://github.com/redis/RedisInsight/compare/3.6.0...3.8.0

**SHA-512 Checksums**

| Package                | SHA-512                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Windows                | 1TZoW4C0AcRtl/j0cOVpageDZ9jhASyOjtKs2UY7MRjzwdOZ7mPhgGHWe2lAJCN/4uysDn9ucA68WRjXTSoLOg== |
| Linux AppImage (x64)   | FC/+B7uKlGAMjgA9stAOlHiKhKrPjfTDMX3q6VbIriGa3O+fdz3ENidYO7AFDsHE+1jL/iuAQk/wqu6Ma3hb6A== |
| Linux AppImage (arm64) | 4RZwtrlFwE2//8bErH8SAhltQWvHe+dDSP8bxz5wvqmfC6Mf52UWp6gQeR7VAejmKEiEvaHTjtgz5ICMwFXzOw== |
| Linux Debian (x64)     | Se2a4S+Hge60Rl+5GJ8Mz4Z5KHkP2OONcVXeKvrimYmDRItShMZ+8FPLZxdwtq3Qt18BJ/rD2YWglV3MuCFQEw== |
| Linux Debian (arm64)   | hZ2Tl2gI15tRPPUOK6CyEXFz1Je8qbnHZ/M0bzBgmBWeUwNWHZ4h0tkOzw1SWXSDr3mgKNwf1XFptzcQu196FA== |
| Linux RPM (x64)        | 1FTnmHi8sSFLjkbDu6cUu69Ere7zXFhQTsNDeoYJKxuyTMO+nusZu5XZLeCJU2NGUIozEh8hlBDGOb0ZVM2HPw== |
| Linux RPM (arm64)      | vI1Vvl0xgSwBE3F0Z7xtaytwf6QhSrbWYF9/o6p35M+MLQJtieBDCdXuZC8bRg/x9Luw3EgE5XxrOnWxlb7Yow== |
| MacOS Intel            | 0dmaYw+VzK6DWSD5XDvSSvmkrTWvnyN7o2kf6TQRu1842pLNaDho8rZivf0xxV+CKWTRd82b0BnSe8CD6ePc1A== |
| MacOS Apple silicon    | l4fC6xeDeZYYLMIVAMOoTyGy+R9DXcnlAktjgi6gNwVUgCN9BxnMvshRxcFTbeO+zrGtbcAfoO7/TDxl8FAq2g== |
