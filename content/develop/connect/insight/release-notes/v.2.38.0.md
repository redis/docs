---
Title: RedisInsight v2.38.0, November 2023
linkTitle: v2.38.0 (November 2023)
date: 2023-11-29 00:00:00 +0000
description: RedisInsight v2.38
weight: 1
---
## 2.38 (November 2023)
This is the General Availability (GA) release of RedisInsight 2.38.

### Highlights
- Major UX improvements and space optimization for a cleaner and more organized Tree view, ensuring easier namespace navigation and faster key browsing. Additionally, in Tree view, you can now sort your Redis key names alphabetically.
- Renamed the application from RedisInsight v2 to simply RedisInsight

### Details

**Features and improvements**

- [#2706](https://github.com/RedisInsight/RedisInsight/pull/2706), [#2783](https://github.com/RedisInsight/RedisInsight/pull/2783) Major UX improvements and space optimization for a cleaner and more organized Tree view. This includes consolidating the display of namespaces and keys in a dedicated section and omitting namespace information from key names in the list of keys. In addition, the Tree view introduces a new option to alphabetically sort Redis key names.
- [#2751](https://github.com/RedisInsight/RedisInsight/pull/2751) Renamed the application from RedisInsight v2 to simply RedisInsight
- [#2799](https://github.com/RedisInsight/RedisInsight/pull/2799) Automatically make three retries to establish or re-establish a database connection if an error occurs

**Bugs**
- [#2793](https://github.com/RedisInsight/RedisInsight/pull/2793) [Do not require](https://github.com/RedisInsight/RedisInsight/issues/2765) an SSH password or passphrase
- [#2794](https://github.com/RedisInsight/RedisInsight/pull/2794) Prevent [potential crashes](https://github.com/RedisInsight/RedisInsight/issues/2763) caused by using parentheses in usernames on the Windows operating system
- [#2797](https://github.com/RedisInsight/RedisInsight/pull/2797) Avoid initiating a bulk deletion or Profiler after the operating system resumes from sleep mode
