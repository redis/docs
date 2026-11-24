---
Title: Use the minimal base image
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Run Redis Software for Kubernetes cluster nodes on a container image built from Red Hat UBI 9 Minimal.
linkTitle: Minimal base image
weight: 70
---

You can run your Redis Enterprise cluster (REC) nodes on a Redis Software image built from the Red Hat Universal Base Image (UBI) 9 Minimal instead of the standard UBI 9 image. The minimal base image is available starting with operator version 8.0.18-11.

The minimal base image installs fewer operating system packages. Fewer packages mean a smaller attack surface and fewer Common Vulnerabilities and Exposures (CVEs) reported against the image by container scanners.

## Use the minimal image

Minimal images use the same version tag as the standard image, with a `.minimal` suffix. For example, the minimal image for `8.2.0-125.19` is `8.2.0-125.19.minimal`. Find the Redis Software image tag for your operator version in the [release notes](/content/operate/kubernetes/release-notes/_index.md).

Set `spec.redisEnterpriseImageSpec.versionTag` on the `RedisEnterpriseCluster` to the minimal tag:

```yaml
spec:
  redisEnterpriseImageSpec:
    versionTag: <version-tag>.minimal
```

The operator pulls the image from the default repository: `redislabs/redis` on Docker Hub, or `registry.connect.redhat.com/redislabs/redis-enterprise` on OpenShift. To pull from a private registry instead, see [Use a private registry for container images](/content/operate/kubernetes/deployment/container-images.md).

## FIPS mode

Don't add `.minimal` to the version tag if [FIPS mode](/content/operate/kubernetes/security/fips.md) is enabled. The operator adds a `.fips` suffix to the version tag, and there is no `<version-tag>.minimal.fips` image. The FIPS-compatible image is already built from UBI 9 Minimal.
