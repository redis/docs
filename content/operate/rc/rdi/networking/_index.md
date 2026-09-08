---
Title: Networking
alwaysopen: false
categories:
- docs
- operate
- rc
description: Network reference for connecting a Data Integration pipeline to your source database.
hideListLinks: true
linkTitle: Networking
weight: 4
---

Your Data Integration pipeline runs on Redis Cloud and connects to your source database over [AWS PrivateLink]({{<relref "/operate/rc/rdi/setup#set-up-connectivity">}}). The following guides explain how the network path works and how to keep it available:

- [AWS PrivateLink reference]({{<relref "/operate/rc/rdi/networking/aws-privatelink">}}): How traffic flows between the pipeline and your database, which address each component sees, and how to keep the connection available when your database fails over.
