---
Title: crdb-cli crdb update
alwaysopen: false
categories:
- docs
- operate
- rs
description: Updates the configuration of an Active-Active database.
linkTitle: update
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/crdb-cli/crdb/update/'
---

Updates the configuration of an Active-Active database.

```sh
crdb-cli crdb update --crdb-guid <guid>
         [--no-wait]
         [--force]
         [--default-db-config <configuration> ]
         [--default-db-config-file <filename>]
         [--compression <0-6>]
         [--causal-consistency { true | false } ]
         [--credentials id=<id>,username=<username>,password=<password> ]
         [--encryption { true | false } ]
         [--oss-cluster { true | false } ]
         [--featureset-version { true | false } ]
         [--memory-size <maximum_memory>]
         [--bigstore-ram-size <maximum_memory>]
         [--update-module name=<name>,featureset_version=<version>]
```

If you want to change the configuration of the local instance only, use [`rladmin`]({{< relref "/operate/rs/7.8/references/cli-utilities/rladmin" >}}) instead.

### Parameters

| Parameter                                                           | Value                                                                                                                         | Description                                                                                                                                                              |
|---------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| crdb-guid \<guid\>                                                 | string                                                                                                                        | GUID of the Active-Active database (required)                                                                                                                            |
| bigstore-ram-size \<maximum_memory\>                                                  | size in bytes, kilobytes (KB), or gigabytes (GB)                                                                               | Maximum RAM limit for the  databases with Auto Tiering enabled, if activated                                                                                                          |
| memory-size \<maximum_memory\>                                                                | size in bytes, kilobytes (KB), or gigabytes (GB) | Maximum database memory (required)                                                                                                                                                                                           |
| causal-consistency                                                  | true <br/>false                                                                                                           | [Causal consistency]({{< relref "/operate/rs/7.8/databases/active-active/causal-consistency.md" >}}) applies updates to all instances in the order they were received |
| compression                                                         | 0-6                                                                                                                           | The level of data compression: <br /><br /> 0 = No compression <br /><br /> 6 = High compression and resource load (Default: 3)                                                        |
| credentials id=\<id\>,username=\<username\>,password=\<password\> | strings                                                                                                                       | Updates the credentials for access to the instance                                                                                                                       |
| default-db-config \<configuration\>                                                  |                                                                                                                               | Default database configuration from stdin. For a list of database settings, see the [CRDB database config object]({{<relref "/operate/rs/7.8/references/rest-api/objects/crdb/database_config">}}) reference. |
| default-db-config-file \<filename\>                                | filepath                                                                                                                      | Default database configuration from file                                                                                                                                 |
| encryption                                                          | true <br/>false                                                                                                           | Activates or deactivates encryption                                                                                                                                      |
| force                                                               |                                                                                                                               | Force an update even if there are no changes                                                                                                                             |
| no-wait                                                             |                                                                                                                               | Do not wait for the command to finish                                                                                                                                    |
| oss-cluster                                                         | true <br/>false                                                                                                           | Activates or deactivates OSS Cluster mode                                                                                                                                |
| eviction-policy                                                     | noeviction<br/>allkeys-lru<br/>allkeys-lfu<br/>allkeys-random<br/>volatile-lru<br/>volatile-lfu<br/>volatile-random<br/>volatile-ttl | Updates [eviction policy]({{< relref "/operate/rs/7.8/databases/memory-performance/eviction-policy" >}})                                                                                                          |
| featureset-version                                                  | true<br/>false                                                                                                             | Updates to latest FeatureSet version                                                                                                                                     |
| update-module name=\<name>,featureset_version=\<version\>         | strings                                                                                                                       | Update a module to the specified version                                                                                                                                 |

### Returns

Returns the task ID of the task that is updating the database.

If `--no-wait` is specified, the command exits. Otherwise, it will wait for the database to be updated and then return "finished."

### Examples

The following example changes the maximum database memory:

```sh
$ crdb-cli crdb update --crdb-guid <crdb-guid> --memory-size 2GB
Task <task-id> created
  ---> Status changed: queued -> started
  ---> Status changed: started -> finished
```

The following example shows how to change a default database configuration setting:

```sh
$ crdb-cli crdb update --crdb-guid <crdb-guid> --default-db-config '{"shards_count": <primary_shards_count>}'
Task <task-id> created
  ---> Status changed: queued -> started
  ---> Status changed: started -> finished
```
