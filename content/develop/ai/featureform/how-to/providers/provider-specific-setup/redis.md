---
title: Redis provider setup
description: Register Redis as the online store used by Featureform feature-view serving.
linkTitle: Redis
weight: 20
---

Use Redis when the workspace needs an online store for low-latency feature serving.

## Registration

```bash
ff provider register demo_redis \
  --workspace demo-workspace \
  --type redis \
  --redis-host <release-name>-featureform-redis \
  --redis-port 6379
```

## Provider role

`online-store`

In the quickstart definitions file, the feature view references this provider with `inference_store="demo_redis"`.
