---
Title: Redis Cloud changelog (September 2023)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  September 2023.
highlights: RESP protocol selection
linktitle: September 2023
tags:
- changelog
weight: 78
aliases:
  - /operate/rc/changelog/september-2023
---

## New features

### RESP protocol selection

For all databases using Redis 7.2, you can now choose between the RESP2 and RESP3 protocols when you [create a database](/content/operate/rc/databases/create-database/_index.md). For more information about the different RESP versions, see the [Redis serialization protocol specification](/content/develop/reference/protocol-spec.md#resp-versions).

### Opt-in to Redis 7.2

{{< embed-md "rc-opt-in-to-72.md" >}}

