---
Title: Redis Insight v3.0.2, January 2026
linkTitle: v3.0.2 (January 2026)
date: 2026-01-07 00:00:00 +0000
description: Redis Insight v3.0.2
weight: 1
---

## 3.0.1 (December 2025)

This maintenance patch release includes critical and non-critical bug fixes for Redis Insight 3.0.0.

### Bug fixes

- [#5317](https://github.com/redis/RedisInsight/issues/5317) SQLite package ‘not found’ error on macOS x64 builds.
- [#5310](https://github.com/redis/RedisInsight/issues/5310) Inaccurately reported CPU metrics when Redis I/O threads or cluster shards push CPU usage above 100%.
- [#5190](https://github.com/redis/RedisInsight/issues/5190) Delimiter options not persisted on database switch.

**SHA-512 Checksums**

| Package             | SHA-512                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Windows             | 4wqbGo0XWd1iXmRMjVtDWCloUzNMWYq0rb13efWv8+odOTv0yHL2Qtxr7nGG4IFzETnL5BCVaoXPp8OkwGzZPA== |
| Linux AppImage      | bzOdG+/srFdZ9hvWamftwwE+4l4H2/7UuHPb9Xg/G/tyLB1HlTso3/0B1GtWALz807uqDxJavd3GAKwLKOdtSw== |
| Linux Debian        | 0XrzscKQzrRlKRRuQu0AYdwoK/30HP9e9OsuRFjoOVe4Triw3tgXj1/N5a7JGAqECy4BBMhI6ODCHzKEiEmHsw== |
| Linux RPM           | grPoYw+/ZPMlNC13muASRqebIHjel+LaqggyVW37eFqHhVo70yEtoxiNogVXOj7y7UDKUG2O0qfDYpgBqlkWoQ== |
| MacOS Intel         | Ta6PEtDBtjrV+Ut2ArQEaGHB/KYU1OvR6LNIMMTfOgHLssIv1l1YjlcMI0cZJj/zcgD1JtPdIyOe9k7vNXht5Q== |
| MacOS Apple silicon | aAKmBHK+pBGm2yRSQmdzx2Eno9N237kPi/HmqQ/X+Iv2iWa3zFdw8QDfL28m13+ROslJDbzpHSfZue8fOew5Xg== |
