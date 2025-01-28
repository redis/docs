---
Title: RedisInsight v2.6.0, July 2022
linkTitle: v2.6.0 (July 2022)
date: 2022-07-25 00:00:00 +0000
description: RedisInsight v2.6.0
weight: 8
---

## 2.6.0 (July 2022)
This is the General Availability (GA) release of RedisInsight 2.6.0

### Headlines:
- Bulk actions: Delete the keys in bulk based on the filters set in Browser or Tree view
- Multiline support for key values in Browser and Tree View: Click the key value to see it in full
- [Pipeline](https://redis.io/docs/manual/pipelining/) support in Workbench: Batch Redis commands in Workbench to optimize round-trip times
- In-app notifications: Receive messages about important changes, updates, or announcements inside the application. Notifications are always available in the Notification center, and can be displayed with or without preview.

### Details
**Features and improvements:**
- [#890](https://github.com/RedisInsight/RedisInsight/pull/890), [#883](https://github.com/RedisInsight/RedisInsight/pull/883), [#875](https://github.com/RedisInsight/RedisInsight/pull/875) Delete keys in bulk from your Redis database in Browser and Tree view based on filters you set by key name or data type.
- [#878](https://github.com/RedisInsight/RedisInsight/pull/878) Multiline support for key values in Browser and Tree View: Select the truncated value to expand the row and see the full value, select again to collapse it.
- [#837](https://github.com/RedisInsight/RedisInsight/pull/837), [#838](https://github.com/RedisInsight/RedisInsight/pull/838) Added [pipeline](https://redis.io/docs/manual/pipelining/) support for commands run in Workbench to optimize round-trip times. Default number of commands sent in a pipeline is 5, and is configurable in Settings > Advanced. 
- [#862](https://github.com/RedisInsight/RedisInsight/pull/862), [#840](https://github.com/RedisInsight/RedisInsight/pull/840) Added in-app notifications to inform you about any important changes, updates, or announcements. Notifications are always available in the Notification center, and can be displayed with or without preview.
- [#830](https://github.com/RedisInsight/RedisInsight/pull/830) To more easily explore and work with stream data, always display stream entry ID and controls to remove the Stream entry regardless of the number of fields.
- [#928](https://github.com/RedisInsight/RedisInsight/pull/928) Remember the sorting on the list of databases.

**Bugs fixed:**
- [#932](https://github.com/RedisInsight/RedisInsight/pull/932) Refresh the JSON value in Browser/Tree view.
