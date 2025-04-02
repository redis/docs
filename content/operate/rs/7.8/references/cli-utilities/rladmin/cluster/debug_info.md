---
Title: rladmin cluster debug_info
alwaysopen: false
categories:
- docs
- operate
- rs
description: Creates a support package.
headerRange: '[1-2]'
linkTitle: debug_info
tags:
- configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/rladmin/cluster/debug_info/'
---

Downloads a support package to the specified path. If you do not specify a path, it downloads the package to the default path specified in the cluster configuration file.

```sh
rladmin cluster debug_info
        [ node <ID> ]
        [ path <path> ]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| node | integer | Downloads a support package for the specified node |
| path | filepath | Specifies the location where the support package should download |

### Returns

Reports the progress of the support package download.

### Example

```sh
$ rladmin cluster debug_info node 1
Preparing the debug info files package
Downloading...
[==================================================]
Downloading complete. File /tmp/debuginfo.20220511-215637.node-1.tar.gz is saved.
```
