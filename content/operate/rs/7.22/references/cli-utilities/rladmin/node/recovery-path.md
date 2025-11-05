---
Title: rladmin node recovery_path set
alwaysopen: false
categories:
- docs
- operate
- rs
description: Sets a node's local recovery path.
headerRange: '[1-2]'
linkTitle: recovery_path
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/node/recovery-path/'
---

Sets the node's local recovery path, which specifies the directory where [persistence files]({{< relref "/operate/rs/7.22/databases/configure/database-persistence" >}}) are stored. You can use these persistence files to [recover a failed database]({{< relref "/operate/rs/7.22/databases/recover" >}}).

```sh
rladmin node <ID> recovery_path set <path>
```

### Parameters

| Parameter | Type/Value                     | Description                                                                                   |
|-----------|--------------------------------|-----------------------------------------------------------------------------------------------|
| node      | integer                        | Sets the recovery path for the specified node                                            |
| path      | filepath                       | Path to the folder where persistence files are stored                                         |

### Returns

Returns `Updated successfully` if the recovery path was set. Otherwise, it returns an error.

### Example

```sh
$ rladmin node 2 recovery_path set /var/opt/redislabs/persist/redis
Updated successfully.
```
