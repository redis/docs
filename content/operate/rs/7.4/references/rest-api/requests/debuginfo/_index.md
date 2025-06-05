---
Title: Debug info requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Debug info requests
hideListLinks: true
linkTitle: debuginfo
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/debuginfo/'
---

{{<banner-article>}}
These REST API paths are deprecated as of Redis Enterprise Software version 7.4.2. Use the new paths [`/v1/cluster/debuginfo`]({{< relref "/operate/rs/7.4/references/rest-api/requests/cluster/debuginfo" >}}), [`/v1/nodes/debuginfo`]({{< relref "/operate/rs/7.4/references/rest-api/requests/nodes/debuginfo" >}}), and [`/v1/bdbs/debuginfo`]({{< relref "/operate/rs/7.4/references/rest-api/requests/bdbs/debuginfo" >}}) instead.
{{</banner-article>}}

Downloads a support package, which includes logs and information about the cluster, nodes, databases, and shards, as a tar file called `filename.tar.gz`. Extract the files from the tar file to access the debug info.

## Get debug info for all nodes in the cluster

| Method | Path | Description |
|--------|------|-------------|
| [GET]({{< relref "./all#get-all-debuginfo" >}}) | `/v1/debuginfo/all` | Gets debug info for all nodes |
| [GET]({{< relref "./all/bdb#get-all-debuginfo-bdb" >}}) | `/v1/debuginfo/all/bdb/{bdb_uid}` | Gets debug info for a database from all nodes |

## Get debug info for the current node

| Method | Path | Description |
|--------|------|-------------|
| [GET]({{< relref "./node#get-debuginfo-node" >}}) | `/v1/debuginfo/node` | Gets debug info for the current node |
| [GET]({{< relref "./node/bdb#get-debuginfo-node-bdb" >}}) | `/v1/debuginfo/node/bdb/{bdb_uid}` | Gets debug info for a database from the current node |
