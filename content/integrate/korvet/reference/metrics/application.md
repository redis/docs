---
Title: Application Metrics
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Metrics that carry the running application's identity.
linkTitle: Application
weight: 20
---

These metrics carry the running application's identity.

## Metrics

### Build

Constant gauge (value `1`) carrying the running application's identity in its tag set. Tags: `name`, `version`.

**Name**: `korvet.application.build` \
**Type**: `gauge`

**Tags**

| Key | Description |
|---|---|
| `name` | Application name (typically `korvet`). |
| `version` | Application version as reported by Spring Boot `BuildProperties`; `unknown` when the build did not embed `build-info.properties`. |
