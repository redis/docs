---
Title: Redis Insight v3.0.0, November 2025
linkTitle: v3.0.0 (November 2025)
date: 2025-11-30 00:00:00 +0000
description: Redis Insight v3.0.0
weight: 1
---

## 3.0.0 (November 2025)

This is the General Availability (GA) release of Redis Insight 3.0.0, a major version upgrade that introduces a new UI experience, a new navigation architecture, and foundational improvements that set the stage for faster, more powerful developer workflows from now on.

### Headlines

- Refreshed UI with modernized visuals and a more intuitive workflow, making it easier for developers to inspect keys, debug data issues, and move quickly between tasks. The updated design also aligns Redis Insight with the Redis Cloud experience for a unified visual model.
- New top-level navigation that replaces the left sidebar, making high-usage tools like Browser and Workbench easier to find and access. This layout sets the foundation for improved workflow-driven enhancements.

### Details

- Refreshed UI with modernized visuals and a more intuitive workflow, making it easier for developers to inspect keys, debug data issues, and move quickly between tasks.
- [#5190](https://github.com/redis/RedisInsight/pull/4777) Introduced a new navigation menu that improves discoverability and reduces clicks for common developer workflows.

### Bugs

- [#5218](https://github.com/redis/RedisInsight/issues/5218) RDI job name field not loading when reopening a job (Redis Data Integration 1.14+).
- [#4927](https://github.com/redis/RedisInsight/issues/4927) Database list search now properly filters not-connected databases.
- [#5190](https://github.com/redis/RedisInsight/issues/5190) Electron version bump resolves a MacOS 26 compatibility issue.

**SHA-256 Checksums**

| Package             | SHA-256                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Windows             | uv0RwVZt5xIBbFWepOgss0Zdiz8/TuyEcUKYBnzaVPPkIfpxHFpV2LaJ+MNHuQoJETObNQtGcSGtqL/o09pMJQ== |
| Linux AppImage      | IgQoAayGvrvEHCqix+4GsWt5+nHA5ROJ0vjSdg6+NggTPwfOpP6pHuGIvMlQP2pXjdeynaDPeWY5d+hQWpYtNA== |
| Linux Debian        | nD27nc7EO0OaML9McebDwrLwp1nfDPwZx9OWQvseomwgvDU0OWbjib5DL31CVqFBE6YNQedYMTatiSF5qmymlw== |
| Linux RPM           | GzzN86sAmQiikfbfV4k3Hc6mV+9DZZAkvDLqDOs6swYwgcjNmDmjwf89PGUp3BokugPwfHuVAmOfSa3khxSFvA== |
| MacOS Intel         | zux1c8wOy69USAE88GGaOxGuvsCQxTN6/HlYMpWVgevWe9SFCxrFePb5bD4f7QZoDN0v958aVDiqF3bEYvGwLg== |
| MacOS Apple silicon | F6YFC+6Quyl7SQMvlyscKq7WXlF2Wkmuf+q6qL6wU/wmzLKa1tfrP0anbtyEl9eGQESpUCZ5bUQo4LB4FBiw6A== |
