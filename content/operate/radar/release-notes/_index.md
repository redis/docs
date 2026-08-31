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

Cloud releases roll out automatically on a weekly or biweekly basis, so there's nothing to schedule or install.

{{<table-children columnNames="Release,What changed" columnSources="LinkTitle,Description" enableLinks="LinkTitle" limitTags="cloud">}}

## Self-managed releases

Self-managed Radar ships as a Helm chart, an RPM, and a Docker Compose bundle, the same three artifacts described in [Install Radar]({{< relref "/operate/radar/install" >}}). Contact your Redis account team to get the artifacts and their checksums.

Radar ships on two support tracks:

- **Long-Term Support (LTS)** releases prioritize stability and receive support for an extended period. Choose LTS if you want predictable upgrade cycles.
- **Short-Term Support (STS)** releases give you earlier access to new features and improvements, but have a shorter support lifecycle and need more frequent upgrades.

STS releases receive security and bug fixes for 6 months after release. LTS releases receive support for 2 years.

Install a new release when you're ready to move to it. See [Install Radar]({{< relref "/operate/radar/install" >}}).

{{<table-children columnNames="Release,What changed" columnSources="LinkTitle,Description" enableLinks="LinkTitle" limitTags="self-managed">}}
