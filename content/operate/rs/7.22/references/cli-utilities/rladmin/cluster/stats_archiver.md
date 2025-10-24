---
Title: rladmin cluster stats_archiver
alwaysopen: false
categories:
- docs
- operate
- rs
description: Enables/deactivates the stats archiver.
headerRange: '[1-2]'
linkTitle: stats_archiver
tags:
- configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/cluster/stats_archiver/'
---

Enables or deactivates the stats archiver, which logs statistics in CSV (comma-separated values) format.

```sh
rladmin cluster stats_archiver { enabled | disabled }
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| enabled | Turn on the stats archiver |
| disabled | Turn off the stats archiver |

### Returns

Returns the updated status of the stats archiver. 

### Example

```sh
$ rladmin cluster stats_archiver enabled 
Status: enabled
```