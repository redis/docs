---
Title: crdb-cli crdb add-instance
alwaysopen: false
categories:
- docs
- operate
- rs
description: Adds a peer replica to an Active-Active database.
linkTitle: add-instance
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/crdb-cli/crdb/add-instance/'
---

Adds a peer replica to an existing Active-Active database in order to host the database on another cluster. This creates an additional active instance of the database on the specified cluster.

```sh
crdb-cli crdb add-instance --crdb-guid <guid>
         --instance fqdn=<cluster_fqdn>,username=<username>,password=<password>[,url=https://<hostname-or-IP>:9443,replication_endpoint=<hostname-or-IP>:<port>,replication_tls_sni=<hostname>]
         [--compression <0-6>]
         [--wait | --no-wait]
```

### Parameters

| Parameter | Value   | Description |
|-----------|---------|-------------|
| crdb-guid | string  | The GUID of the database (required) |
| instance fqdn=\<cluster_fqdn\>,username=\<username\>,password=\<password\>,url=https://\<hostname-or-IP\>:9443,replication_endpoint=\<hostname-or-IP\>:\<port\>,replication_tls_sni=\<hostname\> | strings | The connection information for the new participating cluster (required)<br/><br/>**Required:**<br/>• `fqdn` - Cluster fully qualified domain name<br/>• `username` - Cluster username<br/>• `password` - Cluster password<br/><br/>**Optional:**<br/>• `url` - URL to access the cluster's REST API<br/>• `replication_endpoint` - Address to access the database instance for peer replication<br/>• `replication_tls_sni` - Cluster [Server Name Indication (SNI)](https://en.wikipedia.org/wiki/Server_Name_Indication) hostname for TLS connections |
| compression | 0-6 | The level of data compression: <br /><br > 0 = No compression <br /><br > 6 = High compression and resource load (Default: 3) |
| wait | | Prevents `crdb-cli` from running another command before this command finishes |
| no-wait | | `crdb-cli` can run another command before this command finishes |

### Returns

Returns the task ID of the task that is adding the new instance.

If `--no-wait` is specified, the command exits. Otherwise, it will wait for the instance to be added and return `finished`.

### Example

```sh
$ crdb-cli crdb add-instance --crdb-guid db6365b5-8aca-4055-95d8-7eb0105c0b35 \
        --instance fqdn=cluster2.redis.local,username=admin@redis.local,password=admin-password
Task f809fae7-8e26-4c8f-9955-b74dbbd47949 created
  ---> Status changed: queued -> started
  ---> Status changed: started -> finished
```
