---
Title: Ensure port availability
alwaysopen: false
categories:
- docs
- operate
- rs
description: Make sure required ports are available.
linkTitle: Ensure port availability
weight: 40
url: '/operate/rs/7.4/installing-upgrading/install/prepare-install/port-availability/'
---

Before [installing Redis Enterprise Software]({{< relref "/operate/rs/installing-upgrading/install" >}}), make sure all required ports are available.

{{<embed-md "port-availability-embed.md">}}

## Update `sysctl.conf` to avoid port collisions

{{<embed-md "port-collision-avoidance.md">}}

## Ubuntu conflicts with port 53

{{<embed-md "port-53.md">}}
