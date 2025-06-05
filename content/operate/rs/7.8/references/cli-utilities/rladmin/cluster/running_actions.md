---
Title: rladmin cluster running_actions
alwaysopen: false
categories:
- docs
- operate
- rs
description: Lists all active tasks.
headerRange: '[1-2]'
linkTitle: running_actions
tags:
- configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/rladmin/cluster/running_actions/'
---

Lists all active tasks running on the cluster.

```sh
rladmin cluster running_actions
```

### Parameters

None

### Returns

Returns details about any active tasks running on the cluster. 

### Example

```sh
$ rladmin cluster running_actions
Got 1 tasks:
1) Task: maintenance_on (ce391d81-8d51-4ce2-8f63-729c7ac2589e) Node: 1 Status: running
```
