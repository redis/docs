---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Probabilistic data structures in Redis
linkTitle: Probabilistic
title: Probabilistic
weight: 140
---

*Probabilistic data structures* give approximations of statistics such as
counts, frequencies, and rankings rather than precise values.
The advantage of using approximations is that they are adequate for
many common purposes but are much more efficient to calculate. They
sometimes have other advantages too, such as obfuscating times, locations,
and other sensitive data.

Probabilistic data structures are available as part of Redis Open Source and they are available in Redis Software and Redis Cloud.
See
[Install Redis Open Source]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
[Install Redis Enterprise]({{< relref "/operate/rs/installing-upgrading/install" >}})
for full installation instructions.