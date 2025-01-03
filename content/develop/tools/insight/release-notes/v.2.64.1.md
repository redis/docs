---
Title: Redis Insight v2.64.1, December 2024
linkTitle: v2.64.1 (December 2024)
date: 2024-12-27 00:00:00 +0000
description: Redis Insight v2.64.1
weight: 1

---
## 2.64.1 (December 2024)
This is a maintenance release for Redis Insight 2.64.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

### Details

- [#4236](https://github.com/RedisInsight/RedisInsight/pull/4236) Reverts the change to use JSONPath ($) by default rather than (.). These changes could cause issues with shards in Redis Enterprise Active-Active databases.

**SHA-256 Checksums**
| Package | SHA-256 |
|--|--|
| Windows | hIK4qrC50Gd4jZnpHnwRIIVyDWtOfvfFID9nv8xfdcDgf4LvJcGLa9zVYkbfvwUv+aEaaBCohJJZMIGFC6iYHQ== |
| Linux AppImage | ll999oWjvKppawlYBPN6phGNa+mDiWmefIvkbQNAd7JPZFbHTYuLFWMWo4F1NrnZlr6vnPF6awbu7ubbiZL0HA== |
| Linux Debian| 4MKHfmmapfhxXUln0X+rpFXzm2dH6IPj2BIwlNRPQDGhpQ5flzOtLlV1iNGm9xqennZUv+hx+cVQodzPIj8FTw== |
| MacOS Intel | 5FkllEVCbD9M1fYww7N6XT3Qknl5tWrkHKWQWGhjkUiR/nZ89u+A84UzynB5H/lzBCFwUWJidfGJ4akrX2J7Hg== |
| MacOS Apple silicon | 2gWxZqGlAo0RyQKa0h8puyXMkIg1vF/Gobd9vS9DNWZMr3aYJojALx6f7pfknBoL7MDmZI29Mohtx4mnQPbjGQ== |
