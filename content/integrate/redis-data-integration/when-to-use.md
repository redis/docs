---
Title: When to use RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Understand when (and when not) to use RDI.
group: di
hideListLinks: false
linkTitle: When to use RDI
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
tocEmbedHeaders: true
weight: 5
---

RDI is designed to support apps that must use a disk-based database as the system of record
but must also be fast and scalable. This is a common requirement for mobile and web
apps with a rapidly-growing number of users; the performance of the main database is fine at first
but it will soon struggle to handle the increasing demand without a cache.

## Guidelines for using RDI

Use the information in the sections below to determine whether RDI is a good fit for your architecture.

```decision-tree
```

{{< embed-md "rdi-when-to-use.md" >}}

### Decision tree for using RDI

Use the decision tree below to determine whether RDI is a good fit for your architecture:

{{< embed-md "rdi-when-to-use-dec-tree.md" >}}
