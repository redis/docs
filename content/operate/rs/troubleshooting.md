---
Title: Troubleshooting Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Troubleshooting resources for Redis Enterprise Software
linkTitle: Troubleshooting
weight: 95
---

## General troubleshooting

For general troubleshooting, see:

- [Create a support package]({{<relref "/operate/rs/installing-upgrading/creating-support-package">}}) to gather information about the cluster, nodes, and databases to help debug issues

- [Logging]({{<relref "/operate/rs/clusters/logging">}})

- [`rladmin status`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status">}}) command, which displays the current status of nodes, databases, database endpoints, and shards on the cluster

- [`rlcheck`]({{<relref "/operate/rs/references/cli-utilities/rlcheck">}})  utility, which runs various tests to check node health and reports any discovered issues

## Troubleshooting by topic

For troubleshooting specific issues, see:

- [Replica Of repeatedly fails]({{<relref "/operate/rs/databases/import-export/replica-of/replicaof-repeatedly-fails">}})

- CRDT [INFO]({{<relref "/operate/rs/databases/active-active/develop/develop-for-aa#info">}}) for troubleshooting Active-Active databases

## Contact support

If initial troubleshooting doesn't resolve the issue, you can [contact support](https://redis.io/support/) for additional help.
