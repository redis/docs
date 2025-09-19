---
Title: Troubleshooting Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Resources for troubleshooting Redis Enterprise Software
linkTitle: Troubleshooting
weight: 75
---

## General troubleshooting

For general troubleshooting, see:

- [Create a support package]({{<relref "/operate/rs/installing-upgrading/creating-support-package">}}) to gather information about the cluster, nodes, and databases to help debug issues

- [Logging]({{<relref "/operate/rs/clusters/logging">}})

- [`rladmin status`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status">}}) command, which displays the current status of nodes, databases, database endpoints, and shards on the cluster

- [`rlcheck`]({{<relref "/operate/rs/references/cli-utilities/rlcheck">}})  utility, which runs various tests to check node health and reports any discovered issues

## Troubleshooting by topic

For troubleshooting specific issues, see:

- [Database connectivity troubleshooting]({{<relref "/operate/rs/databases/connect/troubleshooting-guide">}})

- [Replica Of repeatedly fails]({{<relref "/operate/rs/databases/import-export/replica-of/replicaof-repeatedly-fails">}})

- CRDT [INFO]({{<relref "/operate/rs/databases/active-active/develop/develop-for-aa#info">}}) for troubleshooting Active-Active databases

## Knowledge base

The [Redis Software knowledge base](https://support.redislabs.com/hc/en-us/categories/26174244088594-Redis-Software) provides additional guides and troubleshooting resources.

- [Tools for Identifying Failures in Clusters](https://support.redislabs.com/hc/en-us/articles/26759137301394-Tools-for-Identifying-Failures-in-Clusters)

- [Troubleshooting TLS Failures](https://support.redislabs.com/hc/en-us/articles/26867190871314-Troubleshooting-TLS-Failures)

- [Troubleshooting TLS Connection Failures Caused by Certificate Expiration](https://support.redislabs.com/hc/en-us/articles/27021922067090-Troubleshooting-TLS-Connection-Failures-Caused-by-Certificate-Expiration)

- [Diagnosing and Resolving Endpoint Flapping in Redis Software](https://support.redislabs.com/hc/en-us/articles/27001052658706-Diagnosing-and-Resolving-Endpoint-Flapping-in-Redis-Software)

- See [Troubleshooting Redis Software](https://support.redislabs.com/hc/en-us/sections/26758971861778-Troubleshooting-Redis-Software) for more troubleshooting guides.


## Contact support

If initial troubleshooting doesn't resolve the issue, you can [contact support](https://redis.io/support/) for additional help.
