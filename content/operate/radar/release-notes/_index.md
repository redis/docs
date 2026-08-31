---
title: Release notes
alwaysopen: false
categories:
- docs
- operate
- radar
description: Get Radar release artifacts and see what changed in each release.
linkTitle: Release notes
hideListLinks: true
weight: 60
---

This page lists Redis Radar release artifacts and what changed in each release.

Radar versions releases using calendar versioning (CalVer), so a release's version number reflects when it shipped rather than a sequential count.

## Cloud releases

Redis Cloud's hosted Radar needs no download and no installation. Sign in with your existing Redis Cloud credentials.

Cloud releases roll out automatically on a regular basis, so there's nothing to schedule or install. See the [changelog]({{< relref "/operate/radar/release-notes/cloud-changelog" >}}) for what changed in each release.

## Self-managed releases

Self-managed Radar ships as a Helm chart, an RPM, and a Docker Compose bundle, as described in [Install Radar]({{< relref "/operate/radar/install" >}}). Get the RPM from the [Redis Download Center](https://cloud.redis.io/#/rlec-downloads), under **Modules, tools and integrations**, the container images from Docker Hub, and the Helm chart.

Radar ships on two support tracks:

- **Long-Term Support (LTS)** releases prioritize stability and receive support for an extended period. Choose LTS if you want predictable upgrade cycles.
- **Short-Term Support (STS)** releases give you earlier access to new features and improvements, but have a shorter support lifecycle and need more frequent upgrades.

STS releases receive security and bug fixes for 6 months after release. LTS releases receive support for 2 years.

Install a new release when you're ready to upgrade. See [Install Radar]({{< relref "/operate/radar/install" >}}).

{{<table-children columnNames="Release,What changed" columnSources="LinkTitle,Description" enableLinks="LinkTitle" limitTags="self-managed">}}
