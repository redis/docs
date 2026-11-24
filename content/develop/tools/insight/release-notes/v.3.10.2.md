---
Title: Redis Insight v3.10.2, November 2026
linkTitle: v3.10.2 (November 2026)
date: 2026-11-24 00:00:00 +0000
description: Redis Insight v3.10.2
weight: 1
---

## 3.10.2 (November 2026)

This is a patch release of Redis Insight 3.10.2, which includes bug fixes.

### Headlines

- **TLS cluster connections:** fixed connecting to Redis Clusters over TLS when the server certificates are issued for host names only, such as AWS MemoryDB.

### Bugs

- [#6619](https://github.com/redis/RedisInsight/issues/6619) Fixed Redis Clusters with host name only TLS certificates, such as AWS MemoryDB, being detected as standalone. The connection failed to use cluster mode and ended up with MOVED errors. Redis Insight now keeps the host name for the TLS certificate check when it connects to cluster nodes. ([#6620](https://github.com/redis/RedisInsight/pull/6620))
- [#6612](https://github.com/redis/RedisInsight/pull/6612) Fixed Pub/Sub unsubscribing from several channels at once, which could close the Redis connection while other unsubscribes were still running.

**Full Changelog**: https://github.com/redis/RedisInsight/compare/3.10.0...3.10.2

**SHA-512 Checksums**

| Package                | SHA-512 |
| ---------------------- | ------- |
| Windows                | RxzmS3N2QGXVlYqsyhXDpCBDZGVXgAZ8uOfKoTD7QDonDgqEWq/mlBSTt1ZbXlmMMlScfloqqSQNRTmwHelgpg== |
| Linux AppImage (x64)   | 2nAviutIuQa/uMLW3PJgyY6I3teP7sAJpC3q5XcCAH8WpyZ4SEhS5xa8BYnowHMoKyFcuZeIWsQctyV/Q6f/8Q== |
| Linux AppImage (arm64) | g1ENPqwDUivAWkURqB/5xRt9GznrX9urRJ4dFUKI+FkVO0h07v8dYDffdev5K+K/8kG/V//JEuvSjDX5Z1eI7w== |
| Linux Debian (x64)     | k6LcPX5Q0HIYb4Lur9l4nwW5qyJ5M+XJwwpE84HLJMTNjhOA+8KwQBRKcCKjn3igMxTCZ8MSzKNqWcTy0CuTqQ== |
| Linux Debian (arm64)   | 7vNys8wajgFQOPRoOXdY5bu1Jf42lMIXR9RZP1zxkQhPLQlqi0oJ9HSPeMCpfAk3ddOJKq8wVHmmgxQ8fZI76A== |
| Linux RPM (x64)        | Kti9OxMIzwaNiRylvnt37FH+jcbB3JZXdVkyIkwryTFypQ+nEhO2Ibc2FCQXD7Wu0jgyJieHWcuZYmKk/dgxSw== |
| Linux RPM (arm64)      | V1FUYzlTu/dSbw4uTwHuAD3+Fn2B18EKhMw1KuqoW/GZACO+nckuTQrIK57ZeuxdsiX9dTjkJoE0LF7TZCthXA== |
| MacOS Intel            | IJqJMxxe3Bekt2HJ2nX1tppq5E7OwDBf8iIg0VamUNjROLIGm8JWFbIKNqd3bMIEhRiaGQo5MMndlwgVMYCC2Q== |
| MacOS Apple silicon    | akQw+4ttkKdzr1NDAZQ5XxQUiK2AkCN0LmQX+KAeTrb6kp134LxT2GIh3nJNSBJe09eCiVOyPpmWrKXwny6WfQ== |
