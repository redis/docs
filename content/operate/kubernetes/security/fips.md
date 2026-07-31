---
Title: Enable FIPS 140-3 compliance mode
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Run Redis Software for Kubernetes in FIPS 140-3 compliance mode.
linkTitle: FIPS compliance
weight: 60
---

You can run your Redis Software for Kubernetes cluster in FIPS 140-3 compliance mode, where cryptographic operations use validated, FIPS-approved algorithms. FIPS mode is available starting with operator version 8.2.0.

When you enable FIPS mode, the operator deploys a FIPS-compatible image in place of the standard one.

## Prerequisites

FIPS compliance depends on the underlying platform, not only on Redis:

- **FIPS-configured nodes.** A container runs in FIPS mode only if the host node is configured for FIPS. On OpenShift, the cluster must be installed in FIPS mode. Redis does not configure the host; this is the responsibility of your platform.
- **amd64 architecture.** The FIPS-compatible Redis Enterprise image is built for `amd64` only. There is no arm64 FIPS image.

## Enable FIPS mode

Set `spec.securityContext.fips.enabled` to `true` on the `RedisEnterpriseCluster` (REC):

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  securityContext:
    fips:
      enabled: true
```

When enabled, the operator adds a `.fips` suffix to the image version tag and pulls the matching FIPS-compatible image (for example, `redislabs/redis:<version>.fips`). The field defaults to `false`.

## Pull the image by digest

If you pin the image by digest (`spec.redisEnterpriseImageSpec`) instead of by tag, the operator can't add the `.fips` suffix. In that case, supply a digest that points to a FIPS-compatible image yourself.
